#!/bin/bash
set -e

echo "Building Docker image..."
cd /Users/thana.suk/my-repo/BE-Library
docker-compose build
echo "Build completed!"