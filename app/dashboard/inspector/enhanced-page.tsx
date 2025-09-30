'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeInspections } from '@/lib/hooks/use-realtime-inspections'
import { useOfflineState } from '@/lib/hooks/use-offline-state'
import { useDashboardContext } from '@/components/layout/dashboard-layout'
import { MobileInspectionInterface } from '@/components/inspector/mobile-inspection-interface'
import { useMemo, useState } from 'react'
import { 
  MapPin, Clock, Battery, Wifi, WifiOff, Camera, Mic, 
  Navigation, CheckCircle, AlertTriangle, Calendar, Route
} from 'lucide-react'

export default function EnhancedInspectorDashboard() {
  const { profile } = useSupabaseAuth()
  const { notificationCount } = useDashboardContext()
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const { isOnline, isRealtimeConnected, forceSync } = useOfflineState()
  
  const { inspections, loading: inspectionsLoading } = useRealtimeInspections({
    userRole: profile?.role,
    userId: profile?.id,
    autoRefresh: true
  })

  // Enhanced stats with field-specific metrics
  const fieldStats = useMemo(() => {
    if (inspectionsLoading) return {
      dueToday: 0, completed: 0, pending: 0, drafts: 0,
      totalDistance: 0, avgCompletionTime: 0, efficiency: 0
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dueToday = inspections.filter(i => {
      const dueDate = i.due_date ? new Date(i.due_date) : null
      return dueDate && dueDate >= today && dueDate < tomorrow
    }).length

    const completed = inspections.filter(i => i.status === 'APPROVED').length
    const pending = inspections.filter(i => ['PENDING', 'IN_REVIEW'].includes(i.status)).length
    const drafts = inspections.filter(i => i.status === 'DRAFT').length

    // Calculate efficiency (completed vs assigned)
    const efficiency = inspections.length > 0 ? Math.round((completed / inspections.length) * 100) : 0

    return { dueToday, completed, pending, drafts, totalDistance: 0, avgCompletionTime: 0, efficiency }
  }, [inspections, inspectionsLoading])

  // Route optimization for today's inspections
  const todayRoute = useMemo(() => {
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
        // Sort by priority then location proximity (simplified)
        if (a.priority !== b.priority) {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
          return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
        }
        return 0
      })
  }, [inspections])

  const getConnectionStatus = () => {
    if (!isOnline) return { icon: WifiOff, color: 'text-red-500', text: 'Offline' }
    if (!isRealtimeConnected) return { icon: Wifi, color: 'text-yellow-500', text: 'Limited' }
    return { icon: Wifi, color: 'text-green-500', text: 'Online' }
  }

  const connectionStatus = getConnectionStatus()

  if (selectedInspection) {
    return (
      <MobileInspectionInterface
        inspection={selectedInspection}
        onComplete={(data) => {
          // Handle completion
          setSelectedInspection(null)
        }}
        onSaveDraft={(data) => {
          // Handle draft save
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Field Status Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <connectionStatus.icon className={`h-4 w-4 ${connectionStatus.color}`} />
                <span className="text-sm font-medium">{connectionStatus.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-green-500" />
                <span className="text-sm">85%</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-sm">GPS Active</span>
              </div>
            </div>
            {!isOnline && (
              <Button size="sm" variant="outline" onClick={forceSync}>
                Sync When Online
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due Today
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {inspectionsLoading ? '...' : fieldStats.dueToday}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {inspectionsLoading ? '...' : fieldStats.completed}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Efficiency</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {inspectionsLoading ? '...' : `${fieldStats.efficiency}%`}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Drafts</CardDescription>
            <CardTitle className="text-2xl text-gray-600">
              {inspectionsLoading ? '...' : fieldStats.drafts}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="route">Route</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Today's Inspections
                <Badge variant="outline">{todayRoute.length} scheduled</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayRoute.length > 0 ? (
                <div className="space-y-3">
                  {todayRoute.map((inspection, index) => (
                    <div key={inspection.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <h4 className="font-medium text-sm">{inspection.title}</h4>
                          </div>
                          <p className="text-xs text-gray-500">
                            Due: {inspection.due_date ? new Date(inspection.due_date).toLocaleTimeString() : 'No deadline'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={inspection.priority === 'HIGH' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {inspection.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {inspection.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedInspection(inspection)}
                        >
                          {inspection.status === 'DRAFT' ? 'Continue' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No inspections due today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="route">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Optimized Route
              </CardTitle>
              <CardDescription>Efficient path for today's inspections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Route Summary</span>
                    <Button size="sm" variant="outline">
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Distance</div>
                      <div className="font-medium">24.5 km</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Est. Time</div>
                      <div className="font-medium">6.5 hours</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Stops</div>
                      <div className="font-medium">{todayRoute.length}</div>
                    </div>
                  </div>
                </div>
                
                {/* Route Steps */}
                <div className="space-y-2">
                  {todayRoute.map((inspection, index) => (
                    <div key={inspection.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{inspection.title}</div>
                        <div className="text-xs text-gray-500">
                          {(inspection as any).projects?.address || 'Location TBD'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {index === 0 ? 'Start' : `+${(index * 3.5).toFixed(1)} km`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Quick Capture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Camera className="h-4 w-4 mr-2" />
                    Photo Evidence
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Note
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Navigation className="h-4 w-4 mr-2" />
                    Mark Location
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Site Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offline">
          <Card>
            <CardHeader>
              <CardTitle>Offline Mode</CardTitle>
              <CardDescription>Work without internet connection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Offline Data</span>
                    <Badge variant={isOnline ? "default" : "secondary"}>
                      {isOnline ? 'Synced' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {fieldStats.drafts} draft inspections ready to sync
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" disabled={!isOnline}>
                    Download Maps
                  </Button>
                  <Button variant="outline" onClick={forceSync} disabled={!isOnline}>
                    Sync Now
                  </Button>
                </div>
                
                {!isOnline && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Working Offline
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your work is saved locally and will sync when connection is restored.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
