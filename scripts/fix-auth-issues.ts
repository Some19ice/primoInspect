#!/usr/bin/env tsx
/**
 * Fix Authentication Issues
 * 
 * This script identifies and fixes common authentication issues
 * with demo users, including missing profiles, incorrect roles,
 * and password problems.
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

async function fixAuthUser(user: typeof DEMO_USERS[0]) {
  console.log(`\n🔧 Fixing ${user.name} (${user.email})...`)
  
  try {
    // Check if auth user exists
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
    let authUser = authUsers?.users?.find(u => u.email === user.email)
    
    if (!authUser) {
      // Create auth user
      console.log(`📤 Creating auth user for ${user.email}`)
      const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })
      
      if (createError) {
        console.error(`❌ Failed to create auth user: ${createError.message}`)
        return false
      }
      
      authUser = createData.user
      console.log(`✅ Created auth user: ${user.email}`)
    } else {
      // Update existing auth user
      console.log(`🔄 Updating auth user for ${user.email}`)
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        authUser.id,
        {
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role
          }
        }
      )
      
      if (updateError) {
        console.warn(`⚠️  Warning updating auth user: ${updateError.message}`)
      } else {
        console.log(`✅ Updated auth user: ${user.email}`)
      }
    }
    
    if (!authUser) {
      console.error(`❌ No auth user available for ${user.email}`)
      return false
    }
    
    // Check/create profile
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (!existingProfile) {
      console.log(`📝 Creating profile for ${user.email}`)
    } else {
      console.log(`🔄 Updating profile for ${user.email}`)
    }
    
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: true,
        created_at: existingProfile?.created_at || new Date().toISOString(),
        last_login_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error(`❌ Failed to create/update profile: ${profileError.message}`)
      return false
    }
    
    console.log(`✅ Profile ready for ${user.email}`)
    
    // Test authentication
    console.log(`🧪 Testing authentication for ${user.email}`)
    const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    })
    
    if (signInError) {
      console.error(`❌ Authentication test failed: ${signInError.message}`)
      return false
    }
    
    if (!signInData.user) {
      console.error(`❌ No user data returned from sign-in`)
      return false
    }
    
    // Sign out
    await clientSupabase.auth.signOut()
    
    console.log(`✅ Authentication test passed for ${user.email}`)
    return true
    
  } catch (error) {
    console.error(`❌ Error fixing ${user.email}:`, error)
    return false
  }
}

async function main() {
  console.log('🔧 PrimoInspect Authentication Fix')
  console.log('==================================')
  console.log()
  
  let fixedCount = 0
  let totalUsers = DEMO_USERS.length
  
  for (const user of DEMO_USERS) {
    const success = await fixAuthUser(user)
    if (success) {
      fixedCount++
    }
  }
  
  console.log(`\n📊 Results: ${fixedCount}/${totalUsers} users fixed successfully`)
  
  if (fixedCount === totalUsers) {
    console.log('🎉 All demo users are now working correctly!')
    console.log()
    console.log('✅ Demo User Accounts Ready:')
    console.log('   Executive: sarah.chen@primoinspect.com / DemoExec2025!')
    console.log('   Manager: jennifer.park@primoinspect.com / DemoManager2025!')
    console.log('   Inspector: james.martinez@primoinspect.com / DemoInspector2025!')
    console.log()
    console.log('🚀 You can now sign in with any of these accounts.')
  } else {
    console.log('⚠️  Some authentication issues remain')
    console.log('   Check your Supabase configuration and try again')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Fix script failed:', error)
  process.exit(1)
})