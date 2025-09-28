'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, User, AlertTriangle } from 'lucide-react'
import { Database } from '@/lib/supabase/types'

type Inspection = Database['public']['Tables']['inspections']['Row'] & {
  project?: { name: string }
  assignee?: { name: string }
}

interface InspectionCardProps {
  inspection: Inspection | any // Allow any for mock data
  onAction?: (action: string, inspectionId: string) => void
  compact?: boolean
  showActions?: boolean
}

export function InspectionCard({ 
  inspection, 
  onAction, 
  compact = false,
  showActions = true 
}: InspectionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'approved': return 'bg-green-100 text-green-800'
      case 'in_review': case 'in-review': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatDueDate = (dueDate: string) => {
    if (!dueDate) return null
    
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`
    }
  }

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const getActionButton = () => {
    if (!showActions) return null

    const status = inspection.status?.toLowerCase()
    
    switch (status) {
      case 'pending':
        return (
          <Button 
            size="sm" 
            onClick={() => onAction?.('start', inspection.id)}
          >
            Start
          </Button>
        )
      case 'draft':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction?.('edit', inspection.id)}
          >
            Continue
          </Button>
        )
      case 'in_review':
      case 'in-review':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction?.('review', inspection.id)}
          >
            Review
          </Button>
        )
      case 'approved':
      case 'completed':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction?.('view', inspection.id)}
          >
            View
          </Button>
        )
      default:
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction?.('view', inspection.id)}
          >
            View
          </Button>
        )
    }
  }

  const dueDate = inspection.due_date || inspection.dueDate
  const overdue = isOverdue(dueDate)
  const dueDateText = formatDueDate(dueDate)
  const assigneeName = inspection.assignee?.name || inspection.assignee

  return (
    <Card className={`touch-manipulation ${overdue ? 'border-red-200' : ''}`}>
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={compact ? 'text-sm' : 'text-base'}>
              {inspection.title}
            </CardTitle>
            {inspection.project?.name && (
              <CardDescription className="text-xs">
                {inspection.project.name}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge className={getStatusColor(inspection.status)}>
              {inspection.status}
            </Badge>
            {inspection.priority && (
              <span className={`text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                {inspection.priority}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 space-y-1">
            {assigneeName && (
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {assigneeName}
              </div>
            )}
            {dueDateText && (
              <div className={`flex items-center ${overdue ? 'text-red-600' : ''}`}>
                {overdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                {!overdue && <Clock className="h-3 w-3 mr-1" />}
                {dueDateText}
              </div>
            )}
          </div>
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  )
}