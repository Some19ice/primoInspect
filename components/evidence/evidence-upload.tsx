'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useEvidenceUpload } from '@/lib/hooks/use-evidence-upload'
import { Upload, X, FileImage, FileText, Camera, Trash2 } from 'lucide-react'

interface EvidenceFile {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
  questionId?: string
  gpsLocation?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

interface EvidenceUploadProps {
  inspectionId: string
  questionId?: string // NEW: Link evidence to specific question
  questionText?: string // NEW: Show which question this is for
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  onUploadComplete?: (files: any[]) => void
  onEvidenceLinked?: (questionId: string, evidenceIds: string[]) => void
  required?: boolean
  existingEvidence?: string[] // IDs of existing evidence for this question
}

export function EvidenceUpload({
  inspectionId,
  questionId,
  questionText,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
  onUploadComplete,
  onEvidenceLinked,
  required = false,
  existingEvidence = [],
}: EvidenceUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    files: evidenceFiles,
    addFiles,
    removeFile: removeEvidenceFile,
    uploadAll,
    isUploading: uploading,
    stats,
  } = useEvidenceUpload({
    inspectionId,
    questionId,
    onUploadComplete: (evidenceId: string, url: string) => {
      // Called for each successful upload
      console.log('[EvidenceUpload] Evidence uploaded successfully:', {
        evidenceId,
        questionId,
        inspectionId,
        url,
      })

      // Notify parent that evidence was uploaded
      // Parent should refresh inspection data to get updated evidence list
      if (onUploadComplete) {
        // Create a minimal evidence object for the parent
        const evidenceInfo = {
          evidenceId,
          url,
          question_id: questionId,
          inspection_id: inspectionId,
        }
        onUploadComplete([evidenceInfo] as any)
      }
    },
    onUploadError: (error: string) => {
      console.error('[EvidenceUpload] Upload error:', error)
    },
  })

  // Use evidenceFiles from hook
  const files = evidenceFiles

  const validateFiles = useCallback(
    (fileList: FileList) => {
      const validFiles: File[] = []
      const errors: string[] = []

      Array.from(fileList).forEach(file => {
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
          errors.push(`${file.name}: File too large (max ${maxFileSize}MB)`)
          return
        }

        // Check file type
        const isValidType = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -2))
          }
          return file.type === type || file.name.toLowerCase().endsWith(type)
        })

        if (!isValidType) {
          errors.push(`${file.name}: File type not supported`)
          return
        }

        // Check total file count
        if (validFiles.length + files.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`)
          return
        }

        validFiles.push(file)
      })

      if (errors.length > 0) {
        alert(errors.join('\n'))
      }

      if (validFiles.length > 0) {
        addFiles(validFiles)
      }
    },
    [maxFileSize, maxFiles, acceptedTypes, files.length, addFiles, inspectionId]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateFiles(e.dataTransfer.files)
      }
    },
    [validateFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateFiles(e.target.files)
      }
    },
    [validateFiles]
  )

  const removeFile = useCallback(
    (fileId: string) => {
      removeEvidenceFile(fileId)
    },
    [removeEvidenceFile]
  )

  const uploadFiles = useCallback(async () => {
    console.log(
      '[EvidenceUpload] Starting upload of',
      files.filter(f => f.status === 'pending').length,
      'files'
    )

    // Add GPS location if available and required
    if (questionId) {
      navigator.geolocation?.getCurrentPosition(
        position => {
          files.forEach(file => {
            if (file.status === 'pending') {
              file.gpsLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              }
            }
          })
        },
        error => console.log('[EvidenceUpload] GPS not available:', error)
      )
    }

    // Upload all files - onUploadComplete callback is called for each file
    await uploadAll()

    console.log('[EvidenceUpload] All uploads complete')
  }, [uploadAll, questionId, files])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={required ? 'border-l-4 border-l-orange-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {questionText ? 'Upload Evidence' : 'Upload Evidence'}
          {required && (
            <span className="text-sm text-orange-500">(Required)</span>
          )}
        </CardTitle>
        {questionText ? (
          <div className="space-y-1 text-sm text-gray-600">
            <div className="font-medium text-gray-700">
              For question: {questionText}
            </div>
            <div>
              Add photos, documents, or other evidence for this question. Max{' '}
              {maxFiles} files, {maxFileSize}MB each.
            </div>
          </div>
        ) : (
          <CardDescription>
            Add photos, documents, or other evidence for this inspection. Max{' '}
            {maxFiles} files, {maxFileSize}MB each.
          </CardDescription>
        )}

        {/* Existing Evidence Display */}
        {existingEvidence.length > 0 && (
          <div className="mt-2 rounded-md bg-green-50 p-2">
            <div className="text-sm text-green-700">
              ✓ {existingEvidence.length} evidence file(s) already uploaded for
              this question
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drag files here or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports: Images, PDF, Word documents
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Files
            </h4>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {files.map(evidenceFile => (
                <div
                  key={evidenceFile.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {evidenceFile.file.type.startsWith('image/') ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200">
                        <FileImage className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200">
                        <FileText className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {evidenceFile.file.name}
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div>
                        {(evidenceFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {evidenceFile.gpsLocation && (
                        <div className="text-green-600">
                          📍 GPS: {evidenceFile.gpsLocation.latitude.toFixed(6)}
                          , {evidenceFile.gpsLocation.longitude.toFixed(6)}
                        </div>
                      )}
                      {questionText && (
                        <div className="text-blue-600">
                          🔗 Linked to question
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {evidenceFile.status === 'uploading' && (
                      <div className="mt-1">
                        <Progress
                          value={evidenceFile.progress || 0}
                          className="h-1"
                        />
                      </div>
                    )}

                    {/* Error Message */}
                    {evidenceFile.error && (
                      <p className="mt-1 text-xs text-red-600">
                        {evidenceFile.error}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge className={getStatusColor(evidenceFile.status)}>
                    {evidenceFile.status}
                  </Badge>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(evidenceFile.id)}
                    disabled={evidenceFile.status === 'uploading'}
                    className="h-8 w-8 flex-shrink-0 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Actions */}
        {stats.pending > 0 && (
          <div className="space-y-2">
            <Button
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading
                ? 'Uploading...'
                : `Upload ${stats.pending} file${stats.pending > 1 ? 's' : ''}`}
              {questionId && ' for Question'}
            </Button>
            {questionId && (
              <div className="text-center text-xs text-gray-500">
                Evidence will be linked to the selected question
              </div>
            )}
          </div>
        )}

        {/* Upload Status */}
        {stats.failed > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">
              {stats.failed} file(s) failed to upload
            </p>
          </div>
        )}

        {/* Evidence Summary */}
        {(stats.completed > 0 || existingEvidence.length > 0) && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <div className="text-sm text-green-800">
              <div className="mb-1 font-medium">Evidence Summary:</div>
              <ul className="space-y-1">
                {existingEvidence.length > 0 && (
                  <li>• {existingEvidence.length} existing file(s)</li>
                )}
                {stats.completed > 0 && (
                  <li>• {stats.completed} newly uploaded file(s)</li>
                )}
                {questionId && <li>• All evidence linked to question</li>}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
