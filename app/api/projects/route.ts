import { NextRequest, NextResponse } from 'next/server'
import { withRBAC, requireProjectManager, AuthenticatedRequest } from '@/lib/auth/rbac-middleware'
import { logAuditEvent } from '@/lib/auth/auth-service'
import { supabaseDatabase } from '@/lib/supabase/database'
import { CreateProjectSchema } from '@/lib/validations/project'
import { getTemplateByProjectType } from '@/lib/templates/checklist-templates'

// GET /api/projects - List projects for authenticated user
export const GET = withRBAC()(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 for mobile performance
    const status = searchParams.get('status')

    // Get projects for user with pagination using Supabase
    const result = await supabaseDatabase.getProjectsForUser(
      request.user.id,
      page,
      limit
    )

    if (result.error) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch projects',
          },
        },
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
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch projects',
        },
      },
      { status: 500 }
    )
  }
})

// POST /api/projects - Create new project (Project Manager only)
export const POST = requireProjectManager()(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = CreateProjectSchema.parse(body)

    // Create project in Supabase database
    const result = await supabaseDatabase.createProject({
      name: validatedData.name,
      description: validatedData.description,
      start_date: validatedData.startDate.toISOString(),
      end_date: validatedData.endDate?.toISOString(),
      latitude: validatedData.location?.latitude,
      longitude: validatedData.location?.longitude,
      address: validatedData.location?.address,
    })

    if (result.error) {
      console.error('Error creating project:', result.error)
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create project',
            details: result.error,
          },
        },
        { status: 500 }
      )
    }

    const project = result.data! as any

    // Create default checklists based on project template
    if (body.type && body.type !== 'CUSTOM') {
      const templates = getTemplateByProjectType(body.type)

      for (const template of templates) {
        try {
          await supabaseDatabase.createChecklist({
            project_id: project.id,
            name: template.name,
            description: template.description,
            version: template.version,
            questions: template.questions as any,
            created_by: request.user.id,
            is_active: true
          })
        } catch (checklistError) {
          console.error('Error creating default checklist:', checklistError)
          // Continue with other checklists even if one fails
        }
      }
    }

    // Log project creation with audit trail
    await logAuditEvent(
      'PROJECT',
      project.id,
      'CREATED',
      request.user.id,
      {
        name: project.name,
        type: body.type,
        template_id: body.template_id,
        location: {
          latitude: project.latitude,
          longitude: project.longitude,
        },
        teamMemberIds: [request.user.id],
      },
      request
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
      teamMembers: [request.user.id],
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    }

    return NextResponse.json(formattedProject, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/projects:', error)

    if (error instanceof Error) {
      // Validation error
      if (error.name === 'ZodError') {
        const zodError = error as any
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: zodError.issues || error.message,
            },
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create project',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
})
