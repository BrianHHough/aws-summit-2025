import os
import boto3
import uuid

bedrock = boto3.client("bedrock-agent")

def main(event, context):
    print("Event received:", event)

    knowledge_base_id = os.environ["KNOWLEDGE_BASE_ID"]
    data_source_id = os.environ["DATA_SOURCE_ID"]

    try:
        response = bedrock.start_ingestion_job(
            knowledgeBaseId=knowledge_base_id,
            dataSourceId=data_source_id,
            # clientToken=f"{uuid.uuid4()}"
        )
        print("Ingestion job started:", response)
    except Exception as e:
        print("Failed to start ingestion job:", str(e))
        raise
