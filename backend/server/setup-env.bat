@echo off
cd /d "%~dp0"
echo Creating .env file with your Supabase credentials...
(
echo # Supabase Configuration
echo SUPABASE_URL=https://sglijivwgykgqjahjfcz.supabase.co
echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbGlqaXZ3Z3lrZ3FqYWhqZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTQxMjgsImV4cCI6MjA4NDczMDEyOH0.y2DS0QXotuQzhc-1LJUwkSmWEkUB3p8khoUsISkqeOM
echo.
echo # Server Configuration
echo PORT=3000
) > .env
echo.
echo .env file created successfully in: %CD%
echo.
echo You can now run: npm start
echo.
pause
