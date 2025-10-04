'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { InspectionCard } from '@/components/inspections/inspection-card'
import { EvidenceUpload } from '@/components/evidence/evidence-upload'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Upload, Map, RefreshCw, Plus } from 'lucide-react'

export default function InspectorDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  const router = useRouter()
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false)
  
  // Real-time inspections assigned to this inspector
  const { 
    inspections, 
    loading: inspectionsLoading,
    error: inspectionsError,
    refresh
  } = useRealtimeInspections({
    userRole: profile?.role as 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR' | undefined,
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
    const pending = inspections.filter(i => i.status && ['PENDING', 'IN_REVIEW'].includes(i.status)).length
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
      .sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return bTime - aTime
      })
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

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50'
      case 'REJECTED': return 'text-red-600 bg-red-50'
      case 'IN_REVIEW': return 'text-blue-600 bg-blue-50'
      case 'PENDING': return 'text-yellow-600 bg-yellow-50'
      case 'DRAFT': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Navigation handlers
  const handleInspectionAction = (inspectionId: string, status?: string | null) => {
    // Route based on inspection status
    if (status === 'DRAFT' || status === 'PENDING' || status === 'REJECTED') {
      // Inspector can start/continue/revise these
      router.push(`/inspections/${inspectionId}/execute`)
    } else {
      // For other statuses, go to detail page
      router.push(`/inspections/${inspectionId}`)
    }
  }

  const handleViewInspection = (inspectionId: string) => {
    router.push(`/inspections/${inspectionId}`)
  }

  const handleNewInspection = () => {
    router.push('/inspections/create')
  }

  const handleViewMap = () => {
    router.push('/dashboard/inspector/map')
  }

  const handleSyncOffline = async () => {
    if (refresh) {
      await refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {inspectionsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Failed to load inspections</p>
                <p className="text-xs text-red-600">{inspectionsError}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => refresh()}
                className="text-red-600 border-red-600 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
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

      {/* Assigned Inspections - Ready to Start */}
      {stats.drafts > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Assigned Inspections
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                {stats.drafts} ready to start
              </span>
            </CardTitle>
            <CardDescription className="text-blue-900">
              New inspections assigned to you - click to start
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inspections
                .filter(i => i.status === 'DRAFT')
                .slice(0, 5)
                .map((inspection) => (
                  <div 
                    key={inspection.id} 
                    className="p-4 bg-white border border-blue-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleInspectionAction(inspection.id, 'DRAFT')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{inspection.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {inspection.description || 'No description provided'}
                        </p>
                        {inspection.due_date && (
                          <p className="text-xs text-gray-500 mt-2">
                            Due: {new Date(inspection.due_date).toLocaleDateString()} at {formatTime(inspection.due_date)}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                        {inspection.priority || 'MEDIUM'}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleInspectionAction(inspection.id, 'DRAFT')
                      }}
                    >
                      Start Inspection
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <div 
                  key={inspection.id} 
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewInspection(inspection.id)}
                >
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
                        {inspection.priority || 'N/A'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                        {inspection.status ? inspection.status.replace('_', ' ') : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      className="text-xs flex-1"
                      onClick={() => handleInspectionAction(inspection.id, inspection.status)}
                    >
                      {inspection.status === 'DRAFT' ? 'Start Inspection' : 
                       inspection.status === 'PENDING' ? 'Continue' :
                       inspection.status === 'REJECTED' ? 'Revise' : 'View Details'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => handleViewInspection(inspection.id)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No inspections due today</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/inspections')}
              >
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
                <div 
                  key={inspection.id} 
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleViewInspection(inspection.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{inspection.title}</h4>
                      <p className="text-xs text-gray-500">
                        Updated {inspection.updated_at ? new Date(inspection.updated_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                        {inspection.status ? inspection.status.replace('_', ' ') : 'N/A'}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInspectionAction(inspection.id, inspection.status)
                        }}
                      >
                        {inspection.status === 'DRAFT' ? 'Start' : 'Continue'}
                      </Button>
                    </div>
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
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={handleNewInspection}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  New Inspection
                </div>
                <div className="text-xs text-gray-500">Start field work</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setShowEvidenceUpload(!showEvidenceUpload)}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  Upload Evidence
                </div>
                <div className="text-xs text-gray-500">Photos & documents</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={handleSyncOffline}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Sync Offline
                </div>
                <div className="text-xs text-gray-500">Update local data</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={handleViewMap}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-1">
                  <Map className="h-4 w-4" />
                  View Map
                </div>
                <div className="text-xs text-gray-500">Site locations</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Upload Component - Conditionally rendered */}
      {showEvidenceUpload && todayInspections.length > 0 && (
        <EvidenceUpload 
          inspectionId={todayInspections[0].id}
          onUploadComplete={() => {
            setShowEvidenceUpload(false)
          }}
        />
      )}
      
      {showEvidenceUpload && todayInspections.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              No inspections available. Please create or select an inspection first.
            </p>
            <Button 
              size="sm" 
              className="mt-2"
              onClick={handleNewInspection}
            >
              Create Inspection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
