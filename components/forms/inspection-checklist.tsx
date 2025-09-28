'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ChecklistQuestion {
  id: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'file'
  question: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface ChecklistResponse {
  questionId: string
  value: string | number | boolean | string[]
  notes?: string
}

interface InspectionChecklistProps {
  questions: ChecklistQuestion[]
  onSubmit: (responses: ChecklistResponse[]) => void
  onSaveDraft?: (responses: ChecklistResponse[]) => void
  initialResponses?: ChecklistResponse[]
  isLoading?: boolean
}

export function InspectionChecklist({ 
  questions, 
  onSubmit, 
  onSaveDraft, 
  initialResponses = [],
  isLoading = false 
}: InspectionChecklistProps) {
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>(() => {
    const initial: Record<string, ChecklistResponse> = {}
    initialResponses.forEach(response => {
      initial[response.questionId] = response
    })
    return initial
  })

  const updateResponse = (questionId: string, value: any, notes?: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        value,
        notes
      }
    }))
  }

  const renderQuestion = (question: ChecklistQuestion) => {
    const response = responses[question.id]
    const value = response?.value

    switch (question.type) {
      case 'text':
        return (
          <textarea
            value={value as string || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            rows={3}
            placeholder="Enter your response..."
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value as number || ''}
            onChange={(e) => updateResponse(question.id, parseFloat(e.target.value))}
            min={question.validation?.min}
            max={question.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            placeholder="Enter number..."
          />
        )

      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name={question.id}
                checked={value === true}
                onChange={() => updateResponse(question.id, true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-green-700 font-medium">Yes / Pass</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name={question.id}
                checked={value === false}
                onChange={() => updateResponse(question.id, false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-red-700 font-medium">No / Fail</span>
            </label>
          </div>
        )

      case 'select':
        return (
          <select
            value={value as string || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={(value as string[] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || []
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option)
                    updateResponse(question.id, newValues)
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span>{option}</span>
              </label>
            ))}
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

  const completedQuestions = Object.keys(responses).length
  const requiredQuestions = questions.filter(q => q.required).length
  const completionRate = Math.round((completedQuestions / questions.length) * 100)

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Inspection Checklist</CardTitle>
          <CardDescription>
            {completedQuestions} of {questions.length} questions completed ({completionRate}%)
          </CardDescription>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Questions */}
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-start justify-between">
              <span className="flex-1">
                {index + 1}. {question.question}
              </span>
              {question.required && (
                <span className="text-red-500 text-sm ml-2">*</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestion(question)}
            
            {/* Notes field for each question */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={responses[question.id]?.notes || ''}
                onChange={(e) => {
                  const currentResponse = responses[question.id]
                  if (currentResponse) {
                    setResponses(prev => ({
                      ...prev,
                      [question.id]: {
                        ...currentResponse,
                        notes: e.target.value
                      }
                    }))
                  }
                }}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                placeholder="Optional notes or observations..."
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="sticky bottom-4 bg-white p-4 border-t space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
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
          >
            Save as Draft
          </Button>
        )}
      </div>
    </div>
  )
}
