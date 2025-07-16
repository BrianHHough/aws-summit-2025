import os
import json
import boto3
from datetime import datetime
from pinecone import Pinecone

# === Load config ===
TABLE_NAME = os.environ["TABLE_NAME"]
PINECONE_SECRET_NAME = os.environ["PINECONE_SECRET_NAME"]
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "talk-with-docs")

# === AWS clients ===
secrets_client = boto3.client("secretsmanager")
bedrock_runtime = boto3.client("bedrock-runtime", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

# === Initialize Pinecone ===
pinecone_api_key = secrets_client.get_secret_value(SecretId=PINECONE_SECRET_NAME)["SecretString"]
pc = Pinecone(api_key=pinecone_api_key)
index = pc.Index(PINECONE_INDEX_NAME)

# === Helpers ===
def embed_text(text: str):
    response = bedrock_runtime.invoke_model(
        modelId="amazon.titan-embed-text-v1",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({ "inputText": text })
    )
    body = json.loads(response["body"].read())
    return body["embedding"]

def query_pinecone(embedding, doc_id):
    results = index.query(
        vector=embedding,
        top_k=5,
        include_metadata=True,
        filter={"doc_id": {"$eq": doc_id}}
    )
    return results["matches"]

def generate_claude_response(context_chunks, user_message):
    context = "\n---\n".join(c["metadata"]["text"] for c in context_chunks)
    prompt = f"Context:\n{context}\n\nUser: {user_message}\nAssistant:"

    response = bedrock_runtime.invoke_model(
        modelId="anthropic.claude-3-sonnet-20240229-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7
        })
    )
    content = json.loads(response["body"].read())
    return content["content"][0]["text"]

# === Lambda handler ===
def main(event, context):
    user_sub = event["identity"]["sub"]
    doc_id = event["arguments"]["documentId"]
    message = event["arguments"]["message"]

    # 1. Embed the user message
    user_embedding = embed_text(message)

    # 2. Search Pinecone for relevant context
    chunks = query_pinecone(user_embedding, doc_id)

    # 3. Generate a response using Claude
    response_text = generate_claude_response(chunks, message)

    # 4. Save to DynamoDB
    table.put_item(Item={
        "pk": user_sub,
        "sk": f"chat#{doc_id}#{datetime.utcnow().isoformat()}",
        "message": message,
        "response": response_text
    })

    return response_text
