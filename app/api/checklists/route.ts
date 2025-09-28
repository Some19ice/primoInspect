import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabase } from '@/lib/supabase/client'

// GET /api/checklists - List checklists for authenticated user's projects
export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    let query = supabase
      .from('checklists')
      .select('*')
      .eq('is_active', true)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch checklists' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checklists: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklists' },
      { status: 500 }
    )
  }
}

// POST /api/checklists - Create new checklist (Project Manager only)
export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, {
    requiredRole: 'PROJECT_MANAGER',
  })
  if (error) return error

  try {
    const body = await request.json()
    const { projectId, name, description, questions } = body

    if (!projectId || !name || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'projectId, name, and questions array are required' },
        { status: 400 }
      )
    }

    const { data, error: createError } = await supabase
      .from('checklists')
      .insert({
        project_id: projectId,
        name,
        description,
        questions,
        version: '1.0',
        is_active: true,
        created_by: user!.id
      } as any)
      .select()
      .single()

    if (createError) {
      console.error('Error creating checklist:', createError)
      return NextResponse.json(
        { error: 'Failed to create checklist' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent(
      'CHECKLIST',
      (data as any).id,
      'CREATED',
      user!.id,
      { name, questionsCount: questions.length }
    )

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to create checklist' },
      { status: 500 }
    )
  }
}
