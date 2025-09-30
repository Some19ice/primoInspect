#!/usr/bin/env tsx
/**
 * PrimoInspect Demo Data Seeder
 * 
 * This script populates the Supabase database with comprehensive demo data
 * for renewable energy inspection projects. It creates realistic scenarios
 * including users, projects, inspections, evidence, and notifications.
 * 
 * Usage: npm run seed:demo-data
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') // Remove quotes

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Function to ensure basic tables exist
async function ensureTablesExist() {
  console.log('🏗️  Ensuring database tables exist...')
  
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        console.log('⚠️  Tables do not exist. Please run database migrations first.')
        console.log('   Run: supabase db push')
        return false
      }
      // Other errors might be okay (like empty table)
      console.log('⚠️  Database warning (continuing):', error.message)
    }
    
    console.log('✅ Database tables ready')
    return true
  } catch (error) {
    console.warn('⚠️  Error checking tables:', error)
    return false
  }
}

// Demo user credentials for easy testing
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

async function clearExistingData() {
  console.log('🧹 Clearing existing demo data...')
  
  const tables = [
    'audit_logs',
    'reports', 
    'notifications',
    'approvals',
    'evidence',
    'inspections',
    'checklists',
    'project_members',
    'projects'
  ]

  for (const table of tables) {
    const { error } = await supabase
      .from(table as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (error && !error.message.includes('cannot delete')) {
      console.warn(`⚠️  Warning clearing ${table}:`, error.message)
    }
  }
  
  console.log('✅ Existing data cleared')
}

async function clearExistingAuthUsers() {
  console.log('🧹 Clearing existing demo auth users...')
  
  try {
    // Get all users to find demo users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    if (authUsers?.users) {
      const demoEmails = DEMO_USERS.map(u => u.email)
      const demoUsers = authUsers.users.filter(user => 
        user.email && demoEmails.includes(user.email)
      )
      
      // Delete demo users
      for (const user of demoUsers) {
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        if (error) {
          console.warn(`⚠️  Warning deleting user ${user.email}:`, error.message)
        } else {
          console.log(`🗑️  Deleted existing user: ${user.email}`)
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Warning clearing auth users:', error)
  }
}

async function createDemoUsers() {
  console.log('👥 Creating demo user accounts...')
  
  const createdUsers = []
  
  for (const userData of DEMO_USERS) {
    try {
      // Create auth user with email confirmation
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      })

      if (authError) {
        console.warn(`⚠️  Warning creating user ${userData.email}:`, authError.message)
        
        // If user already exists, try to get their ID and update
        if (authError.message.includes('already') || authError.message.includes('registered')) {
          const { data: authUsers } = await supabase.auth.admin.listUsers()
          const existingAuthUser = authUsers?.users?.find(u => u.email === userData.email)
          
          if (existingAuthUser) {
            // Update password for existing user
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingAuthUser.id,
              {
                password: userData.password,
                user_metadata: {
                  name: userData.name,
                  role: userData.role
                }
              }
            )
            
            if (updateError) {
              console.warn(`⚠️  Warning updating user ${userData.email}:`, updateError.message)
            }
              const { error: createProfileError } = await supabase
                .from('profiles')
                .upsert({
                  id: existingAuthUser.id,
                  email: userData.email,
                  name: userData.name,
                  role: userData.role,
                  is_active: true,
                  created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                  last_login_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
                })

              if (!createProfileError) {
                createdUsers.push({
                  id: existingAuthUser.id,
                  email: userData.email,
                  name: userData.name,
                  role: userData.role
                })
                console.log(`✅ Created profile for existing ${userData.role}: ${userData.name} (${userData.email})`)
              } else {
                console.warn(`⚠️  Error creating profile for ${userData.email}:`, createProfileError.message)
              }
            }
          }
        }
        continue
      }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            is_active: true,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            last_login_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
          })

        if (profileError) {
          console.warn(`⚠️  Warning creating profile for ${userData.email}:`, profileError.message)
          continue
        }

        createdUsers.push({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        })

        console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.email})`)
      }
    } catch (error) {
      console.warn(`⚠️  Error creating user ${userData.email}:`, error)
    }
  }
  
  if (createdUsers.length === 0) {
    console.error('❌ No users were created successfully')
    throw new Error('Failed to create demo users')
  }
  
  console.log(`✅ Successfully created/updated ${createdUsers.length} demo users`)
  return createdUsers
}
}

async function createProjects(users: any[]) {
  console.log('🏗️  Creating renewable energy projects...')
  
  const projectManager = users.find(u => u.role === 'PROJECT_MANAGER')
  if (!projectManager) {
    throw new Error('No project manager found')
  }

  const projects = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Desert Sun Solar Farm',
      description: 'Large-scale photovoltaic installation in Arizona desert with 500MW capacity. Features advanced tracking systems and energy storage integration.',
      status: 'ACTIVE',
      start_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 33.4484,
      longitude: -112.0740,
      address: 'Phoenix, AZ 85001'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Coastal Wind Project Alpha',
      description: 'Offshore wind farm with 50 turbines generating 300MW. Located 15 miles off the coast with submarine cable connection.',
      status: 'ACTIVE',
      start_date: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY 10001'
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Green Valley Solar Installation',
      description: 'Community solar project serving 1,200 households with battery storage system for grid stability.',
      status: 'ACTIVE',
      start_date: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'San Francisco, CA 94101'
    }
  ]

  const { error } = await supabase
    .from('projects')
    .insert(projects)

  if (error) {
    throw new Error(`Failed to create projects: ${error.message}`)
  }

  // Add project members
  const members = []
  for (const project of projects) {
    for (const user of users) {
      members.push({
        project_id: project.id,
        user_id: user.id,
        role: user.role,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  const { error: membersError } = await supabase
    .from('project_members')
    .insert(members)

  if (membersError) {
    throw new Error(`Failed to add project members: ${membersError.message}`)
  }

  console.log(`✅ Created ${projects.length} projects with team assignments`)
  return projects
}

async function createChecklists(projects: any[], users: any[]) {
  console.log('📋 Creating inspection checklists...')
  
  const projectManager = users.find(u => u.role === 'PROJECT_MANAGER')
  
  const checklists = [
    {
      id: '44444444-4444-4444-4444-444444444444',
      project_id: projects[0].id,
      name: 'Solar Panel Safety & Installation Check',
      description: 'Comprehensive checklist for solar panel installation verification and safety compliance',
      version: '2.1',
      questions: [
        {
          id: 'sp-001',
          question: 'Are all solar panels properly secured to mounting structures?',
          type: 'boolean',
          required: true,
          category: 'Installation'
        },
        {
          id: 'sp-002',
          question: 'Verify DC voltage readings are within acceptable range (300-600V)',
          type: 'number',
          required: true,
          category: 'Electrical',
          min: 300,
          max: 600
        },
        {
          id: 'sp-003',
          question: 'Are all electrical connections weatherproofed and secure?',
          type: 'boolean',
          required: true,
          category: 'Electrical' 
        },
        {
          id: 'sp-004',
          question: 'Document any visible damage or defects',
          type: 'text',
          required: false,
          category: 'Quality'
        },
        {
          id: 'sp-005',
          question: 'Overall installation quality rating (1-5)',
          type: 'rating',
          required: true,
          category: 'Quality',
          scale: 5
        }
      ],
      created_by: projectManager?.id
    }
  ]

  const { error } = await supabase
    .from('checklists')
    .insert(checklists)

  if (error) {
    throw new Error(`Failed to create checklists: ${error.message}`)
  }

  console.log(`✅ Created ${checklists.length} inspection checklists`)
  return checklists
}

async function createInspections(projects: any[], checklists: any[], users: any[]) {
  console.log('🔍 Creating inspection records...')
  
  const inspector = users.find(u => u.role === 'INSPECTOR')
  const manager = users.find(u => u.role === 'PROJECT_MANAGER')
  
  if (!inspector || !manager) {
    throw new Error('Missing required users for inspections')
  }

  const inspections = [
    {
      id: '55555555-5555-5555-5555-555555555555',
      project_id: projects[0].id,
      checklist_id: checklists[0].id,
      assigned_to: inspector.id,
      title: 'Array Section A1-A5 Installation Check',
      description: 'Initial installation verification for solar array sections A1 through A5',
      status: 'DRAFT',
      priority: 'HIGH',
      due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 33.4484,
      longitude: -112.0740,
      accuracy: 5.2,
      address: 'Phoenix, AZ - Array Section A',
      responses: {
        'sp-001': true,
        'sp-002': 485,
        'sp-003': true,
        'sp-004': 'Minor scuff on panel A3-12, does not affect functionality',
        'sp-005': 4
      },
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      project_id: projects[0].id,
      checklist_id: checklists[0].id,
      assigned_to: inspector.id,
      title: 'Inverter Station 1 Commissioning',
      description: 'Pre-commissioning inspection of primary inverter station',
      status: 'DRAFT',
      priority: 'HIGH',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 33.4474,
      longitude: -112.0730,
      accuracy: 6.1,
      address: 'Phoenix, AZ - Inverter Station 1',
      responses: {
        'sp-001': true,
        'sp-002': 478,
        'sp-003': true,
        'sp-004': 'All systems nominal',
        'sp-005': 5
      },
      submitted_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      project_id: projects[0].id,
      checklist_id: checklists[0].id,
      assigned_to: inspector.id,
      title: 'Array Section C1-C6 Final Check',
      description: 'Final verification before grid connection',
      status: 'DRAFT',
      priority: 'HIGH',
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      latitude: 33.4464,
      longitude: -112.0720,
      address: 'Phoenix, AZ - Array Section C',
      responses: {}
    }
  ]

  const { error } = await supabase
    .from('inspections')
    .insert(inspections)

  if (error) {
    throw new Error(`Failed to create inspections: ${error.message}`)
  }

  // Create approvals for completed inspections
  const approvals = [
    {
      id: '88888888-8888-8888-8888-888888888888',
      inspection_id: inspections[0].id,
      approver_id: manager.id,
      decision: 'APPROVED',
      notes: 'Installation meets all safety and quality standards. Minor cosmetic damage noted on panel A3-12 does not affect performance or safety.',
      review_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  const { error: approvalsError } = await supabase
    .from('approvals')
    .insert(approvals)

  if (approvalsError) {
    console.warn('⚠️  Warning creating approvals:', approvalsError.message)
  }

  console.log(`✅ Created ${inspections.length} inspection records`)
  return inspections
}

async function createNotifications(users: any[], inspections: any[]) {
  console.log('🔔 Creating notifications...')
  
  const manager = users.find(u => u.role === 'PROJECT_MANAGER')
  const inspector = users.find(u => u.role === 'INSPECTOR')
  const executive = users.find(u => u.role === 'EXECUTIVE')
  
  const notifications = [
    {
      user_id: manager?.id,
      type: 'APPROVAL_REQUIRED',
      title: 'New Inspection Awaiting Approval',
      message: 'Inverter Station 1 Commissioning inspection has been submitted and requires your approval.',
      related_entity_type: 'INSPECTION',
      related_entity_id: inspections[1].id,
      is_read: false,
      priority: 'HIGH'
    },
    {
      user_id: inspector?.id,
      type: 'ASSIGNMENT',
      title: 'New Inspection Assignment',
      message: 'You have been assigned to inspect Array Section C1-C6. Due date: tomorrow.',
      related_entity_type: 'INSPECTION',
      related_entity_id: inspections[2].id,
      is_read: false,
      priority: 'HIGH'
    },
    {
      user_id: executive?.id,
      type: 'STATUS_CHANGE',
      title: 'Project Milestone Reached',
      message: 'Desert Sun Solar Farm has completed Phase 2 installation inspections.',
      related_entity_type: 'PROJECT',
      related_entity_id: '11111111-1111-1111-1111-111111111111',
      is_read: true,
      priority: 'MEDIUM'
    }
  ].filter(n => n.user_id) // Remove notifications for missing users

  if (notifications.length > 0) {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.warn('⚠️  Warning creating notifications:', error.message)
    } else {
      console.log(`✅ Created ${notifications.length} notifications`)
    }
  }
}

async function createAuditLogs(users: any[], inspections: any[]) {
  console.log('📝 Creating audit trail...')
  
  const manager = users.find(u => u.role === 'PROJECT_MANAGER')
  const inspector = users.find(u => u.role === 'INSPECTOR')
  
  const auditLogs = [
    {
      entity_type: 'INSPECTION',
      entity_id: inspections[0].id,
      action: 'CREATED',
      user_id: manager?.id,
      metadata: {
        assigned_to: inspector?.name,
        priority: 'HIGH',
        due_date: inspections[0].due_date
      }
    },
    {
      entity_type: 'INSPECTION', 
      entity_id: inspections[0].id,
      action: 'SUBMITTED',
      user_id: inspector?.id,
      metadata: {
        responses_count: 5,
        evidence_count: 0
      }
    },
    {
      entity_type: 'INSPECTION',
      entity_id: inspections[0].id,
      action: 'APPROVED',
      user_id: manager?.id,
      metadata: {
        approval_notes: 'Installation meets standards',
        review_duration_minutes: 15
      }
    }
  ].filter(log => log.user_id) // Remove logs for missing users

  if (auditLogs.length > 0) {
    const { error } = await supabase
      .from('audit_logs')
      .insert(auditLogs)

    if (error) {
      console.warn('⚠️  Warning creating audit logs:', error.message)
    } else {
      console.log(`✅ Created ${auditLogs.length} audit log entries`)
    }
  }
}

async function main() {
  console.log('🌱 Starting PrimoInspect demo data seeding...')
  console.log()

  try {
    // Ensure tables exist
    const tablesReady = await ensureTablesExist()
    if (!tablesReady) {
      console.log('❌ Cannot proceed without database tables.')
      console.log('   Please run: supabase db push')
      process.exit(1)
    }
    
    // Clear existing data
    await clearExistingData()
    
    // Create demo users
    const users = await createDemoUsers()
    if (users.length === 0) {
      throw new Error('No demo users were created')
    }
    
    // Create projects
    const projects = await createProjects(users)
    
    // Create checklists
    const checklists = await createChecklists(projects, users)
    
    // Create inspections
    const inspections = await createInspections(projects, checklists, users)
    
    // Create notifications
    await createNotifications(users, inspections)
    
    // Create audit logs
    await createAuditLogs(users, inspections)
    
    console.log()
    console.log('🎉 Demo data seeding completed successfully!')
    console.log()
    console.log('📋 Demo User Accounts Created:')
    console.log('   Executive: sarah.chen@primoinspect.com / DemoExec2025!')
    console.log('   Manager: jennifer.park@primoinspect.com / DemoManager2025!')
    console.log('   Inspector: james.martinez@primoinspect.com / DemoInspector2025!')
    console.log()
    console.log('🎯 What was created:')
    console.log(`   • ${users.length} demo user accounts`)
    console.log(`   • ${projects.length} renewable energy projects`)
    console.log(`   • ${checklists.length} inspection checklists`)
    console.log(`   • ${inspections.length} inspection records`)
    console.log('   • Team assignments and project memberships')
    console.log('   • Notifications and audit trail')
    console.log()
    console.log('🚀 Ready for demo! You can now sign in with any of the demo accounts.')
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
    process.exit(1)
  }
}

// Run the seeder
main()