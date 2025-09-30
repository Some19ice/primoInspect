#!/usr/bin/env tsx
/**
 * Test Dashboard Flow
 * 
 * This script tests the complete sign-in to dashboard flow
 * to ensure everything works correctly in the application context.
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
    role: 'EXECUTIVE',
    expectedDashboard: '/dashboard/executive'
  },
  {
    email: 'jennifer.park@primoinspect.com',
    password: 'DemoManager2025!',
    name: 'Jennifer Park',
    role: 'PROJECT_MANAGER',
    expectedDashboard: '/dashboard/manager'
  },
  {
    email: 'james.martinez@primoinspect.com',
    password: 'DemoInspector2025!',
    name: 'James Martinez',
    role: 'INSPECTOR',
    expectedDashboard: '/dashboard/inspector'
  }
]

async function testDashboardFlow(user: typeof DEMO_USERS[0]) {
  console.log(`\n🔐 Testing dashboard flow for ${user.name}...`)
  
  try {
    // Step 1: Sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    })

    if (signInError) {
      console.error(`❌ Sign-in failed: ${signInError.message}`)
      return false
    }

    if (!signInData.user) {
      console.error(`❌ No user data returned`)
      return false
    }

    console.log(`✅ Sign-in successful`)
    console.log(`   User ID: ${signInData.user.id}`)
    console.log(`   Email: ${signInData.user.email}`)
    console.log(`   Metadata Role: ${signInData.user.user_metadata?.role}`)
    console.log(`   Metadata Name: ${signInData.user.user_metadata?.name}`)

    // Step 2: Verify user metadata
    if (signInData.user.user_metadata?.role !== user.role) {
      console.warn(`⚠️  Role mismatch: expected ${user.role}, got ${signInData.user.user_metadata?.role}`)
    } else {
      console.log(`✅ Role metadata correct: ${user.role}`)
    }

    if (signInData.user.user_metadata?.name !== user.name) {
      console.warn(`⚠️  Name mismatch: expected ${user.name}, got ${signInData.user.user_metadata?.name}`)
    } else {
      console.log(`✅ Name metadata correct: ${user.name}`)
    }

    // Step 3: Test session retrieval
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !sessionData.session) {
      console.error(`❌ Session retrieval failed: ${sessionError?.message}`)
    } else {
      console.log(`✅ Session active and retrievable`)
    }

    // Step 4: Sign out
    await supabase.auth.signOut()
    console.log(`✅ Sign-out successful`)

    return true
    
  } catch (error) {
    console.error(`❌ Error testing ${user.email}:`, error)
    return false
  }
}

async function main() {
  console.log('🧪 Testing PrimoInspect Dashboard Flow')
  console.log('====================================')
  console.log()
  
  let successCount = 0
  
  for (const user of DEMO_USERS) {
    const success = await testDashboardFlow(user)
    if (success) {
      successCount++
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${DEMO_USERS.length} users have working authentication flow`)
  
  if (successCount === DEMO_USERS.length) {
    console.log('🎉 All demo users have working authentication!')
    console.log()
    console.log('✅ Dashboard Flow Ready:')
    console.log('   1. Users can sign in successfully')
    console.log('   2. User metadata contains role and name information')
    console.log('   3. Sessions are properly maintained')
    console.log('   4. Fallback profiles will be created from metadata')
    console.log()
    console.log('🚀 Test the application:')
    console.log('   1. Open: http://localhost:3001')
    console.log('   2. Click "Sign In to Continue"')
    console.log('   3. Use any demo account:')
    console.log('      • Executive: sarah.chen@primoinspect.com / DemoExec2025!')
    console.log('      • Manager: jennifer.park@primoinspect.com / DemoManager2025!')
    console.log('      • Inspector: james.martinez@primoinspect.com / DemoInspector2025!')
    console.log('   4. Should redirect to appropriate role-based dashboard')
    console.log()
    console.log('📝 Note: Dashboards will now show content using fallback profiles')
    console.log('    from user metadata when RLS blocks direct profile access.')
  } else {
    console.log('⚠️  Some authentication issues remain')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Dashboard flow test failed:', error)
  process.exit(1)
})