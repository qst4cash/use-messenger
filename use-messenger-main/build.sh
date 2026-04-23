#!/bin/bash

echo "Building USE for production..."
echo ""

cd "$(dirname "$0")/backend"

echo "Building backend..."
go build -o use-server -ldflags="-s -w"
if [ $? -ne 0 ]; then
    echo "Failed to build backend"
    exit 1
fi
echo "Backend built successfully"

cd "../clients/web"

echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build frontend"
    exit 1
fi
echo "Frontend built successfully"

echo ""
echo "Build complete!"
echo "Backend: backend/use-server"
echo "Frontend: clients/web/dist/"
