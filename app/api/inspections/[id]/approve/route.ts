import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request, {
    requiredRole: 'PROJECT_MANAGER',
  })
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    
    const approvalData = {
      inspection_id: id,
      approver_id: user!.id,
      decision: 'APPROVED' as const,
      notes: body.notes || '',
      is_escalated: body.isEscalated || false,
      escalation_reason: body.escalationReason,
    }
    
    const result = await supabaseDatabase.createApproval(approvalData)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to approve inspection' },
        { status: 500 }
      )
    }

    // Update inspection status to approved
    await supabaseDatabase.updateInspectionStatus(id, 'APPROVED', {
      completed_at: new Date().toISOString()
    })

    await logAuditEvent('INSPECTION', id, 'APPROVED', user!.id, body)
    
    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to approve inspection' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request, {
    requiredRole: 'PROJECT_MANAGER',
  })
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    
    const approvalData = {
      inspection_id: id,
      approver_id: user!.id,
      decision: 'REJECTED' as const,
      notes: body.notes || '',
      is_escalated: body.isEscalated || false,
      escalation_reason: body.escalationReason,
    }
    
    const result = await supabaseDatabase.createApproval(approvalData)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to reject inspection' },
        { status: 500 }
      )
    }

    // Update inspection status to rejected and increment rejection count
    await supabaseDatabase.updateInspectionStatus(id, 'REJECTED', {
      rejection_count: 1 // Simplified - could be enhanced to track actual count
    })

    await logAuditEvent('INSPECTION', id, 'REJECTED', user!.id, body)
    
    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reject inspection' },
      { status: 500 }
    )
  }
}
