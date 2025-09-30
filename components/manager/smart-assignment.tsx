'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

interface Inspector {
  id: string
  name: string
  currentWorkload: number
  efficiency: number
  specialties: string[]
  location: { lat: number; lng: number }
  availability: 'available' | 'busy' | 'offline'
  estimatedCapacity: number
}

interface SmartAssignmentProps {
  inspectors: Inspector[]
  inspection: {
    id: string
    title: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    estimatedDuration: number
    requiredSkills: string[]
    location?: { lat: number; lng: number }
    dueDate: string
  }
  onAssign: (inspectorId: string, reasoning: string[]) => void
  onCancel: () => void
}

export function SmartAssignment({ inspectors, inspection, onAssign, onCancel }: SmartAssignmentProps) {
  const [selectedInspector, setSelectedInspector] = useState<string>('')
  const [recommendations, setRecommendations] = useState<Array<{
    inspectorId: string
    score: number
    reasoning: string[]
    workloadAfter: number
  }>>([])

  useEffect(() => {
    // Calculate smart recommendations
    const scored = inspectors.map(inspector => {
      let score = 100
      const reasoning: string[] = []
      
      // Factor 1: Current workload (40% weight)
      const workloadScore = Math.max(0, 100 - inspector.currentWorkload)
      score = score * 0.4 + workloadScore * 0.4
      
      if (inspector.currentWorkload < 60) {
        reasoning.push('Low current workload - has capacity')
      } else if (inspector.currentWorkload > 85) {
        reasoning.push('High workload - may cause delays')
        score -= 20
      }
      
      // Factor 2: Efficiency rating (25% weight)
      score = score * 0.75 + inspector.efficiency * 0.25
      
      if (inspector.efficiency > 90) {
        reasoning.push('High efficiency rating')
      } else if (inspector.efficiency < 70) {
        reasoning.push('Below average efficiency')
      }
      
      // Factor 3: Skill match (20% weight)
      const skillMatch = inspection.requiredSkills.filter(skill => 
        inspector.specialties.includes(skill)
      ).length / Math.max(inspection.requiredSkills.length, 1)
      
      score = score * 0.8 + skillMatch * 100 * 0.2
      
      if (skillMatch > 0.8) {
        reasoning.push('Excellent skill match')
      } else if (skillMatch < 0.5) {
        reasoning.push('Limited skill match')
      }
      
      // Factor 4: Availability (15% weight)
      if (inspector.availability === 'available') {
        reasoning.push('Currently available')
      } else if (inspector.availability === 'busy') {
        score -= 15
        reasoning.push('Currently busy')
      } else {
        score -= 30
        reasoning.push('Currently offline')
      }
      
      // Factor 5: Location proximity (if location provided)
      if (inspection.location && inspector.location) {
        const distance = calculateDistance(inspection.location, inspector.location)
        if (distance < 10) {
          reasoning.push('Close to inspection site')
          score += 5
        } else if (distance > 50) {
          reasoning.push('Far from inspection site')
          score -= 10
        }
      }
      
      // Priority adjustment
      if (inspection.priority === 'HIGH' && inspector.efficiency > 85) {
        score += 10
        reasoning.push('High performer for priority task')
      }
      
      const workloadAfter = inspector.currentWorkload + (inspection.estimatedDuration / inspector.estimatedCapacity * 100)
      
      return {
        inspectorId: inspector.id,
        score: Math.max(0, Math.min(100, score)),
        reasoning,
        workloadAfter
      }
    })
    
    // Sort by score and take top recommendations
    const sorted = scored.sort((a, b) => b.score - a.score)
    setRecommendations(sorted)
    
    // Auto-select best recommendation if it's significantly better
    if (sorted.length > 0 && sorted[0].score > 80) {
      setSelectedInspector(sorted[0].inspectorId)
    }
  }, [inspectors, inspection])

  const handleAssign = () => {
    if (!selectedInspector) return
    
    const recommendation = recommendations.find(r => r.inspectorId === selectedInspector)
    onAssign(selectedInspector, recommendation?.reasoning || [])
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'text-red-600'
    if (workload >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Smart Assignment Recommendations
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p><strong>{inspection.title}</strong></p>
          <div className="flex items-center gap-4 mt-1">
            <Badge variant={inspection.priority === 'HIGH' ? 'destructive' : 'outline'}>
              {inspection.priority} Priority
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {inspection.estimatedDuration}h estimated
            </span>
            <span>Due: {new Date(inspection.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Top Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recommended Inspectors
          </h4>
          
          {recommendations.slice(0, 3).map((rec, index) => {
            const inspector = inspectors.find(i => i.id === rec.inspectorId)
            if (!inspector) return null
            
            return (
              <div 
                key={inspector.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedInspector === inspector.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedInspector(inspector.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{inspector.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{inspector.name}</h5>
                        {index === 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Best Match
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {inspector.currentWorkload}% workload
                        </span>
                        <span>{inspector.efficiency}% efficiency</span>
                        <Badge variant="outline" className="text-xs">
                          {inspector.availability}
                        </Badge>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">
                          Workload after assignment: 
                          <span className={`ml-1 font-medium ${getWorkloadColor(rec.workloadAfter)}`}>
                            {Math.round(rec.workloadAfter)}%
                          </span>
                        </div>
                        <Progress value={rec.workloadAfter} className="h-2 w-32" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                      {Math.round(rec.score)}
                    </div>
                    <div className="text-xs text-gray-500">Match Score</div>
                  </div>
                </div>
                
                {/* Reasoning */}
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-600">
                    <strong>Why this inspector:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {rec.reasoning.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Manual Selection */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Or choose manually:</h4>
          <Select value={selectedInspector} onValueChange={setSelectedInspector}>
            <SelectTrigger>
              <SelectValue placeholder="Select an inspector" />
            </SelectTrigger>
            <SelectContent>
              {inspectors.map(inspector => (
                <SelectItem key={inspector.id} value={inspector.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{inspector.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {inspector.currentWorkload}% workload
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Warning for overloaded inspectors */}
        {selectedInspector && (() => {
          const rec = recommendations.find(r => r.inspectorId === selectedInspector)
          return rec && rec.workloadAfter > 90 ? (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Warning: This assignment will overload the inspector ({Math.round(rec.workloadAfter)}% workload)
              </span>
            </div>
          ) : null
        })()}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedInspector}
          >
            Assign Inspector
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  // Simplified distance calculation - in production would use proper geolocation
  const latDiff = Math.abs(point1.lat - point2.lat)
  const lngDiff = Math.abs(point1.lng - point2.lng)
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111 // Rough km conversion
}
