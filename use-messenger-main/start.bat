@echo off
echo Starting USE Server...
echo.

REM Kill old backend processes
echo Stopping old backend processes...
taskkill /F /IM use-server.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Kill old frontend processes
echo Stopping old frontend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

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
