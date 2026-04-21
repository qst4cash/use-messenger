@echo off
echo Checking USE Server status...
echo.

echo Checking backend (port 4000)...
netstat -ano | findstr ":4000" >nul
if %errorlevel% equ 0 (
    echo [OK] Backend is running on http://localhost:4000
) else (
    echo [X] Backend is not running
)

echo.
echo Checking frontend (port 3000)...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [OK] Frontend is running on http://localhost:3000
) else (
    echo [X] Frontend is not running
)

echo.
pause
