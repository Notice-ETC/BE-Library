#!/bin/bash
set -e

echo "Deploying container..."
cd /Users/thana.suk/my-repo/BE-Library
docker-compose down || true
docker-compose up -d
echo "Deployment completed!"