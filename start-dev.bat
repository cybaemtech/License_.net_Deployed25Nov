@echo off
echo ===============================================
echo License Management System - Development Server
echo ===============================================
echo.
echo Starting both Frontend and Backend servers...
echo.
echo Frontend will run on: http://localhost:5000/License/
echo Backend API will run on: http://localhost:8000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start PHP backend server in a new window
start "PHP Backend Server" cmd /k "php -S localhost:8000 -t api"

REM Wait a moment for PHP server to start
timeout /t 2 /nobreak >nul

REM Start Vite frontend server in the current window
echo Starting Frontend server...
npm run dev

REM If npm exits, close the PHP server window
taskkill /FI "WindowTitle eq PHP Backend Server*" /T /F >nul 2>&1
