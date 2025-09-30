'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFieldEvidence } from '@/lib/hooks/use-field-evidence'
import { FieldToolsService } from '@/lib/services/field-tools'
import { 
  Camera, Mic, MapPin, FileText, Zap, 
  Square, Circle, Wifi, WifiOff, Battery 
} from 'lucide-react'

interface QuickActionsProps {
  inspectionId: string
  onActionComplete?: (action: string, result: any) => void
}

export function QuickActions({ inspectionId, onActionComplete }: QuickActionsProps) {
  const [deviceStatus, setDeviceStatus] = useState({
    battery: 85,
    network: 'good' as 'offline' | 'poor' | 'good' | 'excellent',
    location: true
  })

  const {
    capturePhoto,
    startVoiceRecording,
    stopVoiceRecording,
    isCapturing,
    isRecording,
    canCapture,
    canRecord,
    hasLocation,
    stats
  } = useFieldEvidence({
    inspectionId,
    onCapture: (file) => {
      onActionComplete?.('capture', file)
    }
  })

  const quickActions = [
    {
      id: 'photo',
      label: 'Photo',
      icon: Camera,
      action: capturePhoto,
      disabled: !canCapture || isCapturing,
      loading: isCapturing,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'voice',
      label: isRecording ? 'Stop' : 'Voice',
      icon: isRecording ? Square : Mic,
      action: isRecording ? stopVoiceRecording : startVoiceRecording,
      disabled: !canRecord,
      loading: false,
      color: isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'location',
      label: 'Location',
      icon: MapPin,
      action: async () => {
        const location = await FieldToolsService.getCurrentLocation()
        onActionComplete?.('location', location)
      },
      disabled: !hasLocation,
      loading: false,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'quick_note',
      label: 'Note',
      icon: FileText,
      action: () => {
        // Open quick note modal
        onActionComplete?.('note', null)
      },
      disabled: false,
      loading: false,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  const getNetworkIcon = () => {
    switch (deviceStatus.network) {
      case 'offline': return WifiOff
      case 'poor': return Wifi
      case 'good': return Wifi
      case 'excellent': return Wifi
      default: return Wifi
    }
  }

  const getNetworkColor = () => {
    switch (deviceStatus.network) {
      case 'offline': return 'text-red-500'
      case 'poor': return 'text-yellow-500'
      case 'good': return 'text-green-500'
      case 'excellent': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          
          {/* Device Status */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Battery className={`h-4 w-4 ${deviceStatus.battery > 20 ? 'text-green-500' : 'text-red-500'}`} />
              <span>{deviceStatus.battery}%</span>
            </div>
            <div className="flex items-center gap-1">
              {(() => {
                const NetworkIcon = getNetworkIcon()
                return <NetworkIcon className={`h-4 w-4 ${getNetworkColor()}`} />
              })()}
              <span className="capitalize">{deviceStatus.network}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.id}
                  onClick={action.action}
                  disabled={action.disabled || action.loading}
                  className={`h-20 flex-col gap-2 text-white ${action.color}`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">
                    {action.loading ? 'Working...' : action.label}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* Evidence Stats */}
          {stats.total > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Evidence Captured</span>
                <Badge variant="outline">{stats.total} items</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-gray-600">{stats.pending}</div>
                  <div className="text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{stats.uploading}</div>
                  <div className="text-gray-500">Uploading</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{stats.completed}</div>
                  <div className="text-gray-500">Complete</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{stats.failed}</div>
                  <div className="text-gray-500">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Circle className="h-3 w-3 mr-1" />
              Pass
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Square className="h-3 w-3 mr-1" />
              Fail
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              N/A
            </Button>
          </div>

          {/* Emergency Actions */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs bg-red-500 text-white">
                Emergency Stop
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Call Supervisor
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
