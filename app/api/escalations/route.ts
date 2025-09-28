import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, { 
    requiredRoles: ['EXECUTIVE', 'PROJECT_MANAGER'] 
  })
  if (error) return error

  try {
    const result = await supabaseDatabase.getEscalationQueueForManager(user!.id)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to fetch escalations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      escalations: result.data || [],
      count: result.data?.length || 0
    })

  } catch (error) {
    console.error('Escalations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch escalations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, { 
    requiredRole: 'PROJECT_MANAGER' 
  })
  if (error) return error

  try {
    const body = await request.json()
    const { inspectionId, escalationReason, priorityLevel } = body

    if (!inspectionId || !escalationReason) {
      return NextResponse.json(
        { error: 'inspectionId and escalationReason are required' },
        { status: 400 }
      )
    }

    // Create escalation
    const escalationResult = await supabaseDatabase.createEscalation({
      inspection_id: inspectionId,
      original_manager_id: user!.id,
      escalation_reason: escalationReason,
      priority_level: priorityLevel || 'MEDIUM'
    })

    if (escalationResult.error) {
      return NextResponse.json(
        { error: 'Failed to create escalation' },
        { status: 500 }
      )
    }

    await logAuditEvent('ESCALATION', (escalationResult.data as any)?.id || 'unknown', 'CREATED', user!.id, body)

    return NextResponse.json({
      success: true,
      escalation: escalationResult.data
    })

  } catch (error) {
    console.error('Escalation processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process escalation' },
      { status: 500 }
    )
  }
}
