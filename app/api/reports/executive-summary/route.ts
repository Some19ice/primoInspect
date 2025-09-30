import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { ExecutiveAnalyticsService } from '@/lib/services/executive-analytics'

export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request, { 
    requiredRoles: ['EXECUTIVE'] 
  })
  if (error) return error

  try {
    const body = await request.json()
    const { dateRange } = body

    const analyticsService = new ExecutiveAnalyticsService()
    
    // Gather comprehensive executive data
    const [
      performanceTrends,
      projectHealth,
      costAnalysis,
      riskMetrics,
      complianceMetrics,
      insights
    ] = await Promise.all([
      analyticsService.getPerformanceTrends(),
      analyticsService.getProjectHealthMetrics(),
      analyticsService.getCostAnalysis(),
      analyticsService.getRiskMetrics(),
      analyticsService.getComplianceMetrics(),
      analyticsService.getPredictiveInsights()
    ])

    const executiveReport = {
      id: `exec_report_${Date.now()}`,
      generatedBy: user!.id,
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: {
        totalProjects: projectHealth.reduce((sum: number, p: any) => sum + p.value, 0),
        complianceRate: complianceMetrics.complianceRate,
        costEfficiency: calculateCostEfficiency(costAnalysis),
        riskLevel: calculateRiskLevel(riskMetrics),
        keyInsights: insights.recommendations.slice(0, 3)
      },
      sections: {
        performance: {
          trends: performanceTrends,
          efficiency: insights.projectedCompletion,
          recommendations: insights.recommendations
        },
        projects: {
          healthDistribution: projectHealth,
          statusBreakdown: projectHealth
        },
        financial: {
          budgetAnalysis: costAnalysis,
          costTrends: costAnalysis,
          savings: calculateSavings(costAnalysis)
        },
        compliance: {
          overallRate: complianceMetrics.complianceRate,
          breakdown: complianceMetrics,
          riskAreas: insights.riskFactors
        },
        risks: {
          distribution: riskMetrics,
          mitigation: insights.recommendations,
          forecast: insights.riskFactors
        }
      }
    }

    // Log audit event
    await logAuditEvent(
      'REPORT',
      executiveReport.id,
      'GENERATED',
      user!.id,
      { reportType: 'EXECUTIVE_SUMMARY', dateRange }
    )

    // In production, this would generate a PDF
    return NextResponse.json({
      success: true,
      report: executiveReport,
      downloadUrl: `/api/reports/download/${executiveReport.id}`
    })

  } catch (error) {
    console.error('Executive report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate executive report' },
      { status: 500 }
    )
  }
}

function calculateCostEfficiency(costAnalysis: any[]): number {
  const totalBudget = costAnalysis.reduce((sum, item) => sum + item.budget, 0)
  const totalActual = costAnalysis.reduce((sum, item) => sum + item.actual, 0)
  return totalBudget > 0 ? Math.round(((totalBudget - totalActual) / totalBudget) * 100) : 0
}

function calculateRiskLevel(riskMetrics: any): 'LOW' | 'MEDIUM' | 'HIGH' {
  const { high, medium, low } = riskMetrics
  const total = high + medium + low
  if (total === 0) return 'LOW'
  
  const highRatio = high / total
  if (highRatio > 0.3) return 'HIGH'
  if (highRatio > 0.1) return 'MEDIUM'
  return 'LOW'
}

function calculateSavings(costAnalysis: any[]): number {
  return costAnalysis.reduce((sum, item) => sum + (item.budget - item.actual), 0)
}
