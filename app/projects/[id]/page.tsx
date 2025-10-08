'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, FileText, MapPin, Calendar, Settings, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useToast } from '@/lib/hooks/use-toast'

interface Project {
  id: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

interface ProjectStats {
  totalInspections: number
  completedInspections: number
  pendingInspections: number
  teamMembers: number
  overdueInspections: number
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)

  const projectId = params.id as string

  useEffect(() => {
    if (projectId && profile) {
      fetchProject()
    }
  }, [projectId, profile])

  const fetchProject = async () => {
    try {
      const [projectResponse, inspectionsResponse, membersResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/inspections`),
        fetch(`/api/projects/${projectId}/members`)
      ])

      if (projectResponse.ok) {
        const data = await projectResponse.json()
        setProject(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive",
        })
      }

      // Calculate stats
      if (inspectionsResponse.ok && membersResponse.ok) {
        const inspectionsData = await inspectionsResponse.json()
        const members = await membersResponse.json()

        // Handle both array and paginated response formats
        const inspections = Array.isArray(inspectionsData)
          ? inspectionsData
          : inspectionsData.data || inspectionsData.inspections || []

        const now = new Date()
        const completedCount = inspections.filter(
          (i: any) => i.status === 'APPROVED'
        ).length
        const pendingCount = inspections.filter(
          (i: any) => i.status && !['APPROVED', 'REJECTED'].includes(i.status)
        ).length
        const overdueCount = inspections.filter(
          (i: any) =>
            i.due_date &&
            new Date(i.due_date) < now &&
            i.status &&
            !['APPROVED', 'REJECTED'].includes(i.status)
        ).length

        setStats({
          totalInspections: inspections.length,
          completedInspections: completedCount,
          pendingInspections: pendingCount,
          teamMembers: members.length,
          overdueInspections: overdueCount,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">Project Details</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/projects/${projectId}/manage`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>

        {/* Project Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <CardDescription className="mt-2">
                  {project.description || 'No description provided'}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-gray-600">
                      {new Date(project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {project.end_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-gray-600">
                        {new Date(project.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {project.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-gray-600">{project.address}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Inspections</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalInspections}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedInspections}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingInspections}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Team Members</p>
                    <p className="text-2xl font-bold mt-1">{stats.teamMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overdue Alert */}
        {stats && stats.overdueInspections > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">
                    {stats.overdueInspections} overdue inspection{stats.overdueInspections > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-700">
                    These inspections require immediate attention
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => router.push(`/projects/${projectId}/inspections?filter=overdue`)}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
            onClick={() => router.push(`/projects/${projectId}/inspections`)}
          >
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Inspections</h3>
              <p className="text-sm text-gray-600">View and manage inspections</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-green-300"
            onClick={() => router.push(`/projects/${projectId}/manage?tab=team`)}
          >
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Team</h3>
              <p className="text-sm text-gray-600">Manage team members</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-gray-400"
            onClick={() => router.push(`/projects/${projectId}/manage?tab=settings`)}
          >
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <h3 className="font-medium">Settings</h3>
              <p className="text-sm text-gray-600">Project configuration</p>
            </CardContent>
          </Card>
        </div>
        </div>

        {/* Progress Overview */}
        {stats && stats.totalInspections > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-gray-600">
                      {Math.round((stats.completedInspections / stats.totalInspections) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.completedInspections / stats.totalInspections) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.completedInspections}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingInspections}</p>
                    <p className="text-xs text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.overdueInspections}</p>
                    <p className="text-xs text-gray-600">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}