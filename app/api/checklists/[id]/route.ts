import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

// GET /api/checklists/[id] - Get specific checklist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    
    const result = await supabaseDatabase.getChecklistById(id)

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    )
  }
}

// PUT /api/checklists/[id] - Update checklist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Validate user has permission to update checklist
    const userRole = (user as any)?.user_metadata?.role
    if (userRole !== 'PROJECT_MANAGER' && userRole !== 'EXECUTIVE') {
      return NextResponse.json(
        { error: 'Not authorized to update checklists' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.version) updateData.version = body.version
    if (body.questions) updateData.questions = body.questions
    if (body.isActive !== undefined) updateData.is_active = body.isActive

    const { data, error: updateError } = await supabaseDatabase.updateChecklist(id, updateData)

    if (updateError) {
      console.error('Database error updating checklist:', updateError)
      return NextResponse.json(
        { error: 'Failed to update checklist' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent('CHECKLIST', id, 'UPDATED', user!.id, {
      updatedFields: Object.keys(updateData),
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    )
  }
}

// DELETE /api/checklists/[id] - Delete checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params

    // Validate user has permission to delete checklist
    const userRole = (user as any)?.user_metadata?.role
    if (userRole !== 'PROJECT_MANAGER' && userRole !== 'EXECUTIVE') {
      return NextResponse.json(
        { error: 'Not authorized to delete checklists' },
        { status: 403 }
      )
    }

    // Check if checklist is in use by any inspections
    const inspectionsResult = await supabaseDatabase.getInspectionsByChecklistId(id)
    if (inspectionsResult.data && inspectionsResult.data.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete checklist that is in use by inspections',
          inspectionCount: inspectionsResult.data.length
        },
        { status: 400 }
      )
    }

    const result = await supabaseDatabase.deleteChecklist(id)

    if (result.error) {
      console.error('Error deleting checklist:', result.error)
      return NextResponse.json(
        { error: 'Failed to delete checklist' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent('CHECKLIST', id, 'DELETED', user!.id, {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist:', error)
    return NextResponse.json(
      { error: 'Failed to delete checklist' },
      { status: 500 }
    )
  }
}