from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import boto3
import json
import os
from typing import Generator

# Routes (Relative Imports)
from .routes.generate_upload_url import router as upload_router
from .routes.check_upload_status import router as status_router
from .routes.chat import router as chat_router

from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# Initialize Bedrock client
bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")


@app.get("/")
def root():
    return {"message": "Talk with Docs is alive 🧠📄"}


app.include_router(upload_router)
app.include_router(status_router)
app.include_router(chat_router)
