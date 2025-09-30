import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function GET(request: NextRequest) {
    const { user, error } = await withSupabaseAuth(request)
    if (error) return error

    try {
        const url = new URL(request.url)
        const query = url.searchParams.get('q') || ''
        const excludeProjectId = url.searchParams.get('excludeProject') || undefined

        if (query.length < 2) {
            return NextResponse.json({ data: [] })
        }

        const result = await supabaseDatabase.searchUsers(query, excludeProjectId)

        if (result.error) {
            return NextResponse.json(
                { error: 'Failed to search users' },
                { status: 500 }
            )
        }

        return NextResponse.json({ data: result.data })
    } catch (error) {
        console.error('Error searching users:', error)
        return NextResponse.json(
            { error: 'Failed to search users' },
            { status: 500 }
        )
    }
}