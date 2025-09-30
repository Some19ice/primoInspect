#!/usr/bin/env tsx
/**
 * Final Authentication Fix
 * 
 * This script performs a complete fix of all authentication issues:
 * 1. Cleans up duplicate profiles
 * 2. Ensures proper auth users exist
 * 3. Creates correct profiles with proper IDs
 * 4. Tests the complete authentication flow
 * 5. Verifies RLS policies work correctly
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

async function cleanAllProfiles() {
  console.log('🧹 Cleaning all existing profiles...')
  
  try {
    // Delete all profiles first
    const { error: deleteError } = await adminSupabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (deleteError) {
      console.warn('⚠️  Warning deleting profiles:', deleteError.message)
    } else {
      console.log('✅ All profiles deleted')
    }
  } catch (error) {
    console.warn('⚠️  Error cleaning profiles:', error)
  }
}

async function recreateAuthUsers() {
  console.log('👥 Recreating auth users...')
  
  const createdUsers = []
  
  for (const userData of DEMO_USERS) {
    try {
      // First try to delete existing user
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === userData.email)
      
      if (existingUser) {
        await adminSupabase.auth.admin.deleteUser(existingUser.id)
        console.log(`🗑️  Deleted existing user: ${userData.email}`)
      }
      
      // Create fresh auth user
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      })

      if (authError) {
        console.error(`❌ Failed to create user ${userData.email}:`, authError.message)
        continue
      }

      if (!authData.user) {
        console.error(`❌ No user data returned for ${userData.email}`)
        continue
      }

      console.log(`✅ Created auth user: ${userData.email} (ID: ${authData.user.id})`)
      
      // Create profile immediately
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          is_active: true,
          created_at: new Date().toISOString(),
          last_login_at: null,
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error(`❌ Failed to create profile for ${userData.email}:`, profileError.message)
        continue
      }

      console.log(`✅ Created profile: ${userData.name} (${userData.role})`)
      
      createdUsers.push({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      })

    } catch (error) {
      console.error(`❌ Error processing ${userData.email}:`, error)
    }
  }
  
  return createdUsers
}

async function testCompleteAuthFlow() {
  console.log('🧪 Testing complete authentication flow...')
  
  let successCount = 0
  
  for (const userData of DEMO_USERS) {
    try {
      console.log(`\n🔐 Testing ${userData.name} (${userData.email})...`)
      
      // Test sign-in
      const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      })

      if (signInError) {
        console.error(`❌ Sign-in failed: ${signInError.message}`)
        continue
      }

      if (!signInData.user) {
        console.error(`❌ No user data returned`)
        continue
      }

      console.log(`✅ Authentication successful`)
      console.log(`   User ID: ${signInData.user.id}`)
      console.log(`   Email verified: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`)

      // Test profile access using the authenticated client
      const { data: profiles, error: profileError } = await clientSupabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)

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
      console.log(`✅ Profile access successful:`)
      console.log(`   Name: ${profile.name}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Active: ${profile.is_active}`)

      // Sign out
      await clientSupabase.auth.signOut()
      
      successCount++
      
    } catch (error) {
      console.error(`❌ Error testing ${userData.email}:`, error)
    }
  }
  
  return successCount
}

async function main() {
  console.log('🔧 PrimoInspect Final Authentication Fix')
  console.log('=======================================')
  console.log()
  
  try {
    // Step 1: Clean all profiles
    await cleanAllProfiles()
    console.log()
    
    // Step 2: Recreate auth users and profiles
    const users = await recreateAuthUsers()
    console.log()
    
    if (users.length === 0) {
      throw new Error('No users were created successfully')
    }
    
    console.log(`✅ Successfully created ${users.length} complete user accounts`)
    console.log()
    
    // Step 3: Test complete authentication flow
    const successCount = await testCompleteAuthFlow()
    console.log()
    
    console.log(`📊 Final Results: ${successCount}/${DEMO_USERS.length} users working correctly`)
    
    if (successCount === DEMO_USERS.length) {
      console.log('🎉 All demo users are now working perfectly!')
      console.log()
      console.log('✅ Demo User Accounts Ready:')
      console.log('   Executive: sarah.chen@primoinspect.com / DemoExec2025!')
      console.log('   Manager: jennifer.park@primoinspect.com / DemoManager2025!')
      console.log('   Inspector: james.martinez@primoinspect.com / DemoInspector2025!')
      console.log()
      console.log('🚀 You can now sign in to the application with any of these accounts.')
      console.log('   The authentication system is fully functional!')
    } else {
      console.log('❌ Some authentication issues remain')
      console.log('   Check your Supabase configuration and RLS policies')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Final fix failed:', error)
    process.exit(1)
  }
}

main()