@echo off
title USE Messenger Manager

:menu
cls
echo ================================
echo    USE Messenger Manager
echo ================================
echo.
echo 1. Start servers
echo 2. Stop servers
echo 3. Check status
echo 4. Install dependencies
echo 5. Build production
echo 6. Clean project
echo 7. View logs
echo 8. Exit
echo.
set /p choice="Select option [1-8]: "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto status
if "%choice%"=="4" goto install
if "%choice%"=="5" goto build
if "%choice%"=="6" goto clean
if "%choice%"=="7" goto logs
if "%choice%"=="8" goto exit
goto invalid

:start
echo.
call start.bat
pause
goto menu

:stop
echo.
call stop.bat
pause
goto menu

:status
echo.
call status.bat
pause
goto menu

:install
echo.
call install.bat
pause
goto menu

:build
echo.
call build.bat
pause
goto menu

:clean
echo.
call clean.bat
pause
goto menu

:logs
echo.
echo 1. Backend logs
echo 2. Frontend logs
echo 3. All logs
set /p log_choice="Select: "
if "%log_choice%"=="1" call logs.bat backend
if "%log_choice%"=="2" call logs.bat frontend
if "%log_choice%"=="3" call logs.bat all
pause
goto menu

:invalid
echo.
echo Invalid option!
pause
goto menu

:exit
echo.
echo Goodbye!
timeout /t 2 /nobreak >nul
exit
