'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Search, Filter, Plus, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'

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
}

export default function ProjectInspectionsPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

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
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  const fetchInspections = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/inspections?limit=100`)
      if (response.ok) {
        const data = await response.json()
        setInspections(data.data || [])
      } else {
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
      setLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || inspection.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

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
            <h1 className="text-2xl font-bold text-gray-900">
              {project?.name} - Inspections
            </h1>
            <p className="text-gray-600">
              {filteredInspections.length} of {inspections.length} inspections
            </p>
          </div>
          <Button onClick={() => router.push(`/inspections/create?projectId=${projectId}`)}>
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search inspections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inspections List */}
        <Card>
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
            <CardDescription>
              Manage all inspections for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {inspections.length === 0 
                    ? 'No inspections created yet' 
                    : 'No inspections match your filters'
                  }
                </p>
                <p className="text-sm">
                  {inspections.length === 0 
                    ? 'Create your first inspection to get started'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {inspections.length === 0 && (
                  <Button 
                    className="mt-4" 
                    onClick={() => router.push(`/inspections/create?projectId=${projectId}`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Inspection
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/inspections/${inspection.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {getInspectionStatusIcon(inspection.status)}
                      <div>
                        <p className="font-medium">{inspection.title}</p>
                        <p className="text-sm text-gray-600">
                          Assigned to {inspection.profiles?.name || 'Unassigned'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(inspection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(inspection.priority)}>
                        {inspection.priority}
                      </Badge>
                      <Badge className={getStatusColor(inspection.status)}>
                        {inspection.status}
                      </Badge>
                      {inspection.due_date && (
                        <span className="text-sm text-gray-500">
                          Due {new Date(inspection.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}