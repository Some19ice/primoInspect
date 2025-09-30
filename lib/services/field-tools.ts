export class FieldToolsService {
  
  // GPS and Location Services
  static async getCurrentLocation(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          console.error('Location error:', error)
          resolve(null)
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      )
    })
  }

  // Camera and Photo Capture
  static async capturePhoto(options: {
    quality?: number
    maxWidth?: number
    maxHeight?: number
  } = {}): Promise<File | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: options.maxWidth || 1920 },
          height: { ideal: options.maxHeight || 1080 }
        } 
      })

      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      video.srcObject = stream
      await video.play()

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0)

      // Stop camera
      stream.getTracks().forEach(track => track.stop())

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `inspection_${Date.now()}.jpg`, { 
                type: 'image/jpeg' 
              })
              resolve(file)
            } else {
              resolve(null)
            }
          },
          'image/jpeg',
          options.quality || 0.8
        )
      })
    } catch (error) {
      console.error('Photo capture error:', error)
      return null
    }
  }

  // Voice Recording
  static async startVoiceRecording(): Promise<{
    stop: () => Promise<File | null>
    isRecording: boolean
  }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.start()

      return {
        isRecording: true,
        stop: () => new Promise((resolve) => {
          mediaRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop())
            const blob = new Blob(chunks, { type: 'audio/webm' })
            const file = new File([blob], `voice_note_${Date.now()}.webm`, { 
              type: 'audio/webm' 
            })
            resolve(file)
          }
          mediaRecorder.stop()
        })
      }
    } catch (error) {
      console.error('Voice recording error:', error)
      return {
        isRecording: false,
        stop: async () => null
      }
    }
  }

  // Route Optimization
  static optimizeRoute(inspections: any[]): any[] {
    // Simple optimization - in production would use proper routing API
    return inspections.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 3
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 3
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Then by due time
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      
      return 0
    })
  }

  // Offline Data Management
  static async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        synced: false
      }))
    } catch (error) {
      console.error('Offline save error:', error)
    }
  }

  static async getOfflineData(key: string): Promise<any | null> {
    try {
      const stored = localStorage.getItem(`offline_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.data
      }
      return null
    } catch (error) {
      console.error('Offline retrieve error:', error)
      return null
    }
  }

  static async getPendingSyncData(): Promise<Array<{ key: string; data: any; timestamp: number }>> {
    const pendingData: Array<{ key: string; data: any; timestamp: number }> = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('offline_')) {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (!parsed.synced) {
              pendingData.push({
                key: key.replace('offline_', ''),
                data: parsed.data,
                timestamp: parsed.timestamp
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Pending sync data error:', error)
    }
    
    return pendingData
  }

  // Device Capabilities Check
  static getDeviceCapabilities() {
    return {
      hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasGeolocation: !!navigator.geolocation,
      hasMicrophone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasAccelerometer: 'DeviceMotionEvent' in window,
      hasGyroscope: 'DeviceOrientationEvent' in window,
      isOnline: navigator.onLine,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      supportsOffline: 'serviceWorker' in navigator && 'caches' in window
    }
  }

  // Battery Status (if available)
  static async getBatteryStatus(): Promise<{ level: number; charging: boolean } | null> {
    try {
      // @ts-ignore - Battery API is experimental
      const battery = await navigator.getBattery?.()
      if (battery) {
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging
        }
      }
    } catch (error) {
      console.error('Battery status error:', error)
    }
    return null
  }

  // Network Quality Assessment
  static getNetworkQuality(): 'offline' | 'poor' | 'good' | 'excellent' {
    if (!navigator.onLine) return 'offline'
    
    // @ts-ignore - Connection API is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      const effectiveType = connection.effectiveType
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'poor'
        case '3g':
          return 'good'
        case '4g':
          return 'excellent'
        default:
          return 'good'
      }
    }
    
    return 'good'
  }

  // Measurement Tools
  static async measureDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): Promise<number> {
    // Haversine formula for distance calculation
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180
    const φ2 = point2.lat * Math.PI / 180
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Quick Actions
  static async quickCapture(type: 'photo' | 'voice' | 'location'): Promise<any> {
    switch (type) {
      case 'photo':
        return await this.capturePhoto()
      case 'voice':
        return await this.startVoiceRecording()
      case 'location':
        return await this.getCurrentLocation()
      default:
        return null
    }
  }
}
