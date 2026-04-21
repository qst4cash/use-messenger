@echo off
echo Cleaning USE project...
echo.

cd /d "%~dp0backend"

echo Cleaning backend...
if exist "use-server.exe" del /f /q use-server.exe
if exist "use-server" del /f /q use-server
if exist "use.db" del /f /q use.db
if exist "uploads" rd /s /q uploads
echo Backend cleaned

cd /d "%~dp0clients\web"

echo Cleaning frontend...
if exist "node_modules" rd /s /q node_modules
if exist "dist" rd /s /q dist
if exist ".vite" rd /s /q .vite
echo Frontend cleaned

echo.
echo Clean complete!
pause
