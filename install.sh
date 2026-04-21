#!/bin/bash

echo "Installing USE dependencies..."
echo ""

cd "$(dirname "$0")/backend"

echo "Installing backend dependencies..."
go mod download
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi
echo "Backend dependencies installed"

cd "../clients/web"

echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies"
    exit 1
fi
echo "Frontend dependencies installed"

echo ""
echo "Installation complete!"
