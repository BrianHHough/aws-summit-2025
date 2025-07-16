#!/bin/bash

set -e

# === Load env vars ===
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "❌ .env.local not found."
  exit 1
fi

# === Validate inputs ===
if [[ -z "$CLUSTER_NAME_FULL" ]]; then
  echo "❌ CLUSTER_NAME_FULL is not set in $ENV_FILE"
  exit 1
fi

if [[ -z "$AWS_REGION" ]]; then
  echo "❌ AWS_REGION is not set in $ENV_FILE"
  exit 1
fi

echo "🔄 Updating EKS kubeconfig for cluster: $CLUSTER_NAME_FULL"
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME_FULL"

echo "⏳ Waiting for EKS LoadBalancer DNS to be available..."

for i in {1..30}; do
  ELB_DNS=$(kubectl get svc talk-with-docs -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)

  if [[ -n "$ELB_DNS" ]]; then
    echo "✅ ELB DNS found: $ELB_DNS"
    break
  fi

  echo "Attempt $i: Still waiting for LoadBalancer..."
  sleep 10
done

if [[ -z "$ELB_DNS" ]]; then
  echo "❌ Failed to retrieve ELB DNS after multiple attempts."
  exit 1
fi

echo "🔐 Updating SSM Parameter Store..."
aws ssm put-parameter \
  --name "/talk-with-docs/eks/loadbalancer_dns" \
  --type "String" \
  --value "$ELB_DNS" \
  --region "$AWS_REGION" \
  --overwrite

echo "🎉 SSM parameter updated with ELB DNS."
