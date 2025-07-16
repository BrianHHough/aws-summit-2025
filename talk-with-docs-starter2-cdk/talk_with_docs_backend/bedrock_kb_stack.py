# talk_with_docs_backend/bedrock_kb_stack.py

from aws_cdk import (
    CfnOutput,
    Stack,
    aws_s3 as s3,
    aws_bedrock as bedrock,
    # StartIngestionJob API
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_events as events,
    aws_events_targets as targets,
)
from constructs import Construct

class BedrockKnowledgeBaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *,
                 upload_bucket: s3.IBucket,
                 collection_arn: str,
                 bedrock_role_arn: str,
                 vector_index_name: str,
                 **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # 1. Create Bedrock Knowledge Base
        knowledge_base = bedrock.CfnKnowledgeBase(self, "KnowledgeBase",
            name="TSP-KnowledgeBase",
            role_arn=bedrock_role_arn,
            knowledge_base_configuration={
                "type": "VECTOR",
                "vectorKnowledgeBaseConfiguration": {
                    "embeddingModelArn": "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1"
                }
            },
            storage_configuration={
                "type": "OPENSEARCH_SERVERLESS",
                "opensearchServerlessConfiguration": {
                    "collectionArn": collection_arn,
                    "vectorIndexName": vector_index_name,
                    "fieldMapping": {
                        "textField": "chunk",
                        "metadataField": "metadata",
                        "vectorField": "embedding"
                    }
                }
            }
        )

        # 2. Add S3 data source for ingestion
        KNOWLEDGE_BASE_ID = knowledge_base.attr_knowledge_base_id
        KNOWLEDGE_BASE_ARN = f"arn:aws:bedrock:us-east-1:{self.account}:knowledge-base/{KNOWLEDGE_BASE_ID}"
        
        data_source = bedrock.CfnDataSource(self, "DataSource",
            knowledge_base_id=KNOWLEDGE_BASE_ID,
            name="talk-with-docs-s3-source",
            data_source_configuration={
                "type": "S3",
                "s3Configuration": {
                    "bucketArn": upload_bucket.bucket_arn,
                    # "inclusionPrefixes": [""] # ["*"]  # Ingest all prefixes
                }
            }
        )

        # 3. Lambda function that starts the ingestion job
        ingestion_lambda = _lambda.Function(self, "StartIngestionJobLambda",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.main",
            code=_lambda.Code.from_asset("lambda/start_s3_ingestion_job"),
            environment={
                "KNOWLEDGE_BASE_ID": KNOWLEDGE_BASE_ID,
                "DATA_SOURCE_ID": data_source.attr_data_source_id
            }
        )

        # 4. Permissions
        ingestion_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock-agent:StartIngestionJob"],
            resources=[KNOWLEDGE_BASE_ARN]
        ))

        ingestion_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=["*"]  # Optional: scope this if needed
        ))

        upload_bucket.grant_read(ingestion_lambda)

        # 5. EventBridge Rule
        rule = events.Rule(self, "S3PutObjectRule",
            event_pattern=events.EventPattern(
                source=["aws.s3"],
                detail_type=["Object Created"],
                detail={
                    "bucket": {
                        "name": [upload_bucket.bucket_name]
                    }
                }
            )
        )

        rule.add_target(targets.LambdaFunction(ingestion_lambda))

        # 6. Outputs
        CfnOutput(self, "UploadBucketName", value=upload_bucket.bucket_name)
        CfnOutput(self, "KnowledgeBaseID", value=KNOWLEDGE_BASE_ID)
        CfnOutput(self, "DataSourceID", value=data_source.attr_data_source_id)
        CfnOutput(self, "IngestionLambdaName", value=ingestion_lambda.function_name)