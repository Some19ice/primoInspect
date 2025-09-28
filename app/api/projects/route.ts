import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'
import { CreateProjectSchema } from '@/lib/validations/project'

// GET /api/projects - List projects for authenticated user
export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 for mobile performance
    const status = searchParams.get('status')

    // Get projects for user with pagination using Supabase
    const result = await supabaseDatabase.getProjectsForUser(
      user!.id,
      page,
      limit
    )

    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    // Filter by status if provided (Supabase filtering can be enhanced)
    let filteredData = result.data as any[] // Type assertion for now
    if (status && ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'].includes(status.toUpperCase())) {
      filteredData = result.data.filter((project: any) => project.status === status.toUpperCase())
    }

    return NextResponse.json({
      projects: filteredData,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project (Project Manager only)
export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, {
    requiredRole: 'PROJECT_MANAGER',
  })
  if (error) return error

  try {
    const body = await request.json()

    // Validate request body
    const validatedData = CreateProjectSchema.parse(body)

    // Create project in Supabase database
    const result = await supabaseDatabase.createProject(
      {
        name: validatedData.name,
        description: validatedData.description,
        start_date: validatedData.startDate.toISOString(),
        end_date: validatedData.endDate?.toISOString(),
        latitude: validatedData.location?.latitude,
        longitude: validatedData.location?.longitude,
        address: validatedData.location?.address,
      },
      user!.id
    )

    if (result.error) {
      console.error('Error creating project:', result.error)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    const project = result.data! as any // Type assertion for now

    // Log project creation with audit trail
    await logAuditEvent(
      'PROJECT',
      project.id,
      'CREATED',
      user!.id,
      {
        name: project.name,
        location: {
          latitude: project.latitude,
          longitude: project.longitude,
        },
        teamMemberIds: [user!.id],
      },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    // Return created project with proper format
    const formattedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      location: {
        latitude: project.latitude,
        longitude: project.longitude,
        address: project.address,
      },
      teamMembers: [user!.id],
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    }

    return NextResponse.json(formattedProject, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      // Validation error
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.message },
          { status: 400 }
        )
      }
    }

    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
