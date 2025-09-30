'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Image, 
  FileText, 
  Download, 
  MapPin, 
  Clock, 
  User,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  MessageSquare
} from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

// Add formatRelativeTime locally for now
const formatRelativeTime = (date: string | Date) => {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return formatDate(date)
  }
}

const fileSize = formatFileSize // Alias for consistency

interface EvidenceItem {
  id: string
  filename: string
  url: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: {
    name: string
    email: string
  }
  metadata?: {
    latitude?: number
    longitude?: number
    accuracy?: number
    timestamp?: string
    deviceInfo?: any
  }
  annotations?: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    text: string
    createdBy: string
    createdAt: string
  }>
}

interface EvidenceViewerProps {
  evidence: EvidenceItem[]
  inspectionId: string
  onAnnotationAdd?: (evidenceId: string, annotation: any) => void
  canAnnotate?: boolean
}

export function EvidenceViewer({ 
  evidence, 
  inspectionId, 
  onAnnotationAdd,
  canAnnotate = false 
}: EvidenceViewerProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleEvidenceClick = useCallback((item: EvidenceItem) => {
    setSelectedEvidence(item)
    setIsViewerOpen(true)
    setZoomLevel(1)
    setRotation(0)
  }, [])

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false)
    setSelectedEvidence(null)
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const handleDownload = useCallback(async (item: EvidenceItem) => {
    try {
      const response = await fetch(item.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }, [])

  const isImage = (type: string) => type.startsWith('image/')

  const getFileIcon = (type: string) => {
    if (isImage(type)) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    if (isImage(type)) return 'bg-blue-100 text-blue-800'
    if (type.includes('pdf')) return 'bg-red-100 text-red-800'
    if (type.includes('document') || type.includes('word')) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (evidence.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Evidence
          </CardTitle>
          <CardDescription>No evidence has been uploaded for this inspection yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Evidence ({evidence.length})
          </CardTitle>
          <CardDescription>
            Photos, documents, and other evidence for this inspection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleEvidenceClick(item)}
              >
                {/* Preview */}
                <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                  {isImage(item.type) ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      {getFileIcon(item.type)}
                      <span className="text-xs text-gray-500 text-center px-2">
                        {item.filename}
                      </span>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getTypeColor(item.type)}>
                      {item.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(item)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-sm font-medium truncate">{item.filename}</p>
                  <p className="text-xs text-gray-500">{fileSize(item.size)}</p>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      {item.uploadedBy.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(item.uploadedAt)}
                    </div>
                    {item.metadata?.latitude && item.metadata?.longitude && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        Location captured
                      </div>
                    )}
                    {item.annotations && item.annotations.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <MessageSquare className="h-3 w-3" />
                        {item.annotations.length} annotation{item.annotations.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Screen Viewer */}
      {isViewerOpen && selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-6xl max-h-full">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {isImage(selectedEvidence.type) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(selectedEvidence)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={closeViewer}
              >
                Close
              </Button>
            </div>

            {/* File Info Panel */}
            <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white rounded-lg p-4 max-w-xs">
              <h3 className="font-medium mb-2">{selectedEvidence.filename}</h3>
              <div className="text-sm space-y-1">
                <p>Size: {fileSize(selectedEvidence.size)}</p>
                <p>Uploaded: {formatDate(selectedEvidence.uploadedAt)}</p>
                <p>By: {selectedEvidence.uploadedBy.name}</p>
                {selectedEvidence.metadata?.latitude && selectedEvidence.metadata?.longitude && (
                  <p>
                    Location: {selectedEvidence.metadata.latitude.toFixed(6)}, {selectedEvidence.metadata.longitude.toFixed(6)}
                    {selectedEvidence.metadata.accuracy && (
                      <span className="block text-xs opacity-75">
                        ±{selectedEvidence.metadata.accuracy.toFixed(0)}m accuracy
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center">
              {isImage(selectedEvidence.type) ? (
                <img
                  src={selectedEvidence.url}
                  alt={selectedEvidence.filename}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s'
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    {getFileIcon(selectedEvidence.type)}
                    <h3 className="text-lg font-medium">{selectedEvidence.filename}</h3>
                    <p className="text-gray-500">Preview not available for this file type</p>
                    <Button onClick={() => handleDownload(selectedEvidence)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}