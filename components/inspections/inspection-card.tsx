'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  showActions = true,
}: InspectionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      // Legacy status handling for backward compatibility
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'text-red-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      case 'LOW':
        return 'text-green-600'
      default:
        return 'text-gray-600'
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

    const status = inspection.status?.toUpperCase()

    switch (status) {
      case 'PENDING':
        return (
          <Button size="sm" onClick={() => onAction?.('start', inspection.id)}>
            Start
          </Button>
        )
      case 'DRAFT':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction?.('edit', inspection.id)}
          >
            Continue
          </Button>
        )
      case 'IN_REVIEW':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction?.('review', inspection.id)}
          >
            Review
          </Button>
        )
      case 'APPROVED':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction?.('view', inspection.id)}
          >
            View
          </Button>
        )
      case 'REJECTED':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction?.('revise', inspection.id)}
          >
            Revise
          </Button>
        )
      // Legacy status handling
      case 'COMPLETED':
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
              {inspection.status?.replace('_', ' ')}
            </Badge>
            {inspection.priority && (
              <span
                className={`text-xs font-medium ${getPriorityColor(inspection.priority)}`}
              >
                {inspection.priority}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-gray-500">
            {assigneeName && (
              <div className="flex items-center">
                <User className="mr-1 h-3 w-3" />
                {assigneeName}
              </div>
            )}
            {dueDateText && (
              <div
                className={`flex items-center ${overdue ? 'text-red-600' : ''}`}
              >
                {overdue && <AlertTriangle className="mr-1 h-3 w-3" />}
                {!overdue && <Clock className="mr-1 h-3 w-3" />}
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
