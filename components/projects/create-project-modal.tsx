'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectForm } from '@/components/forms/project-form'
import { Badge } from '@/components/ui/badge'
import { Sun, Wind, Battery, Zap } from 'lucide-react'

interface ProjectTemplate {
  id: string
  name: string
  type: 'SOLAR' | 'WIND' | 'BATTERY' | 'HYBRID'
  description: string
  icon: React.ReactNode
  defaultChecklists: string[]
  estimatedDuration: string
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'solar-farm',
    name: 'Solar Farm',
    type: 'SOLAR',
    description: 'Large-scale solar photovoltaic installation',
    icon: <Sun className="h-6 w-6" />,
    defaultChecklists: ['Solar Panel Inspection', 'Electrical Systems', 'Safety Compliance'],
    estimatedDuration: '3-6 months'
  },
  {
    id: 'wind-farm',
    name: 'Wind Farm',
    type: 'WIND',
    description: 'Wind turbine installation and maintenance',
    icon: <Wind className="h-6 w-6" />,
    defaultChecklists: ['Turbine Inspection', 'Foundation Check', 'Electrical Systems'],
    estimatedDuration: '6-12 months'
  },
  {
    id: 'battery-storage',
    name: 'Battery Storage',
    type: 'BATTERY',
    description: 'Energy storage system installation',
    icon: <Battery className="h-6 w-6" />,
    defaultChecklists: ['Battery Systems', 'Safety Systems', 'Control Systems'],
    estimatedDuration: '2-4 months'
  },
  {
    id: 'hybrid-system',
    name: 'Hybrid System',
    type: 'HYBRID',
    description: 'Combined renewable energy systems',
    icon: <Zap className="h-6 w-6" />,
    defaultChecklists: ['Multi-System Integration', 'Safety Compliance', 'Performance Testing'],
    estimatedDuration: '6-18 months'
  }
]

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: (project: any) => void
}

export function CreateProjectModal({ open, onOpenChange, onProjectCreated }: CreateProjectModalProps) {
  const [step, setStep] = useState<'template' | 'form'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setStep('form')
  }

  const handleProjectSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const projectData = {
        ...data,
        type: selectedTemplate?.type,
        template_id: selectedTemplate?.id,
        default_checklists: selectedTemplate?.defaultChecklists
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        const project = await response.json()
        onProjectCreated(project)
        onOpenChange(false)
        setStep('template')
        setSelectedTemplate(null)
      } else {
        const errorData = await response.json()
        console.error('Project creation failed:', errorData)
        
        let errorMessage = 'Unknown error'
        if (errorData.error) {
          if (errorData.error.code === 'VALIDATION_ERROR' && errorData.error.details) {
            // Show validation errors
            const validationErrors = Array.isArray(errorData.error.details) 
              ? errorData.error.details.map((err: any) => err.message).join(', ')
              : errorData.error.details
            errorMessage = `Validation error: ${validationErrors}`
          } else {
            errorMessage = errorData.error.message || errorData.error
          }
        }
        
        alert(`Failed to create project: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('template')
    setSelectedTemplate(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'template' ? 'Choose Project Template' : 'Create Project'}
          </DialogTitle>
        </DialogHeader>

        {step === 'template' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Select a template to get started with pre-configured checklists and workflows.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROJECT_TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {template.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3">
                      {template.description}
                    </CardDescription>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Duration:</span> {template.estimatedDuration}
                      </div>
                      <div>
                        <span className="font-medium">Includes:</span>
                        <ul className="list-disc list-inside mt-1 text-gray-600">
                          {template.defaultChecklists.map((checklist, index) => (
                            <li key={index}>{checklist}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => handleTemplateSelect({
                  id: 'custom',
                  name: 'Custom Project',
                  type: 'HYBRID',
                  description: 'Start from scratch',
                  icon: <Zap className="h-6 w-6" />,
                  defaultChecklists: [],
                  estimatedDuration: 'Variable'
                })}
                className="w-full"
              >
                Start with Custom Project (No Template)
              </Button>
            </div>
          </div>
        )}

        {step === 'form' && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {selectedTemplate.icon}
              </div>
              <div>
                <h3 className="font-medium">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleBack}>
                Change Template
              </Button>
            </div>

            <ProjectForm
              onSubmit={handleProjectSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isLoading}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
