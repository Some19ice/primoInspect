#!/usr/bin/env tsx
/**
 * Test Authentication for Demo Users
 * 
 * This script tests the authentication flow for seeded demo users
 * to ensure login works correctly.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

const DEMO_USERS = [
  {
    email: 'sarah.chen@primoinspect.com',
    password: 'DemoExec2025!',
    name: 'Sarah Chen',
    role: 'EXECUTIVE'
  },
  {
    email: 'jennifer.park@primoinspect.com',
    password: 'DemoManager2025!',
    name: 'Jennifer Park',
    role: 'PROJECT_MANAGER'
  },
  {
    email: 'james.martinez@primoinspect.com',
    password: 'DemoInspector2025!',
    name: 'James Martinez',
    role: 'INSPECTOR'
  }
]

async function testUserAuth(user: typeof DEMO_USERS[0]) {
  console.log(`\n🔐 Testing ${user.name} (${user.email})...`)
  
  try {
    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    })

    if (signInError) {
      console.error(`❌ Sign-in failed for ${user.email}:`, signInError.message)
      return false
    }

    if (!signInData.user) {
      console.error(`❌ No user data returned for ${user.email}`)
      return false
    }

    console.log(`✅ Authentication successful for ${user.email}`)
    console.log(`   User ID: ${signInData.user.id}`)
    console.log(`   Email verified: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`)

    // Check profile
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)

    if (profileError) {
      console.error(`❌ Profile lookup failed for ${user.email}:`, profileError.message)
      return false
    }

    if (!profiles || profiles.length === 0) {
      console.error(`❌ No profile found for ${user.email}`)
      return false
    }

    // Use the first profile if multiple exist
    const profile = profiles[0]

    console.log(`✅ Profile found:`)
    console.log(`   Name: ${profile.name}`)
    console.log(`   Role: ${profile.role}`)
    console.log(`   Active: ${profile.is_active}`)
    
    if (profiles.length > 1) {
      console.warn(`⚠️  Multiple profiles found (${profiles.length}), using first one`)
    }

    // Sign out
    await supabase.auth.signOut()
    
    return true
  } catch (error) {
    console.error(`❌ Error testing ${user.email}:`, error)
    return false
  }
}

async function main() {
  console.log('🧪 Testing Demo User Authentication')
  console.log('==================================')

  let successCount = 0
  let totalUsers = DEMO_USERS.length

  for (const user of DEMO_USERS) {
    const success = await testUserAuth(user)
    if (success) {
      successCount++
    }
  }

  console.log(`\n📊 Results: ${successCount}/${totalUsers} users can authenticate successfully`)

  if (successCount === totalUsers) {
    console.log('🎉 All demo users are working correctly!')
    process.exit(0)
  } else {
    console.log('⚠️  Some demo users have authentication issues')
    console.log('   Run: npm run seed:demo-data')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})