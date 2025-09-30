const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProfiles() {
  console.log('Fixing profiles access...');
  
  // First, let's try to create a profile for the current user manually
  try {
    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('Error listing users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} auth users`);
    
    // For each user, try to create/update their profile
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      const profileData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        role: user.user_metadata?.role || 'INSPECTOR',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Use service role to insert directly
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });
      
      if (insertError) {
        console.log(`Error creating profile for ${user.email}:`, insertError.message);
      } else {
        console.log(`✅ Profile created/updated for ${user.email}`);
      }
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

fixProfiles();
