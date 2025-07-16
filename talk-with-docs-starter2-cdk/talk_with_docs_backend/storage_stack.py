from aws_cdk import Stack, CfnOutput, RemovalPolicy
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_dynamodb as dynamodb
from constructs import Construct

# For vectorization process:
from aws_cdk import aws_lambda as _lambda, aws_iam as iam
from aws_cdk.aws_s3_notifications import LambdaDestination

class StorageStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # S3 Bucket for file uploads
        self.upload_bucket = s3.Bucket(self, "UploadBucket",
            cors=[s3.CorsRule(
                allowed_methods=[s3.HttpMethods.PUT],
                allowed_origins=["*"],  # In production, replace with your frontend URL
                allowed_headers=["*"]
            )],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY  # Use RETAIN in prod
        )

        # DynamoDB for documents + chat logs
        self.logs_table = dynamodb.Table(self, "DocsTable",
            partition_key={"name": "pk", "type": dynamodb.AttributeType.STRING},
            sort_key={"name": "sk", "type": dynamodb.AttributeType.STRING},
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY  # Use RETAIN in prod
        )

        # Vectorization Lambda
        self.vectorize_fn = _lambda.Function(self, "UploadVectorizeHandler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="upload_vectorize_handler.main",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "TABLE_NAME": self.logs_table.table_name,
                "PINECONE_SECRET_NAME": "prod/pinecone/api-key",
                "PINECONE_INDEX_NAME": "talk-with-docs"
            }
        )

        self.vectorize_fn.add_permission("AllowS3Invoke",
            principal=iam.ServicePrincipal("s3.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=self.upload_bucket.bucket_arn
        )

        self.vectorize_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["secretsmanager:GetSecretValue"],
            resources=["arn:aws:secretsmanager:*:*:secret:prod/pinecone/api-key*"]
        ))
        self.vectorize_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=["*"]
        ))

        self.upload_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            LambdaDestination(self.vectorize_fn)
        )

        CfnOutput(self, "UploadBucketName", value=self.upload_bucket.bucket_name)
        CfnOutput(self, "DocsTableName", value=self.logs_table.table_name)
