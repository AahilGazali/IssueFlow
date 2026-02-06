# Create .env File Instructions

Your Supabase credentials have been configured. To create the `.env` file:

## Option 1: Run the Setup Script (Easiest)
Double-click `setup-env.bat` in this folder. It will automatically create the `.env` file with your credentials.

## Option 2: Manual Creation
1. Create a new file named `.env` (no extension) in this folder
2. Copy and paste the following content:

```
# Supabase Configuration
SUPABASE_URL=https://sglijivwgykgqjahjfcz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbGlqaXZ3Z3lrZ3FqYWhqZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTQxMjgsImV4cCI6MjA4NDczMDEyOH0.y2DS0QXotuQzhc-1LJUwkSmWEkUB3p8khoUsISkqeOM

# Server Configuration
PORT=3000

# Optional: for inviting members by email and showing member emails (Supabase Dashboard → Settings → API → service_role)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

3. Save the file

## Verify
After creating the `.env` file, you should see it in this folder. Make sure it's named exactly `.env` (not `.env.txt` or anything else).

## Next Steps
1. Set up your Supabase database tables (see main README.md for SQL schema)
2. Start the backend server with `npm start` or `start-backend.bat`
