@echo off
color 0A
echo ================================================
echo   License Management System - Full Stack Server
echo ================================================
echo.
echo Starting PHP Backend + React Frontend...
echo.
echo Backend API: http://localhost:8000
echo Frontend:    http://localhost:5000/License/
echo.
echo IMPORTANT: Keep this window OPEN while working
echo Press Ctrl+C to stop BOTH servers
echo ================================================
echo.

REM Start PHP backend in a new window
echo [1/2] Starting PHP Backend Server (Port 8000)...
start "PHP Backend - Port 8000" cmd /k "echo PHP Backend Server Running on Port 8000 && echo. && php -S localhost:8000 -t api"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Build and start frontend
echo.
echo [2/2] Building and Starting Frontend (Port 5000)...
echo.
call npm run build
echo.
echo Starting Preview Server...
npm run preview

REM Cleanup: Close PHP window when frontend stops
echo.
echo Stopping PHP Backend Server...
taskkill /FI "WindowTitle eq PHP Backend - Port 8000*" /T /F >nul 2>&1
echo.
echo All servers stopped. Press any key to exit...
pause >nul
