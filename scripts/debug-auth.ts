#!/usr/bin/env tsx
/**
 * Debug Authentication Issues
 * 
 * This script helps debug authentication issues by showing
 * detailed information about auth users and profiles.
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

const clientSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function debugAuth() {
  console.log('🐛 PrimoInspect Authentication Debug')
  console.log('===================================')
  console.log()

  try {
    // Get all auth users
    console.log('👥 Fetching auth users...')
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    const demoEmails = ['sarah.chen@primoinspect.com', 'jennifer.park@primoinspect.com', 'james.martinez@primoinspect.com']
    const demoUsers = authData?.users?.filter(user => user.email && demoEmails.includes(user.email)) || []
    
    console.log(`📊 Found ${demoUsers.length} demo auth users`)
    
    for (const user of demoUsers) {
      console.log(`\n👤 Auth User: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
    }
    
    // Get all profiles
    console.log('\n📝 Fetching profiles...')
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message)
      return
    }
    
    console.log(`📊 Found ${profiles?.length || 0} total profiles`)
    
    const demoProfiles = profiles?.filter(profile => 
      demoEmails.includes(profile.email)
    ) || []
    
    console.log(`📊 Found ${demoProfiles.length} demo profiles`)
    
    for (const profile of demoProfiles) {
      console.log(`\n📄 Profile: ${profile.email}`)
      console.log(`   ID: ${profile.id}`)
      console.log(`   Name: ${profile.name}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Active: ${profile.is_active}`)
      console.log(`   Created: ${profile.created_at}`)
    }
    
    // Check if profiles match auth users
    console.log('\n🔗 Checking auth user to profile mapping...')
    
    for (const user of demoUsers) {
      const matchingProfile = demoProfiles.find(p => p.id === user.id)
      
      if (matchingProfile) {
        console.log(`✅ ${user.email} → Profile found`)
      } else {
        console.log(`❌ ${user.email} → No matching profile`)
        
        // Look for profiles with same email but different ID
        const emailProfile = demoProfiles.find(p => p.email === user.email)
        if (emailProfile) {
          console.log(`⚠️  Found profile with same email but different ID:`)
          console.log(`     Auth ID: ${user.id}`)
          console.log(`     Profile ID: ${emailProfile.id}`)
        }
      }
    }
    
    // Test client authentication for one user
    if (demoUsers.length > 0) {
      const testUser = demoUsers[0]
      console.log(`\n🧪 Testing client authentication for ${testUser.email}...`)
      
      const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
        email: testUser.email!,
        password: testUser.email === 'sarah.chen@primoinspect.com' ? 'DemoExec2025!' :
                 testUser.email === 'jennifer.park@primoinspect.com' ? 'DemoManager2025!' :
                 'DemoInspector2025!' // james.martinez
      })
      
      if (signInError) {
        console.error(`❌ Sign-in failed: ${signInError.message}`)
      } else if (signInData.user) {
        console.log(`✅ Sign-in successful`)
        console.log(`   User ID: ${signInData.user.id}`)
        
        // Try to fetch profile using client
        const { data: clientProfiles, error: clientProfileError } = await clientSupabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
        
        if (clientProfileError) {
          console.error(`❌ Client profile fetch failed: ${clientProfileError.message}`)
        } else {
          console.log(`✅ Client profile fetch: Found ${clientProfiles?.length || 0} profiles`)
          if (clientProfiles && clientProfiles.length > 0) {
            console.log(`   First profile: ${clientProfiles[0].name} (${clientProfiles[0].role})`)
          }
        }
        
        await clientSupabase.auth.signOut()
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

debugAuth()