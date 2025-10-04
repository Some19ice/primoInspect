'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Loader2 } from 'lucide-react'
import { QuestionTypeSelector, QuestionType } from './QuestionTypeSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required').max(500, 'Question too long'),
  type: z.enum(['boolean', 'number', 'text', 'select', 'multiselect', 'photo', 'rating']),
  category: z.string().min(1, 'Category is required'),
  required: z.boolean(),
  evidenceRequired: z.boolean(),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
})

export type QuestionFormData = z.infer<typeof questionSchema>

interface QuestionEditorProps {
  open: boolean
  onClose: () => void
  onSave: (question: QuestionFormData) => void
  initialData?: Partial<QuestionFormData>
  categories: string[]
}

export function QuestionEditor({
  open,
  onClose,
  onSave,
  initialData,
  categories,
}: QuestionEditorProps) {
  const [newOption, setNewOption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      type: 'boolean',
      category: '',
      required: true,
      evidenceRequired: false,
      description: '',
      options: [],
      validation: {},
      ...initialData,
    },
  })

  const selectedType = form.watch('type')
  const options = form.watch('options') || []

  useEffect(() => {
    if (initialData) {
      form.reset({
        question: '',
        type: 'boolean',
        category: '',
        required: true,
        evidenceRequired: false,
        description: '',
        options: [],
        validation: {},
        ...initialData,
      })
    }
  }, [initialData, form])

  const handleAddOption = () => {
    if (newOption.trim()) {
      const currentOptions = form.getValues('options') || []
      form.setValue('options', [...currentOptions, newOption.trim()])
      setNewOption('')
    }
  }

  const handleRemoveOption = (index: number) => {
    const currentOptions = form.getValues('options') || []
    form.setValue('options', currentOptions.filter((_, i) => i !== index))
  }

  const handleSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true)
    try {
      onSave(data)
      form.reset()
      onClose()
    } catch (error) {
      console.error('Error saving question:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const needsOptions = selectedType === 'select' || selectedType === 'multiselect'
  const needsValidation = selectedType === 'number'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Question' : 'Add Question'}
          </DialogTitle>
          <DialogDescription>
            Create a question for your inspection checklist. Inspectors will see this in the field.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question">Question Text *</Label>
            <Textarea
              id="question"
              {...form.register('question')}
              placeholder="e.g., Are all safety barriers properly installed?"
              rows={3}
              className="resize-none"
            />
            {form.formState.errors.question && (
              <p className="text-sm text-red-600">
                {form.formState.errors.question.message}
              </p>
            )}
          </div>

          {/* Question Type Selector */}
          <QuestionTypeSelector
            selectedType={selectedType}
            onSelectType={(type) => form.setValue('type', type)}
          />

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              {...form.register('category')}
              placeholder="e.g., Safety, Electrical, Quality"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Options (for select/multiselect) */}
          {needsOptions && (
            <div className="space-y-2">
              <Label>Options *</Label>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add an option"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {options.map((option, index) => (
                    <Badge key={index} variant="secondary" className="pl-2 pr-1">
                      {option}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {options.length === 0 && (
                <p className="text-sm text-orange-600">
                  Add at least one option
                </p>
              )}
            </div>
          )}

          {/* Validation Rules (for number) */}
          {needsValidation && (
            <div className="space-y-2">
              <Label>Validation Rules</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min" className="text-sm">Min Value</Label>
                  <Input
                    id="min"
                    type="number"
                    {...form.register('validation.min', { valueAsNumber: true })}
                    placeholder="e.g., 0"
                  />
                </div>
                <div>
                  <Label htmlFor="max" className="text-sm">Max Value</Label>
                  <Input
                    id="max"
                    type="number"
                    {...form.register('validation.max', { valueAsNumber: true })}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Helper Text (optional)</Label>
            <Input
              id="description"
              {...form.register('description')}
              placeholder="Additional instructions for inspectors"
            />
          </div>

          {/* Settings */}
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium text-sm">Question Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="required">Required Question</Label>
                <p className="text-sm text-gray-500">
                  Inspectors must answer this question
                </p>
              </div>
              <Switch
                id="required"
                checked={form.watch('required')}
                onCheckedChange={(checked) => form.setValue('required', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="evidenceRequired">Evidence Required</Label>
                <p className="text-sm text-gray-500">
                  Inspectors must upload photo/document
                </p>
              </div>
              <Switch
                id="evidenceRequired"
                checked={form.watch('evidenceRequired')}
                onCheckedChange={(checked) => form.setValue('evidenceRequired', checked)}
              />
            </div>
          </div>

          {/* Live Preview */}
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inspector Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium text-sm">
                    {form.watch('question') || 'Your question will appear here...'}
                    {form.watch('required') && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>
                  <div className="flex gap-1">
                    {form.watch('category') && (
                      <Badge variant="outline" className="text-xs">
                        {form.watch('category')}
                      </Badge>
                    )}
                    {form.watch('evidenceRequired') && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        Evidence
                      </Badge>
                    )}
                  </div>
                </div>
                
                {form.watch('description') && (
                  <p className="text-xs text-gray-500 mb-2">
                    {form.watch('description')}
                  </p>
                )}

                {/* Type-specific preview */}
                {selectedType === 'boolean' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-green-50">
                      <input type="radio" disabled />
                      <span className="text-sm">Yes / Pass</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-red-50">
                      <input type="radio" disabled />
                      <span className="text-sm">No / Fail</span>
                    </div>
                  </div>
                )}

                {selectedType === 'number' && (
                  <Input
                    type="number"
                    placeholder="Enter number..."
                    disabled
                    className="bg-gray-50"
                  />
                )}

                {selectedType === 'text' && (
                  <Textarea
                    placeholder="Enter text response..."
                    disabled
                    className="bg-gray-50 resize-none"
                    rows={3}
                  />
                )}

                {(selectedType === 'select' || selectedType === 'multiselect') && (
                  <div className="space-y-2">
                    {options.length > 0 ? (
                      options.map((option, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                          <input
                            type={selectedType === 'select' ? 'radio' : 'checkbox'}
                            disabled
                          />
                          <span className="text-sm">{option}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Add options to see preview
                      </p>
                    )}
                  </div>
                )}

                {selectedType === 'photo' && (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">Photo capture interface</p>
                  </div>
                )}

                {selectedType === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="h-10 w-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (needsOptions && options.length === 0)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Question'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
