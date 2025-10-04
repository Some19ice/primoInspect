'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Save, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { QuestionEditor, QuestionFormData } from './QuestionEditor'
import { QuestionCard } from './QuestionCard'
import { useToast } from '@/lib/hooks/use-toast'

const checklistMetadataSchema = z.object({
  name: z.string().min(1, 'Checklist name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  projectType: z.enum(['SOLAR', 'WIND', 'BATTERY', 'HYBRID', 'CUSTOM']),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 minute'),
})

type ChecklistMetadata = z.infer<typeof checklistMetadataSchema>

interface ChecklistBuilderProps {
  projectId?: string
  initialData?: {
    metadata?: Partial<ChecklistMetadata>
    questions?: (QuestionFormData & { id: string })[]
  }
  onSave: (data: { metadata: ChecklistMetadata; questions: (QuestionFormData & { id: string })[] }) => Promise<void>
  onCancel?: () => void
}

export function ChecklistBuilder({ projectId, initialData, onSave, onCancel }: ChecklistBuilderProps) {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<(QuestionFormData & { id: string })[]>(
    initialData?.questions || []
  )
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<(QuestionFormData & { id: string }) | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)

  const form = useForm<ChecklistMetadata>({
    resolver: zodResolver(checklistMetadataSchema),
    defaultValues: {
      name: '',
      description: '',
      projectType: 'CUSTOM',
      estimatedDuration: 30,
      ...initialData?.metadata,
    },
  })

  // Group questions by category
  const categorizedQuestions = questions.reduce((acc, question) => {
    const category = question.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(question)
    return acc
  }, {} as Record<string, (QuestionFormData & { id: string })[]>)

  const categories = Object.keys(categorizedQuestions)

  // Restore draft on mount
  useEffect(() => {
    if (!draftRestored && !initialData) {
      try {
        const draftKey = `checklist-draft-${projectId || 'new'}`
        const savedDraft = localStorage.getItem(draftKey)
        
        if (savedDraft) {
          const draft = JSON.parse(savedDraft)
          const lastSaved = new Date(draft.lastSaved)
          const now = new Date()
          const hoursSinceLastSave = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60)
          
          // Only restore if less than 24 hours old
          if (hoursSinceLastSave < 24) {
            // Restore metadata
            if (draft.metadata) {
              Object.keys(draft.metadata).forEach((key) => {
                form.setValue(key as any, draft.metadata[key])
              })
            }
            
            // Restore questions
            if (draft.questions && draft.questions.length > 0) {
              setQuestions(draft.questions)
            }
            
            setDraftRestored(true)
            toast({
              title: 'Draft Restored',
              description: `Your work from ${lastSaved.toLocaleString()} has been restored.`,
            })
          } else {
            // Clear old draft
            localStorage.removeItem(draftKey)
          }
        }
      } catch (error) {
        console.error('Error restoring draft:', error)
      }
    }
  }, [projectId, initialData, draftRestored, form, toast])

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    const timer = setTimeout(() => {
      handleSaveDraft()
    }, 5000) // Auto-save every 5 seconds

    setAutoSaveTimer(timer)

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
    }
  }, [form.watch(), questions])

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setEditorOpen(true)
  }

  const handleEditQuestion = (question: QuestionFormData & { id: string }) => {
    setEditingQuestion(question)
    setEditorOpen(true)
  }

  const handleSaveQuestion = (questionData: QuestionFormData) => {
    if (editingQuestion) {
      // Update existing question
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? { ...questionData, id: q.id } : q
      ))
      toast({
        title: 'Question Updated',
        description: 'Your changes have been saved.',
      })
    } else {
      // Add new question
      const newQuestion = {
        ...questionData,
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
      setQuestions([...questions, newQuestion])
      toast({
        title: 'Question Added',
        description: 'The question has been added to your checklist.',
      })
    }
    setEditorOpen(false)
    setEditingQuestion(null)
  }

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id))
      toast({
        title: 'Question Deleted',
        description: 'The question has been removed from your checklist.',
      })
    }
  }

  const handleSaveDraft = async () => {
    // Save draft to localStorage
    if (questions.length > 0 || form.getValues('name')) {
      try {
        const draftData = {
          metadata: form.getValues(),
          questions,
          lastSaved: new Date().toISOString(),
        }
        localStorage.setItem(`checklist-draft-${projectId || 'new'}`, JSON.stringify(draftData))
      } catch (error) {
        console.error('Error saving draft:', error)
      }
    }
  }

  const handlePublish = async () => {
    const metadata = form.getValues()
    
    if (questions.length === 0) {
      toast({
        title: 'Cannot Publish',
        description: 'Add at least one question before publishing.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave({ metadata, questions })
      // Clear draft
      localStorage.removeItem(`checklist-draft-${projectId || 'new'}`)
      toast({
        title: 'Checklist Published',
        description: 'Your checklist is now available for inspections.',
      })
    } catch (error) {
      console.error('Error publishing checklist:', error)
      toast({
        title: 'Publishing Failed',
        description: 'There was an error publishing your checklist. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const stats = {
    totalQuestions: questions.length,
    requiredQuestions: questions.filter(q => q.required).length,
    evidenceRequired: questions.filter(q => q.evidenceRequired).length,
    categories: categories.length,
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Questions</CardDescription>
            <CardTitle className="text-2xl">{stats.totalQuestions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Required</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.requiredQuestions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Evidence</CardDescription>
            <CardTitle className="text-2xl text-purple-600">{stats.evidenceRequired}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Categories</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.categories}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Details</CardTitle>
          <CardDescription>
            Basic information about your inspection checklist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Checklist Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="e.g., Solar Panel Installation Check"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type *</Label>
              <Select
                value={form.watch('projectType')}
                onValueChange={(value: any) => form.setValue('projectType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLAR">Solar</SelectItem>
                  <SelectItem value="WIND">Wind</SelectItem>
                  <SelectItem value="BATTERY">Battery Storage</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Brief description of what this checklist covers..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
            <Input
              id="estimatedDuration"
              type="number"
              {...form.register('estimatedDuration', { valueAsNumber: true })}
              placeholder="30"
            />
            {form.formState.errors.estimatedDuration && (
              <p className="text-sm text-red-600">
                {form.formState.errors.estimatedDuration.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions ({stats.totalQuestions})</CardTitle>
              <CardDescription>
                Add and organize questions for inspectors to complete
              </CardDescription>
            </div>
            <Button onClick={handleAddQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No questions added yet. Click "Add Question" to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {categories.map((category) => (
                <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary">
                        {categorizedQuestions[category].length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3">
                      {categorizedQuestions[category].map((question, index) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          index={questions.indexOf(question)}
                          onEdit={() => handleEditQuestion(question)}
                          onDelete={() => handleDeleteQuestion(question.id)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isSaving || questions.length === 0}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Publish Checklist
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question Editor Modal */}
      <QuestionEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false)
          setEditingQuestion(null)
        }}
        onSave={handleSaveQuestion}
        initialData={editingQuestion || undefined}
        categories={categories.length > 0 ? categories : ['Safety', 'Quality', 'Technical']}
      />
    </div>
  )
}
