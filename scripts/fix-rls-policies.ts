#!/usr/bin/env tsx
/**
 * Fix RLS Policies
 * 
 * This script ensures that RLS policies are properly set up
 * so users can access their own profiles and related data.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') // Remove quotes

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function enableRLS() {
  console.log('🔒 Enabling Row Level Security...')
  
  const tables = ['profiles', 'projects', 'project_members', 'checklists', 'inspections', 'evidence', 'approvals', 'notifications', 'reports', 'audit_logs']
  
  for (const table of tables) {
    try {
      // Enable RLS
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      })
      console.log(`✅ Enabled RLS for ${table}`)
    } catch (error) {
      console.warn(`⚠️  Warning enabling RLS for ${table}:`, error)
    }
  }
}

async function createProfilesPolicies() {
  console.log('📋 Creating profiles policies...')
  
  const policies = [
    {
      name: 'Users can view own profile',
      sql: `
        CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
      `
    },
    {
      name: 'Users can update own profile',
      sql: `
        CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
      `
    },
    {
      name: 'System can insert profiles',
      sql: `
        CREATE POLICY "System can insert profiles" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
      `
    }
  ]
  
  for (const policy of policies) {
    try {
      await supabase.rpc('exec_sql', { sql: policy.sql })
      console.log(`✅ Created policy: ${policy.name}`)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`ℹ️  Policy already exists: ${policy.name}`)
      } else {
        console.warn(`⚠️  Warning creating policy ${policy.name}:`, error)
      }
    }
  }
}

async function createProjectPolicies() {
  console.log('🏗️  Creating project policies...')
  
  const policies = [
    {
      name: 'Users can view their projects',
      sql: `
        CREATE POLICY "Users can view their projects" ON projects
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
          )
        );
      `
    },
    {
      name: 'Project managers can create projects',
      sql: `
        CREATE POLICY "Project managers can create projects" ON projects
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('PROJECT_MANAGER', 'EXECUTIVE')
          )
        );
      `
    }
  ]
  
  for (const policy of policies) {
    try {
      await supabase.rpc('exec_sql', { sql: policy.sql })
      console.log(`✅ Created policy: ${policy.name}`)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`ℹ️  Policy already exists: ${policy.name}`)
      } else {
        console.warn(`⚠️  Warning creating policy ${policy.name}:`, error)
      }
    }
  }
}

async function testRLSPolicies() {
  console.log('🧪 Testing RLS policies...')
  
  // Create a test client with anon key
  const testClient = createClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Test user authentication and profile access
  try {
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: 'sarah.chen@primoinspect.com',
      password: 'DemoExec2025!'
    })
    
    if (signInError) {
      console.error(`❌ Test sign-in failed: ${signInError.message}`)
      return false
    }
    
    if (!signInData.user) {
      console.error(`❌ No user data returned`)
      return false
    }
    
    console.log(`✅ Test sign-in successful for ${signInData.user.email}`)
    
    // Test profile access
    const { data: profile, error: profileError } = await testClient
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single()
    
    if (profileError) {
      console.error(`❌ Profile access failed: ${profileError.message}`)
      return false
    }
    
    if (!profile) {
      console.error(`❌ No profile data returned`)
      return false
    }
    
    console.log(`✅ Profile access successful: ${profile.name} (${profile.role})`)
    
    await testClient.auth.signOut()
    return true
    
  } catch (error) {
    console.error(`❌ RLS test error:`, error)
    return false
  }
}

async function main() {
  console.log('🔒 PrimoInspect RLS Policy Fix')
  console.log('=============================')
  console.log()
  
  try {
    await enableRLS()
    console.log()
    
    await createProfilesPolicies()
    console.log()
    
    await createProjectPolicies()
    console.log()
    
    const testSuccess = await testRLSPolicies()
    console.log()
    
    if (testSuccess) {
      console.log('🎉 RLS policies are working correctly!')
      console.log('   Run: npm run test:auth')
    } else {
      console.log('❌ RLS policy issues remain')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ RLS fix failed:', error)
    process.exit(1)
  }
}

main()