@echo off
color 0B
echo ===============================================
echo License Management System - Preview Mode
echo ===============================================
echo.
echo Building the project first...
call npm run build
echo.
echo Starting both Frontend (Preview) and Backend servers...
echo.
echo Frontend will run on: http://localhost:5000/License/
echo Backend API will run on: http://localhost:8000
echo.
echo IMPORTANT: Keep this window OPEN
echo Press Ctrl+C to stop both servers
echo.
echo ===============================================
echo.

REM Start PHP backend server in a new window
echo [1/2] Starting PHP Backend Server...
start "PHP Backend - Port 8000" cmd /k "echo PHP Backend Running on Port 8000 && echo Database: Check .env file && echo. && php -S localhost:8000 -t api"

REM Wait a moment for PHP server to start
echo [2/2] Starting Frontend Server...
timeout /t 3 /nobreak >nul

REM Start Vite preview server in the current window
npm run preview

REM If npm exits, close the PHP server window
echo.
echo Stopping servers...
taskkill /FI "WindowTitle eq PHP Backend - Port 8000*" /T /F >nul 2>&1
echo Servers stopped.
