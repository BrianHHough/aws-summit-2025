from aws_cdk import (
    Stack,
    CfnOutput,
    aws_iam as iam,
    aws_opensearchserverless as oss,
    aws_s3 as s3
)
from aws_cdk.aws_iam import PolicyStatement
from constructs import Construct
import json

class OpenSearchStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *,
                 upload_bucket: s3.IBucket,  # ✅ add this
                 **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        collection_name = "kb-doc-vectors"
        self.vector_index_name = "talkwithdocs-vectorindex"

        # 1. Create OpenSearch Serverless collection
        self.collection = oss.CfnCollection(self, "VectorCollection",
            name=collection_name,
            type="VECTORSEARCH"
        )

        # 2. Encryption policy
        encryption_policy = oss.CfnSecurityPolicy(self, "EncryptionPolicy",
            name="kb-doc-vectors-encryption",
            type="encryption",
            policy=json.dumps({
                "Rules": [
                    {
                        "ResourceType": "collection",
                        "Resource": [f"collection/{collection_name}"]
                    }
                ],
                "AWSOwnedKey": True
            })
        )

        # 3. Network policy
        network_policy = oss.CfnSecurityPolicy(self, "NetworkPolicy",
            name="kb-doc-vectors-network",
            type="network",
            policy=json.dumps([
                {
                    "Description": "Allow Bedrock access",
                    "Rules": [
                        {
                            "ResourceType": "collection",
                            "Resource": [f"collection/{collection_name}"]
                        }
                    ],
                    "AllowFromPublic": True
                }
            ])
        )

        # ❗ Ensure collection is created **after** both policies
        self.collection.add_dependency(encryption_policy)
        self.collection.add_dependency(network_policy)


        # 4. IAM role for Bedrock to assume
        self.bedrock_role = iam.Role(self, "BedrockAccessRole",
            assumed_by=iam.ServicePrincipal("bedrock.amazonaws.com")
        )

        # Allow OpenSearch and Bedrock model access
        self.bedrock_role.add_to_policy(iam.PolicyStatement(
            actions=[
                "aoss:APIAccessAll",
                "aoss:BatchGetCollection",
                "bedrock:InvokeModel"
            ],
            resources=["*"]
        ))

        # Get the ARN of the bucket and its contents
        upload_bucket_arn = upload_bucket.bucket_arn
        upload_bucket_objects_arn = f"{upload_bucket_arn}/*"
        
        self.bedrock_role.add_to_policy(PolicyStatement(
            actions=["s3:ListBucket"],
            resources=[upload_bucket_arn]
        ))

        self.bedrock_role.add_to_policy(PolicyStatement(
            actions=["s3:GetObject"],
            resources=[upload_bucket_objects_arn]
        ))

        # 5. Data access policy for Bedrock role
        oss.CfnAccessPolicy(self, "DataAccessPolicy",
            name="kb-index-access",
            type="data",
            policy=json.dumps([
                {
                    "Rules": [
                        {
                            "ResourceType": "index",
                            "Resource": [f"index/{collection_name}/*"],
                            "Permission": [
                                "aoss:*"
                                # "aoss:CreateIndex",
                                # "aoss:DescribeIndex",
                                # "aoss:UpdateIndex",
                                # "aoss:DeleteIndex",
                                # "aoss:ReadDocument",
                                # "aoss:WriteDocument"
                            ]
                        }
                    ],
                    "Principal": [
                        self.bedrock_role.role_arn,
                        'arn:aws:iam::761018892962:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess_6930ae2c0e91f050',
                        'arn:aws:iam::761018892962:role/cdk-hnb659fds-cfn-exec-role-761018892962-us-east-1'
                        ]
                }
            ])
        )

        # 6. Collection-level access (describe only)
        oss.CfnAccessPolicy(self, "CollectionAccessPolicy",
            name="kb-collection-access",
            type="data",
            policy=json.dumps([
                {
                    "Rules": [
                        {
                            "ResourceType": "collection",
                            "Resource": [f"collection/{collection_name}"],
                            "Permission": [
                                "aoss:*"
                                # "aoss:DescribeCollectionItems",
                                # "aoss:CreateIndex"
                            ]
                        }
                    ],
                    "Principal": [
                        self.bedrock_role.role_arn,
                        'arn:aws:iam::761018892962:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess_6930ae2c0e91f050',
                        'arn:aws:iam::761018892962:role/cdk-hnb659fds-cfn-exec-role-761018892962-us-east-1'
                    ]
                }
            ])
        )

        # 7. Programmatically create index in opensearch service for vectors
        oss.CfnIndex(self, "VectorIndex",
            collection_endpoint=self.collection.attr_collection_endpoint,
            index_name=self.vector_index_name,
            mappings={
                "properties": {
                    "embedding": {
                        "type": "knn_vector",
                        "dimension": 1536,  # Adjust based on your embedding model
                        "method": {
                            "engine": "faiss",
                            "name": "hnsw",
                            "parameters": {
                                "efConstruction": 512,
                                "m": 16
                            },
                            "spaceType": "l2"
                        }
                    },
                    "chunk": {
                        "type": "text",
                        "index": True
                    },
                    "metadata": {
                        "type": "text",
                        "index": True
                    }
                }
            },
            settings={
                "index": {
                    "knn": True,
                    "knnAlgoParamEfSearch": 512
                }
            }
        )

        # 8. Outputs
        # CfnOutput(self, "CollectionName", value=self.collection.collection_name)
        CfnOutput(self, "CollectionArn", value=self.collection.attr_arn)
        CfnOutput(self, "VectorIndexName", value=self.vector_index_name)
        CfnOutput(self, "BedrockRoleArn", value=self.bedrock_role.role_arn)
