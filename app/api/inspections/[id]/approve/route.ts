import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Validate user has approval permissions
    const userRole = (user as any)?.user_metadata?.role
    if (userRole !== 'PROJECT_MANAGER' && userRole !== 'EXECUTIVE') {
      return NextResponse.json(
        { error: 'Not authorized to approve inspections' },
        { status: 403 }
      )
    }

    // Get the inspection
    const inspectionResult = await supabaseDatabase.getInspectionById(id)
    if (inspectionResult.error || !inspectionResult.data) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    const inspection = inspectionResult.data as any

    // Verify inspection is in reviewable state
    if (inspection.status !== 'IN_REVIEW') {
      return NextResponse.json(
        { error: `Cannot approve inspection with status: ${inspection.status}` },
        { status: 400 }
      )
    }

    const approved = body.approved === true
    const notes = body.notes || ''

    // Update inspection status
    const newStatus = approved ? 'APPROVED' : 'REJECTED'
    const statusResult = await supabaseDatabase.updateInspectionStatus(
      id,
      newStatus,
      approved ? { completed_at: new Date().toISOString() } : {}
    )

    if (statusResult.error) {
      return NextResponse.json(
        { error: 'Failed to update inspection status' },
        { status: 500 }
      )
    }

    // Create approval record
    const approvalData = {
      inspection_id: id,
      approver_id: user!.id,
      decision: approved ? 'APPROVED' : 'REJECTED',
      notes: notes,
      created_at: new Date().toISOString(),
    }

    // Log audit event
    await logAuditEvent('INSPECTION', id, approved ? 'APPROVED' : 'REJECTED', user!.id, {
      notes: notes,
      previousStatus: inspection.status,
    })

    // Create notification for inspector
    const notificationMessage = approved
      ? `Your inspection "${inspection.title}" has been approved`
      : `Your inspection "${inspection.title}" needs revision. ${notes ? 'Notes: ' + notes : ''}`

    await supabaseDatabase.createNotification({
      user_id: inspection.assigned_to,
      type: approved ? 'INSPECTION_APPROVED' : 'INSPECTION_REJECTED',
      title: approved ? 'Inspection Approved' : 'Inspection Needs Revision',
      message: notificationMessage,
      related_entity_type: 'INSPECTION',
      related_entity_id: id,
      priority: approved ? 'MEDIUM' : 'HIGH',
    })

    // If rejected, increment rejection count
    if (!approved) {
      const currentRejectionCount = inspection.rejection_count || 0
      await supabaseDatabase.updateInspection(id, {
        rejection_count: currentRejectionCount + 1,
      })

      // If too many rejections, escalate
      if (currentRejectionCount >= 2) {
        await supabaseDatabase.createNotification({
          user_id: inspection.project?.created_by || user!.id,
          type: 'INSPECTION_ESCALATED',
          title: 'Inspection Escalated',
          message: `Inspection "${inspection.title}" has been rejected ${currentRejectionCount + 1} times and needs attention`,
          related_entity_type: 'INSPECTION',
          related_entity_id: id,
          priority: 'HIGH',
        })
      }
    }

    return NextResponse.json({
      success: true,
      decision: approved ? 'APPROVED' : 'REJECTED',
      message: approved
        ? 'Inspection approved successfully'
        : 'Inspection rejected and returned for revision',
      status: newStatus,
      approvedAt: approved ? new Date().toISOString() : undefined,
      notes: notes,
    })

  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}