'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, UserCheck } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

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
  assigned_to: string
  profiles?: {
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
  onAssignmentChanged 
}: AssignInspectionModalProps) {
  const { toast } = useToast()
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  const handleAssign = async () => {
    if (!inspection || !selectedAssignee) return

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/inspections/${inspection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_to: selectedAssignee
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inspection reassigned successfully",
        })
        onAssignmentChanged()
        handleClose()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to reassign inspection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error reassigning inspection:', error)
      toast({
        title: "Error",
        description: "Failed to reassign inspection",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    setSelectedAssignee('')
    onClose()
  }

  const currentAssignee = projectMembers.find(m => m.profiles.id === inspection?.assigned_to)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Inspection</DialogTitle>
          <DialogDescription>
            Change the assignee for "{inspection?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {currentAssignee && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Currently assigned to:</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <span>{currentAssignee.profiles.name}</span>
                <span className="text-xs text-gray-500">
                  ({currentAssignee.role.replace('_', ' ')})
                </span>
              </div>
            </div>
          )}

          {/* New Assignment */}
          <div>
            <label className="block text-sm font-medium mb-2">Reassign to:</label>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {projectMembers.map((member) => (
                  <SelectItem key={member.profiles.id} value={member.profiles.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{member.profiles.name}</span>
                      <span className="text-xs text-gray-500">
                        ({member.role.replace('_', ' ')})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedAssignee || isAssigning || selectedAssignee === inspection?.assigned_to}
          >
            {isAssigning ? (
              'Reassigning...'
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Reassign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}