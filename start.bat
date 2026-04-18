@echo off
echo Starting ATTSYS 2.0...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
pause
