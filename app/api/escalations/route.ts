import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, { 
    requiredRoles: ['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR'] 
  })
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const inspectionId = searchParams.get('inspectionId')
    const managerId = searchParams.get('managerId')

    // If inspectionId is provided, get active escalation for that inspection
    if (inspectionId) {
      const result = await supabaseDatabase.getActiveEscalation(inspectionId)
      
      if (result.error) {
        // Check if it's just a "no rows" error which is fine
        const errorCode = (result.error as any)?.code
        if (errorCode && errorCode !== 'PGRST116') { // PGRST116 = no rows returned
          return NextResponse.json(
            { error: 'Failed to fetch escalation' },
            { status: 500 }
          )
        }
        // No escalation found is not an error
        return NextResponse.json({
          escalation: null
        })
      }

      return NextResponse.json({
        escalation: result.data
      })
    }

    // Otherwise get escalation queue for manager
    const userIdToQuery = managerId || user!.id
    const result = await supabaseDatabase.getEscalationQueueForManager(userIdToQuery)
    
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
