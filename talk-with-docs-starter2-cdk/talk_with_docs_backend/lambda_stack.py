from aws_cdk import (
    Stack, 
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_dynamodb as dynamodb,
    aws_s3 as s3
)
from constructs import Construct
from aws_cdk.aws_s3 import IBucket
from aws_cdk.aws_s3_notifications import LambdaDestination

class LambdaStack(Stack):
    def __init__(self, scope: Construct, id: str, bucket: IBucket, table: dynamodb.Table, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # Vectorization Lambda
        self.vectorize_fn = _lambda.Function(self, "UploadVectorizeHandler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="upload_vectorize_handler.main",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "TABLE_NAME": table.table_name,
                "PINECONE_SECRET_NAME": "prod/pinecone/api-key",
                "PINECONE_INDEX_NAME": "talk-with-docs"
            }
        )
        
        # Permissions
        self.vectorize_fn.add_permission("AllowS3Invoke",
            principal=iam.ServicePrincipal("s3.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=bucket.bucket_arn
        )
        
        # This is added in `app.py instead of here - avoid cyclical dependency`
        # bucket.add_event_notification(
        #     s3.EventType.OBJECT_CREATED,
        #     LambdaDestination(self.vectorize_fn)
        # )
        
        # Pinecone/Bedrock permissions
        self.vectorize_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["secretsmanager:GetSecretValue"],
            resources=["arn:aws:secretsmanager:*:*:secret:prod/pinecone/api-key*"]
        ))
        self.vectorize_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=["*"]
        ))
