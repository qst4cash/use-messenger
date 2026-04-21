#!/bin/bash

echo "Stopping USE Server..."
echo ""

pkill -f "use-server"
pkill -f "vite"

echo "USE Server stopped."
sleep 1
