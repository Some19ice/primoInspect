'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ChecklistQuestion {
  id: string
  type:
    | 'text'
    | 'number'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'file'
    | 'photo'
    | 'rating'
  question: string
  required: boolean
  category?: string
  evidenceRequired?: boolean
  evidenceTypes?: string[]
  gpsRequired?: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  scale?: number // For rating questions
}

interface ChecklistResponse {
  questionId: string
  value: string | number | boolean | string[]
  notes?: string
  evidenceIds?: string[] // Links to evidence for this question
  gpsLocation?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

interface InspectionChecklistProps {
  questions: ChecklistQuestion[]
  onSubmit: (responses: ChecklistResponse[]) => void
  onSaveDraft?: (responses: ChecklistResponse[]) => void
  onEvidenceRequired?: (questionId: string, questionText: string) => void
  initialResponses?: ChecklistResponse[]
  isLoading?: boolean
  autoSave?: boolean
  inspectionId?: string
}

export function InspectionChecklist({
  questions,
  onSubmit,
  onSaveDraft,
  onEvidenceRequired,
  initialResponses = [],
  isLoading = false,
  autoSave = false,
  inspectionId,
}: InspectionChecklistProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'single'>('list')
  const [showValidation, setShowValidation] = useState(false)
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>(
    () => {
      const initial: Record<string, ChecklistResponse> = {}
      initialResponses.forEach(response => {
        initial[response.questionId] = response
      })
      return initial
    }
  )
  const [completionStats, setCompletionStats] = useState({
    totalQuestions: questions.length,
    answeredQuestions: 0,
    requiredQuestions: 0,
    answeredRequired: 0,
    evidenceRequired: 0,
    evidenceProvided: 0,
  })

  const updateResponse = (
    questionId: string,
    value: any,
    notes?: string,
    evidenceIds?: string[],
    gpsLocation?: any
  ) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        value,
        notes,
        evidenceIds,
        gpsLocation,
      },
    }))
  }

  // Calculate completion stats
  useEffect(() => {
    const totalQuestions = questions.length
    const answeredQuestions = Object.keys(responses).filter(
      key => responses[key].value !== undefined && responses[key].value !== ''
    ).length

    const requiredQuestions = questions.filter(q => q.required).length
    const answeredRequired = questions.filter(
      q =>
        q.required &&
        responses[q.id]?.value !== undefined &&
        responses[q.id]?.value !== ''
    ).length

    const evidenceRequired = questions.filter(q => q.evidenceRequired).length
    const evidenceProvided = questions.filter(
      q =>
        q.evidenceRequired &&
        responses[q.id]?.evidenceIds &&
        responses[q.id].evidenceIds!.length > 0
    ).length

    setCompletionStats({
      totalQuestions,
      answeredQuestions,
      requiredQuestions,
      answeredRequired,
      evidenceRequired,
      evidenceProvided,
    })
  }, [questions, responses])

  // Auto-save functionality with progress tracking
  useEffect(() => {
    if (!autoSave || !onSaveDraft) return

    const timer = setTimeout(() => {
      const responseArray = Object.values(responses)
      if (responseArray.length > 0) {
        // Save responses (progress tracking can be done separately if needed)
        onSaveDraft(responseArray)
      }
    }, 2000) // Auto-save every 2 seconds

    return () => clearTimeout(timer)
  }, [responses, autoSave, onSaveDraft, completionStats])

  const renderQuestion = (question: ChecklistQuestion) => {
    const response = responses[question.id]
    const value = response?.value

    switch (question.type) {
      case 'text':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={e => updateResponse(question.id, e.target.value)}
            className="w-full touch-manipulation rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter your response..."
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={e =>
              updateResponse(question.id, parseFloat(e.target.value))
            }
            min={question.validation?.min}
            max={question.validation?.max}
            className="min-h-[44px] w-full touch-manipulation rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter number..."
          />
        )

      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="flex min-h-[44px] cursor-pointer items-center space-x-3">
              <input
                type="radio"
                name={question.id}
                checked={value === true}
                onChange={() => updateResponse(question.id, true)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="font-medium text-green-700">Yes / Pass</span>
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center space-x-3">
              <input
                type="radio"
                name={question.id}
                checked={value === false}
                onChange={() => updateResponse(question.id, false)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="font-medium text-red-700">No / Fail</span>
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center space-x-3">
              <input
                type="radio"
                name={question.id}
                checked={value === 'N/A'}
                onChange={() => updateResponse(question.id, 'N/A')}
                className="h-4 w-4 text-blue-600"
              />
              <span className="font-medium text-gray-700">Not Applicable</span>
            </label>
          </div>
        )

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={e => updateResponse(question.id, e.target.value)}
            className="min-h-[44px] w-full touch-manipulation rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an option</option>
            {question.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label
                key={option}
                className="flex min-h-[44px] cursor-pointer items-center space-x-3"
              >
                <input
                  type="checkbox"
                  checked={((value as string[]) || []).includes(option)}
                  onChange={e => {
                    const currentValues = (value as string[]) || []
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option)
                    updateResponse(question.id, newValues)
                  }}
                  className="h-4 w-4 text-blue-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'rating':
        return (
          <div className="flex items-center space-x-2">
            {Array.from({ length: question.scale || 5 }, (_, i) => i + 1).map(
              rating => (
                <label
                  key={rating}
                  className="flex cursor-pointer items-center"
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={value === rating}
                    onChange={() => updateResponse(question.id, rating)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      value === rating
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {rating}
                  </div>
                </label>
              )
            )}
          </div>
        )

      case 'photo':
        return (
          <div className="space-y-3">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
              <p className="mb-2 text-sm text-gray-600">
                Photo evidence required
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() =>
                    onEvidenceRequired?.(question.id, question.question)
                  }
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Trigger file upload for this question
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.multiple = true
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files && files.length > 0) {
                        // Handle file upload with question linking
                        onEvidenceRequired?.(question.id, question.question)
                      }
                    }
                    input.click()
                  }}
                  className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                >
                  Upload Photo
                </button>
              </div>
            </div>
            {response?.evidenceIds && response.evidenceIds.length > 0 && (
              <div className="text-sm text-green-600">
                ✓ {response.evidenceIds.length} photo(s) attached
                <div className="mt-1 text-xs text-gray-500">
                  Linked to this question
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const handleSubmit = () => {
    const responseArray = Object.values(responses)
    onSubmit(responseArray)
  }

  const handleSaveDraft = () => {
    const responseArray = Object.values(responses)
    onSaveDraft?.(responseArray)
  }

  const completionRate = Math.round(
    (completionStats.answeredQuestions / completionStats.totalQuestions) * 100
  )
  const requiredCompletionRate =
    completionStats.requiredQuestions > 0
      ? Math.round(
          (completionStats.answeredRequired /
            completionStats.requiredQuestions) *
            100
        )
      : 100
  const evidenceCompletionRate =
    completionStats.evidenceRequired > 0
      ? Math.round(
          (completionStats.evidenceProvided /
            completionStats.evidenceRequired) *
            100
        )
      : 100

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('single')}
          >
            Single Question
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowValidation(!showValidation)}
        >
          {showValidation ? 'Hide' : 'Show'} Validation
        </Button>
      </div>

      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Inspection Checklist</CardTitle>
          <CardDescription>
            {completionStats.answeredQuestions} of{' '}
            {completionStats.totalQuestions} questions completed (
            {completionRate}%)
          </CardDescription>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completionRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Required Questions Progress */}
          {completionStats.requiredQuestions > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Required Questions</span>
                <span>
                  {completionStats.answeredRequired}/
                  {completionStats.requiredQuestions}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600 transition-all duration-300"
                  style={{ width: `${requiredCompletionRate}%` }}
                />
              </div>
            </div>
          )}

          {/* Evidence Progress */}
          {completionStats.evidenceRequired > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Evidence Required</span>
                <span>
                  {completionStats.evidenceProvided}/
                  {completionStats.evidenceRequired}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${evidenceCompletionRate}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Questions */}
      {questions.map((question, index) => (
        <Card
          key={question.id}
          className={
            question.evidenceRequired ? 'border-l-4 border-l-purple-500' : ''
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-start justify-between text-base">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span>
                    {index + 1}. {question.question}
                  </span>
                  {question.required && (
                    <span className="text-sm text-red-500">*</span>
                  )}
                  {question.evidenceRequired && (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-500">
                      Evidence Required
                    </span>
                  )}
                  {question.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                      {question.category}
                    </span>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestion(question)}

            {/* Evidence Section */}
            {question.evidenceRequired && (
              <div className="mt-3 rounded-md bg-purple-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-purple-700">
                    Evidence Required
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      onEvidenceRequired?.(question.id, question.question)
                    }
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    + Add Evidence
                  </button>
                </div>
                {responses[question.id]?.evidenceIds &&
                responses[question.id].evidenceIds!.length > 0 ? (
                  <div className="text-sm text-green-600">
                    ✓ {responses[question.id].evidenceIds!.length} evidence
                    file(s) attached
                  </div>
                ) : (
                  <div className="text-sm text-orange-600">
                    ⚠️ Evidence required for this question
                  </div>
                )}
              </div>
            )}

            {/* Notes field for each question */}
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                value={responses[question.id]?.notes || ''}
                onChange={e => {
                  const currentResponse = responses[question.id]
                  if (currentResponse) {
                    setResponses(prev => ({
                      ...prev,
                      [question.id]: {
                        ...currentResponse,
                        notes: e.target.value,
                      },
                    }))
                  } else {
                    // Create new response with just notes
                    setResponses(prev => ({
                      ...prev,
                      [question.id]: {
                        questionId: question.id,
                        value: '',
                        notes: e.target.value,
                      },
                    }))
                  }
                }}
                rows={2}
                className="w-full touch-manipulation rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes or observations..."
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="sticky bottom-4 space-y-3 border-t bg-white p-4">
        {/* Validation Summary */}
        {(completionStats.answeredRequired <
          completionStats.requiredQuestions ||
          completionStats.evidenceProvided <
            completionStats.evidenceRequired) && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <div className="text-sm text-yellow-800">
              <strong>Missing Requirements:</strong>
              <ul className="mt-1 list-inside list-disc">
                {completionStats.answeredRequired <
                  completionStats.requiredQuestions && (
                  <li>
                    {completionStats.requiredQuestions -
                      completionStats.answeredRequired}{' '}
                    required question(s)
                  </li>
                )}
                {completionStats.evidenceProvided <
                  completionStats.evidenceRequired && (
                  <li>
                    {completionStats.evidenceRequired -
                      completionStats.evidenceProvided}{' '}
                    evidence requirement(s)
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            completionStats.answeredRequired < completionStats.requiredQuestions
          }
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Submitting...' : 'Submit Inspection'}
        </Button>

        {onSaveDraft && (
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {autoSave ? 'Save Progress' : 'Save as Draft'}
          </Button>
        )}
      </div>
    </div>
  )
}
