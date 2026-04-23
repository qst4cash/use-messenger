@echo off
echo Installing USE dependencies...
echo.

cd /d "%~dp0backend"

echo Installing backend dependencies...
go mod download
if errorlevel 1 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed

cd /d "%~dp0clients\web"

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed

echo.
echo Installation complete!
pause
