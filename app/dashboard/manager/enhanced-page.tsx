'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamManagementDashboard } from '@/components/manager/team-management-dashboard'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeProjects } from '@/lib/hooks/use-realtime-projects'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { useState, useMemo } from 'react'
import { 
  Users, Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, BarChart3, Settings, Bell, Filter
} from 'lucide-react'

export default function EnhancedManagerDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')
  
  const { projects, loading: projectsLoading } = useRealtimeProjects({
    userId: profile?.id,
    autoRefresh: true,
    includeMembers: true
  })

  const { inspections, loading: inspectionsLoading } = useRealtimeInspections({
    userRole: profile?.role,
    userId: profile?.id,
    autoRefresh: true
  })

  // Enhanced analytics
  const analytics = useMemo(() => {
    if (projectsLoading || inspectionsLoading) return null

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const timeframe = selectedTimeframe === 'week' ? weekAgo : monthAgo
    const recentInspections = inspections.filter(i => new Date(i.created_at) > timeframe)

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
      totalInspections: inspections.length,
      pendingApprovals: inspections.filter(i => i.status === 'IN_REVIEW').length,
      overdueInspections: inspections.filter(i => 
        i.due_date && new Date(i.due_date) < now && !['APPROVED', 'REJECTED'].includes(i.status)
      ).length,
      completionRate: inspections.length > 0 ? 
        Math.round((inspections.filter(i => i.status === 'APPROVED').length / inspections.length) * 100) : 0,
      avgResponseTime: calculateAvgResponseTime(inspections),
      slaBreaches: inspections.filter(i => i.due_date && new Date(i.due_date) < now).length,
      recentActivity: recentInspections.length,
      teamUtilization: calculateTeamUtilization(projects)
    }
  }, [projects, inspections, selectedTimeframe, projectsLoading, inspectionsLoading])

  // Mock team data - in production would come from API
  const teamMembers = [
    { id: '1', name: 'John Smith', role: 'Senior Inspector', workload: 85, efficiency: 92, assignedInspections: 12, completedThisWeek: 8, overdueCount: 1, status: 'available' as const },
    { id: '2', name: 'Sarah Johnson', role: 'Inspector', workload: 65, efficiency: 88, assignedInspections: 9, completedThisWeek: 6, overdueCount: 0, status: 'busy' as const },
    { id: '3', name: 'Mike Chen', role: 'Inspector', workload: 45, efficiency: 95, assignedInspections: 6, completedThisWeek: 5, overdueCount: 0, status: 'available' as const }
  ]

  const priorityInspections = inspections
    .filter(i => i.status === 'IN_REVIEW' && i.priority === 'HIGH')
    .slice(0, 5)

  const upcomingDeadlines = inspections
    .filter(i => i.due_date && new Date(i.due_date) > new Date() && new Date(i.due_date) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-gray-600">Manage teams, projects, and approvals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Active Projects</span>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{analytics?.activeProjects || 0}</div>
            <div className="text-xs text-gray-500">of {analytics?.totalProjects || 0} total</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Pending Approvals</span>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{analytics?.pendingApprovals || 0}</div>
            {notificationCount > 0 && (
              <Badge className="text-xs bg-orange-100 text-orange-800">{notificationCount} urgent</Badge>
            )}
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">SLA Breaches</span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{analytics?.slaBreaches || 0}</div>
            <div className="text-xs text-gray-500">requires attention</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Completion Rate</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{analytics?.completionRate || 0}%</div>
            <div className="text-xs text-gray-500">this {selectedTimeframe}</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Team Utilization</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">{analytics?.teamUtilization || 0}%</div>
            <div className="text-xs text-gray-500">average load</div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Inspections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  High Priority Approvals
                </CardTitle>
                <CardDescription>Inspections requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                {priorityInspections.length > 0 ? (
                  <div className="space-y-3">
                    {priorityInspections.map((inspection) => (
                      <div key={inspection.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-sm">{inspection.title}</h4>
                          <p className="text-xs text-gray-500">
                            Due: {inspection.due_date ? new Date(inspection.due_date).toLocaleDateString() : 'No deadline'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Review</Button>
                          <Button size="sm">Approve</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No high priority items</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription>Next 3 days</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((inspection) => (
                      <div key={inspection.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-sm">{inspection.title}</h4>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(inspection.due_date!).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.ceil((new Date(inspection.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementDashboard
            teamMembers={teamMembers}
            onAssignInspection={(memberId) => console.log('Assign to:', memberId)}
            onViewMember={(memberId) => console.log('View member:', memberId)}
          />
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Approval Queue</CardTitle>
              <CardDescription>Inspections awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspections.filter(i => i.status === 'IN_REVIEW').map((inspection) => (
                  <div key={inspection.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{inspection.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{inspection.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={inspection.priority === 'HIGH' ? 'destructive' : 'outline'}>
                            {inspection.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Submitted {new Date(inspection.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>All projects under your management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Inspections:</span>
                          <span>{inspections.filter(i => i.project_id === project.id).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="text-green-600">
                            {inspections.filter(i => i.project_id === project.id && i.status === 'APPROVED').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="text-orange-600">
                            {inspections.filter(i => i.project_id === project.id && i.status === 'IN_REVIEW').length}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-3">Manage</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Advanced analytics charts would be implemented here</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Resource allocation and utilization metrics</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function calculateAvgResponseTime(inspections: any[]): number {
  const reviewedInspections = inspections.filter(i => ['APPROVED', 'REJECTED'].includes(i.status))
  if (reviewedInspections.length === 0) return 0
  
  const totalTime = reviewedInspections.reduce((sum, inspection) => {
    const created = new Date(inspection.created_at).getTime()
    const updated = new Date(inspection.updated_at).getTime()
    return sum + (updated - created)
  }, 0)
  
  return Math.round(totalTime / (reviewedInspections.length * 1000 * 60 * 60)) // hours
}

function calculateTeamUtilization(projects: any[]): number {
  // Simplified calculation - in production would be more sophisticated
  return 75
}
