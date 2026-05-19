@echo off
echo ========================================
echo    USE Messenger - Starting...
echo ========================================
echo.

echo [1/2] Starting Backend (Go)...
start "USE Backend" cmd /k "cd messenger\backend && go run main.go"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (React)...
start "USE Frontend" cmd /k "cd messenger\frontend && npm run dev"

echo.
echo ========================================
echo    USE Messenger Started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:4000
echo.
echo Press any key to exit...
pause >nul
