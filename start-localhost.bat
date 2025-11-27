@echo off
cls
color 0A
title License Management System - Localhost Server

echo ========================================================
echo    License Management System - Localhost Setup
echo ========================================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file NOT FOUND!
    echo.
    echo Creating .env file...
    echo MYSQL_HOST=localhost> .env
    echo MYSQL_PORT=3306>> .env
    echo MYSQL_DATABASE=license_db>> .env
    echo MYSQL_USER=root>> .env
    echo MYSQL_PASSWORD=>> .env
    echo APP_ENV=development>> .env
    echo.
    echo [CREATED] .env file created successfully!
    echo.
    echo IMPORTANT: Please edit .env file and add your MySQL password
    echo Then run this file again.
    echo.
    pause
    notepad .env
    exit
)

echo [OK] .env file found
echo.

REM Kill any existing PHP servers on port 8000
echo Stopping any existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

echo.
echo Starting servers...
echo ========================================================
echo.
echo [1/2] PHP Backend  : http://localhost:8000
echo [2/2] React Frontend: http://localhost:5000/License/
echo.
echo Debug endpoint: http://localhost:8000/debug.php
echo.
echo ========================================================
echo.
echo KEEP THIS WINDOW OPEN!
echo Press Ctrl+C to stop both servers
echo.

REM Start PHP backend
start "PHP Backend (Port 8000)" cmd /k "cd /d "%~dp0" && echo PHP Backend Server && echo ==================== && echo. && php -S localhost:8000 -t api"

REM Wait for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend
echo Starting frontend...
call npm install --silent
npm run dev

REM Cleanup when frontend stops
echo.
echo Stopping servers...
taskkill /FI "WindowTitle eq PHP Backend*" /T /F >nul 2>&1
echo Done.
pause
