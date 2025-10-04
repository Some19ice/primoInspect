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
    
    // Get basic project info and KPIs
    const [projectResult, kpis] = await Promise.all([
      supabaseDatabase.getProjectById(id),
      supabaseDatabase.getDashboardStats(user!.id, (user as any)?.user_metadata?.role || 'INSPECTOR')
    ])
    
    if (projectResult.error) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      project: projectResult.data,
      kpis,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project dashboard' },
      { status: 500 }
    )
  }
}
