#!/bin/bash

echo "USE Server Logs"
echo "================"
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./logs.sh [backend|frontend|all]"
    echo ""
    echo "Examples:"
    echo "  ./logs.sh backend   - Show backend logs"
    echo "  ./logs.sh frontend  - Show frontend logs"
    echo "  ./logs.sh all       - Show all logs"
    exit 1
fi

if [ "$1" = "backend" ]; then
    echo "Backend Logs:"
    echo "-------------"
    if [ -f "backend/server.log" ]; then
        cat backend/server.log
    else
        echo "No backend logs found"
    fi
fi

if [ "$1" = "frontend" ]; then
    echo "Frontend Logs:"
    echo "--------------"
    if [ -f "clients/web/vite.log" ]; then
        cat clients/web/vite.log
    else
        echo "No frontend logs found"
    fi
fi

if [ "$1" = "all" ]; then
    echo "Backend Logs:"
    echo "-------------"
    if [ -f "backend/server.log" ]; then
        cat backend/server.log
    else
        echo "No backend logs found"
    fi
    echo ""
    echo "Frontend Logs:"
    echo "--------------"
    if [ -f "clients/web/vite.log" ]; then
        cat clients/web/vite.log
    else
        echo "No frontend logs found"
    fi
fi

echo ""
