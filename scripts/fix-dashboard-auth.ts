#!/usr/bin/env tsx
/**
 * Fix Dashboard Authentication Issues
 * 
 * This script identifies and fixes the post-login issues where dashboards
 * don't show content due to profile access problems.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '')
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

async function fixRLSPolicies() {
  console.log('🔒 Fixing RLS policies for dashboard access...')
  
  try {
    // Drop existing policies that might be too restrictive
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON profiles;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON profiles;',
      'DROP POLICY IF EXISTS "System can insert profiles" ON profiles;'
    ]
    
    for (const sql of dropPolicies) {
      try {
        await adminSupabase.rpc('exec_sql', { sql })
      } catch (error) {
        // Ignore errors if policies don't exist
      }
    }
    
    // Create more permissive policies for dashboard functionality
    const createPolicies = [
      {
        name: 'Allow users to view own profile',
        sql: `
          CREATE POLICY "Allow users to view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);
        `
      },
      {
        name: 'Allow users to update own profile',
        sql: `
          CREATE POLICY "Allow users to update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id)
          WITH CHECK (auth.uid() = id);
        `
      },
      {
        name: 'Allow authenticated users to insert profiles',
        sql: `
          CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
        `
      },
      {
        name: 'Allow service role full access',
        sql: `
          CREATE POLICY "Allow service role full access" ON profiles
          FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
        `
      }
    ]
    
    for (const policy of createPolicies) {
      try {
        await adminSupabase.rpc('exec_sql', { sql: policy.sql })
        console.log(`✅ Created policy: ${policy.name}`)
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️  Policy already exists: ${policy.name}`)
        } else {
          console.warn(`⚠️  Warning creating policy ${policy.name}:`, error.message)
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
    return false
  }
}

async function ensureProfilesExist() {
  console.log('👤 Ensuring profiles exist for all demo users...')
  
  // Get all auth users
  const { data: authData } = await adminSupabase.auth.admin.listUsers()
  const authUsers = authData?.users || []
  
  let profilesCreated = 0
  
  for (const userData of DEMO_USERS) {
    const authUser = authUsers.find(u => u.email === userData.email)
    
    if (!authUser) {
      console.log(`⚠️  No auth user found for ${userData.email}`)
      continue
    }
    
    // Check if profile exists
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (!existingProfile) {
      // Create profile
      const { error: createError } = await adminSupabase
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
      
      if (createError) {
        console.error(`❌ Failed to create profile for ${userData.email}:`, createError.message)
      } else {
        console.log(`✅ Created profile for ${userData.email}`)
        profilesCreated++
      }
    } else {
      // Update profile to ensure it has correct data
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
      
      if (updateError) {
        console.warn(`⚠️  Failed to update profile for ${userData.email}:`, updateError.message)
      } else {
        console.log(`✅ Updated profile for ${userData.email}`)
      }
    }
  }
  
  return profilesCreated
}

async function testDashboardFlow() {
  console.log('🧪 Testing complete dashboard authentication flow...')
  
  let successCount = 0
  
  for (const userData of DEMO_USERS) {
    try {
      console.log(`\n🔐 Testing dashboard flow for ${userData.name}...`)
      
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

      // Test profile access (this is what the dashboard needs)
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
        console.error(`❌ No profile found - dashboard will be empty`)
        await clientSupabase.auth.signOut()
        continue
      }

      const profile = profiles[0]
      console.log(`✅ Profile accessible: ${profile.name} (${profile.role})`)
      
      // Test additional dashboard data access
      const { data: projects, error: projectsError } = await clientSupabase
        .from('projects')
        .select('*')
        .limit(1)

      if (projectsError) {
        console.warn(`⚠️  Projects access issue: ${projectsError.message}`)
      } else {
        console.log(`✅ Projects accessible (${projects?.length || 0} found)`)
      }

      const { data: inspections, error: inspectionsError } = await clientSupabase
        .from('inspections')
        .select('*')
        .limit(1)

      if (inspectionsError) {
        console.warn(`⚠️  Inspections access issue: ${inspectionsError.message}`)
      } else {
        console.log(`✅ Inspections accessible (${inspections?.length || 0} found)`)
      }

      await clientSupabase.auth.signOut()
      successCount++
      
    } catch (error) {
      console.error(`❌ Error testing ${userData.email}:`, error)
    }
  }
  
  return successCount
}

async function createSampleData() {
  console.log('📊 Creating sample dashboard data...')
  
  try {
    // Get demo users
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('*')
      .in('email', DEMO_USERS.map(u => u.email))
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found - skipping sample data creation')
      return
    }
    
    // Create a sample project for demo
    const managerProfile = profiles.find(p => p.role === 'PROJECT_MANAGER')
    
    if (managerProfile) {
      const { data: existingProject } = await adminSupabase
        .from('projects')
        .select('id')
        .eq('name', 'Demo Solar Installation')
        .single()
      
      if (!existingProject) {
        const { data: project, error: projectError } = await adminSupabase
          .from('projects')
          .insert({
            name: 'Demo Solar Installation',
            description: 'Sample renewable energy project for demonstration',
            status: 'ACTIVE',
            created_by: managerProfile.id,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single()
        
        if (projectError) {
          console.warn(`⚠️  Failed to create sample project: ${projectError.message}`)
        } else {
          console.log(`✅ Created sample project: Demo Solar Installation`)
          
          // Add project members
          const inspectorProfile = profiles.find(p => p.role === 'INSPECTOR')
          if (inspectorProfile && project) {
            await adminSupabase
              .from('project_members')
              .insert([
                {
                  project_id: project.id,
                  user_id: managerProfile.id,
                  role: 'PROJECT_MANAGER'
                },
                {
                  project_id: project.id,
                  user_id: inspectorProfile.id,
                  role: 'INSPECTOR'
                }
              ])
            
            console.log(`✅ Added project members`)
          }
        }
      } else {
        console.log(`ℹ️  Sample project already exists`)
      }
    }
    
  } catch (error) {
    console.warn(`⚠️  Error creating sample data:`, error)
  }
}

async function main() {
  console.log('🔧 PrimoInspect Dashboard Authentication Fix')
  console.log('==========================================')
  console.log()
  
  try {
    // Step 1: Fix RLS policies
    const rlsFixed = await fixRLSPolicies()
    console.log()
    
    // Step 2: Ensure profiles exist
    const profilesCreated = await ensureProfilesExist()
    console.log()
    
    // Step 3: Create sample data for dashboards
    await createSampleData()
    console.log()
    
    // Step 4: Test complete dashboard flow
    const successCount = await testDashboardFlow()
    console.log()
    
    console.log(`📊 Results: ${successCount}/${DEMO_USERS.length} users have working dashboard access`)
    
    if (successCount === DEMO_USERS.length) {
      console.log('🎉 Dashboard authentication is now working correctly!')
      console.log()
      console.log('✅ All demo users can now sign in and access their dashboards:')
      console.log('   • Executive Dashboard: sarah.chen@primoinspect.com / DemoExec2025!')
      console.log('   • Manager Dashboard: jennifer.park@primoinspect.com / DemoManager2025!')
      console.log('   • Inspector Dashboard: james.martinez@primoinspect.com / DemoInspector2025!')
      console.log()
      console.log('🚀 Test the application at: http://localhost:3001')
      console.log('   Sign in with any demo account to see the dashboard!')
    } else {
      console.log('⚠️  Some dashboard access issues remain')
      console.log('   Check the errors above and run the fix again if needed')
    }
    
  } catch (error) {
    console.error('❌ Dashboard fix failed:', error)
    process.exit(1)
  }
}

main()