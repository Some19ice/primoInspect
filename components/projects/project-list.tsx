'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, Clock } from 'lucide-react'
import { Database } from '@/lib/supabase/types'

type Project = Database['public']['Tables']['projects']['Row'] & {
  members?: any[]
  inspections?: Database['public']['Tables']['inspections']['Row'][]
}

interface ProjectListProps {
  projects: Project[]
  loading?: boolean
  userProjects?: string[]
  onProjectClick?: (projectId: string) => void
  onViewDetails?: (projectId: string) => void
  onManageProject?: (projectId: string) => void
}

export function ProjectList({ 
  projects, 
  loading = false, 
  userProjects = [],
  onProjectClick,
  onViewDetails,
  onManageProject
}: ProjectListProps) {
  const getStatusColor = (status: string | null) => {
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No projects found</p>
          <Button className="mt-4">Create Project</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card 
          key={project.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onProjectClick?.(project.id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="mt-1">
                  {project.description || 'No description provided'}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {project.members?.length || 0} members
                </span>
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {project.inspections?.length || 0} inspections
                </span>
                {userProjects.includes(project.id) && (
                  <Badge variant="outline" className="text-xs">
                    Member
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails?.(project.id)}
                >
                  View Details
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onManageProject?.(project.id)}
                >
                  Manage
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}