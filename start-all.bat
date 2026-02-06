@echo off
echo ========================================
echo   Bug Tracker - Starting All Services
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "if not exist node_modules (npm install) && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && if not exist node_modules (npm install) && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
