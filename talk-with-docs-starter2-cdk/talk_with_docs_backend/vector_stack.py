from aws_cdk import Stack, aws_secretsmanager as secretsmanager, CfnOutput
from constructs import Construct

class VectorStoreStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # Store Pinecone API key in Secrets Manager
        self.pinecone_secret = secretsmanager.Secret(self, "PineconeAPIKey",
            secret_name="prod/pinecone/api-key",
            description="API key for Pinecone vector DB",
        )

        CfnOutput(self, "PineconeSecretName", value=self.pinecone_secret.secret_name)
