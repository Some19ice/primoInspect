'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Users, FileText, Settings, Plus, Edit, Save, X, Trash2, CheckCircle, Clock, AlertCircle, UserMinus, UserCog, UserCheck } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'
import AddMemberModal from '@/components/project/AddMemberModal'
import AssignInspectionModal from '@/components/project/AssignInspectionModal'

interface ProjectMember {
  role: string
  profiles: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface Inspection {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  created_at: string
  profiles: {
    id: string
    name: string
    email: string
  }
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string | null
  address: string | null
  created_at: string
  updated_at: string
  project_members?: ProjectMember[]
}

export default function ProjectManagePage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [inspectionsLoading, setInspectionsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: '',
    end_date: ''
  })

  const projectId = params.id as string

  useEffect(() => {
    if (projectId && profile) {
      fetchProject()
      fetchInspections()
    }
  }, [projectId, profile])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        setEditForm({
          name: data.name || '',
          description: data.description || '',
          status: data.status || 'ACTIVE',
          end_date: data.end_date ? data.end_date.split('T')[0] : ''
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchInspections = async () => {
    setInspectionsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/inspections`)
      console.log('Inspections API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Inspections API response data:', data)
        setInspections(data.data || [])
      } else {
        const errorData = await response.json()
        console.error('Inspections API error:', errorData)
        toast({
          title: "Error",
          description: "Failed to load inspections",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching inspections:', error)
      toast({
        title: "Error",
        description: "Failed to load inspections",
        variant: "destructive",
      })
    } finally {
      setInspectionsLoading(false)
    }
  }

  const handleCreateInspection = () => {
    router.push(`/inspections/create?projectId=${projectId}`)
  }

  const handleAddMember = () => {
    setShowAddMemberModal(true)
  }

  const handleMemberAdded = () => {
    fetchProject() // Refresh project data to get updated members
  }

  const handleReassignInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection)
    setShowAssignModal(true)
  }

  const handleAssignmentChanged = () => {
    fetchInspections() // Refresh inspections to show updated assignments
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userName} has been removed from the project`,
        })
        fetchProject() // Refresh project data
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMemberRole = async (userId: string, userName: string, newRole: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userName}'s role has been updated`,
        })
        fetchProject() // Refresh project data
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update member role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      })
    }
  }

  const handleEditProject = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (project) {
      setEditForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'ACTIVE',
        end_date: project.end_date ? project.end_date.split('T')[0] : ''
      })
    }
  }

  const handleSaveProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          status: editForm.status,
          end_date: editForm.end_date || null
        }),
      })

      if (response.ok) {
        const updatedProject = await response.json()
        setProject(updatedProject)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Project updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update project",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        })
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete project",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInspectionStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING': case 'IN_REVIEW': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'REJECTED': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProjectStats = () => {
    const total = inspections.length
    const completed = inspections.filter(i => i.status === 'APPROVED').length
    const pending = inspections.filter(i => ['DRAFT', 'PENDING'].includes(i.status)).length
    const inReview = inspections.filter(i => i.status === 'IN_REVIEW').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const teamMembers = project?.project_members?.length || 1

    return { total, completed, pending, inReview, completionRate, teamMembers }
  }

  const stats = getProjectStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Manage {project.name}</h1>
            <p className="text-gray-600">Project Management Dashboard</p>
          </div>
          <div className="flex items-center gap-2">

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const data = {
                  project: project,
                  inspections: inspections,
                  stats: stats
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${project.name.replace(/\s+/g, '_')}_export.json`
                a.click()
                URL.revokeObjectURL(url)
                toast({
                  title: "Success",
                  description: "Project data exported successfully",
                })
              }}
            >
              Export Data
            </Button>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>

        {/* Management Sections */}
        <div className="space-y-6">
          {/* Overview Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Inspections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-sm text-gray-600">
                    {stats.total === 0 ? 'No inspections yet' : 'Active inspections'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.teamMembers}</div>
                  <p className="text-sm text-gray-600">Project team size</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-sm text-gray-600">Approved inspections</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">In Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.inReview}</div>
                  <p className="text-sm text-gray-600">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completionRate}%</div>
                  <p className="text-sm text-gray-600">
                    {stats.total === 0 ? 'No data yet' : `${stats.completed} of ${stats.total}`}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inspections.slice(0, 3).map((inspection) => (
                    <div key={inspection.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {getInspectionStatusIcon(inspection.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{inspection.title}</p>
                        <p className="text-xs text-gray-600">
                          {inspection.status === 'APPROVED' ? 'Completed' : 
                           inspection.status === 'IN_REVIEW' ? 'Submitted for review' :
                           inspection.status === 'PENDING' ? 'Submitted' : 'Created'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(inspection.created_at).toLocaleDateString()} • {inspection.profiles?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                  {inspections.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent activity</p>
                      <p className="text-sm">Activity will appear here as team members work on inspections</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inspections Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inspections</CardTitle>
                    <CardDescription>Manage project inspections</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchInspections}>
                      Refresh
                    </Button>
                    <Button onClick={handleCreateInspection}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Inspection
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {inspectionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : inspections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No inspections created yet</p>
                    <p className="text-sm">Create your first inspection to get started</p>
                    <Button className="mt-4" onClick={handleCreateInspection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Inspection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspections.slice(0, 5).map((inspection) => (
                      <div
                        key={inspection.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/inspections/${inspection.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          {getInspectionStatusIcon(inspection.status)}
                          <div>
                            <p className="font-medium">{inspection.title}</p>
                            <p className="text-sm text-gray-600">
                              Assigned to {inspection.profiles?.name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(inspection.priority)}>
                            {inspection.priority}
                          </Badge>
                          <Badge variant="outline">
                            {inspection.status}
                          </Badge>
                          {inspection.due_date && (
                            <span className="text-sm text-gray-500">
                              Due {new Date(inspection.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {profile?.role === 'PROJECT_MANAGER' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReassignInspection(inspection)
                              }}
                              title="Reassign inspection"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {inspections.length > 5 && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/projects/${projectId}/inspections`)}
                        >
                          View All {inspections.length} Inspections
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage project team</CardDescription>
                  </div>
                  <Button onClick={handleAddMember}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project?.project_members && project.project_members.length > 0 ? (
                    project.project_members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{member.profiles?.name || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600">{member.profiles?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === 'PROJECT_MANAGER' ? 'default' : 'secondary'}>
                            {member.role.replace('_', ' ')}
                          </Badge>
                          {profile?.role === 'PROJECT_MANAGER' && member.profiles?.id !== profile?.id && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateMemberRole(
                                  member.profiles!.id,
                                  member.profiles!.name,
                                  member.role === 'PROJECT_MANAGER' ? 'INSPECTOR' : 'PROJECT_MANAGER'
                                )}
                                title={member.role === 'PROJECT_MANAGER' ? 'Make Inspector' : 'Make Manager'}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.profiles!.id, member.profiles!.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Remove Member"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{profile?.name}</p>
                          <p className="text-sm text-gray-600">{profile?.email}</p>
                        </div>
                      </div>
                      <Badge>Project Manager</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>Configure project details and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Project Information</h3>
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={handleEditProject}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Project Name</label>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Enter project name"
                        />
                      ) : (
                        <Input value={project.name} readOnly />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Status</label>
                      {isEditing ? (
                        <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="ON_HOLD">On Hold</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={project.status} readOnly />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <Input 
                        value={project.start_date ? new Date(project.start_date).toLocaleDateString() : ''} 
                        readOnly 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editForm.end_date}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                        />
                      ) : (
                        <Input 
                          value={project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'} 
                          readOnly 
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Enter project description"
                        className="h-24"
                      />
                    ) : (
                      <Textarea 
                        value={project.description || 'No description provided'} 
                        readOnly 
                        className="h-24"
                      />
                    )}
                  </div>

                  {project.address && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <Input value={project.address} readOnly />
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProject}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}

                  {!isEditing && profile?.role === 'PROJECT_MANAGER' && (
                    <div className="pt-6 border-t">
                      <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Once you delete a project, there is no going back. Please be certain.
                      </p>
                      <Button 
                        className="bg-red-600 hover:bg-red-700 text-white" 
                        size="sm" 
                        onClick={handleDeleteProject}
                        disabled={inspections.length > 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </Button>
                      {inspections.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Cannot delete project with existing inspections
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        projectId={projectId}
        onMemberAdded={handleMemberAdded}
      />

      {/* Assign Inspection Modal */}
      <AssignInspectionModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        inspection={selectedInspection}
        projectMembers={project?.project_members || []}
        onAssignmentChanged={handleAssignmentChanged}
      />
    </div>
  )
}