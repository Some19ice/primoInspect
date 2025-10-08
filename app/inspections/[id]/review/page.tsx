'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApprovalForm } from '@/components/approvals/approval-form'
import { ArrowLeft, FileText, User, Calendar, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, MapPin } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'

interface InspectionResponse {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  project_id: string
  assigned_to: string
  checklist_id: string
  responses: Record<string, any>
  rejection_count?: number
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

export default function InspectionReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [inspection, setInspection] = useState<InspectionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
        setInspection(data)
        
        // Verify the inspection is in reviewable state (PENDING or IN_REVIEW)
        if (data.status !== 'PENDING' && data.status !== 'IN_REVIEW') {
          toast({
            title: "Notice",
            description: "This inspection is not ready for review",
            variant: "default",
          })
        }
        
        // If status is PENDING, automatically change it to IN_REVIEW when manager opens it
        if (data.status === 'PENDING') {
          try {
            await fetch(`/api/inspections/${inspectionId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'IN_REVIEW' }),
            })
            // Update local state
            setInspection({ ...data, status: 'IN_REVIEW' })
          } catch (err) {
            console.error('Failed to update status to IN_REVIEW:', err)
            // Not critical, continue anyway
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.error || "Failed to load inspection",
          variant: "destructive",
        })
        router.back()
      }
    } catch (error) {
      console.error('Error fetching inspection:', error)
      toast({
        title: "Error",
        description: "Failed to load inspection details",
        variant: "destructive",
      })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (data: any) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/inspections/${inspectionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: data.decision === 'approved',
          notes: data.notes,
          escalationReason: data.escalationReason,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || `Inspection ${data.decision === 'approved' ? 'approved' : 'rejected'} successfully`,
        })
        router.push('/dashboard/manager')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: errorData.error || "Failed to process approval",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error submitting approval:', error)
      toast({
        title: "Error",
        description: "Failed to submit approval decision",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getResponseValue = (question: any) => {
    if (!inspection?.responses) return null
    
    // Try multiple strategies to find the response
    // 1. Try question.id (UUID)
    if (inspection.responses[question.id]) {
      return inspection.responses[question.id]
    }
    
    // 2. Try question.field (field name like 'gfci-tested')
    if (question.field && inspection.responses[question.field]) {
      return inspection.responses[question.field]
    }
    
    // 3. Try question.name
    if (question.name && inspection.responses[question.name]) {
      return inspection.responses[question.name]
    }
    
    // 4. Try question.key
    if (question.key && inspection.responses[question.key]) {
      return inspection.responses[question.key]
    }
    
    return null
  }

  const getStatusBadge = (value: string) => {
    const lowerValue = value.toLowerCase()
    
    if (lowerValue === 'pass' || lowerValue === 'yes' || lowerValue === 'true') {
      return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Yes</Badge>
    } else if (lowerValue === 'fail' || lowerValue === 'no' || lowerValue === 'false') {
      return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="h-3 w-3" />No</Badge>
    } else if (lowerValue === 'n/a' || lowerValue === 'na') {
      return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>
    }
    return <Badge variant="outline" className="bg-blue-50 text-blue-800">{value}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
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

  // Verify user is a manager
  if (profile?.role !== 'PROJECT_MANAGER' && profile?.role !== 'EXECUTIVE') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Access Restricted</p>
              <p className="text-gray-500 mt-2">Only project managers can review inspections</p>
              <Button onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const questions = inspection.checklists?.questions || []
  const responses = inspection.responses || {}

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Review Inspection</h1>
            <p className="text-gray-600">
              {inspection.projects?.name || 'Inspection Review'}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {inspection.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Inspection Details & Responses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Inspection Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{inspection.title}</CardTitle>
                <CardDescription>
                  {inspection.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">Inspector</p>
                      <p className="text-gray-600">{inspection.profiles?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">Submitted</p>
                      <p className="text-gray-600">
                        {inspection.submitted_at 
                          ? new Date(inspection.submitted_at).toLocaleString()
                          : new Date(inspection.updated_at).toLocaleString()
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">Checklist</p>
                      <p className="text-gray-600">{inspection.checklists?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">Priority</p>
                      <Badge className={
                        inspection.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        inspection.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {inspection.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checklist Responses */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Responses</CardTitle>
                <CardDescription>
                  {questions.length} questions • {Object.keys(responses).length} answered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question: any, index: number) => {
                    const response = getResponseValue(question)
                    const hasResponse = response && response.value !== undefined && response.value !== null

                    return (
                      <div key={question.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                              {question.required && (
                                <Badge variant="outline" className="text-xs">Required</Badge>
                              )}
                              {question.evidenceRequired && (
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />Evidence
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-gray-900 mt-1">{question.question}</p>
                            {question.description && (
                              <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                            )}
                            
                            {/* Response */}
                            <div className="mt-3 bg-gray-50 p-3 rounded-md">
                              {hasResponse ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700">Answer:</span>
                                    {question.type === 'boolean' || question.type === 'yes-no' || question.type === 'pass-fail' ? (
                                      getStatusBadge(String(response.value))
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900 bg-white px-2 py-1 rounded">{String(response.value)}</span>
                                    )}
                                  </div>
                                  {response.notes && (
                                    <div className="text-sm text-gray-700 pl-4 border-l-2 border-blue-400 bg-white p-2 rounded">
                                      <span className="font-semibold">Notes: </span>
                                      {response.notes}
                                    </div>
                                  )}
                                  {response.evidenceIds && response.evidenceIds.length > 0 && (
                                    <div className="text-sm text-gray-700 flex items-center gap-1">
                                      <ImageIcon className="h-4 w-4 text-blue-600" />
                                      <span className="font-semibold">Evidence: </span>
                                      <span>{response.evidenceIds.length} file(s) attached</span>
                                    </div>
                                  )}
                                  {response.timestamp && (
                                    <div className="text-xs text-gray-500">
                                      Answered: {new Date(response.timestamp).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                  ⚠️ No response provided
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Evidence Gallery */}
            {inspection.evidence && inspection.evidence.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Evidence Gallery ({inspection.evidence.length})
                  </CardTitle>
                  <CardDescription>Uploaded evidence files with metadata</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {inspection.evidence.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                          <img 
                            src={item.url} 
                            alt={item.filename}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(item.url, '_blank')}
                          />
                        </div>
                        {item.verified && (
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600 truncate">{item.filename}</p>
                          {(item.latitude && item.longitude) && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Location verified
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Approval Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <ApprovalForm
                inspectionId={inspection.id}
                inspectionTitle={inspection.title}
                onSubmit={handleApproval}
                onCancel={() => router.back()}
                isLoading={submitting}
                rejectionCount={inspection.rejection_count || 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
