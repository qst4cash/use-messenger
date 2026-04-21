@echo off
echo USE Server Logs
echo ================
echo.

if "%1"=="" (
    echo Usage: logs.bat [backend^|frontend^|all]
    echo.
    echo Examples:
    echo   logs.bat backend   - Show backend logs
    echo   logs.bat frontend  - Show frontend logs
    echo   logs.bat all       - Show all logs
    pause
    exit /b 1
)

if "%1"=="backend" (
    echo Backend Logs:
    echo -------------
    if exist "backend\server.log" (
        type backend\server.log
    ) else (
        echo No backend logs found
    )
)

if "%1"=="frontend" (
    echo Frontend Logs:
    echo --------------
    if exist "clients\web\vite.log" (
        type clients\web\vite.log
    ) else (
        echo No frontend logs found
    )
)

if "%1"=="all" (
    echo Backend Logs:
    echo -------------
    if exist "backend\server.log" (
        type backend\server.log
    ) else (
        echo No backend logs found
    )
    echo.
    echo Frontend Logs:
    echo --------------
    if exist "clients\web\vite.log" (
        type clients\web\vite.log
    ) else (
        echo No frontend logs found
    )
)

echo.
pause
