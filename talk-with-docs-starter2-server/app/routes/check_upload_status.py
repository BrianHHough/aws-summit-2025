from fastapi import Request, APIRouter, HTTPException
import boto3
import os

router = APIRouter()

dynamodb = boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION", "us-east-1"))

@router.get("/check-upload-status/{document_id}")
async def check_upload_status(document_id: str, request: Request):
    ddb_table_name = os.getenv("DDB_TABLE")
    if not ddb_table_name:
        raise RuntimeError("Missing DDB_TABLE environment variable")

    table = dynamodb.Table(ddb_table_name)

    try:
        response = table.get_item(Key={"document_id": document_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying DynamoDB: {str(e)}")

    item = response.get("Item")

    if not item:
        return {"status": "NOT_FOUND"}

    # Authorization check - API Gateway handles authentication
    # Get user ID from the header set by API Gateway
    print('All headers:', dict(request.headers))
    request_user = request.headers.get("X-User-Id")
    print('request_user before check:', request_user)
    print('item user_id:', item.get("user_id"))
    if not request_user or item.get("user_id") != request_user:
        raise HTTPException(status_code=403, detail="Unauthorized")
    print('request_user after check:', request_user)
    return {
        "status": item.get("scan_status", "UNKNOWN"),
        "file_title": item.get("file_title"),
        "s3_key": item.get("s3_key"),
        "user_id": item.get("user_id"),
        "upload_timestamp": item.get("upload_timestamp"),
    }
