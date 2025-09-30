import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    const { user, error } = await withSupabaseAuth(request, {
        requiredRole: 'PROJECT_MANAGER',
    })
    if (error) return error

    try {
        const { id, userId } = await params
        const { role } = await request.json()

        if (!role) {
            return NextResponse.json(
                { error: 'Role is required' },
                { status: 400 }
            )
        }

        const result = await supabaseDatabase.updateProjectMemberRole(id, userId, role)

        if (result.error) {
            return NextResponse.json(
                { error: (result.error as any)?.message || 'Failed to update member role' },
                { status: 400 }
            )
        }

        await logAuditEvent('PROJECT_MEMBER', id, 'UPDATED', user!.id, {
            updatedUserId: userId,
            newRole: role
        })

        return NextResponse.json(result.data)
    } catch (error) {
        console.error('Error updating project member:', error)
        return NextResponse.json(
            { error: 'Failed to update project member' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    const { user, error } = await withSupabaseAuth(request, {
        requiredRole: 'PROJECT_MANAGER',
    })
    if (error) return error

    try {
        const { id, userId } = await params

        const result = await supabaseDatabase.removeProjectMember(id, userId)

        if (result.error) {
            return NextResponse.json(
                { error: (result.error as any)?.message || 'Failed to remove project member' },
                { status: 400 }
            )
        }

        await logAuditEvent('PROJECT_MEMBER', id, 'REMOVED', user!.id, {
            removedUserId: userId
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing project member:', error)
        return NextResponse.json(
            { error: 'Failed to remove project member' },
            { status: 500 }
        )
    }
}