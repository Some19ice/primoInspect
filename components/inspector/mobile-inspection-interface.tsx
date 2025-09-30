'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, Mic, MapPin, Clock, CheckCircle, AlertTriangle, Navigation } from 'lucide-react'

interface MobileInspectionProps {
  inspection: any
  onComplete: (data: any) => void
  onSaveDraft: (data: any) => void
}

export function MobileInspectionInterface({ inspection, onComplete, onSaveDraft }: MobileInspectionProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  const questions = inspection.checklist?.questions || []
  const currentQuestion = questions[currentStep]
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Camera access error:', error)
    }
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `inspection_${Date.now()}.jpg`, { type: 'image/jpeg' })
          handleResponse('photo', file)
        }
      }, 'image/jpeg', 0.8)
      
      // Stop camera
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
    }
  }

  const startVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsRecording(true)
      // Voice recording implementation would go here
    } catch (error) {
      console.error('Microphone access error:', error)
    }
  }

  const handleResponse = (key: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion?.id || currentStep]: {
        ...prev[currentQuestion?.id || currentStep],
        [key]: value,
        timestamp: new Date().toISOString(),
        location: location
      }
    }))
  }

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete({ responses, location, completedAt: new Date().toISOString() })
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveDraft = () => {
    onSaveDraft({ responses, location, lastSaved: new Date().toISOString() })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold truncate">{inspection.title}</h1>
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} of {questions.length}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Location & Time */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-4">
        {currentQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{currentQuestion.question}</CardTitle>
              {currentQuestion.required && (
                <Badge variant="destructive" className="w-fit text-xs">Required</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Type Specific UI */}
              {currentQuestion.type === 'boolean' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={responses[currentQuestion.id]?.value === true ? "default" : "outline"}
                    onClick={() => handleResponse('value', true)}
                    className="h-16 text-lg"
                  >
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Pass
                  </Button>
                  <Button
                    variant={responses[currentQuestion.id]?.value === false ? "outline" : "outline"}
                    onClick={() => handleResponse('value', false)}
                    className={`h-16 text-lg ${responses[currentQuestion.id]?.value === false ? 'bg-red-500 text-white' : ''}`}
                  >
                    <AlertTriangle className="h-6 w-6 mr-2" />
                    Fail
                  </Button>
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <textarea
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Enter your observations..."
                  value={responses[currentQuestion.id]?.value || ''}
                  onChange={(e) => handleResponse('value', e.target.value)}
                />
              )}

              {currentQuestion.type === 'number' && (
                <input
                  type="number"
                  className="w-full p-3 border rounded-lg text-lg"
                  placeholder="Enter measurement"
                  value={responses[currentQuestion.id]?.value || ''}
                  onChange={(e) => handleResponse('value', parseFloat(e.target.value))}
                />
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={capturePhoto}
                  className="h-16 flex-col"
                >
                  <Camera className="h-6 w-6 mb-1" />
                  Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={startVoiceNote}
                  className="h-16 flex-col"
                  disabled={isRecording}
                >
                  <Mic className="h-6 w-6 mb-1" />
                  {isRecording ? 'Recording...' : 'Voice'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleResponse('location_verified', true)}
                  className="h-16 flex-col"
                >
                  <Navigation className="h-6 w-6 mb-1" />
                  Mark Location
                </Button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={2}
                  placeholder="Optional notes..."
                  value={responses[currentQuestion.id]?.notes || ''}
                  onChange={(e) => handleResponse('notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Camera View */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={saveDraft}
            className="px-6"
          >
            Save Draft
          </Button>
          <Button
            onClick={nextStep}
            className="flex-1"
          >
            {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
