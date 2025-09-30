#!/usr/bin/env tsx
/**
 * Simple Authentication Fix
 * 
 * This script fixes authentication by working with existing users
 * and ensuring profiles are properly accessible.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') // Remove quotes
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const adminSupabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const clientSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

const DEMO_USERS = [
  {
    email: 'sarah.chen@primoinspect.com',
    password: 'DemoExec2025!',
    name: 'Sarah Chen',
    role: 'EXECUTIVE' as const
  },
  {
    email: 'jennifer.park@primoinspect.com',
    password: 'DemoManager2025!',
    name: 'Jennifer Park',
    role: 'PROJECT_MANAGER' as const
  },
  {
    email: 'james.martinez@primoinspect.com',
    password: 'DemoInspector2025!',
    name: 'James Martinez',
    role: 'INSPECTOR' as const
  }
]

async function disableRLS() {
  console.log('🔓 Temporarily disabling RLS to fix profiles...')
  
  try {
    // Disable RLS on profiles table temporarily
    await adminSupabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    })
    console.log('✅ RLS disabled on profiles table')
    return true
  } catch (error) {
    console.warn('⚠️  Error disabling RLS:', error)
    return false
  }
}

async function enableRLS() {
  console.log('🔒 Re-enabling RLS on profiles...')
  
  try {
    await adminSupabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
    })
    console.log('✅ RLS re-enabled on profiles table')
  } catch (error) {
    console.warn('⚠️  Error enabling RLS:', error)
  }
}

async function fixUserProfiles() {
  console.log('🔧 Fixing user profiles...')
  
  // Get all auth users
  const { data: authData } = await adminSupabase.auth.admin.listUsers()
  const authUsers = authData?.users || []
  
  let fixedCount = 0
  
  for (const userData of DEMO_USERS) {
    const authUser = authUsers.find(u => u.email === userData.email)
    
    if (!authUser) {
      console.log(`⚠️  No auth user found for ${userData.email}`)
      continue
    }
    
    console.log(`🔧 Fixing ${userData.email}...`)
    
    // Update auth user password and metadata
    try {
      await adminSupabase.auth.admin.updateUserById(authUser.id, {
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      })
      console.log(`   ✅ Updated auth user`)
    } catch (error) {
      console.warn(`   ⚠️  Warning updating auth user:`, error)
    }
    
    // Delete any existing profiles for this user
    try {
      await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', authUser.id)
      console.log(`   🗑️  Cleaned existing profiles`)
    } catch (error) {
      console.warn(`   ⚠️  Warning cleaning profiles:`, error)
    }
    
    // Create fresh profile
    try {
      const { error: insertError } = await adminSupabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error(`   ❌ Failed to create profile: ${insertError.message}`)
        continue
      }
      
      console.log(`   ✅ Created fresh profile`)
      fixedCount++
      
    } catch (error) {
      console.error(`   ❌ Error creating profile:`, error)
    }
  }
  
  return fixedCount
}

async function testAuthentication() {
  console.log('🧪 Testing authentication...')
  
  let successCount = 0
  
  for (const userData of DEMO_USERS) {
    try {
      console.log(`\n🔐 Testing ${userData.name}...`)
      
      // Test sign-in
      const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      })

      if (signInError) {
        console.error(`❌ Sign-in failed: ${signInError.message}`)
        continue
      }

      console.log(`✅ Sign-in successful`)

      // Test profile access - use select without single() to avoid coercion error
      const { data: profiles, error: profileError } = await clientSupabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user!.id)

      if (profileError) {
        console.error(`❌ Profile access failed: ${profileError.message}`)
        await clientSupabase.auth.signOut()
        continue
      }

      if (!profiles || profiles.length === 0) {
        console.error(`❌ No profile found`)
        await clientSupabase.auth.signOut()
        continue
      }

      const profile = profiles[0]
      console.log(`✅ Profile found: ${profile.name} (${profile.role})`)

      await clientSupabase.auth.signOut()
      successCount++
      
    } catch (error) {
      console.error(`❌ Error testing ${userData.email}:`, error)
    }
  }
  
  return successCount
}

async function main() {
  console.log('🔧 PrimoInspect Simple Authentication Fix')
  console.log('=========================================')
  console.log()
  
  try {
    // Temporarily disable RLS
    const rlsDisabled = await disableRLS()
    console.log()
    
    // Fix user profiles
    const fixedCount = await fixUserProfiles()
    console.log()
    
    // Re-enable RLS
    if (rlsDisabled) {
      await enableRLS()
      console.log()
    }
    
    // Test authentication
    const successCount = await testAuthentication()
    console.log()
    
    console.log(`📊 Results: ${successCount}/${DEMO_USERS.length} users working correctly`)
    
    if (successCount === DEMO_USERS.length) {
      console.log('🎉 All demo users are now working correctly!')
      console.log()
      console.log('✅ Demo User Accounts Ready:')
      console.log('   Executive: sarah.chen@primoinspect.com / DemoExec2025!')
      console.log('   Manager: jennifer.park@primoinspect.com / DemoManager2025!')
      console.log('   Inspector: james.martinez@primoinspect.com / DemoInspector2025!')
      console.log()
      console.log('🚀 Authentication system is fully functional!')
    } else {
      console.log('⚠️  Some issues remain, but partial functionality is available')
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  }
}

main()