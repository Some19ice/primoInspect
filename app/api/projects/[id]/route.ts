import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    
    const result = await supabaseDatabase.getProjectById(id)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
    
    const result = await supabaseDatabase.updateProject(id, body)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }

    await logAuditEvent('PROJECT', id, 'UPDATED', user!.id, body)
    
    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request, {
    requiredRole: 'PROJECT_MANAGER',
  })
  if (error) return error

  try {
    const { id } = await params
    
    const result = await supabaseDatabase.deleteProject(id)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Failed to delete project' },
        { status: 400 }
      )
    }

    await logAuditEvent('PROJECT', id, 'DELETED', user!.id, {})
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
