'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Users, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

interface BulkOperationsProps {
  inspections: any[]
  onBulkAction: (action: string, inspectionIds: string[], data?: any) => void
}

export function BulkOperations({ inspections, onBulkAction }: BulkOperationsProps) {
  const [selectedInspections, setSelectedInspections] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('')

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInspections(inspections.map(i => i.id))
    } else {
      setSelectedInspections([])
    }
  }

  const handleSelectInspection = (inspectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedInspections(prev => [...prev, inspectionId])
    } else {
      setSelectedInspections(prev => prev.filter(id => id !== inspectionId))
    }
  }

  const handleBulkAction = () => {
    if (selectedInspections.length === 0 || !bulkAction) return

    const actionData: any = {}
    if (assignee) actionData.assignee = assignee
    if (priority) actionData.priority = priority

    onBulkAction(bulkAction, selectedInspections, actionData)
    setSelectedInspections([])
    setBulkAction('')
    setAssignee('')
    setPriority('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'LOW': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Bulk Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedInspections.length === inspections.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">
              {selectedInspections.length} of {inspections.length} selected
            </span>
          </div>

          {selectedInspections.length > 0 && (
            <>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve All</SelectItem>
                  <SelectItem value="reject">Reject All</SelectItem>
                  <SelectItem value="reassign">Reassign</SelectItem>
                  <SelectItem value="update_priority">Update Priority</SelectItem>
                  <SelectItem value="extend_deadline">Extend Deadline</SelectItem>
                  <SelectItem value="add_note">Add Note</SelectItem>
                </SelectContent>
              </Select>

              {bulkAction === 'reassign' && (
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspector1">John Smith</SelectItem>
                    <SelectItem value="inspector2">Sarah Johnson</SelectItem>
                    <SelectItem value="inspector3">Mike Chen</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {bulkAction === 'update_priority' && (
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction}
                size="sm"
              >
                Apply to {selectedInspections.length} items
              </Button>
            </>
          )}
        </div>

        {/* Inspections List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {inspections.map((inspection) => (
            <div 
              key={inspection.id} 
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
            >
              <Checkbox
                checked={selectedInspections.includes(inspection.id)}
                onCheckedChange={(checked) => handleSelectInspection(inspection.id, checked as boolean)}
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{inspection.title}</h4>
                  <Badge className={getStatusColor(inspection.status)}>
                    {inspection.status.replace('_', ' ')}
                  </Badge>
                  <span className={`text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                    {inspection.priority}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {(inspection as any).profiles?.name || 'Unassigned'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {inspection.due_date ? new Date(inspection.due_date).toLocaleDateString() : 'No deadline'}
                  </span>
                  {inspection.due_date && new Date(inspection.due_date) < new Date() && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inspection.status === 'IN_REVIEW' && (
                  <>
                    <Button size="sm" variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {inspections.filter(i => i.status === 'IN_REVIEW').length}
            </div>
            <div className="text-xs text-gray-500">Pending Review</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {inspections.filter(i => i.priority === 'HIGH').length}
            </div>
            <div className="text-xs text-gray-500">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {inspections.filter(i => 
                i.due_date && new Date(i.due_date) < new Date()
              ).length}
            </div>
            <div className="text-xs text-gray-500">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {inspections.filter(i => i.status === 'APPROVED').length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
