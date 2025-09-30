'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/hooks/use-toast'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { supabaseDatabase } from '@/lib/supabase/database'
import { 
  Calendar, 
  Clock, 
  User, 
  FileCheck, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'

const inspectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  checklistId: z.string().min(1, 'Checklist is required'),
  assignedTo: z.string().min(1, 'Inspector assignment is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
})

type InspectionFormData = z.infer<typeof inspectionSchema>

interface EnhancedInspectionFormProps {
  projectId?: string
  onSubmit?: (data: InspectionFormData) => void
  onCancel?: () => void
  initialData?: Partial<InspectionFormData>
}

export function EnhancedInspectionForm({ 
  projectId, 
  onSubmit, 
  onCancel,
  initialData 
}: EnhancedInspectionFormProps) {
  const [checklists, setChecklists] = useState<any[]>([])
  const [inspectors, setInspectors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      priority: 'MEDIUM',
      projectId: projectId || '',
      ...initialData,
    },
  })

  // Load form data
  useEffect(() => {
    const loadFormData = async () => {
      if (!profile?.id) return
      
      setIsLoading(true)
      try {
        // Load checklists with projects separately if needed
        const [checklistResult, projectResult] = await Promise.all([
          supabaseDatabase.getChecklists(),
          profile.role === 'PROJECT_MANAGER' ? supabaseDatabase.getProjectsForUser(profile.id) : Promise.resolve({ data: [] })
        ])

        if (checklistResult.data) setChecklists(checklistResult.data)
        if (projectResult.data) setProjects(projectResult.data)

        // For now, create mock inspector data - this should be replaced with actual project member fetching
        if (projectId) {
          setInspectors([
            { id: 'mock-inspector-1', name: 'Mock Inspector', email: 'inspector@example.com', role: 'INSPECTOR' }
          ])
        }

      } catch (error) {
        console.error('Failed to load form data:', error)
        toast({
          title: "Loading Error",
          description: "Failed to load form data. Please refresh and try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadFormData()
  }, [profile?.id, projectId, toast])

  const handleSubmit = async (data: InspectionFormData) => {
    if (!profile?.id) return

    setIsSubmitting(true)
    try {
      // Create inspection via API
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          createdBy: profile.id,
          status: 'ASSIGNED'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create inspection')
      }

      const result = await response.json()

      toast({
        title: "Inspection Created",
        description: `"${data.title}" has been assigned to the inspector.`,
      })

      // Call parent callback
      if (onSubmit) {
        onSubmit(data)
      }

      // Reset form
      form.reset()

    } catch (error) {
      console.error('Failed to create inspection:', error)
      toast({
        title: "Creation Failed",
        description: "Failed to create inspection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading form...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Create New Inspection
        </CardTitle>
        <CardDescription>
          Assign a new inspection task to a team member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Project Selection (if not pre-selected) */}
          {!projectId && profile?.role === 'PROJECT_MANAGER' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Project *
              </label>
              <Select
                value={form.watch('projectId')}
                onValueChange={(value) => form.setValue('projectId', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.projectId && (
                <p className="text-red-600 text-sm">{form.formState.errors.projectId.message}</p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Inspection Title *
            </label>
            <Input
              {...form.register('title')}
              placeholder="e.g., Solar Panel Safety Inspection"
              className="h-11"
            />
            {form.formState.errors.title && (
              <p className="text-red-600 text-sm">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <Textarea
              {...form.register('description')}
              placeholder="Additional details about what needs to be inspected..."
              rows={3}
            />
          </div>

          {/* Checklist and Inspector Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checklist Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Checklist *
              </label>
              <Select
                value={form.watch('checklistId')}
                onValueChange={(value) => form.setValue('checklistId', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select checklist" />
                </SelectTrigger>
                <SelectContent>
                  {checklists.map((checklist) => (
                    <SelectItem key={checklist.id} value={checklist.id}>
                      {checklist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.checklistId && (
                <p className="text-red-600 text-sm">{form.formState.errors.checklistId.message}</p>
              )}
            </div>

            {/* Inspector Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assign To *
              </label>
              <Select
                value={form.watch('assignedTo')}
                onValueChange={(value) => form.setValue('assignedTo', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent>
                  {inspectors.map((inspector) => (
                    <SelectItem key={inspector.id} value={inspector.id}>
                      <div className="flex items-center gap-2">
                        <span>{inspector.name || inspector.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.assignedTo && (
                <p className="text-red-600 text-sm">{form.formState.errors.assignedTo.message}</p>
              )}
            </div>
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Priority
              </label>
              <Select
                value={form.watch('priority')}
                onValueChange={(value: any) => form.setValue('priority', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </label>
              <Input
                {...form.register('dueDate')}
                type="date"
                className="h-11"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Inspection
                </>
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}