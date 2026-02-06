# Quick Fix: Create .env File

## Method 1: Run the Script (Easiest)
Double-click `setup-env.bat` in this folder.

## Method 2: Use Node Script
Run this command from the `backend/server` directory:
```bash
node create-env.js
```

## Method 3: Manual Creation
1. In the `backend/server` folder, create a new file named `.env` (exactly `.env`, not `.env.txt`)
2. Copy and paste this content:

```
# Supabase Configuration
SUPABASE_URL=https://sglijivwgykgqjahjfcz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbGlqaXZ3Z3lrZ3FqYWhqZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTQxMjgsImV4cCI6MjA4NDczMDEyOH0.y2DS0QXotuQzhc-1LJUwkSmWEkUB3p8khoUsISkqeOM

# Server Configuration
PORT=3000
```

3. Save the file

## Verify
After creating the file, you should see `.env` in the `backend/server` folder.

Then try running `npm start` again from the root directory.
