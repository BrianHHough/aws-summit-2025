#!/bin/bash

# Build the Docker image if needed
docker build -t fastapi-server .

# Run the container with AWS credentials from your environment
docker run -p 8000:8000 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
  fastapi-server