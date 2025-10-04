'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { User, Clock, AlertTriangle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { supabaseDatabase } from '@/lib/supabase/database'

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

interface AssignInspectionModalProps {
  isOpen: boolean
  onClose: () => void
  inspection: Inspection | null
  projectMembers: ProjectMember[]
  onAssignmentChanged: () => void
}

export default function AssignInspectionModal({
  isOpen,
  onClose,
  inspection,
  projectMembers,
  onAssignmentChanged,
}: AssignInspectionModalProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const { toast } = useToast()

  // Get available inspectors from project members
  const availableInspectors = projectMembers.filter(
    member => member.profiles?.role === 'INSPECTOR' || member.role === 'INSPECTOR'
  )

  useEffect(() => {
    if (inspection && isOpen) {
      setSelectedAssignee(inspection.profiles?.id || '')
    }
  }, [inspection, isOpen])

  const handleAssign = async () => {
    if (!inspection || !selectedAssignee) return

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/inspections/${inspection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: selectedAssignee,
        }),
      })

      if (response.ok) {
        const assignedMember = availableInspectors.find(
          member => member.profiles.id === selectedAssignee
        )
        
        toast({
          title: "Assignment Updated",
          description: `Inspection reassigned to ${assignedMember?.profiles.name}`,
        })
        
        onAssignmentChanged()
        onClose()
      } else {
        const errorData = await response.json()
        toast({
          title: "Assignment Failed",
          description: errorData.error || "Failed to reassign inspection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error reassigning inspection:', error)
      toast({
        title: "Assignment Failed",
        description: "Failed to reassign inspection",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!inspection) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Inspection</DialogTitle>
          <DialogDescription>
            Change the inspector assigned to this inspection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inspection Details */}
          <div className="rounded-lg border p-3 bg-gray-50">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm">{inspection.title}</h4>
              <Badge className={getPriorityColor(inspection.priority)}>
                {inspection.priority}
              </Badge>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                Currently: {inspection.profiles?.name || 'Unassigned'}
              </div>
              {inspection.due_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Due: {new Date(inspection.due_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Inspector Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign To</label>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select inspector" />
              </SelectTrigger>
              <SelectContent>
                {availableInspectors.length > 0 ? (
                  availableInspectors.map((member) => (
                    <SelectItem key={member.profiles.id} value={member.profiles.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{member.profiles.name}</div>
                          <div className="text-xs text-gray-500">{member.profiles.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No inspectors available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Warning for status */}
          {inspection.status !== 'DRAFT' && inspection.status !== 'PENDING' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium">Status Warning</div>
                <div>This inspection is currently {inspection.status.toLowerCase()}. Reassigning may affect the current workflow.</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAssign}
              disabled={isAssigning || !selectedAssignee || selectedAssignee === inspection.profiles?.id}
              className="flex-1"
            >
              {isAssigning ? 'Reassigning...' : 'Reassign'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}