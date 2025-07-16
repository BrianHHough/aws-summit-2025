# talk_with_docs_backend/chat_stack.py

from aws_cdk import Stack, CfnOutput, RemovalPolicy
from aws_cdk import aws_dynamodb as ddb
from constructs import Construct

class FileChatStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # DocumentSession Table
        self.document_session_table = ddb.Table(
            self, "DocumentSessionTable",
            partition_key=ddb.Attribute(name="id", type=ddb.AttributeType.STRING),
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )
        self.document_session_table.add_global_secondary_index(
            index_name="document_id-index",
            partition_key=ddb.Attribute(name="document_id", type=ddb.AttributeType.STRING)
        )

        # ChatMessage Table
        self.chat_message_table = ddb.Table(
            self, "ChatMessageTable",
            partition_key=ddb.Attribute(name="id", type=ddb.AttributeType.STRING),
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )
        self.chat_message_table.add_global_secondary_index(
            index_name="document_session_id-index",
            partition_key=ddb.Attribute(name="document_session_id", type=ddb.AttributeType.STRING)
        )

        # Outputs
        CfnOutput(self, "DocumentSessionTableName", value=self.document_session_table.table_name)
        CfnOutput(self, "ChatMessageTableName", value=self.chat_message_table.table_name)
