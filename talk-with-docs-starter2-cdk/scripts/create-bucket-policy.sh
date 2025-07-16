#!/bin/bash
# Usage: ./create-bucket-policy.sh <BUCKET_NAME> <ACCOUNT_ID>

set -e

BUCKET_NAME=$1
ACCOUNT_ID=$2

if [[ -z "$BUCKET_NAME" || -z "$ACCOUNT_ID" ]]; then
  echo "Usage: $0 <BUCKET_NAME> <ACCOUNT_ID>"
  exit 1
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/aws-service-role/malware-protection.guardduty.amazonaws.com/AWSServiceRoleForAmazonGuardDutyMalwareProtection"

# Create a bucket policy that grants permissions to the GuardDuty Malware Protection service role
POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowGuardDutyMalwareProtection",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${ROLE_ARN}"
      },
      "Action": [
        "s3:GetObject",
        "s3:GetObjectTagging",
        "s3:PutObjectTagging",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${BUCKET_NAME}",
        "arn:aws:s3:::${BUCKET_NAME}/*"
      ]
    }
  ]
}
EOF
)

# Apply the bucket policy
aws s3api put-bucket-policy --bucket "${BUCKET_NAME}" --policy "${POLICY}"

echo "Bucket policy applied to ${BUCKET_NAME}"