#!/bin/bash

# Usage: ./enable-guardduty-s3.sh <BUCKET_NAME> <ACCOUNT_ID>

set -e

BUCKET_NAME=$1
ACCOUNT_ID=$2

if [[ -z "$BUCKET_NAME" || -z "$ACCOUNT_ID" ]]; then
  echo "Usage: $0 <BUCKET_NAME> <ACCOUNT_ID>"
  exit 1
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/aws-service-role/malware-protection.guardduty.amazonaws.com/AWSServiceRoleForAmazonGuardDutyMalwareProtection"

aws guardduty create-malware-protection-plan \
  --role "$ROLE_ARN" \
  --protected-resource "S3Bucket={BucketName=${BUCKET_NAME}}" \
  --actions "Tagging={Status=ENABLED}"
