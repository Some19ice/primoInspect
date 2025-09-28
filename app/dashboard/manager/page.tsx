'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectList } from '@/components/projects/project-list'
import { InspectionCard } from '@/components/inspections/inspection-card'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeProjects } from '@/lib/hooks/use-realtime-projects'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { useMemo } from 'react'

export default function ManagerDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  
  // Real-time projects data for this manager
  const { 
    projects, 
    loading: projectsLoading 
  } = useRealtimeProjects({
    userId: profile?.id,
    autoRefresh: true,
    includeMembers: true
  })

  // Real-time inspections data for this manager's projects
  const { 
    inspections, 
    loading: inspectionsLoading 
  } = useRealtimeInspections({
    userRole: profile?.role,
    userId: profile?.id,
    autoRefresh: true
  })

  // Calculate real-time manager stats
  const stats = useMemo(() => {
    if (projectsLoading || inspectionsLoading) {
      return {
        myProjects: 0,
        pendingApprovals: 0,
        overdueInspections: 0,
        teamMembers: 0
      }
    }

    const myProjects = projects.length
    const pendingApprovals = inspections.filter(i => i.status === 'IN_REVIEW').length
    const overdueInspections = inspections.filter(i => {
      if (!i.due_date) return false
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

    return {
      myProjects,
      pendingApprovals,
      overdueInspections,
      teamMembers
    }
  }, [projects, inspections, projectsLoading, inspectionsLoading])

  // Use real projects data or fallback to empty array for loading state
  const displayProjects = projectsLoading ? [] : projects

  const pendingInspections = [
    { 
      id: '1', 
      title: 'Solar Panel Installation Check', 
      status: 'in-review' as const, 
      priority: 'high' as const, 
      dueDate: '2025-09-27',
      assignee: 'Mike Jones',
      project: 'Solar Farm Alpha'
    },
    { 
      id: '2', 
      title: 'Wind Turbine Safety Inspection', 
      status: 'pending' as const, 
      priority: 'medium' as const, 
      dueDate: '2025-09-26',
      assignee: 'Sarah Wilson',
      project: 'Wind Project Beta'
    }
  ]

  const handleInspectionAction = (action: string, inspectionId: string) => {
    console.log(`Action: ${action} on inspection: ${inspectionId}`)
    // Handle inspection actions
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">My Projects</CardDescription>
            <CardTitle className="text-2xl">{stats.myProjects}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Pending Approvals</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{stats.pendingApprovals}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.overdueInspections}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Team Members</CardDescription>
            <CardTitle className="text-2xl">{stats.teamMembers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common project management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className="h-16 flex flex-col space-y-1">
              <span className="text-sm font-medium">Create</span>
              <span className="text-xs">Inspection</span>
            </Button>
            <Button size="lg" variant="outline" className="h-16 flex flex-col space-y-1">
              <span className="text-sm font-medium">Assign</span>
              <span className="text-xs">Inspector</span>
            </Button>
            <Button size="lg" variant="outline" className="h-16 flex flex-col space-y-1">
              <span className="text-sm font-medium">Generate</span>
              <span className="text-xs">Report</span>
            </Button>
            <Button size="lg" variant="outline" className="h-16 flex flex-col space-y-1">
              <span className="text-sm font-medium">View</span>
              <span className="text-xs">Projects</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Projects</CardTitle>
          <CardDescription>Projects you're managing</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectList 
            projects={displayProjects} 
            loading={projectsLoading}
            userProjects={projects.map(p => p.id)}
          />
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Approvals</CardTitle>
          <CardDescription>Inspections requiring your review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingInspections.map((inspection) => (
              <InspectionCard 
                key={inspection.id} 
                inspection={inspection}
                onAction={handleInspectionAction}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
