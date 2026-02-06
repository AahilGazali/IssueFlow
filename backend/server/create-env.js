const fs = require('fs');
const path = require('path');

const envContent = `# Supabase Configuration
SUPABASE_URL=https://sglijivwgykgqjahjfcz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbGlqaXZ3Z3lrZ3FqYWhqZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTQxMjgsImV4cCI6MjA4NDczMDEyOH0.y2DS0QXotuQzhc-1LJUwkSmWEkUB3p8khoUsISkqeOM

# Server Configuration
PORT=3000
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('Location:', envPath);
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}
