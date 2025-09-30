import { supabaseDatabase } from '@/lib/supabase/database'
import { databaseExtensions } from '@/lib/supabase/database-extensions'

export class ManagerAnalyticsService {
  
  async getTeamPerformanceMetrics(managerId: string, timeframe: 'week' | 'month' | 'quarter' = 'month') {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const { data: inspections } = await databaseExtensions.getInspectionsByDateRange(
      startDate.toISOString(),
      new Date().toISOString()
    )
    
    // Group by inspector
    const performanceByInspector = inspections?.reduce((acc: any, inspection: any) => {
      const inspectorId = inspection.assigned_to
      if (!inspectorId) return acc
      
      if (!acc[inspectorId]) {
        acc[inspectorId] = {
          inspectorId,
          inspectorName: (inspection as any).profiles?.name || 'Unknown',
          totalAssigned: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          avgCompletionTime: 0,
          efficiency: 0
        }
      }
      
      acc[inspectorId].totalAssigned++
      
      if (inspection.status === 'APPROVED') {
        acc[inspectorId].completed++
      } else if (['DRAFT', 'PENDING', 'IN_REVIEW'].includes(inspection.status)) {
        acc[inspectorId].pending++
        
        if (inspection.due_date && new Date(inspection.due_date) < new Date()) {
          acc[inspectorId].overdue++
        }
      }
      
      return acc
    }, {} as Record<string, any>)
    
    // Calculate efficiency and completion times
    Object.values(performanceByInspector || {}).forEach((inspector: any) => {
      inspector.efficiency = inspector.totalAssigned > 0 ? 
        Math.round((inspector.completed / inspector.totalAssigned) * 100) : 0
    })
    
    return Object.values(performanceByInspector || {})
  }

  async getWorkloadDistribution(managerId: string) {
    const projectsResult = await supabaseDatabase.getProjectsForUser(managerId)
    const { data: inspections } = await databaseExtensions.getAllInspections()
    
    const workloadData = projectsResult?.data?.reduce((acc: any, project: any) => {
      const projectInspections = inspections?.filter((i: any) => i.project_id === project.id) || []
      
      acc.push({
        projectId: project.id,
        projectName: project.name,
        totalInspections: projectInspections.length,
        pendingInspections: projectInspections.filter((i: any) => ['DRAFT', 'PENDING'].includes(i.status)).length,
        inReviewInspections: projectInspections.filter((i: any) => i.status === 'IN_REVIEW').length,
        completedInspections: projectInspections.filter((i: any) => i.status === 'APPROVED').length,
        workloadPercentage: 0 // Will be calculated below
      })
      
      return acc
    }, [] as any[])
    
    const totalInspections = workloadData?.reduce((sum: number, project: any) => sum + project.totalInspections, 0) || 0
    workloadData?.forEach((project: any) => {
      project.workloadPercentage = totalInspections > 0 ? 
        Math.round((project.totalInspections / totalInspections) * 100) : 0
    })
    
    return workloadData || []
  }

  async getSLAMetrics(managerId: string) {
    const { data: inspections } = await databaseExtensions.getAllInspections()
    
    const now = new Date()
    const slaMetrics = {
      totalInspections: inspections?.length || 0,
      onTime: 0,
      breached: 0,
      atRisk: 0, // Due within 24 hours
      avgResponseTime: 0,
      breachRate: 0
    }
    
    inspections?.forEach((inspection: any) => {
      if (!inspection.due_date) return
      
      const dueDate = new Date(inspection.due_date)
      const timeToDue = dueDate.getTime() - now.getTime()
      const hoursUntilDue = timeToDue / (1000 * 60 * 60)
      
      if (inspection.status === 'APPROVED') {
        const completedAt = new Date(inspection.updated_at)
        if (completedAt <= dueDate) {
          slaMetrics.onTime++
        } else {
          slaMetrics.breached++
        }
      } else {
        if (hoursUntilDue < 0) {
          slaMetrics.breached++
        } else if (hoursUntilDue < 24) {
          slaMetrics.atRisk++
        } else {
          slaMetrics.onTime++
        }
      }
    })
    
    slaMetrics.breachRate = slaMetrics.totalInspections > 0 ? 
      Math.round((slaMetrics.breached / slaMetrics.totalInspections) * 100) : 0
    
    return slaMetrics
  }

  async getResourceUtilization(managerId: string) {
    const teamPerformance = await this.getTeamPerformanceMetrics(managerId)
    
    const utilization = {
      totalTeamMembers: teamPerformance.length,
      averageWorkload: 0,
      underutilized: 0, // < 60% efficiency
      optimal: 0, // 60-85% efficiency
      overloaded: 0, // > 85% efficiency
      recommendations: [] as string[]
    }
    
    if (teamPerformance.length > 0) {
      utilization.averageWorkload = Math.round(
        teamPerformance.reduce((sum: number, member: any) => sum + member.efficiency, 0) / teamPerformance.length
      )
      
      teamPerformance.forEach((member: any) => {
        if (member.efficiency < 60) {
          utilization.underutilized++
        } else if (member.efficiency > 85) {
          utilization.overloaded++
        } else {
          utilization.optimal++
        }
      })
      
      // Generate recommendations
      if (utilization.overloaded > 0) {
        utilization.recommendations.push(`${utilization.overloaded} team members are overloaded - consider redistributing work`)
      }
      if (utilization.underutilized > 0) {
        utilization.recommendations.push(`${utilization.underutilized} team members have capacity for additional work`)
      }
      if (utilization.averageWorkload < 70) {
        utilization.recommendations.push('Team has overall capacity - consider taking on additional projects')
      }
    }
    
    return utilization
  }

  async getProjectHealthScores(managerId: string) {
    const projectsResult = await supabaseDatabase.getProjectsForUser(managerId)
    const { data: inspections } = await databaseExtensions.getAllInspections()
    
    const projectHealth = projectsResult?.data?.map((project: any) => {
      const projectInspections = inspections?.filter((i: any) => i.project_id === project.id) || []
      
      let healthScore = 100
      let healthFactors = []
      
      // Factor 1: Completion rate
      const completionRate = projectInspections.length > 0 ? 
        (projectInspections.filter((i: any) => i.status === 'APPROVED').length / projectInspections.length) * 100 : 100
      
      if (completionRate < 80) {
        healthScore -= 20
        healthFactors.push('Low completion rate')
      }
      
      // Factor 2: Overdue inspections
      const overdueCount = projectInspections.filter((i: any) => 
        i.due_date && new Date(i.due_date) < new Date() && i.status !== 'APPROVED'
      ).length
      
      if (overdueCount > 0) {
        healthScore -= Math.min(30, overdueCount * 10)
        healthFactors.push(`${overdueCount} overdue inspections`)
      }
      
      // Factor 3: Recent activity
      const recentActivity = projectInspections.filter((i: any) => 
        new Date(i.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
      
      if (recentActivity === 0 && projectInspections.length > 0) {
        healthScore -= 15
        healthFactors.push('No recent activity')
      }
      
      return {
        projectId: project.id,
        projectName: project.name,
        healthScore: Math.max(0, healthScore),
        healthStatus: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
        factors: healthFactors,
        totalInspections: projectInspections.length,
        completionRate: Math.round(completionRate)
      }
    }) || []
    
    return projectHealth
  }

  async getPredictiveInsights(managerId: string) {
    const [teamPerformance, slaMetrics, workloadDistribution] = await Promise.all([
      this.getTeamPerformanceMetrics(managerId),
      this.getSLAMetrics(managerId),
      this.getWorkloadDistribution(managerId)
    ])
    
    const insights = {
      predictions: [] as string[],
      recommendations: [] as string[],
      risks: [] as string[],
      opportunities: [] as string[]
    }
    
    // Analyze trends and generate insights
    const avgEfficiency = teamPerformance.reduce((sum: number, member: any) => sum + member.efficiency, 0) / teamPerformance.length
    
    if (avgEfficiency > 85) {
      insights.predictions.push('Team performance trending upward - expect 10% improvement next month')
      insights.opportunities.push('High-performing team ready for additional responsibilities')
    } else if (avgEfficiency < 70) {
      insights.risks.push('Team performance below target - intervention needed')
      insights.recommendations.push('Consider additional training or workload redistribution')
    }
    
    if (slaMetrics.breachRate > 15) {
      insights.risks.push('SLA breach rate above acceptable threshold')
      insights.recommendations.push('Review and optimize approval processes')
    }
    
    // Workload analysis
    const highWorkloadProjects = workloadDistribution.filter((p: any) => p.workloadPercentage > 30)
    if (highWorkloadProjects.length > 0) {
      insights.recommendations.push(`Focus resources on high-workload projects: ${highWorkloadProjects.map((p: any) => p.projectName).join(', ')}`)
    }
    
    return insights
  }
}
