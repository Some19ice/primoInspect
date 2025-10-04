'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ArrowLeft, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChecklistBuilder } from '@/components/forms/checklist-builder/ChecklistBuilder'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'

export default function CreateChecklistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8">Loading...</div>}>
      <CreateChecklistPageContent />
    </Suspense>
  )
}

function CreateChecklistPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const projectId = searchParams.get('projectId')

  // Only allow project managers
  if (profile && profile.role !== 'PROJECT_MANAGER') {
    router.push('/dashboard')
    return null
  }

  const handleSave = async (data: any) => {
    try {
      // Transform the data to match API schema
      const checklistData = {
        projectId: projectId,
        name: data.metadata.name,
        description: data.metadata.description || '',
        version: '1.0',
        questions: data.questions.map((q: any, index: number) => ({
          id: `q-${index + 1}`,
          question: q.question,
          type: q.type,
          category: q.category,
          required: q.required,
          evidenceRequired: q.evidenceRequired,
          description: q.description,
          options: q.options,
          validation: q.validation,
        })),
      }

      const response = await fetch('/api/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checklistData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checklist')
      }

      await response.json()
      
      setIsRedirecting(true)
      
      // Redirect based on context
      if (projectId) {
        router.push(`/projects/${projectId}/manage`)
      } else {
        router.push('/dashboard/manager')
      }
    } catch (error) {
      console.error('Error saving checklist:', error)
      throw error
    }
  }

  const handleCancel = () => {
    if (projectId) {
      router.push(`/projects/${projectId}/manage`)
    } else {
      router.push('/dashboard/manager')
    }
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium">Checklist Created Successfully!</p>
              <p className="text-sm text-gray-600 mt-2">Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Create Inspection Checklist</h1>
            <p className="text-gray-600">
              Build a custom checklist for your project inspections
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Checklist Builder
            </CardTitle>
            <CardDescription>
              Create questions that inspectors will answer in the field. You can add different types of questions,
              require evidence uploads, and organize them into categories for easy navigation.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Builder */}
        <ChecklistBuilder
          projectId={projectId || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
