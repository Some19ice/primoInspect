'use client'

import { useState, useCallback, useRef } from 'react'
import { useEvidenceUpload } from './use-evidence-upload'
import { FieldToolsService } from '@/lib/services/field-tools'

interface FieldEvidenceFile {
  id: string
  file: File
  type: 'photo' | 'voice' | 'document'
  location?: { lat: number; lng: number; accuracy: number }
  timestamp: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  metadata?: {
    deviceInfo?: any
    networkQuality?: string
    batteryLevel?: number
  }
}

interface UseFieldEvidenceOptions {
  inspectionId: string
  autoLocation?: boolean
  autoMetadata?: boolean
  onCapture?: (file: FieldEvidenceFile) => void
}

export function useFieldEvidence({
  inspectionId,
  autoLocation = true,
  autoMetadata = true,
  onCapture
}: UseFieldEvidenceOptions) {
  const [fieldFiles, setFieldFiles] = useState<FieldEvidenceFile[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const voiceRecorderRef = useRef<{ stop: () => Promise<File | null> } | null>(null)

  const { addFiles, uploadAll, isUploading } = useEvidenceUpload({
    inspectionId,
    onUploadComplete: (evidenceId, url) => {
      setFieldFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'completed' } : f
      ))
    }
  })

  const capturePhoto = useCallback(async () => {
    setIsCapturing(true)
    try {
      const file = await FieldToolsService.capturePhoto({
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080
      })

      if (file) {
        const location = autoLocation ? await FieldToolsService.getCurrentLocation() : undefined
        const battery = autoMetadata ? await FieldToolsService.getBatteryStatus() : undefined
        const networkQuality = autoMetadata ? FieldToolsService.getNetworkQuality() : undefined

        const fieldFile: FieldEvidenceFile = {
          id: `photo_${Date.now()}`,
          file,
          type: 'photo',
          location: location || undefined,
          timestamp: new Date().toISOString(),
          status: 'pending',
          progress: 0,
          metadata: autoMetadata ? {
            deviceInfo: FieldToolsService.getDeviceCapabilities(),
            networkQuality,
            batteryLevel: battery?.level
          } : undefined
        }

        setFieldFiles(prev => [...prev, fieldFile])
        addFiles([file])
        onCapture?.(fieldFile)
      }
    } catch (error) {
      console.error('Photo capture failed:', error)
    } finally {
      setIsCapturing(false)
    }
  }, [inspectionId, autoLocation, autoMetadata, addFiles, onCapture])

  const startVoiceRecording = useCallback(async () => {
    setIsCapturing(true)
    try {
      const recorder = await FieldToolsService.startVoiceRecording()
      voiceRecorderRef.current = recorder
      return recorder
    } catch (error) {
      console.error('Voice recording failed:', error)
      setIsCapturing(false)
      return null
    }
  }, [])

  const stopVoiceRecording = useCallback(async () => {
    if (voiceRecorderRef.current) {
      try {
        const file = await voiceRecorderRef.current.stop()
        
        if (file) {
          const location = autoLocation ? await FieldToolsService.getCurrentLocation() : undefined
          const battery = autoMetadata ? await FieldToolsService.getBatteryStatus() : undefined
          const networkQuality = autoMetadata ? FieldToolsService.getNetworkQuality() : undefined

          const fieldFile: FieldEvidenceFile = {
            id: `voice_${Date.now()}`,
            file,
            type: 'voice',
            location: location || undefined,
            timestamp: new Date().toISOString(),
            status: 'pending',
            progress: 0,
            metadata: autoMetadata ? {
              deviceInfo: FieldToolsService.getDeviceCapabilities(),
              networkQuality,
              batteryLevel: battery?.level
            } : undefined
          }

          setFieldFiles(prev => [...prev, fieldFile])
          addFiles([file])
          onCapture?.(fieldFile)
        }
      } catch (error) {
        console.error('Voice recording stop failed:', error)
      } finally {
        voiceRecorderRef.current = null
        setIsCapturing(false)
      }
    }
  }, [inspectionId, autoLocation, autoMetadata, addFiles, onCapture])

  const addDocument = useCallback(async (file: File) => {
    const location = autoLocation ? await FieldToolsService.getCurrentLocation() : undefined
    const battery = autoMetadata ? await FieldToolsService.getBatteryStatus() : undefined
    const networkQuality = autoMetadata ? FieldToolsService.getNetworkQuality() : undefined

    const fieldFile: FieldEvidenceFile = {
      id: `doc_${Date.now()}`,
      file,
      type: 'document',
      location: location || undefined,
      timestamp: new Date().toISOString(),
      status: 'pending',
      progress: 0,
      metadata: autoMetadata ? {
        deviceInfo: FieldToolsService.getDeviceCapabilities(),
        networkQuality,
        batteryLevel: battery?.level
      } : undefined
    }

    setFieldFiles(prev => [...prev, fieldFile])
    addFiles([file])
    onCapture?.(fieldFile)
  }, [inspectionId, autoLocation, autoMetadata, addFiles, onCapture])

  const removeFile = useCallback((fileId: string) => {
    setFieldFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const uploadAllEvidence = useCallback(async () => {
    // Update status to uploading
    setFieldFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' } : f
    ))
    
    await uploadAll()
  }, [uploadAll])

  const saveOffline = useCallback(async () => {
    const offlineData = {
      inspectionId,
      files: fieldFiles.map(f => ({
        ...f,
        file: undefined // Can't serialize File objects
      })),
      timestamp: Date.now()
    }
    
    await FieldToolsService.saveOfflineData(`evidence_${inspectionId}`, offlineData)
  }, [inspectionId, fieldFiles])

  const getStats = useCallback(() => {
    const total = fieldFiles.length
    const pending = fieldFiles.filter(f => f.status === 'pending').length
    const uploading = fieldFiles.filter(f => f.status === 'uploading').length
    const completed = fieldFiles.filter(f => f.status === 'completed').length
    const failed = fieldFiles.filter(f => f.status === 'error').length

    return { total, pending, uploading, completed, failed }
  }, [fieldFiles])

  return {
    // Files
    fieldFiles,
    
    // Actions
    capturePhoto,
    startVoiceRecording,
    stopVoiceRecording,
    addDocument,
    removeFile,
    uploadAllEvidence,
    saveOffline,
    
    // State
    isCapturing,
    isUploading,
    isRecording: !!voiceRecorderRef.current,
    
    // Stats
    stats: getStats(),
    
    // Utilities
    canCapture: FieldToolsService.getDeviceCapabilities().hasCamera,
    canRecord: FieldToolsService.getDeviceCapabilities().hasMicrophone,
    hasLocation: FieldToolsService.getDeviceCapabilities().hasGeolocation
  }
}
