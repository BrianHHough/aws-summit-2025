# routes/chat.py
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from typing import Generator
import boto3
import os
import json

router = APIRouter()

bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")


@router.post("/chat")
async def chat(request: Request) -> StreamingResponse:
    user_id = request.headers.get("X-User-Id", "anonymous")

    body = await request.json()
    user_input = body.get("message", "")
    document_id = body.get("documentId", "")

    print(f"User ID: {user_id}, Document ID: {document_id}")
    print(f"Request body: {body}")

    payload = {
        "messages": [{"role": "user", "content": user_input}],
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "temperature": 0.7,
        "top_k": 250,
        "top_p": 0.999
    }

    def bedrock_stream() -> Generator[bytes, None, None]:
        response = bedrock.invoke_model_with_response_stream(
            body=json.dumps(payload),
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json"
        )

        for event in response.get("body"):
            chunk = event.get("chunk")
            if chunk:
                chunk_data = json.loads(chunk.get("bytes").decode())
                if "delta" in chunk_data and "text" in chunk_data["delta"]:
                    yield chunk_data["delta"]["text"].encode("utf-8")

    return StreamingResponse(
        bedrock_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Transfer-Encoding": "chunked"
        }
    )
