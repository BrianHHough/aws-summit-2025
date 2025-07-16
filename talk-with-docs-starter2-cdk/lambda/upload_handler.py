import os
import boto3
import uuid
from datetime import datetime

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

BUCKET_NAME = os.environ["BUCKET_NAME"]
TABLE_NAME = os.environ["TABLE_NAME"]
table = dynamodb.Table(TABLE_NAME)

def main(event, context):
    filename = event["arguments"]["filename"]
    user_sub = event["identity"]["sub"]

    file_id = str(uuid.uuid4())
    s3_key = f"{user_sub}/{file_id}/{filename}"

    url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": BUCKET_NAME, "Key": s3_key},
        ExpiresIn=3600
    )

    table.put_item(Item={
        "pk": user_sub,
        "sk": f"doc#{file_id}",
        "filename": filename,
        "s3_key": s3_key,
        "createdAt": datetime.utcnow().isoformat(),
        "status": "uploading"
    })

    return {
        "uploadUrl": url,
        "fileId": file_id,
        "message": "Upload your file using the provided URL. It will be processed automatically."
    }
