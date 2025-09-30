import { supabaseDatabase } from '@/lib/supabase/database'
import { databaseExtensions } from '@/lib/supabase/database-extensions'

export class ExecutiveAnalyticsService {
  
  async getPerformanceTrends(months: number = 6) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    const { data: inspections } = await databaseExtensions.getInspectionsByDateRange(
      startDate.toISOString(),
      new Date().toISOString()
    )
    
    // Group by month and calculate metrics
    const monthlyData = inspections?.reduce((acc: any, inspection: any) => {
      const month = new Date(inspection.completed_at || inspection.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (!acc[month]) {
        acc[month] = { completed: 0, total: 0 }
      }
      acc[month].total++
      if (inspection.status === 'APPROVED') {
        acc[month].completed++
      }
      return acc
    }, {} as Record<string, { completed: number; total: number }>)
    
    return Object.entries(monthlyData || {}).map(([month, data]: [string, any]) => ({
      month,
      completed: data.completed,
      efficiency: Math.round((data.completed / data.total) * 100)
    }))
  }

  async getProjectHealthMetrics() {
    const { data: projects } = await databaseExtensions.getAllProjects()
    
    const healthMetrics = projects?.reduce((acc: any, project: any) => {
      // Calculate health based on inspection completion rates and overdue items
      const health = this.calculateProjectHealth(project)
      acc[health]++
      return acc
    }, { healthy: 0, warning: 0, critical: 0 })
    
    return [
      { name: 'Healthy', value: healthMetrics?.healthy || 0, status: 'healthy' as const },
      { name: 'Warning', value: healthMetrics?.warning || 0, status: 'warning' as const },
      { name: 'Critical', value: healthMetrics?.critical || 0, status: 'critical' as const }
    ]
  }

  async getCostAnalysis() {
    // This would integrate with financial data when available
    const { data: projects } = await databaseExtensions.getAllProjects()
    
    return [
      { category: 'Inspections', budget: 50000, actual: 45000 },
      { category: 'Equipment', budget: 30000, actual: 32000 },
      { category: 'Personnel', budget: 80000, actual: 75000 },
      { category: 'Travel', budget: 15000, actual: 18000 }
    ]
  }

  async getRiskMetrics() {
    const { data: inspections } = await databaseExtensions.getAllInspections()
    
    const riskCounts = inspections?.reduce((acc: any, inspection: any) => {
      const priority = inspection.priority || 'MEDIUM'
      acc[priority.toLowerCase()]++
      return acc
    }, { high: 0, medium: 0, low: 0 })
    
    return riskCounts || { high: 0, medium: 0, low: 0 }
  }

  async getComplianceMetrics() {
    const { data: inspections } = await databaseExtensions.getAllInspections()
    
    const total = inspections?.length || 0
    const compliant = inspections?.filter((i: any) => i.status === 'APPROVED').length || 0
    const nonCompliant = inspections?.filter((i: any) => i.status === 'REJECTED').length || 0
    const pending = total - compliant - nonCompliant
    
    return {
      complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
      totalInspections: total,
      compliant,
      nonCompliant,
      pending
    }
  }

  async getPredictiveInsights() {
    // Basic trend analysis for predictions
    const trends = await this.getPerformanceTrends(12)
    const avgEfficiency = trends.reduce((sum, t) => sum + t.efficiency, 0) / trends.length
    
    return {
      projectedCompletion: Math.round(avgEfficiency),
      riskFactors: ['Seasonal weather delays', 'Resource constraints'],
      recommendations: [
        'Increase inspection frequency during peak season',
        'Consider additional training for inspectors'
      ]
    }
  }

  private calculateProjectHealth(project: any): 'healthy' | 'warning' | 'critical' {
    // Simplified health calculation - would be more sophisticated in production
    if (project.status === 'COMPLETED') return 'healthy'
    if (project.status === 'ON_HOLD') return 'critical'
    
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceUpdate > 30) return 'critical'
    if (daysSinceUpdate > 14) return 'warning'
    return 'healthy'
  }
}
