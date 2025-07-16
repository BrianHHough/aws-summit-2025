from fastapi import Request, APIRouter
import uuid
import boto3
import os
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
dynamodb = boto3.resource("dynamodb")

class UploadRequest(BaseModel):
    file_title: str
    file_type: str
    file_size: Optional[int] = None
    page_count: Optional[int] = None

@router.post("/generate-upload-url")
async def generate_upload_url(request: Request, body: UploadRequest):
    # Defer env var access until inside the route
    upload_bucket = os.getenv("UPLOAD_BUCKET_NAME")
    ddb_table_name = os.getenv("DDB_TABLE")
    if not ddb_table_name or not upload_bucket:
        raise RuntimeError("Missing DDB_TABLE or UPLOAD_BUCKET_NAME environment variable")

    table = dynamodb.Table(ddb_table_name)

    user_id = request.headers.get("X-User-Id", "anonymous")  # fallback
    document_id = str(uuid.uuid4())
    object_key = f"{user_id}/{document_id}/{body.file_title}"

    # 1. Generate pre-signed URL
    presigned_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": upload_bucket,
            "Key": object_key,
            "ContentType": body.file_type
        },
        ExpiresIn=3600
    )

    # 2. Create metadata entry in DynamoDB
    item = {
        "document_id": document_id,
        "user_id": user_id,
        "file_title": body.file_title,
        "file_type": body.file_type,
        "s3_key": object_key,
        "scan_status": "PENDING",
        "upload_timestamp": datetime.utcnow().replace(microsecond=0).isoformat() + "Z" # UTC Timezone
    }
    
    # Add optional fields if provided
    if body.file_size is not None:
        item["file_size"] = body.file_size
    if body.page_count is not None:
        item["page_count"] = body.page_count
        
    table.put_item(Item=item)

    return {
        "upload_url": presigned_url,
        "document_id": document_id,
        "upload_bucket": upload_bucket
    }
