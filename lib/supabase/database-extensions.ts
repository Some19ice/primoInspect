import { supabase } from './client'

// Extension methods for the database service to support executive analytics
export class DatabaseExtensions {
  
  async getInspectionsByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        projects(name, status),
        profiles(name, role)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members(
          role,
          profiles(id, name, email, role)
        )
      `)
      .order('updated_at', { ascending: false })

    return { data, error }
  }

  async getAllInspections() {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        projects(name, status),
        profiles(name, role)
      `)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async getProjectPerformanceMetrics(projectId?: string) {
    let query = supabase
      .from('inspections')
      .select(`
        status,
        priority,
        created_at,
        completed_at,
        due_date,
        projects(id, name, status)
      `)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) return { data: null, error }

    // Calculate performance metrics
    const metrics = {
      totalInspections: data.length,
      completedOnTime: data.filter((i: any) => 
        i.status === 'APPROVED' && 
        i.completed_at && 
        i.due_date && 
        new Date(i.completed_at) <= new Date(i.due_date)
      ).length,
      overdue: data.filter((i: any) => 
        i.status !== 'APPROVED' && 
        i.due_date && 
        new Date() > new Date(i.due_date)
      ).length,
      averageCompletionTime: this.calculateAverageCompletionTime(data),
      complianceRate: data.length > 0 ? 
        Math.round((data.filter((i: any) => i.status === 'APPROVED').length / data.length) * 100) : 0
    }

    return { data: metrics, error: null }
  }

  async getResourceUtilization() {
    const { data: inspectors, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        inspections:inspections(
          id,
          status,
          created_at,
          completed_at
        )
      `)
      .eq('role', 'INSPECTOR')

    if (error) return { data: null, error }

    const utilization = inspectors.map((inspector: any) => {
      const inspections = inspector.inspections || []
      const completed = inspections.filter((i: any) => i.status === 'APPROVED')
      const pending = inspections.filter((i: any) => ['DRAFT', 'PENDING', 'IN_REVIEW'].includes(i.status))
      
      return {
        inspectorId: inspector.id,
        inspectorName: inspector.name,
        totalAssigned: inspections.length,
        completed: completed.length,
        pending: pending.length,
        utilizationRate: inspections.length > 0 ? 
          Math.round((completed.length / inspections.length) * 100) : 0
      }
    })

    return { data: utilization, error: null }
  }

  async getComplianceTrends(months: number = 12) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const { data, error } = await this.getInspectionsByDateRange(
      startDate.toISOString(),
      new Date().toISOString()
    )

    if (error) return { data: null, error }

    // Group by month and calculate compliance rates
    const monthlyCompliance = data?.reduce((acc: any, inspection: any) => {
      const month = new Date(inspection.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      })
      
      if (!acc[month]) {
        acc[month] = { total: 0, compliant: 0 }
      }
      
      acc[month].total++
      if (inspection.status === 'APPROVED') {
        acc[month].compliant++
      }
      
      return acc
    }, {} as Record<string, { total: number; compliant: number }>)

    const trends = Object.entries(monthlyCompliance || {}).map(([month, data]: [string, any]) => ({
      month,
      complianceRate: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0,
      totalInspections: data.total,
      compliantInspections: data.compliant
    }))

    return { data: trends, error: null }
  }

  private calculateAverageCompletionTime(inspections: any[]): number {
    const completedInspections = inspections.filter((i: any) => 
      i.status === 'APPROVED' && i.created_at && i.completed_at
    )

    if (completedInspections.length === 0) return 0

    const totalTime = completedInspections.reduce((sum: number, inspection: any) => {
      const created = new Date(inspection.created_at).getTime()
      const completed = new Date(inspection.completed_at).getTime()
      return sum + (completed - created)
    }, 0)

    // Return average time in days
    return Math.round(totalTime / (completedInspections.length * 24 * 60 * 60 * 1000))
  }
}

export const databaseExtensions = new DatabaseExtensions()
