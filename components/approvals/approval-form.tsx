'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRealtimeNotifications } from '@/lib/hooks/use-realtime-notifications'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { supabaseDatabase } from '@/lib/supabase/database'
import { Clock, AlertTriangle, Bell } from 'lucide-react'

interface EscalationStatus {
  id: string
  status: 'QUEUED' | 'NOTIFIED' | 'RESOLVED' | 'EXPIRED'
  priority_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  escalation_threshold_hours: number
  notification_count: number
  created_at: string
  expires_at: string | null
}

interface ApprovalFormData {
  decision: 'approved' | 'rejected'
  notes: string
  escalationReason?: string
}

interface ApprovalFormProps {
  inspectionId: string
  inspectionTitle: string
  onSubmit: (data: ApprovalFormData) => void
  onCancel?: () => void
  isLoading?: boolean
  rejectionCount?: number
}

export function ApprovalForm({ 
  inspectionId,
  inspectionTitle,
  onSubmit, 
  onCancel, 
  isLoading = false,
  rejectionCount = 0
}: ApprovalFormProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [escalationStatus, setEscalationStatus] = useState<EscalationStatus | null>(null)
  const [escalationTimer, setEscalationTimer] = useState<string>('')
  const { user } = useSupabaseAuth()
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ApprovalFormData>()

  // Real-time notifications for escalation updates
  const { notifications } = useRealtimeNotifications({
    userId: user?.id,
    maxNotifications: 50
  })

  const watchedDecision = watch('decision')
  const showEscalationWarning = rejectionCount >= 1 && watchedDecision === 'rejected'
  
  // Filter escalation notifications for this inspection
  const escalationNotifications = notifications.filter(n => 
    n.type === 'ESCALATION' && 
    n.related_entity_id === inspectionId &&
    !n.is_read
  )

  // Fetch current escalation status
  const fetchEscalationStatus = useCallback(async () => {
    try {
      const result = await supabaseDatabase.getActiveEscalation(inspectionId)
      
      if (!result.error && result.data) {
        setEscalationStatus(result.data as unknown as EscalationStatus)
      }
    } catch (err) {
      // No active escalation found
      setEscalationStatus(null)
    }
  }, [inspectionId])

  // Calculate time remaining for escalation
  const updateEscalationTimer = useCallback(() => {
    if (!escalationStatus?.expires_at) {
      setEscalationTimer('')
      return
    }

    const now = new Date()
    const expiresAt = new Date(escalationStatus.expires_at)
    const diff = expiresAt.getTime() - now.getTime()

    if (diff <= 0) {
      setEscalationTimer('Expired')
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      setEscalationTimer(`${hours}h ${minutes}m remaining`)
    } else {
      setEscalationTimer(`${minutes}m remaining`)
    }
  }, [escalationStatus])

  // Set up real-time escalation monitoring
  useEffect(() => {
    if (!inspectionId) return

    fetchEscalationStatus()

    // Subscribe to escalation queue changes using database service
    const channel = supabaseDatabase.subscribeToInspectionEscalation(inspectionId, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        setEscalationStatus(payload.new as unknown as EscalationStatus)
      } else if (payload.eventType === 'DELETE') {
        setEscalationStatus(null)
      }
    })

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [inspectionId, fetchEscalationStatus])

  // Update escalation timer every minute
  useEffect(() => {
    if (!escalationStatus) return

    updateEscalationTimer()
    const interval = setInterval(updateEscalationTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [escalationStatus, updateEscalationTimer])

  const onFormSubmit = (data: ApprovalFormData) => {
    onSubmit(data)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Inspection</CardTitle>
        <CardDescription>
          {inspectionTitle}
        </CardDescription>
        
        {/* Real-time Escalation Status */}
        {escalationStatus && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <h4 className="font-medium text-orange-800">Active Escalation</h4>
              <Badge className={getPriorityColor(escalationStatus.priority_level)}>
                {escalationStatus.priority_level}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-orange-700">
                <Clock className="h-3 w-3" />
                <span>{escalationTimer}</span>
              </div>
              
              <p className="text-orange-600">
                Status: <span className="font-medium">{escalationStatus.status}</span>
                {escalationStatus.notification_count > 0 && (
                  <span className="ml-2">
                    • {escalationStatus.notification_count} notification{escalationStatus.notification_count > 1 ? 's' : ''} sent
                  </span>
                )}
              </p>
              
              {escalationStatus.status === 'QUEUED' && (
                <p className="text-orange-600">
                  ⏳ This inspection is queued for escalation. Managers will be notified if not resolved soon.
                </p>
              )}
              
              {escalationStatus.status === 'NOTIFIED' && (
                <p className="text-orange-600">
                  📢 Project managers have been notified of this escalation.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Real-time Escalation Notifications */}
        {escalationNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-800">
                Recent Escalation Updates ({escalationNotifications.length})
              </h4>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {escalationNotifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">{notification.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-blue-600 mt-1">{notification.message}</p>
                  <p className="text-blue-500 text-xs mt-1">
                    {notification.created_at ? new Date(notification.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              ))}
              
              {escalationNotifications.length > 3 && (
                <p className="text-blue-600 text-xs text-center pt-2">
                  + {escalationNotifications.length - 3} more escalation updates
                </p>
              )}
            </div>
          </div>
        )}

        {rejectionCount > 0 && !escalationStatus && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ This inspection has been rejected {rejectionCount} time{rejectionCount > 1 ? 's' : ''} previously.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Decision Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Decision *
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 min-h-[44px]">
                <input
                  type="radio"
                  value="approved"
                  {...register('decision', { required: 'Please make a decision' })}
                  className="w-4 h-4 text-green-600"
                />
                <div className="flex-1">
                  <span className="font-medium text-green-700">Approve</span>
                  <p className="text-sm text-gray-600">Inspection meets all requirements</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-md hover:bg-gray-50 min-h-[44px]">
                <input
                  type="radio"
                  value="rejected"
                  {...register('decision', { required: 'Please make a decision' })}
                  className="w-4 h-4 text-red-600"
                />
                <div className="flex-1">
                  <span className="font-medium text-red-700">Reject</span>
                  <p className="text-sm text-gray-600">Inspection requires corrections</p>
                </div>
              </label>
            </div>
            {errors.decision && (
              <p className="text-red-600 text-sm mt-1">{errors.decision.message}</p>
            )}
          </div>

          {/* Enhanced Escalation Warning with Real-time Context */}
          {showEscalationWarning && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                ⚠️ Escalation Warning
              </h4>
              
              <div className="space-y-3">
                <p className="text-sm text-red-700">
                  Rejecting this inspection again will trigger automatic escalation to project managers 
                  for manual reassignment (FR-020).
                </p>
                
                {escalationStatus ? (
                  <div className="bg-red-100 border border-red-300 rounded p-3">
                    <p className="text-sm text-red-800 font-medium mb-1">
                      🚨 Escalation Already Active
                    </p>
                    <p className="text-xs text-red-700">
                      This inspection is already in the escalation queue. Additional rejections will 
                      increase priority and accelerate manager notification.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-red-300 rounded p-3">
                    <p className="text-sm text-red-800 font-medium mb-1">
                      📋 Escalation Process
                    </p>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• Inspection will be moved to escalation queue</li>
                      <li>• Project managers will be notified within 1 hour</li>
                      <li>• New inspector may be assigned</li>
                      <li>• You'll receive real-time updates on resolution</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <label htmlFor="escalationReason" className="block text-sm font-medium text-red-700 mb-1">
                  Escalation Reason *
                </label>
                <select
                  id="escalationReason"
                  {...register('escalationReason', { 
                    required: watchedDecision === 'rejected' && rejectionCount >= 1 ? 'Escalation reason is required' : false 
                  })}
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px] touch-manipulation"
                >
                  <option value="">Select reason for escalation</option>
                  <option value="insufficient_evidence">Insufficient Evidence</option>
                  <option value="safety_concerns">Safety Concerns</option>
                  <option value="compliance_issues">Compliance Issues</option>
                  <option value="quality_standards">Quality Standards Not Met</option>
                  <option value="incomplete_inspection">Incomplete Inspection</option>
                  <option value="technical_issues">Technical Issues</option>
                  <option value="inspector_competency">Inspector Competency Concerns</option>
                  <option value="other">Other</option>
                </select>
                {errors.escalationReason && (
                  <p className="text-red-600 text-sm mt-1">{errors.escalationReason.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Review Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Review Notes *
            </label>
            <textarea
              id="notes"
              {...register('notes', { required: 'Review notes are required' })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              placeholder={watchedDecision === 'approved' 
                ? "Explain why this inspection is approved..." 
                : "Explain what needs to be corrected..."
              }
            />
            {errors.notes && (
              <p className="text-red-600 text-sm mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              size="lg"
              variant={watchedDecision === 'approved' ? 'default' : watchedDecision === 'rejected' ? 'outline' : 'default'}
            >
              {isLoading ? 'Submitting...' : `Submit ${watchedDecision || 'Decision'}`}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                size="lg"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
