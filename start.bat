@echo off
echo Starting USE Server...
echo.

cd /d "%~dp0backend"

if not exist "use-server.exe" (
    echo Building server...
    go build -o use-server.exe
    if errorlevel 1 (
        echo Failed to build server
        pause
        exit /b 1
    )
)

echo Backend server starting on http://localhost:4000
start "USE Backend" cmd /k "use-server.exe"

timeout /t 2 /nobreak >nul

cd /d "%~dp0clients\web"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Frontend starting on http://localhost:3000
start "USE Frontend" cmd /k "npm run dev"

echo.
echo USE is starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
pause
