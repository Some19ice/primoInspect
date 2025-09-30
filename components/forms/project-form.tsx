'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProjectFormData {
  name: string
  description?: string
  startDate: string
  endDate?: string
  latitude?: number
  longitude?: number
  address?: string
}

interface ProjectFormProps {
  onSubmit: (data: any) => void
  onCancel?: () => void
  initialData?: Partial<ProjectFormData>
  isLoading?: boolean
}

export function ProjectForm({ onSubmit, onCancel, initialData, isLoading = false }: ProjectFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: initialData
  })

  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setUseCurrentLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Update form with current location
          setUseCurrentLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setUseCurrentLocation(false)
        }
      )
    }
  }

  const onFormSubmit = (data: ProjectFormData) => {
    // Send data as-is, let the API handle date conversion
    const formattedData = {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.latitude && data.longitude ? {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address
      } : undefined
    }
    onSubmit(formattedData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Project' : 'Create New Project'}</CardTitle>
        <CardDescription>
          Set up a renewable energy project for inspection management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              id="name"
              {...register('name', { required: 'Project name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              placeholder="e.g., Solar Farm Alpha"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
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
              placeholder="Brief description of the project"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                id="startDate"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              />
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                {...register('endDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            
            <div className="space-y-3">
              <div>
                <input
                  {...register('address')}
                  placeholder="Project address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  {...register('latitude', { valueAsNumber: true })}
                  placeholder="Latitude"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
                />
                <input
                  type="number"
                  step="any"
                  {...register('longitude', { valueAsNumber: true })}
                  placeholder="Longitude"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={useCurrentLocation}
                className="w-full"
              >
                {useCurrentLocation ? 'Getting Location...' : 'Use Current Location'}
              </Button>
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
              {isLoading ? 'Saving...' : (initialData ? 'Update Project' : 'Create Project')}
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
