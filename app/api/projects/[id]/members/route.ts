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