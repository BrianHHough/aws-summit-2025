import os
import boto3
import json
from pinecone import Pinecone
from langchain.embeddings import BedrockEmbeddings  # Simplified example
from utils.text_extraction import extract_text  # You would implement this

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
secrets = boto3.client("secretsmanager")

TABLE_NAME = os.environ["TABLE_NAME"]
PINECONE_SECRET_NAME = os.environ["PINECONE_SECRET_NAME"]
table = dynamodb.Table(TABLE_NAME)

def main(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]
        user_sub, file_id, filename = key.split("/", 2)

        # Download file from S3
        obj = s3.get_object(Bucket=bucket, Key=key)
        file_bytes = obj["Body"].read()

        # Extract text (you'll implement this)
        text = extract_text(file_bytes, filename)
        if not text:
            raise Exception("Text extraction failed")

        # Get Pinecone API key
        pinecone_key = secrets.get_secret_value(SecretId=PINECONE_SECRET_NAME)["SecretString"]
        pc = Pinecone(api_key=pinecone_key)
        index = pc.Index("talk-with-docs")

        # Embed and upload
        embedder = BedrockEmbeddings(model="amazon.titan-embed-text-v1")
        chunks = text.split("\n\n")  # Simplistic chunking
        vectors = [{"id": f"{file_id}-{i}", "values": embedder.embed(chunk)} for i, chunk in enumerate(chunks)]

        index.upsert(vectors)

        # Mark as processed
        table.update_item(
            Key={"pk": user_sub, "sk": f"doc#{file_id}"},
            UpdateExpression="SET #s = :s",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": "vectorized"}
        )
