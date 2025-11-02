#!/bin/bash
set -e

echo "Deploying container..."
cd /Users/thana.suk/my-repo/BE-Library
podman-compose down || true
podman-compose up -d
echo "Deployment completed!"