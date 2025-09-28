'use client'

import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface InspectionFormData {
  title: string
  description?: string
  checklistId: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
}

interface InspectionFormProps {
  onSubmit: (data: InspectionFormData) => void
  onCancel?: () => void
  checklists?: Array<{ id: string; name: string }>
  inspectors?: Array<{ id: string; name: string; email: string }>
  isLoading?: boolean
}

export function InspectionForm({ 
  onSubmit, 
  onCancel, 
  checklists = [], 
  inspectors = [], 
  isLoading = false 
}: InspectionFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<InspectionFormData>({
    defaultValues: {
      priority: 'medium'
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Inspection</CardTitle>
        <CardDescription>
          Assign a new inspection to a team member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Inspection Title *
            </label>
            <input
              id="title"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              placeholder="e.g., Solar Panel Safety Check"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              placeholder="Additional details about the inspection"
            />
          </div>

          {/* Checklist Selection */}
          <div>
            <label htmlFor="checklistId" className="block text-sm font-medium text-gray-700 mb-1">
              Checklist *
            </label>
            <select
              id="checklistId"
              {...register('checklistId', { required: 'Checklist is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            >
              <option value="">Select a checklist</option>
              {checklists.map((checklist) => (
                <option key={checklist.id} value={checklist.id}>
                  {checklist.name}
                </option>
              ))}
            </select>
            {errors.checklistId && (
              <p className="text-red-600 text-sm mt-1">{errors.checklistId.message}</p>
            )}
          </div>

          {/* Inspector Assignment */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Inspector *
            </label>
            <select
              id="assignedTo"
              {...register('assignedTo', { required: 'Inspector assignment is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            >
              <option value="">Select an inspector</option>
              {inspectors.map((inspector) => (
                <option key={inspector.id} value={inspector.id}>
                  {inspector.name} ({inspector.email})
                </option>
              ))}
            </select>
            {errors.assignedTo && (
              <p className="text-red-600 text-sm mt-1">{errors.assignedTo.message}</p>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? 'Creating...' : 'Create Inspection'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                size="lg"
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
