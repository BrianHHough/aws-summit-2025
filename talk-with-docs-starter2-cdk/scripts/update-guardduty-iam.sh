#!/bin/bash

# Set strict mode
set -euo pipefail

# ========== Config ==========
ROLE_NAME="AWSServiceRoleForAmazonGuardDutyMalwareProtection"
POLICY_NAME="AllowS3UploadBucketScan"
BUCKET_NAME="fileuploadstack-uploadbucketd2c1da78-bwthi8hj4fin"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
# ============================

echo "📌 Checking if IAM Role '${ROLE_NAME}' exists..."
if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "❌ Role '${ROLE_NAME}' not found. Make sure GuardDuty is enabled and malware protection is turned on."
  exit 1
fi

echo "✅ Role exists."

# Create the policy document
POLICY_JSON=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ScanAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
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

echo "🛠 Attaching inline policy '${POLICY_NAME}' to '${ROLE_NAME}'..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document "$POLICY_JSON"

echo "🎉 Done! GuardDuty role now has access to scan S3 bucket: ${BUCKET_NAME}"
