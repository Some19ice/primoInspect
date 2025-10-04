'use client'

import { CheckSquare, Hash, FileText, ChevronDown, CheckCheck, Camera, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export type QuestionType = 'boolean' | 'number' | 'text' | 'select' | 'multiselect' | 'photo' | 'rating'

interface QuestionTypeOption {
  type: QuestionType
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const questionTypes: QuestionTypeOption[] = [
  {
    type: 'boolean',
    label: 'Yes/No',
    description: 'Pass/fail or yes/no questions',
    icon: <CheckSquare className="h-6 w-6" />,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    type: 'number',
    label: 'Number',
    description: 'Numeric measurements with validation',
    icon: <Hash className="h-6 w-6" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Open-ended text responses',
    icon: <FileText className="h-6 w-6" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    type: 'select',
    label: 'Single Choice',
    description: 'Select one option from a list',
    icon: <ChevronDown className="h-6 w-6" />,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    type: 'multiselect',
    label: 'Multiple Choice',
    description: 'Select multiple options',
    icon: <CheckCheck className="h-6 w-6" />,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    type: 'photo',
    label: 'Photo',
    description: 'Capture photo evidence',
    icon: <Camera className="h-6 w-6" />,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
  },
  {
    type: 'rating',
    label: 'Rating',
    description: 'Quality rating scale (1-5)',
    icon: <Star className="h-6 w-6" />,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
]

interface QuestionTypeSelectorProps {
  selectedType?: QuestionType
  onSelectType: (type: QuestionType) => void
  disabled?: boolean
}

export function QuestionTypeSelector({
  selectedType,
  onSelectType,
  disabled = false,
}: QuestionTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Question Type *
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {questionTypes.map((option) => {
          const isSelected = selectedType === option.type
          return (
            <Card
              key={option.type}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? `border-2 ${option.color} shadow-md`
                  : 'border border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onSelectType(option.type)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`p-3 rounded-lg ${
                      isSelected ? option.color : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckSquare className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export { questionTypes }
