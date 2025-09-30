import { NextRequest, NextResponse } from 'next/server'
import { requireProjectManager, AuthenticatedRequest } from '@/lib/auth/rbac-middleware'
import { logAuditEvent } from '@/lib/auth/auth-service'
import { supabaseDatabase } from '@/lib/supabase/database'

export const POST = requireProjectManager()(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json()
    
    const approvalData = {
      inspection_id: id,
      approver_id: request.user.id,
      decision: 'APPROVED' as const,
      notes: body.notes || '',
      is_escalated: body.isEscalated || false,
      escalation_reason: body.escalationReason,
    }
    
    const result = await supabaseDatabase.createApproval(approvalData)
    
    if (result.error) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to approve inspection',
          },
        },
        { status: 500 }
      )
    }

    // Update inspection status to approved
    await supabaseDatabase.updateInspectionStatus(id, 'APPROVED', {
      completed_at: new Date().toISOString()
    })

    await logAuditEvent('INSPECTION', id, 'APPROVED', request.user.id, body, request)
    
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error approving inspection:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to approve inspection',
        },
      },
      { status: 500 }
    )
  }
})

export const PUT = requireProjectManager()(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json()
    
    const approvalData = {
      inspection_id: id,
      approver_id: request.user.id,
      decision: 'REJECTED' as const,
      notes: body.notes || '',
      is_escalated: body.isEscalated || false,
      escalation_reason: body.escalationReason,
    }
    
    const result = await supabaseDatabase.createApproval(approvalData)
    
    if (result.error) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to reject inspection',
          },
        },
        { status: 500 }
      )
    }

    // Update inspection status to rejected and increment rejection count
    await supabaseDatabase.updateInspectionStatus(id, 'REJECTED', {
      rejection_count: 1 // Simplified - could be enhanced to track actual count
    })

    await logAuditEvent('INSPECTION', id, 'REJECTED', request.user.id, body, request)
    
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error rejecting inspection:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reject inspection',
        },
      },
      { status: 500 }
    )
  }
})
