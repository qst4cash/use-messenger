#!/bin/bash

echo "Starting USE Server..."
echo ""

cd "$(dirname "$0")/backend"

if [ ! -f "use-server" ]; then
    echo "Building server..."
    go build -o use-server
    if [ $? -ne 0 ]; then
        echo "Failed to build server"
        exit 1
    fi
fi

echo "Backend server starting on http://localhost:4000"
./use-server &
BACKEND_PID=$!

sleep 2

cd "../clients/web"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Frontend starting on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "USE is running..."
echo "Backend: http://localhost:4000 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
