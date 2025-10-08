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
    const assignedTo = searchParams.get('assignedTo') || undefined

    // Get userId and userRole from query params
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole') as 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR' | null

    if (projectId) {
      // Get inspections for specific project
      const result = await supabaseDatabase.getInspectionsForProject(
        projectId,
        {
          status,
          assignedTo,
          page,
          limit,
        }
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
    } else if (userId && userRole) {
      // Get inspections for specific user based on their role
      console.log('[API /api/inspections] Fetching for userId:', userId, 'role:', userRole)
      
      const result = await supabaseDatabase.getInspectionsForUser(
        userId,
        userRole
      )

      if (result.error) {
        console.error('[API /api/inspections] Error:', result.error)
        return NextResponse.json(
          { error: 'Failed to fetch inspections' },
          { status: 500 }
        )
      }

      console.log('[API /api/inspections] Returning', result.data.length, 'inspections')
      
      return NextResponse.json({
        inspections: result.data,
        pagination: {
          page: 1,
          limit: result.data.length,
          total: result.data.length,
          hasNext: false,
          hasPrev: false,
        },
      })
    }
      // No filters provided
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
    console.log('[POST /api/inspections] Received request:', {
      ...body,
      userId: user?.id,
    })

    // Basic validation
    if (!body.projectId || !body.checklistId || !body.title) {
      const missing = []
      if (!body.projectId) missing.push('projectId')
      if (!body.checklistId) missing.push('checklistId')
      if (!body.title) missing.push('title')

      console.error('[POST /api/inspections] Missing required fields:', missing)
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate that the checklist exists (either in database or as a template)
    // First check if it's a database checklist
    const checklistResult = await supabaseDatabase.getChecklistById(
      body.checklistId
    )

    // If not found in database, check if it's a template ID
    if (checklistResult.error || !checklistResult.data) {
      const { CHECKLIST_TEMPLATES } = await import(
        '@/lib/templates/checklist-templates'
      )
      const isTemplate = CHECKLIST_TEMPLATES.some(
        t => t.id === body.checklistId
      )

      if (!isTemplate) {
        console.error(
          '[POST /api/inspections] Invalid checklist:',
          body.checklistId,
          checklistResult.error
        )
        return NextResponse.json(
          {
            error:
              'Invalid checklist ID. Please select a valid checklist or template.',
          },
          { status: 400 }
        )
      }

      // If it's a template, we need to create a checklist record for this inspection
      // Templates can be used across projects, so we'll create a project-specific copy
      const template = CHECKLIST_TEMPLATES.find(t => t.id === body.checklistId)!
      const newChecklistResult = await supabaseDatabase.createChecklist({
        project_id: body.projectId,
        name: template.name,
        description: template.description,
        version: template.version,
        questions: JSON.parse(JSON.stringify(template.questions)) as any,
        created_by: user!.id,
        is_active: true,
      })

      if (newChecklistResult.error || !newChecklistResult.data) {
        console.error(
          '[POST /api/inspections] Failed to create checklist from template:',
          newChecklistResult.error
        )
        return NextResponse.json(
          { error: 'Failed to create checklist from template' },
          { status: 500 }
        )
      }

      // Update checklistId to use the newly created checklist
      body.checklistId = newChecklistResult.data.id
      console.log(
        '[POST /api/inspections] Created checklist from template:',
        body.checklistId
      )
    }

    // Validate that the user is a member of the project
    const projectResult = await supabaseDatabase.getProjectById(body.projectId)
    if (projectResult.error || !projectResult.data) {
      console.error(
        '[POST /api/inspections] Invalid project:',
        body.projectId,
        projectResult.error
      )
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
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
    const inspectionData = {
      project_id: body.projectId,
      checklist_id: body.checklistId,
      assigned_to: body.assignedTo || user!.id,
      title: body.title,
      description: body.description,
      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
      due_date: body.dueDate,
    }

    console.log('[POST /api/inspections] Creating with data:', inspectionData)
    const result = await supabaseDatabase.createInspection(inspectionData)

    if (result.error || !result.data) {
      console.error('[POST /api/inspections] Database error:', result.error)
      return NextResponse.json(
        { error: 'Failed to create inspection', details: result.error },
        { status: 500 }
      )
    }

    const inspection = result.data as any

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

    console.log(
      '[POST /api/inspections] Successfully created inspection:',
      inspection.id
    )
    return NextResponse.json(responseData, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/inspections] Unexpected error:', error)
    console.error('[POST /api/inspections] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to create inspection', details: error.message },
      { status: 500 }
    )
  }
}
