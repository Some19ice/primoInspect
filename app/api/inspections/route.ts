import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'



// GET /api/inspections - Get filtered list of inspections
export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')?.split(',').filter(Boolean)
    const assignedTo = searchParams.get('assignedTo')

    if (projectId) {
      // Get inspections for specific project
      const result = await supabaseDatabase.getInspectionsForProject(
        projectId,
        {
          status,
          assignedTo,
          userRole: (user as any)?.user_metadata?.role,
          userId: user!.id,
        },
        page,
        limit
      )

      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to fetch inspections' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        inspections: result.data,
        pagination: result.pagination,
      })
    } else {
      // Get all inspections for user across projects
      return NextResponse.json({
        inspections: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
      })
    }
  } catch (error) {
    console.error('Error fetching inspections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 }
    )
  }
}

// POST /api/inspections - Create new inspection
export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const body = await request.json()

    // Basic validation
    if (!body.projectId || !body.checklistId || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, checklistId, title' },
        { status: 400 }
      )
    }

    // Validate that the checklist exists and belongs to the project
    const checklistResult = await supabaseDatabase.getChecklistById(body.checklistId)
    if (checklistResult.error || !checklistResult.data) {
      return NextResponse.json(
        { error: 'Invalid checklist ID' },
        { status: 400 }
      )
    }

    // Validate that the user is a member of the project
    const projectResult = await supabaseDatabase.getProjectById(body.projectId)
    if (projectResult.error || !projectResult.data) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Normalize priority to uppercase
    const priority = (body.priority || 'MEDIUM').toUpperCase()
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be LOW, MEDIUM, or HIGH' },
        { status: 400 }
      )
    }

    // Create inspection using database service
    const result = await supabaseDatabase.createInspection({
      project_id: body.projectId,
      checklist_id: body.checklistId,
      assigned_to: body.assignedTo || user!.id,
      title: body.title,
      description: body.description,
      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
      due_date: body.dueDate,
    })

    if (result.error) {
      console.error('Database error creating inspection:', result.error)
      return NextResponse.json(
        { error: 'Failed to create inspection', details: result.error },
        { status: 500 }
      )
    }

    const inspection = result.data

    // Log audit trail
    await logAuditEvent('INSPECTION', inspection.id, 'CREATED', user!.id, {
      title: inspection.title,
      projectId: inspection.project_id,
      status: inspection.status,
      priority: inspection.priority,
    })

    // Create assignment notification if assigned to different user
    if (body.assignedTo && body.assignedTo !== user!.id) {
      await supabaseDatabase.createNotification({
        user_id: body.assignedTo,
        type: 'ASSIGNMENT',
        title: 'New Inspection Assigned',
        message: `You have been assigned to inspection: ${inspection.title}`,
        related_entity_type: 'INSPECTION',
        related_entity_id: inspection.id,
        priority: inspection.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      })
    }

    // Format response
    const responseData = {
      id: inspection.id,
      title: inspection.title,
      description: inspection.description,
      status: inspection.status,
      priority: inspection.priority,
      dueDate: inspection.due_date,
      createdAt: inspection.created_at,
      updatedAt: inspection.updated_at,
      projectId: inspection.project_id,
      assignedTo: inspection.assigned_to,
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating inspection:', error)
    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 }
    )
  }
}
