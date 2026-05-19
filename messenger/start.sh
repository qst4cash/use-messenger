#!/bin/bash

echo "========================================"
echo "   USE Messenger - Starting..."
echo "========================================"
echo ""

echo "[1/2] Starting Backend (Go)..."
cd messenger/backend
go run main.go &
BACKEND_PID=$!
cd ../..

sleep 3

echo "[2/2] Starting Frontend (React)..."
cd messenger/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "========================================"
echo "   USE Messenger Started!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
