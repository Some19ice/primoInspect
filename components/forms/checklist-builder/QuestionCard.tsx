'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Edit, Trash2, Camera, CheckSquare, Hash, FileText, ChevronDown, CheckCheck, Star } from 'lucide-react'
import { QuestionFormData } from './QuestionEditor'

interface QuestionCardProps {
  question: QuestionFormData & { id: string }
  index: number
  onEdit: () => void
  onDelete: () => void
}

const typeIcons = {
  boolean: <CheckSquare className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  select: <ChevronDown className="h-4 w-4" />,
  multiselect: <CheckCheck className="h-4 w-4" />,
  photo: <Camera className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
}

const typeColors = {
  boolean: 'text-green-600 bg-green-50',
  number: 'text-blue-600 bg-blue-50',
  text: 'text-purple-600 bg-purple-50',
  select: 'text-orange-600 bg-orange-50',
  multiselect: 'text-indigo-600 bg-indigo-50',
  photo: 'text-pink-600 bg-pink-50',
  rating: 'text-yellow-600 bg-yellow-50',
}

export function QuestionCard({ question, index, onEdit, onDelete }: QuestionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Question Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-500">
                    Q{index + 1}
                  </span>
                  <Badge variant="outline" className={`${typeColors[question.type]} text-xs`}>
                    <span className="mr-1">{typeIcons[question.type]}</span>
                    {question.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {question.category}
                  </Badge>
                  {question.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {question.evidenceRequired && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      Evidence
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {question.question}
                </p>
                {question.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {question.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0"
                  title="Edit question"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Type-specific details */}
            {question.type === 'select' || question.type === 'multiselect' ? (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Options:</p>
                <div className="flex flex-wrap gap-1">
                  {question.options?.map((option, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {question.type === 'number' && question.validation && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Validation:{' '}
                  {question.validation.min !== undefined && `Min: ${question.validation.min}`}
                  {question.validation.min !== undefined && question.validation.max !== undefined && ' • '}
                  {question.validation.max !== undefined && `Max: ${question.validation.max}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
