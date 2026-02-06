@echo off
echo Starting Backend Server...
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
echo.
echo Backend server starting on http://localhost:3000
echo Make sure you have created backend\server\.env file with your Supabase credentials!
echo.
call npm start
