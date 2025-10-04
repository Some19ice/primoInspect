'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { EvidenceUpload } from '@/components/evidence/evidence-upload'
import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Upload, Map, RefreshCw, Plus, ChevronDown, Battery, MapPin, Wifi } from 'lucide-react'

export default function EnhancedMobileInspectorDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  const router = useRouter()
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [gpsStatus, setGpsStatus] = useState<{ lat: number; lng: number } | null>(null)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Real-time inspections assigned to this inspector
  const { 
    inspections, 
    loading: inspectionsLoading,
    error: inspectionsError,
    refresh
  } = useRealtimeInspections({
    userRole: profile?.role as 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR',
    userId: profile?.id,
    autoRefresh: true
  })

  // Get GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsStatus({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => console.log('GPS error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    }
  }, [])

  // Get battery status
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      })
    }
  }, [])

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

  // Pull-to-refresh for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0 && !isPullRefreshing) {
      const currentY = e.touches[0].clientY
      const distance = currentY - touchStartY.current
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100))
        if (distance > 20) {
          e.preventDefault()
        }
      }
    }
  }, [isPullRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !isPullRefreshing) {
      setIsPullRefreshing(true)
      setPullDistance(0)
      try {
        await refresh()
      } finally {
        setIsPullRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, isPullRefreshing, refresh])

  return (
    <div 
      ref={containerRef}
      className="space-y-6 relative min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isPullRefreshing) && (
        <div 
          className="fixed top-16 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50"
          style={{ 
            transform: `translateY(${isPullRefreshing ? '0px' : `${pullDistance - 60}px`})`,
            opacity: pullDistance > 30 || isPullRefreshing ? 1 : pullDistance / 30 
          }}
        >
          <div className="bg-white rounded-full p-3 shadow-lg">
            {isPullRefreshing ? (
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            ) : (
              <ChevronDown 
                className="h-6 w-6 text-blue-600 transition-transform" 
                style={{ transform: pullDistance > 60 ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Field Status Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Battery className={`h-4 w-4 ${batteryLevel && batteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm">{batteryLevel ? `${batteryLevel}%` : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className={`h-4 w-4 ${gpsStatus ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="text-sm">{gpsStatus ? 'GPS Active' : 'GPS Off'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                className="text-red-600 border-red-600 hover:bg-red-100 min-h-[36px]"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspector Stats - Mobile-first grid with real-time data */}
      <div className="grid grid-cols-2 gap-4 touch-manipulation">
        <Card className="active:scale-95 transition-transform">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Due Today</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {inspectionsLoading ? '...' : stats.assignedToday}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="active:scale-95 transition-transform">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {inspectionsLoading ? '...' : stats.completed}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="active:scale-95 transition-transform">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {inspectionsLoading ? '...' : stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="active:scale-95 transition-transform">
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
                <div 
                  key={inspection.id} 
                  className="p-4 border rounded-lg hover:shadow-md transition-all active:scale-98 cursor-pointer touch-manipulation"
                  onClick={() => handleInspectionAction(inspection.id, inspection.status)}
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
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      size="sm" 
                      className="text-xs min-h-[40px] touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleInspectionAction(inspection.id, inspection.status)
                      }}
                    >
                      {inspection.status === 'DRAFT' ? 'Continue' : 'Review'}
                    </Button>
                    {inspection.status === 'DRAFT' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs min-h-[40px] touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInspectionAction(inspection.id, inspection.status)
                        }}
                      >
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
              <Button 
                variant="outline" 
                size="sm"
                className="min-h-[40px] touch-manipulation"
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
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer active:scale-98 touch-manipulation"
                  onClick={() => handleInspectionAction(inspection.id, inspection.status)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{inspection.title}</h4>
                      <p className="text-xs text-gray-500">
                        Updated {inspection.updated_at ? new Date(inspection.updated_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                      {inspection.status ? inspection.status.replace('_', ' ') : 'N/A'}
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
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 min-h-[72px] touch-manipulation active:scale-95 transition-transform"
              onClick={handleNewInspection}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Inspection
                </div>
                <div className="text-xs text-gray-500 mt-1">Start field work</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 min-h-[72px] touch-manipulation active:scale-95 transition-transform"
              onClick={() => setShowEvidenceUpload(!showEvidenceUpload)}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Evidence
                </div>
                <div className="text-xs text-gray-500 mt-1">Photos & documents</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 min-h-[72px] touch-manipulation active:scale-95 transition-transform"
              onClick={handleSyncOffline}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sync Offline
                </div>
                <div className="text-xs text-gray-500 mt-1">Update local data</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 min-h-[72px] touch-manipulation active:scale-95 transition-transform"
              onClick={handleViewMap}
            >
              <div className="text-left">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  View Map
                </div>
                <div className="text-xs text-gray-500 mt-1">Site locations</div>
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
              className="mt-2 min-h-[40px] touch-manipulation"
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
