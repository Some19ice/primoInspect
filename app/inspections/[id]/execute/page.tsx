'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/lib/hooks/use-toast'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Camera, 
  MapPin, 
  Clock, 
  Save, 
  Send,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { InspectionStateMachine } from '@/lib/services/inspection-state-machine'
import { EvidenceUpload } from '@/components/evidence/evidence-upload'

interface Question {
  id: string
  question: string
  type: 'boolean' | 'text' | 'number' | 'select'
  required: boolean
  evidenceRequired?: boolean
  options?: string[]
}

export default function InspectionExecutePage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()

  const inspectionId = params.id as string

  const [inspection, setInspection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [showEvidence, setShowEvidence] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const fetchInspection = async (preserveResponses = false) => {
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`)
      if (response.ok) {
        const data = await response.json()
        setInspection(data)
        // Load existing responses, but preserve local changes if requested
        if (data.responses && !preserveResponses) {
          setResponses(data.responses)
        } else if (data.responses && preserveResponses) {
          // Merge: keep local responses but update with any server changes
          setResponses(prev => ({
            ...data.responses,
            ...prev, // Local changes take precedence
          }))
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load inspection',
          variant: 'destructive',
        })
        router.back()
      }
    } catch (error) {
      console.error('Error fetching inspection:', error)
      toast({
        title: 'Error',
        description: 'Failed to load inspection',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const questions: Question[] = inspection?.checklists?.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const progress =
    questions.length > 0
      ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
      : 0

  // Fetch inspection data
  useEffect(() => {
    if (inspectionId && profile) {
      fetchInspection()
      // Get GPS location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          error => console.log('GPS error:', error)
        )
      }
    }
  }, [inspectionId, profile])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (
        e.key === 'ArrowRight' &&
        currentQuestionIndex < questions.length - 1
      ) {
        nextQuestion()
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        prevQuestion()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveDraft()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestionIndex, questions.length])

  // Auto-save responses periodically
  useEffect(() => {
    if (!autoSaveEnabled) return

    const autoSaveInterval = setInterval(() => {
      if (Object.keys(responses).length > 0) {
        saveDraft()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [responses, autoSaveEnabled])

  // Save response for current question
  const saveResponse = useCallback(
    (value: any, notes?: string) => {
      if (!currentQuestion) return

      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: {
          value,
          notes,
          timestamp: new Date().toISOString(),
          location: location,
        },
      }))
    },
    [currentQuestion, location]
  )

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowEvidence(false)
    }
  }

  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setShowEvidence(false)
    }
  }

  // Save draft
  const saveDraft = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        toast({
          title: 'Draft Saved',
          description: 'Your progress has been saved',
        })
      } else {
        const errorData = await response.json()
        console.error('Save draft error:', errorData)
        throw new Error(errorData.error || 'Failed to save draft')
      }
    } catch (error: any) {
      console.error('Error saving draft:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Submit inspection
  const submitInspection = async () => {
    // Check for unanswered required questions
    const unansweredRequired = questions.filter(
      q => q.required && !isQuestionAnswered(q.id)
    )

    if (unansweredRequired.length > 0) {
      const firstUnanswered = questions.findIndex(
        q => q.required && !isQuestionAnswered(q.id)
      )

      const confirmed = window.confirm(
        `You have ${unansweredRequired.length} required question(s) unanswered.\n\n` +
          `Would you like to go to the first unanswered question?`
      )

      if (confirmed && firstUnanswered !== -1) {
        setCurrentQuestionIndex(firstUnanswered)
      }
      return
    }

    // Validate first
    const validationData = {
      ...inspection,
      responses,
    }

    const validation = InspectionStateMachine.validateTransition(
      validationData,
      'PENDING'
    )

    if (!validation.valid) {
      // Check if error is about missing evidence
      const hasMissingEvidence = validation.errors.some(err =>
        err.includes('Evidence required')
      )

      if (hasMissingEvidence) {
        // Find first question that needs evidence
        const firstMissingEvidence = questions.findIndex(
          q =>
            q.evidenceRequired &&
            isQuestionAnswered(q.id) &&
            !hasRequiredEvidence(q.id)
        )

        if (firstMissingEvidence !== -1) {
          setCurrentQuestionIndex(firstMissingEvidence)
          setShowEvidence(true) // Open evidence upload
        }
      }

      toast({
        title: 'Cannot Submit',
        description: validation.errors.join('. '),
        variant: 'destructive',
      })
      return
    }

    // Final confirmation
    const finalConfirm = window.confirm(
      `Are you sure you want to submit this inspection?\n\n` +
        `• ${Object.keys(responses).length} questions answered\n` +
        `• This will send the inspection for manager review\n\n` +
        `You can still revise it if rejected.`
    )

    if (!finalConfirm) return

    setSubmitting(true)
    try {
      // First save responses
      const saveResponse = await fetch(`/api/inspections/${inspectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
        }),
      })

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json()
        console.error('Error saving responses before submit:', saveError)
        throw new Error(saveError.error || 'Failed to save responses')
      }

      // Then submit
      const response = await fetch(`/api/inspections/${inspectionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        toast({
          title: 'Inspection Submitted',
          description: 'Your inspection has been submitted for review',
        })
        router.push('/dashboard/inspector')
      } else {
        const data = await response.json()
        console.error('Error submitting inspection:', data)
        
        // Handle validation errors from the API
        const errorMessage = data.error || 
          (data.validationErrors && data.validationErrors.length > 0 
            ? data.validationErrors.join('. ') 
            : 'Failed to submit inspection')
        
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error submitting inspection:', error)
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit inspection',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Check if current question is answered
  const isQuestionAnswered = (questionId: string) => {
    const response = responses[questionId]
    return (
      response &&
      response.value !== undefined &&
      response.value !== null &&
      response.value !== ''
    )
  }

  // Check if question has required evidence
  const hasRequiredEvidence = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question || !question.evidenceRequired) {
      return true // No evidence required
    }

    // Check if evidence exists in responses (newly uploaded)
    const responseEvidence = responses[questionId]?.evidenceIds
    if (responseEvidence && responseEvidence.length > 0) {
      return true
    }

    // Check if evidence exists in inspection data (previously uploaded)
    const evidence = inspection?.evidence || []
    return evidence.some((e: any) => e.question_id === questionId)
  }

  // Check if question is fully complete (answered + evidence if required)
  const isQuestionComplete = (questionId: string) => {
    return isQuestionAnswered(questionId) && hasRequiredEvidence(questionId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-gray-200"></div>
            <div className="h-64 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!inspection || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">
                No questions found in this inspection
              </p>
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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto max-w-3xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Badge>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>

          <h1 className="mb-2 text-xl font-bold">{inspection.title}</h1>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress: {progress}%</span>
              <div className="flex items-center gap-3">
                {lastSaved && (
                  <span className="text-xs text-green-600">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    GPS
                  </span>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {Object.keys(responses).length} of {questions.length} answered
              </span>
              <span>
                {
                  questions.filter(q => q.required && !isQuestionAnswered(q.id))
                    .length
                }{' '}
                required remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        {/* Question Overview - Collapsible */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Question Overview</span>
              <Badge variant="outline" className="text-xs">
                {Object.keys(responses).length}/{questions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {questions.map((q, idx) => {
                const complete = isQuestionComplete(q.id)
                const answered = isQuestionAnswered(q.id)
                const needsEvidence =
                  q.evidenceRequired && answered && !hasRequiredEvidence(q.id)
                const isCurrent = idx === currentQuestionIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx)
                      setShowEvidence(false)
                    }}
                    className={`h-10 rounded-lg text-xs font-medium transition-all ${isCurrent ? 'scale-110 ring-2 ring-blue-500' : ''} ${complete ? 'bg-green-500 text-white' : needsEvidence ? 'bg-purple-500 text-white' : 'bg-white text-gray-600'} ${q.required && !answered ? 'border-2 border-orange-500' : ''} hover:scale-105`}
                    title={`Question ${idx + 1}${q.required ? ' (Required)' : ''}${needsEvidence ? ' - Needs Evidence' : ''}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-500"></div>
                <span>Complete</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-purple-500"></div>
                <span>Needs Evidence</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded border-2 border-orange-500 bg-white"></div>
                <span>Required</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded border bg-white"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">
                {currentQuestion.question}
              </CardTitle>
              {currentQuestion.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Answer Input Based on Type */}
            {currentQuestion.type === 'boolean' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={
                      responses[currentQuestion.id]?.value === true
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => saveResponse(true)}
                    className="h-20 touch-manipulation text-lg"
                  >
                    <CheckCircle className="mr-2 h-6 w-6" />
                    Pass
                  </Button>
                  <Button
                    variant={
                      responses[currentQuestion.id]?.value === false
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => saveResponse(false)}
                    className="h-20 touch-manipulation bg-red-600 text-lg text-white hover:bg-red-700"
                  >
                    <AlertTriangle className="mr-2 h-6 w-6" />
                    Fail
                  </Button>
                </div>
                <Button
                  variant={
                    responses[currentQuestion.id]?.value === 'N/A'
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => saveResponse('N/A')}
                  className="h-14 w-full touch-manipulation bg-gray-100 text-base text-gray-700 hover:bg-gray-200"
                >
                  <X className="mr-2 h-5 w-5" />
                  Not Applicable
                </Button>
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <textarea
                className="w-full resize-none rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter your observations..."
                value={responses[currentQuestion.id]?.value || ''}
                onChange={e => saveResponse(e.target.value)}
              />
            )}

            {currentQuestion.type === 'number' && (
              <input
                type="number"
                className="w-full rounded-lg border p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter measurement"
                value={responses[currentQuestion.id]?.value || ''}
                onChange={e => saveResponse(parseFloat(e.target.value))}
              />
            )}

            {currentQuestion.type === 'select' && currentQuestion.options && (
              <select
                className="w-full rounded-lg border p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={responses[currentQuestion.id]?.value || ''}
                onChange={e => saveResponse(e.target.value)}
              >
                <option value="">Select an option</option>
                {currentQuestion.options.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Additional Notes (Optional)
              </label>
              <textarea
                className="w-full resize-none rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any additional observations..."
                value={responses[currentQuestion.id]?.notes || ''}
                onChange={e => {
                  const currentResponse = responses[currentQuestion.id] || {}
                  saveResponse(currentResponse.value, e.target.value)
                }}
              />
            </div>

            {/* Evidence Required Warning */}
            {currentQuestion.evidenceRequired &&
              isQuestionAnswered(currentQuestion.id) &&
              !hasRequiredEvidence(currentQuestion.id) && (
                <div className="rounded-lg border-2 border-purple-500 bg-purple-50 p-4">
                  <div className="flex items-start gap-3">
                    <Camera className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-purple-900">
                        Photo Evidence Required
                      </h4>
                      <p className="mt-1 text-sm text-purple-700">
                        This question requires photo evidence. Please upload at
                        least one photo before submitting the inspection.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Evidence Upload Toggle */}
            <Button
              variant={currentQuestion.evidenceRequired ? 'default' : 'outline'}
              onClick={() => setShowEvidence(!showEvidence)}
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" />
              {showEvidence ? 'Hide' : 'Add'} Photo Evidence
              {currentQuestion.evidenceRequired && (
                <Badge variant="secondary" className="ml-2">
                  Required
                </Badge>
              )}
            </Button>

            {/* Evidence Upload Component */}
            {showEvidence && (
              <EvidenceUpload
                inspectionId={inspectionId}
                questionId={currentQuestion.id}
                questionText={currentQuestion.question}
                required={currentQuestion.evidenceRequired === true}
                existingEvidence={
                  inspection?.evidence
                    ?.filter((e: any) => e.question_id === currentQuestion.id)
                    ?.map((e: any) => e.id) || []
                }
                onUploadComplete={completedFiles => {
                  // Called after each evidence file is uploaded
                  console.log(
                    '[Execute] Evidence upload completed:',
                    completedFiles
                  )

                  // Add newly uploaded evidence to the local inspection state
                  const newEvidence = completedFiles.map((file: any) => ({
                    id: file.evidenceId,
                    question_id: file.question_id || currentQuestion.id,
                    url: file.url,
                    inspection_id: inspectionId,
                    filename: file.filename || `evidence-${file.evidenceId}`,
                  }))

                  setInspection((prev: any) => {
                    // Check if evidence already exists to avoid duplicates
                    const existingIds = new Set(
                      (prev?.evidence || []).map((e: any) => e.id)
                    )
                    const uniqueNewEvidence = newEvidence.filter(
                      e => !existingIds.has(e.id)
                    )

                    const updated = {
                      ...prev,
                      evidence: [
                        ...(prev?.evidence || []),
                        ...uniqueNewEvidence,
                      ],
                    }

                    console.log(
                      '[Execute] Updated inspection with new evidence:',
                      {
                        previousCount: prev?.evidence?.length || 0,
                        newCount: updated.evidence.length,
                        questionId: currentQuestion.id,
                      }
                    )

                    return updated
                  })
                }}
                onEvidenceLinked={(questionId, evidenceIds) => {
                  // Update the response with evidence IDs for validation
                  console.log('[Execute] Evidence linked to question:', {
                    questionId,
                    evidenceIds,
                  })
                  setResponses(prev => {
                    const updated = {
                      ...prev,
                      [questionId]: {
                        ...prev[questionId],
                        evidenceIds,
                      },
                    }
                    console.log(
                      '[Execute] Updated responses with evidence IDs:',
                      updated
                    )
                    return updated
                  })
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-white p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="min-h-[48px] flex-1 touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={nextQuestion}
                className="min-h-[48px] flex-1 touch-manipulation"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={submitInspection}
                disabled={submitting}
                className="min-h-[48px] flex-1 touch-manipulation bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : 'Submit Inspection'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Save Draft Button */}
          <Button
            variant="ghost"
            onClick={saveDraft}
            disabled={saving}
            className="w-full touch-manipulation"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </div>
    </div>
  )
}
