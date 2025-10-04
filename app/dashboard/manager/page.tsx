'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectList } from '@/components/projects/project-list'
import { InspectionCard } from '@/components/inspections/inspection-card'
import { EnhancedInspectionForm } from '@/components/forms/enhanced-inspection-form'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { ResponsiveLayout } from '@/components/layout/responsive-layout'
import { ResponsiveGrid } from '@/components/ui/responsive-grid'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeProjects } from '@/lib/hooks/use-realtime-projects'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useRealtimeNotifications } from '@/lib/hooks/use-realtime-notifications'
import { useToast } from '@/lib/hooks/use-toast'
import { useMemo } from 'react'
import { 
  Plus, 
  Users, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  ListChecks
} from 'lucide-react'

export default function ManagerDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  // Real-time projects data for this manager
  const { 
    projects, 
    loading: projectsLoading,
    createProject
  } = useRealtimeProjects({
    userId: profile?.id,
    autoRefresh: true,
    includeMembers: true
  })

  // Real-time inspections data for this manager's projects
  const { 
    inspections, 
    loading: inspectionsLoading,
    stats: inspectionStats
  } = useRealtimeInspections({
    userRole: profile?.role as 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR' | undefined,
    userId: profile?.id,
    autoRefresh: true
  })

  // Real-time notifications
  const { notifications, stats: notificationStats } = useRealtimeNotifications()
  const unreadCount = notificationStats?.unread || 0

  // Calculate real-time manager stats
  const dashboardStats = useMemo(() => {
    if (projectsLoading || inspectionsLoading) {
      return {
        myProjects: 0,
        pendingApprovals: 0,
        overdueInspections: 0,
        teamMembers: 0,
        thisWeekCompleted: 0,
        avgCompletionTime: 0
      }
    }

    const myProjects = projects.length
    const pendingApprovals = inspections.filter(i => i.status === 'IN_REVIEW').length
    const overdueInspections = inspections.filter(i => {
      if (!i.due_date || !i.status) return false
      return new Date(i.due_date) < new Date() && !['APPROVED', 'REJECTED'].includes(i.status)
    }).length
    
    // Count unique team members across all projects
    const teamMemberIds = new Set()
    projects.forEach(project => {
      if ((project as any).project_members) {
        (project as any).project_members.forEach((member: any) => {
          if (member.profiles) {
            teamMemberIds.add(member.profiles.id)
          }
        })
      }
    })
    const teamMembers = teamMemberIds.size

    // This week's completed inspections
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const thisWeekCompleted = inspections.filter(i => 
      i.status === 'APPROVED' && 
      i.updated_at && new Date(i.updated_at) > weekAgo
    ).length

    // Average completion time (days)
    const completedInspections = inspections.filter(i => i.status === 'APPROVED')
    const avgCompletionTime = completedInspections.length > 0 
      ? completedInspections.reduce((sum, i) => {
          if (!i.created_at || !i.updated_at) return sum
          const created = new Date(i.created_at)
          const completed = new Date(i.updated_at)
          return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        }, 0) / completedInspections.length
      : 0

    return {
      myProjects,
      pendingApprovals,
      overdueInspections,
      teamMembers,
      thisWeekCompleted,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10
    }
  }, [projects, inspections, projectsLoading, inspectionsLoading])

  const handleCreateInspection = () => {
    setShowCreateForm(true)
  }

  const handleCreateProject = () => {
    setShowCreateProject(true)
  }

  const handleCreateChecklist = () => {
    router.push('/checklists/create')
  }

  const handleProjectCreated = (project: any) => {
    toast({
      title: "Success",
      description: `Project "${project.name}" has been created successfully.`,
    })
    // Refresh projects list
    // The useRealtimeProjects hook should automatically update
  }

  const handleInspectionCreated = () => {
    setShowCreateForm(false)
    toast({
      title: "Success",
      description: "Inspection has been created and assigned.",
    })
  }

  const handleInspectionAction = async (action: string, inspectionId: string) => {
    try {
      if (action === 'approve') {
        const response = await fetch(`/api/inspections/${inspectionId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: true, notes: '' })
        })
        
        if (response.ok) {
          toast({
            title: "Inspection Approved",
            description: "The inspection has been approved successfully.",
          })
        }
      }
      // Add other actions as needed
    } catch (error) {
      console.error('Action failed:', error)
      toast({
        title: "Action Failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewProjectDetails = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleManageProject = (projectId: string) => {
    router.push(`/projects/${projectId}/manage`)
  }

  const handleProjectClick = (projectId: string) => {
    // Default action when clicking on the project card
    router.push(`/projects/${projectId}`)
  }

  // Get pending inspections for approval
  const pendingInspections = inspections.filter(i => i.status === 'IN_REVIEW').slice(0, 5)

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Manager Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {profile?.name || 'Manager'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCreateProject} variant="outline" className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button onClick={handleCreateChecklist} variant="outline" className="flex-1 sm:flex-none">
              <ListChecks className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
            <Button onClick={handleCreateInspection} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              Assign Inspection
            </Button>
          </div>
        </div>

        {/* Real-time Stats */}
        <ResponsiveGrid cols={{ default: 2, lg: 4 }} className="gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">My Projects</CardDescription>
                <FileCheck className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">{dashboardStats.myProjects}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">Pending Approvals</CardDescription>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-orange-600">
                {dashboardStats.pendingApprovals}
              </CardTitle>
              {unreadCount > 0 && (
                <Badge className="mt-1 text-xs bg-orange-100 text-orange-800">
                  {unreadCount} new
                </Badge>
              )}
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">Overdue</CardDescription>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                {dashboardStats.overdueInspections}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">Team Members</CardDescription>
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-2xl">{dashboardStats.teamMembers}</CardTitle>
            </CardHeader>
          </Card>
        </ResponsiveGrid>

        {/* Performance Metrics */}
        <ResponsiveGrid cols={{ default: 1, md: 2 }} className="gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                This Week's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardStats.thisWeekCompleted}
                  </p>
                  <p className="text-sm text-gray-600">Inspections completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Average Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {dashboardStats.avgCompletionTime}
                  </p>
                  <p className="text-sm text-gray-600">Days average</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Create Inspection Form */}
        {showCreateForm && (
          <EnhancedInspectionForm
            onSubmit={handleInspectionCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* My Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Projects</CardTitle>
            <CardDescription>Projects you're managing</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectList 
              projects={projects} 
              loading={projectsLoading}
              userProjects={projects.map(p => p.id)}
              onProjectClick={handleProjectClick}
              onViewDetails={handleViewProjectDetails}
              onManageProject={handleManageProject}
            />
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        {pendingInspections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Pending Approvals
                <Badge className="bg-orange-100 text-orange-800">
                  {pendingInspections.length}
                </Badge>
              </CardTitle>
              <CardDescription>Inspections requiring your review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInspections.map((inspection) => (
                  <InspectionCard 
                    key={inspection.id} 
                    inspection={{
                      id: inspection.id,
                      title: inspection.title,
                      status: inspection.status === 'IN_REVIEW' ? 'in-review' as const : 'pending' as const,
                      priority: inspection.priority?.toLowerCase() as any || 'medium',
                      dueDate: inspection.due_date || '',
                      assignee: (inspection as any).profiles?.name || 'Unknown',
                      project: (inspection as any).projects?.name || 'Unknown Project'
                    }}
                    onAction={handleInspectionAction}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {notification.message}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Project Modal */}
        <CreateProjectModal
          open={showCreateProject}
          onOpenChange={setShowCreateProject}
          onProjectCreated={handleProjectCreated}
        />
      </div>
    </ResponsiveLayout>
  )
}
