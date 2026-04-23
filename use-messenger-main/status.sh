#!/bin/bash

echo "Checking USE Server status..."
echo ""

echo "Checking backend (port 4000)..."
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":4000.*LISTEN"; then
    echo "[OK] Backend is running on http://localhost:4000"
else
    echo "[X] Backend is not running"
fi

echo ""
echo "Checking frontend (port 3000)..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":3000.*LISTEN"; then
    echo "[OK] Frontend is running on http://localhost:3000"
else
    echo "[X] Frontend is not running"
fi

echo ""
