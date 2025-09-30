const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function directRLSFix() {
  console.log('Attempting direct RLS disable...');
  
  // Try using raw SQL via the REST API with proper headers
  const sqlCommands = [
    'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
  ];
  
  for (const sql of sqlCommands) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/sql',
          'Accept': 'application/json'
        },
        body: sql
      });
      
      console.log(`SQL: ${sql}`);
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${await response.text()}`);
      
    } catch (error) {
      console.log('Error executing SQL:', error.message);
    }
  }
}

directRLSFix();
