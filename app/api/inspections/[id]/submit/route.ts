import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'
import { InspectionStateMachine } from '@/lib/services/inspection-state-machine'

/**
 * POST /api/inspections/[id]/submit
 * Submit inspection for review (DRAFT → PENDING)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await withSupabaseAuth(request)
  if (authError) return authError

  try {
    const { id: inspectionId } = await params

    // Fetch current inspection with full details
    const inspectionResult = await supabaseDatabase.getInspectionById(inspectionId)
    
    if (inspectionResult.error || !inspectionResult.data) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    const inspection = inspectionResult.data as any

    // Verify user is assigned to this inspection
    if (inspection.assigned_to !== user!.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this inspection' },
        { status: 403 }
      )
    }

    // Verify current status is DRAFT
    if (inspection.status !== 'DRAFT') {
      return NextResponse.json(
        { 
          error: `Cannot submit inspection with status ${inspection.status}. Only DRAFT inspections can be submitted.`,
          currentStatus: inspection.status
        },
        { status: 400 }
      )
    }

    // Validate inspection can be submitted using state machine
    const validation = InspectionStateMachine.validateTransition(
      inspection,
      'PENDING'
    )

    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Inspection validation failed',
          validationErrors: validation.errors
        },
        { status: 400 }
      )
    }

    // Update inspection status to PENDING
    const updateResult = await supabaseDatabase.updateInspection(inspectionId, {
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
    })

    if (updateResult.error) {
      console.error('Error updating inspection status:', updateResult.error)
      return NextResponse.json(
        { error: 'Failed to submit inspection' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent('INSPECTION', inspectionId, 'SUBMITTED', user!.id, {
      from_status: 'DRAFT',
      to_status: 'PENDING',
      submitted_at: new Date().toISOString(),
    })

    // Create notification for project managers
    try {
      // Get project members who are managers
      const projectResult = await supabaseDatabase.getProjectById(inspection.project_id)
      
      if (projectResult.data && (projectResult.data as any).project_members) {
        const managers = (projectResult.data as any).project_members
          .filter((member: any) => 
            member.profiles?.role === 'PROJECT_MANAGER' && 
            member.user_id !== user!.id
          )

        // Create notification for each manager
        for (const manager of managers) {
          await supabaseDatabase.createNotification({
            user_id: manager.user_id,
            type: 'INSPECTION_SUBMITTED',
            title: 'New Inspection Submitted',
            message: `${inspection.title} has been submitted for review`,
            related_entity_type: 'INSPECTION',
            related_entity_id: inspectionId,
            priority: inspection.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
          })
        }
      }
    } catch (notificationError) {
      // Log but don't fail the request if notifications fail
      console.error('Error creating notifications:', notificationError)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      inspection: {
        id: inspectionId,
        status: 'PENDING',
        submitted_at: new Date().toISOString(),
      },
      message: 'Inspection submitted successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Error in POST /api/inspections/[id]/submit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/inspections/[id]/submit
 * Check if inspection can be submitted (validation only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await withSupabaseAuth(request)
  if (authError) return authError

  try {
    const { id: inspectionId } = await params

    // Fetch inspection
    const inspectionResult = await supabaseDatabase.getInspectionById(inspectionId)
    
    if (inspectionResult.error || !inspectionResult.data) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    const inspection = inspectionResult.data as any

    // Check if user can access this inspection
    if (inspection.assigned_to !== user!.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this inspection' },
        { status: 403 }
      )
    }

    // Validate using state machine
    const validation = InspectionStateMachine.validateTransition(
      inspection,
      'PENDING'
    )

    // Calculate progress
    const progress = InspectionStateMachine.calculateProgress(inspection)

    return NextResponse.json({
      canSubmit: validation.valid,
      validationErrors: validation.errors,
      progress,
      currentStatus: inspection.status,
      nextAction: InspectionStateMachine.getNextAction(inspection),
    })

  } catch (error) {
    console.error('Error in GET /api/inspections/[id]/submit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
