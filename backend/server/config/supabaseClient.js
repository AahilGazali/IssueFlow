const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env from the server directory (backend/server/.env)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const supabaseKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check backend/server/.env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
