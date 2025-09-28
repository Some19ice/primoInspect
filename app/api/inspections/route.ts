import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'
import { CreateInspectionSchema, InspectionFilterSchema } from '@/lib/validations/inspection'

// GET /api/inspections - Get filtered list of inspections
export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const filterParams = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
      projectId: searchParams.get('projectId') || undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean) || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      priority: searchParams.get('priority')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined,
      dueAfter: searchParams.get('dueAfter') || undefined,
      dueBefore: searchParams.get('dueBefore') || undefined,
      includeDrafts: searchParams.get('includeDrafts') === 'true',
    }

    // Validate filter parameters
    const validationResult = InspectionFilterSchema.safeParse(filterParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid filter parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // Build Supabase filter object with role-based access
    const supabaseFilters: any = {
      userId: user!.id,
      userRole: user!.role,
    }

    // Add specific filters
    if (filters.projectId) {
      // Get inspections for specific project
      const result = await supabaseDatabase.getInspectionsForProject(
        filters.projectId,
        {
          status: filters.status ? [filters.status] : undefined,
          assignedTo: filters.assignedTo,
          userRole: user!.role,
          userId: user!.id,
        },
        filters.page,
        filters.limit
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
        filters: filters,
      })
    } else {
      // Get all inspections for user across projects
      // This would need a separate method in the database service
      // For now, return empty result with proper structure
      return NextResponse.json({
        inspections: [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: filters,
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

    // Validate request body
    const validationResult = CreateInspectionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if user can create inspections in this project (handled by RLS)
    // Additional business logic validation can be added here

    // Create inspection using Supabase database service
    const result = await supabaseDatabase.createInspection({
      project_id: data.projectId,
      checklist_id: data.checklistId, // Required by validation schema
      assigned_to: data.assignedTo || user!.id,
      title: data.title,
      description: data.description,
      priority: data.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
      due_date: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    })

    if (result.error) {
      console.error('Error creating inspection:', result.error)
      return NextResponse.json(
        { error: 'Failed to create inspection' },
        { status: 500 }
      )
    }

    const inspection = result.data as any // Type assertion for now

    // Log audit trail
    if (inspection) {
      await logAuditEvent(
        'INSPECTION',
        inspection.id,
        'CREATED',
        user!.id,
        {
          title: inspection.title,
          projectId: inspection.project_id,
          status: inspection.status,
          priority: inspection.priority,
        },
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      )

      // Create assignment notification if assigned to different user
      if (data.assignedTo && data.assignedTo !== user!.id) {
        await supabaseDatabase.createNotification({
          user_id: data.assignedTo,
          type: 'ASSIGNMENT',
          title: 'New Inspection Assigned',
          message: `You have been assigned to inspection: ${inspection.title}`,
          related_entity_type: 'INSPECTION',
          related_entity_id: inspection.id,
          priority: inspection.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        })
      }

      // Format response to match API contract
      const responseData = {
        id: inspection.id,
        title: inspection.title,
        description: inspection.description,
        status: inspection.status,
        priority: inspection.priority,
        dueDate: inspection.due_date,
        location: inspection.latitude && inspection.longitude ? {
          latitude: inspection.latitude,
          longitude: inspection.longitude,
          accuracy: inspection.accuracy,
          address: inspection.address,
        } : null,
        responses: inspection.responses,
        rejectionCount: inspection.rejection_count,
        createdAt: inspection.created_at,
        updatedAt: inspection.updated_at,
        projectId: inspection.project_id,
        assignedTo: inspection.assigned_to,
      }

      return NextResponse.json(responseData, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error creating inspection:', error)
    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 }
    )
  }
}
