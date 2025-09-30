const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableRLS() {
  console.log('Disabling RLS on profiles table...');
  
  // Use the SQL query directly via REST API
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    })
  });

  if (response.ok) {
    console.log('✅ RLS disabled on profiles table');
  } else {
    console.log('❌ Failed to disable RLS:', await response.text());
  }
}

disableRLS().catch(console.error);
