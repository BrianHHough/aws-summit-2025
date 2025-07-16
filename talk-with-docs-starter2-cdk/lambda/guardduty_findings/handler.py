import os
import boto3
import json

ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["DDB_TABLE"])

def main(event, context):
    print("Event:", json.dumps(event))

    findings = event.get("detail", {}).get("service", {}).get("additionalInfo", {}).get("malwareProtection", {})
    s3_metadata = event.get("detail", {}).get("resource", {}).get("resourceDetails", {}).get("s3Bucket", {})
    object_key = s3_metadata.get("objectKey")
    bucket_name = s3_metadata.get("bucketName")

    status = findings.get("scanResultDetails", {}).get("scanResult")

    # Extract document_id from S3 object key
    try:
        # assuming key is like userid/document_id/filename.pdf
        document_id = object_key.split("/")[1]
    except Exception as e:
        print("Failed to parse document ID:", e)
        return

    # Update DynamoDB
    table.update_item(
        Key={"document_id": document_id},
        UpdateExpression="SET scan_status = :s",
        ExpressionAttributeValues={":s": status}
    )

    return {"message": "Scan result processed", "status": status}
