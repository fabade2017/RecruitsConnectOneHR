#!/bin/bash
set -e
# Push OneHR images to AWS ECR (run from repo root)
# Usage: AWS_PROFILE=onehr REGION=eu-west-1 ACCOUNT_ID=123456789012 ./aws/push-ecr.sh
REGION=${REGION:-eu-west-1}
ACCOUNT_ID=${ACCOUNT_ID:?Set ACCOUNT_ID env}
PREFIX="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "Authenticating ECR $REGION..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $PREFIX

for svc in api web; do
  REPO="onehr-$svc"
  echo "Creating repo $REPO if missing..."
  aws ecr describe-repositories --repository-names $REPO --region $REGION 2>&1 | grep -q $REPO || \
    aws ecr create-repository --repository-name $REPO --region $REGION

  echo "Building $svc..."
  docker build -f apps/$svc/Dockerfile -t $REPO:latest .

  echo "Tagging $PREFIX/$REPO:latest..."
  docker tag $REPO:latest $PREFIX/$REPO:latest
  docker push $PREFIX/$REPO:latest
  echo "Pushed $PREFIX/$REPO:latest"
done

# Chatbot (if you have ./chatbot/Dockerfile)
if [ -f chatbot/Dockerfile ]; then
  REPO="onehr-chatbot"
  aws ecr describe-repositories --repository-names $REPO --region $REGION 2>&1 | grep -q $REPO || \
    aws ecr create-repository --repository-name $REPO --region $REGION
  docker build -f chatbot/Dockerfile -t $REPO:latest ./chatbot
  docker tag $REPO:latest $PREFIX/$REPO:latest
  docker push $PREFIX/$REPO:latest
  echo "Pushed chatbot"
fi
echo "Done. Update ecs-task-*.json ACCOUNT_ID/REGION and register: aws ecs register-task-definition --cli-input-json file://aws/ecs-task-api.json"
