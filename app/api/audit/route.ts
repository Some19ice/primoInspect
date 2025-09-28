import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth } from '@/lib/supabase/rbac'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, {
    requiredRoles: ['EXECUTIVE', 'PROJECT_MANAGER']
  })
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const action = searchParams.get('action')
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    if (entityId) {
      query = query.eq('entity_id', entityId)
    }
    if (action) {
      query = query.eq('action', action)
    }

    const { data, error: queryError, count } = await query

    if (queryError) {
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
