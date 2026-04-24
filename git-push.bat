@echo off
echo ====================================
echo Git Push Script
echo ====================================
echo.

set /p commit_message=Enter commit message:

if "%commit_message%"=="" (
    echo Error: Commit message cannot be empty!
    pause
    exit /b 1
)

echo.
echo Adding files...
git add .

echo.
echo Creating commit...
git commit -m "%commit_message%"

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ====================================
echo Done!
echo ====================================
pause
