import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, { 
    requiredRoles: ['EXECUTIVE', 'PROJECT_MANAGER'] 
  })
  if (error) return error

  try {
    const body = await request.json()
    const { projectId, startDate, endDate, reportType = 'INSPECTION_SUMMARY' } = body

    if (!projectId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'projectId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Get inspections for the date range
    const inspections = await supabaseDatabase.getInspectionsForProjectByDateRange(
      projectId,
      { 
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    )

    if (inspections.error) {
      return NextResponse.json(
        { error: 'Failed to fetch inspection data' },
        { status: 500 }
      )
    }

    // Generate basic report data
    const reportData = {
      id: `report_${Date.now()}`,
      projectId,
      reportType,
      generatedBy: user!.id,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      summary: {
        totalInspections: inspections.data?.length || 0,
        completedInspections: inspections.data?.filter(i => (i as any).status === 'COMPLETED').length || 0,
        pendingInspections: inspections.data?.filter(i => (i as any).status === 'PENDING').length || 0,
        rejectedInspections: inspections.data?.filter(i => (i as any).status === 'REJECTED').length || 0,
      },
      inspections: inspections.data || []
    }

    // Log audit event
    await logAuditEvent(
      'REPORT',
      reportData.id,
      'GENERATED',
      user!.id,
      { projectId, reportType, dateRange: { startDate, endDate } }
    )

    return NextResponse.json({
      success: true,
      report: reportData
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    // TODO: Implement report listing from database when reports table is ready
    return NextResponse.json({
      reports: [],
      message: 'Report listing will be implemented when reports are stored in database'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
