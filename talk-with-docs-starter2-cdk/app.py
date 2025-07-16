#!/usr/bin/env python3
from aws_cdk import App

# Resource Stacks
from talk_with_docs_backend.cognito_stack import CognitoStack
from talk_with_docs_backend.storage_stack import StorageStack
from talk_with_docs_backend.appsync_stack import AppSyncStack
from talk_with_docs_backend.eks_stack import EKSStack
from talk_with_docs_backend.eks_server_stack import EKSServerStack
from talk_with_docs_backend.vector_stack import VectorStoreStack
from talk_with_docs_backend.cloudfront_stack import CloudFrontStack
from talk_with_docs_backend.lambda_stack import LambdaStack
from talk_with_docs_backend.file_upload_stack import FileUploadStack
from talk_with_docs_backend.file_chat_stack import FileChatStack
from talk_with_docs_backend.opensearch_stack import OpenSearchStack
from talk_with_docs_backend.bedrock_kb_stack import BedrockKnowledgeBaseStack

# Resources
from aws_cdk.aws_s3_notifications import LambdaDestination
import aws_cdk.aws_s3 as s3

app = App()

cognito_stack = CognitoStack(app, "CognitoStack")
storage_stack = StorageStack(app, "StorageStack")
vector_stack = VectorStoreStack(app, "VectorStoreStack")

# lambda_stack = LambdaStack(app, "LambdaStack",
#     bucket=storage_stack.upload_bucket,
#     table=storage_stack.logs_table
# )

# Set Up the S3 Bucket Notification for Vectorization (outside the stacks)
# storage_stack.upload_bucket.add_event_notification(
#     s3.EventType.OBJECT_CREATED,
#     LambdaDestination(lambda_stack.vectorize_fn)
# )

# appsync_stack = AppSyncStack(app, "AppSyncStack",
#     user_pool=cognito_stack.user_pool,
#     user_pool_client=cognito_stack.user_pool_client,
#     table=storage_stack.logs_table,
#     bucket=storage_stack.upload_bucket
# )

# Deployment/Hosting/Distribution
eks_stack = EKSStack(app, "EKSStack")
cloudfront_stack = CloudFrontStack(app, "CloudFrontStack")

# Server deployment
eks_server_stack = EKSServerStack(app, "EKSServerStack")

# File Upload Process
file_upload_stack = FileUploadStack(app, "FileUploadStack")

# File Chat Process
file_chat_stack = FileChatStack(app, "FileChatStack")

# Create OpenSearch Vector Store Stack
opensearch_stack = OpenSearchStack(app, "OpenSearchStack",
    upload_bucket=file_upload_stack.upload_bucket,                         
)
# Create Bedrock Knowledge Base (needs bucket + OpenSearch)
bedrock_kb_stack = BedrockKnowledgeBaseStack(app, "KnowledgeBaseStack",
    upload_bucket=file_upload_stack.upload_bucket,
    collection_arn=opensearch_stack.collection.attr_arn,
    bedrock_role_arn=opensearch_stack.bedrock_role.role_arn,
    vector_index_name=opensearch_stack.vector_index_name
)

# AppSync API for users to talk with documents
appsync_stack = AppSyncStack(app, "AppSyncStack",
    user_pool=cognito_stack.user_pool,
    document_metadata_table=file_upload_stack.document_metadata_table,
    document_session_table=file_chat_stack.document_session_table,
    chat_message_table=file_chat_stack.chat_message_table
)

app.synth()
