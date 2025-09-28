'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
}

interface EvidenceUploadProps {
  inspectionId: string
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  onUploadComplete?: (files: any[]) => void
}

export function EvidenceUpload({
  inspectionId,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
  onUploadComplete
}: EvidenceUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { 
    files: evidenceFiles,
    addFiles,
    removeFile: removeEvidenceFile,
    uploadAll,
    isUploading: uploading,
    stats
  } = useEvidenceUpload({
    inspectionId,
    onUploadComplete: (evidenceId: string, url: string) => {
      // Called for each successful upload
    },
    onUploadError: (error: string) => {
      console.error('Upload error:', error)
    }
  })

  // Use evidenceFiles from hook
  const files = evidenceFiles

  const validateFiles = useCallback((fileList: FileList) => {
    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(fileList).forEach((file) => {
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
  }, [maxFileSize, maxFiles, acceptedTypes, files.length, addFiles, inspectionId])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(e.dataTransfer.files)
    }
  }, [validateFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(e.target.files)
    }
  }, [validateFiles])

  const removeFile = useCallback((fileId: string) => {
    removeEvidenceFile(fileId)
  }, [removeEvidenceFile])

  const uploadFiles = useCallback(async () => {
    await uploadAll()
    if (onUploadComplete) {
      const completedFiles = evidenceFiles.filter(f => f.status === 'completed')
      onUploadComplete(completedFiles)
    }
  }, [uploadAll, evidenceFiles, onUploadComplete])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'uploading': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Evidence
        </CardTitle>
        <CardDescription>
          Add photos, documents, or other evidence for this inspection.
          Max {maxFiles} files, {maxFileSize}MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drag files here or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports: Images, PDF, Word documents
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Selected Files</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((evidenceFile) => (
                <div key={evidenceFile.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {evidenceFile.file.type.startsWith('image/') ? (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <FileImage className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {evidenceFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(evidenceFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {/* Progress Bar */}
                    {evidenceFile.status === 'uploading' && (
                      <div className="mt-1">
                        <Progress value={evidenceFile.progress || 0} className="h-1" />
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {evidenceFile.error && (
                      <p className="text-xs text-red-600 mt-1">{evidenceFile.error}</p>
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
                    className="flex-shrink-0 h-8 w-8 p-0"
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
          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Uploading...' : `Upload ${stats.pending} file${stats.pending > 1 ? 's' : ''}`}
          </Button>
        )}

        {/* Upload Status */}
        {stats.failed > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{stats.failed} file(s) failed to upload</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}