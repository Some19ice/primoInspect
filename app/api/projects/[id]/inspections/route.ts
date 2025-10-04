import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await withSupabaseAuth(request)
    if (error) return error

    try {
        const { id } = await params
        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '20')
        const status = url.searchParams.get('status')?.split(',') || undefined
        const assignedTo = url.searchParams.get('assignedTo') || undefined

        const userRole = (user as any)?.role || (user as any)?.user_metadata?.role

        const filters = {
            status,
            assignedTo,
            page,
            limit
        }

        const result = await supabaseDatabase.getInspectionsForProject(
            id,
            filters
        )

        if (result.error) {
            return NextResponse.json(
                { error: 'Failed to fetch inspections' },
                { status: 500 }
            )
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching project inspections:', error)
        return NextResponse.json(
            { error: 'Failed to fetch inspections' },
            { status: 500 }
        )
    }
}