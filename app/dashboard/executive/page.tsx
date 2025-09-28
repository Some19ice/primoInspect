'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeProjects } from '@/lib/hooks/use-realtime-projects'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { useMemo } from 'react'

export default function ExecutiveDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  
  // Real-time projects data
  const { 
    projects, 
    loading: projectsLoading 
  } = useRealtimeProjects({
    userId: profile?.id,
    autoRefresh: true,
    includeMembers: true
  })

  // Real-time inspections data
  const { 
    inspections, 
    loading: inspectionsLoading 
  } = useRealtimeInspections({
    userRole: profile?.role,
    userId: profile?.id,
    autoRefresh: true
  })

  // Calculate real-time KPIs from actual data
  const kpis = useMemo(() => {
    if (projectsLoading || inspectionsLoading) {
      return {
        totalProjects: 0,
        activeInspections: 0,
        completionRate: 0,
        criticalIssues: 0
      }
    }

    const totalProjects = projects.length
    const activeInspections = inspections.filter(i => ['PENDING', 'IN_REVIEW'].includes(i.status)).length
    const completedInspections = inspections.filter(i => i.status === 'APPROVED').length
    const completionRate = inspections.length > 0 ? Math.round((completedInspections / inspections.length) * 100) : 0
    const criticalIssues = inspections.filter(i => i.status === 'REJECTED' && i.priority === 'HIGH').length

    return {
      totalProjects,
      activeInspections,
      completionRate,
      criticalIssues
    }
  }, [projects, inspections, projectsLoading, inspectionsLoading])

  // Recent activity from inspections
  const recentActivity = useMemo(() => {
    return inspections
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
      .map(inspection => ({
        id: inspection.id,
        title: inspection.title,
        status: inspection.status,
        updatedAt: inspection.updated_at,
        project: projects.find(p => p.id === inspection.project_id)?.name || 'Unknown Project'
      }))
  }, [inspections, projects])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500'
      case 'REJECTED': return 'bg-red-500'
      case 'IN_REVIEW': return 'bg-yellow-500'
      case 'PENDING': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - Mobile-first grid with real-time data */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Projects</CardDescription>
            <CardTitle className="text-2xl">
              {projectsLoading ? '...' : kpis.totalProjects}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Inspections</CardDescription>
            <CardTitle className="text-2xl">
              {inspectionsLoading ? '...' : kpis.activeInspections}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Completion Rate</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {inspectionsLoading ? '...' : `${kpis.completionRate}%`}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Critical Issues</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {inspectionsLoading ? '...' : kpis.criticalIssues}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest updates across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <div className={`w-2 h-2 ${getStatusColor(activity.status)} rounded-full`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(activity.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* Project Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Status</CardTitle>
          <CardDescription>Overview of all renewable energy projects</CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
                  <div className="h-4 bg-gray-300 rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active</span>
                <span className="text-sm font-medium">
                  {projects.filter(p => p.status === 'ACTIVE').length} projects
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">On Hold</span>
                <span className="text-sm font-medium text-yellow-600">
                  {projects.filter(p => p.status === 'ON_HOLD').length} projects
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-medium text-green-600">
                  {projects.filter(p => p.status === 'COMPLETED').length} projects
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications Summary */}
      {notificationCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              Notifications 
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                {notificationCount}
              </span>
            </CardTitle>
            <CardDescription>You have unread notifications requiring attention</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
