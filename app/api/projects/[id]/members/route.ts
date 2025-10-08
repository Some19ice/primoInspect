import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

// GET /api/projects/[id]/members - Get all members of a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params

    // Get project with members
    const result = await supabaseDatabase.getProjectById(id)

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Extract and format members
    const members = (result.data as any).project_members || []
    const formattedMembers = members.map((member: any) => ({
      id: member.id,
      userId: member.profiles?.id || member.user_id,
      name: member.profiles?.name,
      email: member.profiles?.email,
      role: member.role || member.profiles?.role,
      createdAt: member.created_at,
    }))

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error('Error fetching project members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project members' },
      { status: 500 }
    )
  }
}

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
        const { userId, role = 'INSPECTOR' } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        const result = await supabaseDatabase.addProjectMember(id, userId, role)

        if (result.error) {
            return NextResponse.json(
                { error: (result.error as any)?.message || 'Failed to add project member' },
                { status: 400 }
            )
        }

        await logAuditEvent('PROJECT_MEMBER', id, 'ADDED', user!.id, {
            addedUserId: userId,
            role: role
        })

        return NextResponse.json(result.data)
    } catch (error) {
        console.error('Error adding project member:', error)
        return NextResponse.json(
            { error: 'Failed to add project member' },
            { status: 500 }
        )
    }
}