'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Camera, 
  FileText, 
  Users,
  TrendingUp,
  Activity
} from 'lucide-react'

interface InspectionProgress {
  id: string
  title: string
  assignedTo: {
    id: string
    name: string
    email: string
  }
  status: string
  priority: string
  dueDate: string | null
  progress: {
    totalQuestions: number
    answeredQuestions: number
    requiredAnswered: number
    evidenceProvided: number
    completionRate: number
    lastUpdated: string
  }
  checklist: {
    name: string
    estimatedDuration: number
  }
}

interface InspectionProgressDashboardProps {
  projectId: string
  onInspectionClick?: (inspectionId: string) => void
  onAssignInspection?: (inspectionId: string) => void
}

export function InspectionProgressDashboard({
  projectId,
  onInspectionClick,
  onAssignInspection,
}: InspectionProgressDashboardProps) {
  const [inspections, setInspections] = useState<InspectionProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('active')

  useEffect(() => {
    fetchInspectionProgress()
    
    // Set up real-time updates
    const interval = setInterval(fetchInspectionProgress, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [projectId])

  const fetchInspectionProgress = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/inspections?includeProgress=true`)
      if (response.ok) {
        const data = await response.json()
        setInspections(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching inspection progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'MEDIUM': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'LOW': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const getTimeRemaining = (dueDate: string | null) => {
    if (!dueDate) return null
    
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `${diffDays} days remaining`
    }
  }

  const filteredInspections = inspections.filter(inspection => {
    switch (filter) {
      case 'active':
        return ['DRAFT', 'PENDING', 'IN_REVIEW'].includes(inspection.status.toUpperCase())
      case 'overdue':
        return isOverdue(inspection.dueDate) && !['APPROVED', 'REJECTED'].includes(inspection.status.toUpperCase())
      case 'completed':
        return ['APPROVED'].includes(inspection.status.toUpperCase())
      default:
        return true
    }
  })

  const stats = {
    total: inspections.length,
    active: inspections.filter(i => ['DRAFT', 'PENDING', 'IN_REVIEW'].includes(i.status.toUpperCase())).length,
    overdue: inspections.filter(i => isOverdue(i.dueDate) && !['APPROVED', 'REJECTED'].includes(i.status.toUpperCase())).length,
    completed: inspections.filter(i => i.status.toUpperCase() === 'APPROVED').length,
    avgProgress: inspections.length > 0 
      ? Math.round(inspections.reduce((sum, i) => sum + i.progress.completionRate, 0) / inspections.length)
      : 0
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-5 w-5 animate-spin mr-2" />
            Loading inspection progress...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'active', label: 'Active', count: stats.active },
          { key: 'overdue', label: 'Overdue', count: stats.overdue },
          { key: 'completed', label: 'Completed', count: stats.completed },
        ].map(tab => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(tab.key as any)}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {/* Inspection Progress List */}
      <div className="space-y-4">
        {filteredInspections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No inspections match the current filter</p>
            </CardContent>
          </Card>
        ) : (
          filteredInspections.map(inspection => (
            <Card 
              key={inspection.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                isOverdue(inspection.dueDate) ? 'border-l-4 border-l-red-500' : ''
              }`}
              onClick={() => onInspectionClick?.(inspection.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getPriorityIcon(inspection.priority)}
                      {inspection.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {inspection.assignedTo.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {inspection.checklist.name}
                        </span>
                        {inspection.dueDate && (
                          <span className={`flex items-center gap-1 ${
                            isOverdue(inspection.dueDate) ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {getTimeRemaining(inspection.dueDate)}
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status.replace('_', ' ')}
                    </Badge>
                    {onAssignInspection && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAssignInspection(inspection.id)
                        }}
                      >
                        Reassign
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span>{inspection.progress.completionRate}%</span>
                    </div>
                    <Progress value={inspection.progress.completionRate} className="h-2" />
                  </div>

                  {/* Progress Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>
                        {inspection.progress.answeredQuestions}/{inspection.progress.totalQuestions} Questions
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                        {inspection.progress.requiredAnswered} Required
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-purple-500" />
                      <span>
                        {inspection.progress.evidenceProvided} Evidence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>
                        Updated {new Date(inspection.progress.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Status Indicator */}
                  {inspection.status === 'DRAFT' && inspection.progress.completionRate > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      <Activity className="h-4 w-4" />
                      Inspector is actively working on this inspection
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}