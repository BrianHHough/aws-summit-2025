#!/bin/bash

# === Configurable Inputs ===
REGION="us-east-1"
KB_ID="0DDPSV7D4K"  # <-- replace with your actual KnowledgeBase ID

# === Step 1: Get Data Source ID ===
echo "🔍 Fetching data source ID for knowledge base $KB_ID..."
DATA_SOURCE_ID=$(aws bedrock-agent list-data-sources \
  --region "$REGION" \
  --knowledge-base-id "$KB_ID" \
  --query "dataSourceSummaries[0].dataSourceId" \
  --output text)

if [[ "$DATA_SOURCE_ID" == "None" || -z "$DATA_SOURCE_ID" ]]; then
  echo "❌ No data source found for KB $KB_ID"
  exit 1
fi

echo "✅ Found Data Source ID: $DATA_SOURCE_ID"

# === Step 2: Start Sync (Ingestion) Job ===
echo "🚀 Starting ingestion job for data source $DATA_SOURCE_ID..."

aws bedrock-agent start-ingestion-job \
  --region "$REGION" \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$DATA_SOURCE_ID" \

echo "🎉 Ingestion job triggered!"
