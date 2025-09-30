'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'

interface ProjectMember {
  role: string
  profiles: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface Project {
  id: string
  name: string
  description: string
  project_members?: ProjectMember[]
}

interface Checklist {
  id: string
  name: string
  description: string
  questions: any[]
}

export default function CreateInspectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  
  const [project, setProject] = useState<Project | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [selectedChecklist, setSelectedChecklist] = useState<string>('')
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  
  const projectId = searchParams.get('projectId')

  useEffect(() => {
    if (projectId && profile) {
      fetchProjectAndChecklists()
    }
  }, [projectId, profile])

  const fetchProjectAndChecklists = async () => {
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (projectResponse.ok) {
        const projectData = await projectResponse.json()
        setProject(projectData)
      }

      // Fetch available checklists for the project
      const checklistsResponse = await fetch(`/api/checklists?projectId=${projectId}`)
      if (checklistsResponse.ok) {
        const checklistsData = await checklistsResponse.json()
        setChecklists(checklistsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChecklist = (checklistId: string) => {
    setSelectedChecklist(checklistId)
    setShowAssignmentForm(true)
    // Default to current user if no assignee selected
    if (!selectedAssignee) {
      setSelectedAssignee(profile?.id || '')
    }
  }

  const handleCreateInspection = async () => {
    if (!project || !profile || !selectedChecklist || !selectedAssignee) return

    setCreating(true)
    try {
      const requestData = {
        projectId: projectId,
        checklistId: selectedChecklist,
        assignedTo: selectedAssignee,
        title: `Inspection for ${project.name}`,
        description: `New inspection created for project ${project.name}`,
        priority: 'MEDIUM'
      }
      
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const inspection = await response.json()
        toast({
          title: "Success",
          description: "Inspection created successfully",
        })
        router.push(`/inspections/${inspection.id}`)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create inspection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating inspection:', error)
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Project not found</p>
              <Button onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Create New Inspection</h1>
            <p className="text-gray-600">for {project.name}</p>
          </div>
        </div>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Project: {project.name}</CardTitle>
            <CardDescription>
              {project.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Checklist Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Checklist</CardTitle>
            <CardDescription>
              Choose a checklist template for this inspection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checklists.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No checklists available for this project</p>
                <p className="text-sm">Contact your project manager to add checklists</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklists.map((checklist) => (
                  <Card key={checklist.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{checklist.name}</CardTitle>
                      <CardDescription>
                        {checklist.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {checklist.questions?.length || 0} questions
                        </span>
                        <Button 
                          onClick={() => handleSelectChecklist(checklist.id)}
                          disabled={creating}
                        >
                          Select This Checklist
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Form */}
        {showAssignmentForm && (
          <Card>
            <CardHeader>
              <CardTitle>Assign Inspection</CardTitle>
              <CardDescription>
                Choose who will be responsible for this inspection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assign To</label>
                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {project?.project_members?.map((member) => (
                        <SelectItem key={member.profiles.id} value={member.profiles.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{member.profiles.name}</span>
                            <span className="text-xs text-gray-500">({member.role.replace('_', ' ')})</span>
                          </div>
                        </SelectItem>
                      )) || []}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAssignmentForm(false)
                      setSelectedChecklist('')
                      setSelectedAssignee('')
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateInspection}
                    disabled={creating || !selectedAssignee}
                  >
                    {creating ? 'Creating...' : 'Create Inspection'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}