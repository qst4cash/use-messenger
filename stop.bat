@echo off
echo Stopping USE Server...
echo.

taskkill /FI "WINDOWTITLE eq USE Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq USE Frontend*" /T /F >nul 2>&1
taskkill /IM use-server.exe /F >nul 2>&1
taskkill /IM node.exe /F >nul 2>&1

echo USE Server stopped.
timeout /t 2 /nobreak >nul
