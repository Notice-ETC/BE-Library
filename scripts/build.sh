#!/bin/bash
set -e

echo "Building Docker image..."
cd /Users/thana.suk/my-repo/BE-Library
podman-compose build
echo "Build completed!"