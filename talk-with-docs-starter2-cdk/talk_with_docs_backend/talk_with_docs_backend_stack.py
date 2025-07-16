from aws_cdk import (
    Stack,
    aws_cognito as cognito,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_appsync as appsync,
    aws_iam as iam,
    CfnOutput
)
from constructs import Construct
from aws_cdk.aws_s3_notifications import LambdaDestination


class TalkWithDocsBackendStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # ✅ Cognito Auth
        user_pool = cognito.UserPool(self, "UserPool",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True)
        )

        user_pool_client = cognito.UserPoolClient(self, "UserPoolClient",
            user_pool=user_pool,
            generate_secret=False
        )

        # ✅ S3 Bucket
        bucket = s3.Bucket(self, "DocsBucket", cors=[
            s3.CorsRule(
                allowed_methods=[s3.HttpMethods.PUT],
                allowed_origins=["*"],  # Replace with your domain
                allowed_headers=["*"]
            )
        ])

        # ✅ DynamoDB Table
        table = dynamodb.Table(self, "DocsTable",
            partition_key={"name": "pk", "type": dynamodb.AttributeType.STRING},
            sort_key={"name": "sk", "type": dynamodb.AttributeType.STRING},
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        # ✅ AppSync API
        graphql_api = appsync.GraphqlApi(self, "DocsAPI",
            name="TalkWithDocsAPI",
            schema=appsync.Schema.from_asset("graphql/schema.graphql"),
            authorization_config=appsync.AuthorizationConfig(
                default_authorization=appsync.AuthorizationMode(
                    authorization_type=appsync.AuthorizationType.USER_POOL,
                    user_pool_config=appsync.UserPoolConfig(user_pool=user_pool)
                )
            ),
            xray_enabled=True
        )

        # ✅ Lambda: Upload Handler (pre-signed URL logic)
        upload_fn = _lambda.Function(self, "UploadHandler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="upload_handler.main",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "BUCKET_NAME": bucket.bucket_name,
                "TABLE_NAME": table.table_name
            }
        )

        # ✅ Lambda: Chat Handler
        chat_fn = _lambda.Function(self, "ChatHandler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="chat_handler.main",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "TABLE_NAME": table.table_name,
                "PINECONE_SECRET_NAME": "prod/pinecone/api-key",  # 👈 Match your Secrets Manager secret name
                "PINECONE_INDEX_NAME": "talk-with-docs"
            }
        )

        # Allow access to the Pinecone secret
        chat_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["secretsmanager:GetSecretValue"],
            resources=["arn:aws:secretsmanager:*:*:secret:prod/pinecone/api-key*"]
        ))

        # Allow Bedrock model invocation
        chat_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=["*"]  # Replace with specific ARN if desired
        ))

        # ✅ Lambda: Upload Vectorize Handler
        vectorize_fn = _lambda.Function(self, "UploadVectorizeHandler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="upload_vectorize_handler.main",
            code=_lambda.Code.from_asset("lambda"),
            environment={
                "TABLE_NAME": table.table_name,
                "PINECONE_SECRET_NAME": "prod/pinecone/api-key",
                "PINECONE_INDEX_NAME": "talk-with-docs"
            }
        )

        # Allow S3 to invoke this Lambda
        vectorize_fn.add_permission("AllowS3Invoke",
            principal=iam.ServicePrincipal("s3.amazonaws.com"),
            action="lambda:InvokeFunction",
            source_arn=bucket.bucket_arn
        )

        # Trigger vectorization Lambda when a new file is uploaded
        bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            LambdaDestination(vectorize_fn)
        )

        # Permissions
        table.grant_read_write_data(vectorize_fn)

        vectorize_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["secretsmanager:GetSecretValue"],
            resources=["arn:aws:secretsmanager:*:*:secret:prod/pinecone/api-key*"]
        ))

        vectorize_fn.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=["*"]
        ))

        # Permissions
        bucket.grant_read_write(upload_fn)
        table.grant_read_write_data(upload_fn)
        table.grant_read_write_data(chat_fn)

        # ✅ Add Lambda as AppSync Resolvers
        upload_ds = graphql_api.add_lambda_data_source("UploadDataSource", upload_fn)
        upload_ds.create_resolver(type_name="Mutation", field_name="generateUploadUrl")

        chat_ds = graphql_api.add_lambda_data_source("ChatDataSource", chat_fn)
        chat_ds.create_resolver(type_name="Mutation", field_name="chatWithDocument")

        # ✅ Outputs (for Next.js .env.local)
        CfnOutput(self, "AppSyncAPIURL", value=graphql_api.graphql_url)
        CfnOutput(self, "UserPoolId", value=user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=user_pool_client.user_pool_client_id)
        CfnOutput(self, "DocsBucket", value=bucket.bucket_name)