@echo off
cd /d "%~dp0"
echo # Supabase Configuration> .env
echo SUPABASE_URL=https://sglijivwgykgqjahjfcz.supabase.co>> .env
echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbGlqaXZ3Z3lrZ3FqYWhqZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTQxMjgsImV4cCI6MjA4NDczMDEyOH0.y2DS0QXotuQzhc-1LJUwkSmWEkUB3p8khoUsISkqeOM>> .env
echo.>> .env
echo # Server Configuration>> .env
echo PORT=3000>> .env
echo.
echo .env file created successfully!
echo Location: %CD%\.env
echo.
echo You can now run: npm start
pause
