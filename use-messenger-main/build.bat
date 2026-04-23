@echo off
echo Building USE for production...
echo.

cd /d "%~dp0backend"

echo Building backend...
go build -o use-server.exe -ldflags="-s -w"
if errorlevel 1 (
    echo Failed to build backend
    pause
    exit /b 1
)
echo Backend built successfully

cd /d "%~dp0clients\web"

echo Building frontend...
call npm run build
if errorlevel 1 (
    echo Failed to build frontend
    pause
    exit /b 1
)
echo Frontend built successfully

echo.
echo Build complete!
echo Backend: backend/use-server.exe
echo Frontend: clients/web/dist/
echo.
pause
