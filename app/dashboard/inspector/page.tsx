'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { InspectionCard } from '@/components/inspections/inspection-card'
import { EvidenceUpload } from '@/components/evidence/evidence-upload'
import { useMemo } from 'react'

export default function InspectorDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  
  // Real-time inspections assigned to this inspector
  const { 
    inspections, 
    loading: inspectionsLoading 
  } = useRealtimeInspections({
    userRole: profile?.role,
    userId: profile?.id,
    autoRefresh: true
  })

  // Calculate real-time inspector stats
  const stats = useMemo(() => {
    if (inspectionsLoading) {
      return {
        assignedToday: 0,
        completed: 0,
        pending: 0,
        drafts: 0
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const assignedToday = inspections.filter(i => {
      const dueDate = i.due_date ? new Date(i.due_date) : null
      return dueDate && dueDate >= today && dueDate < tomorrow
    }).length

    const completed = inspections.filter(i => i.status === 'APPROVED').length
    const pending = inspections.filter(i => ['PENDING', 'IN_REVIEW'].includes(i.status)).length
    const drafts = inspections.filter(i => i.status === 'DRAFT').length

    return {
      assignedToday,
      completed,
      pending,
      drafts
    }
  }, [inspections, inspectionsLoading])

  // Today's inspections
  const todayInspections = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return inspections
      .filter(inspection => {
        const dueDate = inspection.due_date ? new Date(inspection.due_date) : null
        return dueDate && dueDate >= today && dueDate < tomorrow
      })
      .sort((a, b) => {
        // Sort by priority then due time
        if (a.priority !== b.priority) {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
          return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
        }
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        return 0
      })
  }, [inspections])

  // Recent inspections for quick access
  const recentInspections = useMemo(() => {
    return inspections
      .filter(i => i.status === 'DRAFT' || i.status === 'PENDING')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
  }, [inspections])

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'No time set'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50'
      case 'REJECTED': return 'text-red-600 bg-red-50'
      case 'IN_REVIEW': return 'text-blue-600 bg-blue-50'
      case 'PENDING': return 'text-yellow-600 bg-yellow-50'
      case 'DRAFT': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Inspector Stats - Mobile-first grid with real-time data */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Due Today</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {inspectionsLoading ? '...' : stats.assignedToday}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {inspectionsLoading ? '...' : stats.completed}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {inspectionsLoading ? '...' : stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Drafts</CardDescription>
            <CardTitle className="text-2xl text-gray-600">
              {inspectionsLoading ? '...' : stats.drafts}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Today's Schedule
            {stats.assignedToday > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
                {stats.assignedToday} due today
              </span>
            )}
          </CardTitle>
          <CardDescription>Inspections scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : todayInspections.length > 0 ? (
            <div className="space-y-3">
              {todayInspections.map((inspection) => (
                <div key={inspection.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{inspection.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {formatTime(inspection.due_date)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {inspection.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                        {inspection.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                        {inspection.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" className="text-xs">
                      {inspection.status === 'DRAFT' ? 'Continue' : 'Review'}
                    </Button>
                    {inspection.status === 'DRAFT' && (
                      <Button size="sm" variant="outline" className="text-xs">
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No inspections due today</p>
              <Button variant="outline" size="sm">
                View All Inspections
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Work */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Work</CardTitle>
          <CardDescription>Your recent inspection activity</CardDescription>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentInspections.length > 0 ? (
            <div className="space-y-3">
              {recentInspections.map((inspection) => (
                <div key={inspection.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{inspection.title}</h4>
                      <p className="text-xs text-gray-500">
                        Updated {new Date(inspection.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                      {inspection.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent work</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common field tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start h-auto py-3">
              <div className="text-left">
                <div className="font-medium text-sm">New Inspection</div>
                <div className="text-xs text-gray-500">Start field work</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3">
              <div className="text-left">
                <div className="font-medium text-sm">Upload Evidence</div>
                <div className="text-xs text-gray-500">Photos & documents</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3">
              <div className="text-left">
                <div className="font-medium text-sm">Sync Offline</div>
                <div className="text-xs text-gray-500">Update local data</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3">
              <div className="text-left">
                <div className="font-medium text-sm">View Map</div>
                <div className="text-xs text-gray-500">Site locations</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Upload Component */}
      <EvidenceUpload inspectionId={todayInspections[0]?.id} />
    </div>
  )
}
