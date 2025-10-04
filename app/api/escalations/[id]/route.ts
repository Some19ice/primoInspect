import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

/**
 * PATCH /api/escalations/[id]
 * 
 * Update escalation status (e.g., resolve it)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request, {
    requiredRoles: ['EXECUTIVE', 'PROJECT_MANAGER']
  })
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Valid escalation statuses
    const validStatuses = ['QUEUED', 'NOTIFIED', 'RESOLVED', 'EXPIRED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update escalation status
    const result = await supabaseDatabase.updateEscalationStatus(id, status)

    if (result.error) {
      console.error('Error updating escalation status:', result.error)
      return NextResponse.json(
        { error: 'Failed to update escalation status' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent('ESCALATION', id, 'UPDATED', user!.id, { status })

    return NextResponse.json({
      success: true,
      escalation: result.data
    })
  } catch (error) {
    console.error('Error in PATCH /api/escalations/[id]:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
