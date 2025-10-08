'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, User, Calendar, MapPin, CheckCircle, XCircle, Image as ImageIcon, Clock, AlertTriangle } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'

// API returns snake_case from database
interface InspectionResponse {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  updated_at: string
  project_id: string
  assigned_to: string
  checklist_id: string
  responses: any
  profiles?: {
    id: string
    name: string
    email: string
  }
  projects?: {
    id: string
    name: string
  }
  checklists?: {
    id: string
    name: string
    version: string
    questions: any[]
  }
  evidence?: Array<{
    id: string
    filename: string
    url: string
    thumbnail_url?: string | null
    verified: boolean
    latitude?: number | null
    longitude?: number | null
    timestamp: string
  }>
}

export default function InspectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [inspection, setInspection] = useState<InspectionResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const inspectionId = params.id as string

  useEffect(() => {
    if (inspectionId && profile) {
      fetchInspection()
    }
  }, [inspectionId, profile])

  const fetchInspection = async () => {
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Inspection data:', data) // Debug log
        setInspection(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', response.status, errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to load inspection details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching inspection:', error)
      toast({
        title: "Error",
        description: "Failed to load inspection details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase().replace('_', '-')
    switch (statusLower) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in-review': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Inspection not found</p>
              <Button onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{inspection.title}</h1>
            <p className="text-gray-600">
              {inspection.projects?.name || 'Inspection Details'}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(inspection.status)}>
              {inspection.status.replace('_', ' ')}
            </Badge>
            <Badge className={getPriorityColor(inspection.priority)}>
              {inspection.priority}
            </Badge>
          </div>
        </div>

        {/* Inspection Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{inspection.title}</CardTitle>
            <CardDescription>
              {inspection.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-gray-600">{inspection.status.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p className="text-sm text-gray-600">{inspection.priority}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Assigned To</p>
                    <p className="text-sm text-gray-600">
                      {inspection.profiles?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {inspection.due_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-gray-600">
                        {new Date(inspection.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(inspection.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Checklist</p>
                    <p className="text-sm text-gray-600">
                      {inspection.checklists?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Section */}
        {inspection.evidence && inspection.evidence.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Evidence ({inspection.evidence.length})
              </CardTitle>
              <CardDescription>Uploaded evidence files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inspection.evidence.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={item.url} 
                        alt={item.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {item.verified && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-1 truncate">{item.filename}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Available actions for this inspection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Inspector Actions */}
              {profile?.id === inspection.assigned_to && (
                <div className="space-y-3">
                  {inspection.status === 'DRAFT' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">Ready to Start</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            This inspection has been assigned to you. Click below to begin the inspection and fill out the checklist.
                          </p>
                          <Button 
                            onClick={() => router.push(`/inspections/${inspection.id}/execute`)}
                            className="mt-3"
                          >
                            Start Inspection
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {inspection.status === 'PENDING' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">Submitted for Review</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Your inspection has been submitted and is waiting for manager review.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {inspection.status === 'IN_REVIEW' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-purple-900">Under Review</h4>
                          <p className="text-sm text-purple-700 mt-1">
                            Your inspection has been submitted and is awaiting manager approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {inspection.status === 'REJECTED' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-900">Requires Revision</h4>
                          <p className="text-sm text-red-700 mt-1">
                            This inspection was rejected and needs to be revised. Please review the feedback and resubmit.
                          </p>
                          <Button 
                            onClick={() => router.push(`/inspections/${inspection.id}/execute`)}
                            className="mt-3"
                            variant="outline"
                          >
                            Revise Inspection
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {inspection.status === 'APPROVED' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-green-900">Approved</h4>
                          <p className="text-sm text-green-700 mt-1">
                            This inspection has been approved by the project manager.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manager Actions */}
              {(profile?.role === 'PROJECT_MANAGER' || profile?.role === 'EXECUTIVE') && profile?.id !== inspection.assigned_to && (
                <div className="space-y-3">
                  {inspection.status === 'DRAFT' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Awaiting Inspector</h4>
                          <p className="text-sm text-gray-700 mt-1">
                            This inspection is assigned to {inspection.profiles?.name}. They will start it when ready.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}


                  {inspection.status === 'PENDING' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">Ready for Review</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            The inspector has completed this inspection. Review and approve or request changes.
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              onClick={() => router.push(`/inspections/${inspection.id}/review`)}
                              size="lg"
                            >
                              Review Inspection
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {inspection.status === 'IN_REVIEW' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-purple-900">Under Review</h4>
                          <p className="text-sm text-purple-700 mt-1">
                            You are currently reviewing this inspection.
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              onClick={() => router.push(`/inspections/${inspection.id}/review`)}
                              size="lg"
                            >
                              Continue Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {inspection.status === 'APPROVED' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-green-900">Approved</h4>
                          <p className="text-sm text-green-700 mt-1">
                            This inspection has been approved and is complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {inspection.status === 'REJECTED' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-900">Rejected</h4>
                          <p className="text-sm text-red-700 mt-1">
                            This inspection was rejected and has been returned to {inspection.profiles?.name} for revision.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Common Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  onClick={() => router.push(`/projects/${inspection.project_id}`)}
                  variant="outline"
                >
                  View Project
                </Button>
                {inspection.projects && (
                  <Button 
                    onClick={() => router.push(`/projects/${inspection.project_id}/inspections`)}
                    variant="outline"
                  >
                    All Inspections
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}