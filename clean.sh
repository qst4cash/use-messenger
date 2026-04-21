#!/bin/bash

echo "Cleaning USE project..."
echo ""

cd "$(dirname "$0")/backend"

echo "Cleaning backend..."
rm -f use-server use-server.exe
rm -f use.db
rm -rf uploads
echo "Backend cleaned"

cd "../clients/web"

echo "Cleaning frontend..."
rm -rf node_modules dist .vite
echo "Frontend cleaned"

echo ""
echo "Clean complete!"
