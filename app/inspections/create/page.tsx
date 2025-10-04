'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User, Clock, AlertCircle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/utils'

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
  estimatedDuration?: number
  categories?: string[]
  version?: string
  isTemplate?: boolean
}

export default function CreateInspectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8">Loading...</div>}>
      <CreateInspectionPageContent />
    </Suspense>
  )
}

function CreateInspectionPageContent() {
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [showChecklistPreview, setShowChecklistPreview] = useState(false)
  const [previewChecklist, setPreviewChecklist] = useState<Checklist | null>(null)
  
  const projectId = searchParams.get('projectId')

  useEffect(() => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project ID provided",
        variant: "destructive",
      })
      router.push('/')
      return
    }
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
        // Auto-generate initial title
        setTitle(`Inspection for ${projectData.name}`)
      } else {
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive",
        })
        router.push('/')
        return
      }

      // Fetch available checklists for the project
      const checklistsResponse = await fetch(`/api/checklists?projectId=${projectId}`)
      if (checklistsResponse.ok) {
        const checklistsData = await checklistsResponse.json()
        setChecklists(checklistsData)
      } else {
        toast({
          title: "Warning",
          description: "No checklists found for this project",
          variant: "default",
        })
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
    setShowChecklistPreview(false)
    // Default to current user if no assignee selected
    if (!selectedAssignee) {
      setSelectedAssignee(profile?.id || '')
    }
  }

  const handlePreviewChecklist = (checklist: Checklist) => {
    setPreviewChecklist(checklist)
    setShowChecklistPreview(true)
  }

  const handleCreateInspection = async () => {
    if (!project || !profile || !selectedChecklist || !selectedAssignee) {
      toast({
        title: "Error",
        description: "Please complete all required fields",
        variant: "destructive",
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an inspection title",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const requestData = {
        projectId: projectId,
        checklistId: selectedChecklist,
        assignedTo: selectedAssignee,
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority,
        dueDate: dueDate || undefined
      }
      
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const inspection = await response.json()
        const assigneeName = project?.project_members?.find(m => m.profiles.id === selectedAssignee)?.profiles.name || 'inspector'
        toast({
          title: "Success",
          description: `Inspection assigned to ${assigneeName}. They will be notified to start the inspection.`,
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
            <h1 className="text-2xl font-bold text-gray-900">Create Inspection Assignment</h1>
            <p className="text-gray-600">Assign an inspection to a team member for {project.name}</p>
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
                  <Card 
                    key={checklist.id} 
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all",
                      selectedChecklist === checklist.id && "ring-2 ring-blue-500 shadow-lg"
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {checklist.name}
                            {selectedChecklist === checklist.id && (
                              <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {checklist.description || 'No description provided'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {checklist.questions?.length || 0} questions
                          </span>
                          {checklist.estimatedDuration && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Clock className="h-4 w-4" />
                              {checklist.estimatedDuration} min
                            </span>
                          )}
                        </div>
                        {checklist.categories && checklist.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {checklist.categories.slice(0, 3).map((cat) => (
                              <span key={cat} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {cat}
                              </span>
                            ))}
                            {checklist.categories.length > 3 && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                +{checklist.categories.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewChecklist(checklist)}
                            disabled={creating}
                            className="flex-1"
                          >
                            Preview
                          </Button>
                          <Button 
                            onClick={() => handleSelectChecklist(checklist.id)}
                            disabled={creating}
                            className="flex-1"
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist Preview Modal */}
        {showChecklistPreview && previewChecklist && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview: {previewChecklist.name}</CardTitle>
                  <CardDescription>
                    {previewChecklist.questions?.length || 0} questions • 
                    {previewChecklist.estimatedDuration ? `${previewChecklist.estimatedDuration} minutes` : 'Time not specified'}
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setShowChecklistPreview(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {previewChecklist.categories && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewChecklist.categories.map((cat) => (
                        <span key={cat} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-2">Sample Questions</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {previewChecklist.questions?.slice(0, 10).map((q: any, idx: number) => (
                      <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="flex items-start gap-2">
                          {q.required && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
                          <span className="flex-1">{q.question}</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-500">{q.type}</span>
                          {q.evidenceRequired && (
                            <span className="text-xs text-blue-600">Photo required</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {previewChecklist.questions && previewChecklist.questions.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {previewChecklist.questions.length - 10} more questions
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => handleSelectChecklist(previewChecklist.id)}
                  className="w-full"
                >
                  Select This Checklist
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspection Details Form */}
        {showAssignmentForm && (
          <Card>
            <CardHeader>
              <CardTitle>Inspection Assignment Details</CardTitle>
              <CardDescription>
                Configure the inspection and assign it to an inspector. They will start and complete the inspection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter inspection title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any additional notes or context"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as 'LOW' | 'MEDIUM' | 'HIGH')}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (Optional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To *</Label>
                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {project?.project_members && project.project_members.length > 0 ? (
                        project.project_members.map((member) => (
                          <SelectItem key={member.profiles.id} value={member.profiles.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{member.profiles.name}</span>
                              <span className="text-xs text-gray-500">({member.role.replace('_', ' ')})</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={profile?.id || 'self'} disabled>
                          No team members available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAssignmentForm(false)
                      setSelectedChecklist('')
                    }}
                    disabled={creating}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateInspection}
                    disabled={creating || !selectedAssignee || !title.trim()}
                    className="flex-1"
                  >
                    {creating ? 'Creating Assignment...' : 'Create & Assign Inspection'}
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
