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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showEvidence, setShowEvidence] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const fetchInspection = async () => {
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`)
      if (response.ok) {
        const data = await response.json()
        setInspection(data)
        // Load existing responses
        if (data.responses) {
          setResponses(data.responses)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load inspection",
          variant: "destructive",
        })
        router.back()
      }
    } catch (error) {
      console.error('Error fetching inspection:', error)
      toast({
        title: "Error",
        description: "Failed to load inspection",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const questions: Question[] = inspection?.checklists?.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 
    ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
    : 0

  // Fetch inspection data
  useEffect(() => {
    if (inspectionId && profile) {
      fetchInspection()
      // Get GPS location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          (error) => console.log('GPS error:', error)
        )
      }
    }
  }, [inspectionId, profile])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
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
  const saveResponse = useCallback((value: any, notes?: string) => {
    if (!currentQuestion) return

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        value,
        notes,
        timestamp: new Date().toISOString(),
        location: location,
      }
    }))
  }, [currentQuestion, location])

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
          updated_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        toast({
          title: "Draft Saved",
          description: "Your progress has been saved",
        })
      } else {
        throw new Error('Failed to save draft')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Submit inspection
  const submitInspection = async () => {
    // Check for unanswered required questions
    const unansweredRequired = questions.filter(q => q.required && !isQuestionAnswered(q.id))
    
    if (unansweredRequired.length > 0) {
      const firstUnanswered = questions.findIndex(q => q.required && !isQuestionAnswered(q.id))
      
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
    
    const validation = InspectionStateMachine.validateTransition(validationData, 'PENDING')
    
    if (!validation.valid) {
      toast({
        title: "Cannot Submit",
        description: validation.errors.join('. '),
        variant: "destructive",
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
      await fetch(`/api/inspections/${inspectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          updated_at: new Date().toISOString(),
        }),
      })

      // Then submit
      const response = await fetch(`/api/inspections/${inspectionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        toast({
          title: "Inspection Submitted",
          description: "Your inspection has been submitted for review",
        })
        router.push('/dashboard/inspector')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit inspection')
      }
    } catch (error: any) {
      console.error('Error submitting inspection:', error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit inspection",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Check if current question is answered
  const isQuestionAnswered = (questionId: string) => {
    const response = responses[questionId]
    return response && response.value !== undefined && response.value !== null && response.value !== ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!inspection || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No questions found in this inspection</p>
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
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Badge>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>

          <h1 className="text-xl font-bold mb-2">{inspection.title}</h1>

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
                {questions.filter(q => q.required && !isQuestionAnswered(q.id)).length} required remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Question Overview - Collapsible */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Question Overview</span>
              <Badge variant="outline" className="text-xs">
                {Object.keys(responses).length}/{questions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {questions.map((q, idx) => {
                const answered = isQuestionAnswered(q.id)
                const isCurrent = idx === currentQuestionIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx)
                      setShowEvidence(false)
                    }}
                    className={`
                      h-10 rounded-lg text-xs font-medium transition-all
                      ${isCurrent ? 'ring-2 ring-blue-500 scale-110' : ''}
                      ${answered ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}
                      ${q.required && !answered ? 'border-2 border-orange-500' : ''}
                      hover:scale-105
                    `}
                    title={`Question ${idx + 1}${q.required ? ' (Required)' : ''}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white border-2 border-orange-500 rounded"></div>
                <span>Required</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white border rounded"></div>
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
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={responses[currentQuestion.id]?.value === true ? "default" : "outline"}
                  onClick={() => saveResponse(true)}
                  className="h-20 text-lg touch-manipulation"
                >
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Pass
                </Button>
                <Button
                  variant={responses[currentQuestion.id]?.value === false ? "default" : "outline"}
                  onClick={() => saveResponse(false)}
                  className="h-20 text-lg touch-manipulation bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  Fail
                </Button>
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <textarea
                className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Enter your observations..."
                value={responses[currentQuestion.id]?.value || ''}
                onChange={(e) => saveResponse(e.target.value)}
              />
            )}

            {currentQuestion.type === 'number' && (
              <input
                type="number"
                className="w-full p-4 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter measurement"
                value={responses[currentQuestion.id]?.value || ''}
                onChange={(e) => saveResponse(parseFloat(e.target.value))}
              />
            )}

            {currentQuestion.type === 'select' && currentQuestion.options && (
              <select
                className="w-full p-4 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={responses[currentQuestion.id]?.value || ''}
                onChange={(e) => saveResponse(e.target.value)}
              >
                <option value="">Select an option</option>
                {currentQuestion.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
                placeholder="Add any additional observations..."
                value={responses[currentQuestion.id]?.notes || ''}
                onChange={(e) => {
                  const currentResponse = responses[currentQuestion.id] || {}
                  saveResponse(currentResponse.value, e.target.value)
                }}
              />
            </div>

            {/* Evidence Upload Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowEvidence(!showEvidence)}
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {showEvidence ? 'Hide' : 'Add'} Photo Evidence
            </Button>

            {/* Evidence Upload Component */}
            {showEvidence && (
              <EvidenceUpload
                inspectionId={inspectionId}
                questionId={currentQuestion.id}
                questionText={currentQuestion.question}
                required={currentQuestion.required && responses[currentQuestion.id]?.value === false}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex-1 touch-manipulation min-h-[48px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={nextQuestion}
                className="flex-1 touch-manipulation min-h-[48px]"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={submitInspection}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 touch-manipulation min-h-[48px]"
              >
                {submitting ? 'Submitting...' : 'Submit Inspection'}
                <Send className="h-4 w-4 ml-2" />
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
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </div>
    </div>
  )
}
