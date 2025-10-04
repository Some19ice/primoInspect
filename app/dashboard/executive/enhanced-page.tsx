'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AnalyticsDashboard } from '@/components/executive/analytics-dashboard'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeProjects } from '@/lib/hooks/use-realtime-projects'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { useState, useEffect, useMemo } from 'react'
import { ExecutiveAnalyticsService } from '@/lib/services/executive-analytics'
import { Download, TrendingUp, AlertCircle, DollarSign, Shield } from 'lucide-react'

export default function EnhancedExecutiveDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const analyticsService = new ExecutiveAnalyticsService()
  
  // Real-time data hooks
  const { projects, loading: projectsLoading } = useRealtimeProjects({
    userId: profile?.id,
    autoRefresh: true,
    includeMembers: true
  })

  const { inspections, loading: inspectionsLoading } = useRealtimeInspections({
    userRole: profile?.role as 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR',
    userId: profile?.id,
    autoRefresh: true
  })

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [trends, health, costs, risks, compliance, insights] = await Promise.all([
          analyticsService.getPerformanceTrends(),
          analyticsService.getProjectHealthMetrics(),
          analyticsService.getCostAnalysis(),
          analyticsService.getRiskMetrics(),
          analyticsService.getComplianceMetrics(),
          analyticsService.getPredictiveInsights()
        ])

        setAnalyticsData({
          performanceTrends: trends,
          projectHealth: health,
          costAnalysis: costs,
          riskMetrics: risks,
          compliance,
          insights
        })
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id) {
      loadAnalytics()
    }
  }, [profile?.id])

  // Enhanced KPIs with predictive insights
  const enhancedKpis = useMemo(() => {
    if (projectsLoading || inspectionsLoading || !analyticsData) {
      return {
        totalProjects: 0,
        activeInspections: 0,
        complianceRate: 0,
        costEfficiency: 0,
        riskScore: 0
      }
    }

    const totalProjects = projects.length
    const activeInspections = inspections.filter(i => i.status && ['PENDING', 'IN_REVIEW'].includes(i.status)).length
    const complianceRate = analyticsData.compliance.complianceRate
    
    // Calculate cost efficiency (budget vs actual)
    const totalBudget = analyticsData.costAnalysis.reduce((sum: number, item: any) => sum + item.budget, 0)
    const totalActual = analyticsData.costAnalysis.reduce((sum: number, item: any) => sum + item.actual, 0)
    const costEfficiency = totalBudget > 0 ? Math.round(((totalBudget - totalActual) / totalBudget) * 100) : 0

    // Calculate risk score
    const { high, medium, low } = analyticsData.riskMetrics
    const totalRisks = high + medium + low
    const riskScore = totalRisks > 0 ? Math.round(((high * 3 + medium * 2 + low * 1) / (totalRisks * 3)) * 100) : 0

    return {
      totalProjects,
      activeInspections,
      complianceRate,
      costEfficiency,
      riskScore
    }
  }, [projects, inspections, analyticsData, projectsLoading, inspectionsLoading])

  const exportReport = async () => {
    // Trigger report generation
    try {
      const response = await fetch('/api/reports/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: { 
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `executive-report-${new Date().toISOString().split('T')[0]}.pdf`
        a.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total Projects
            </CardDescription>
            <CardTitle className="text-2xl">
              {loading ? '...' : enhancedKpis.totalProjects}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Inspections</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? '...' : enhancedKpis.activeInspections}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Compliance Rate
            </CardDescription>
            <CardTitle className={`text-2xl ${enhancedKpis.complianceRate >= 90 ? 'text-green-600' : enhancedKpis.complianceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {loading ? '...' : `${enhancedKpis.complianceRate}%`}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Cost Efficiency
            </CardDescription>
            <CardTitle className={`text-2xl ${enhancedKpis.costEfficiency >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {loading ? '...' : `${enhancedKpis.costEfficiency}%`}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Risk Score
            </CardDescription>
            <CardTitle className={`text-2xl ${enhancedKpis.riskScore <= 30 ? 'text-green-600' : enhancedKpis.riskScore <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {loading ? '...' : `${enhancedKpis.riskScore}%`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Executive Analytics</h2>
        <Button onClick={exportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {analyticsData && (
            <AnalyticsDashboard data={analyticsData} />
          )}
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed performance analysis across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Performance-specific charts would go here */}
              <p className="text-gray-500">Performance analytics implementation</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Dashboard</CardTitle>
              <CardDescription>Regulatory compliance tracking and reporting</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.compliance && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData.compliance.compliant}
                    </div>
                    <div className="text-sm text-gray-500">Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analyticsData.compliance.nonCompliant}
                    </div>
                    <div className="text-sm text-gray-500">Non-Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analyticsData.compliance.pending}
                    </div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analyticsData.compliance.complianceRate}%
                    </div>
                    <div className="text-sm text-gray-500">Overall Rate</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
              <CardDescription>AI-powered recommendations and forecasts</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.insights && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Projected Completion Rate</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData.insights.projectedCompletion}%
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Risk Factors</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analyticsData.insights.riskFactors.map((risk: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{risk}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analyticsData.insights.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
