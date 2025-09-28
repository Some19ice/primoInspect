'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'

export default function Home() {
  const { user, profile, loading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Still loading

    if (user && profile) {
      // Redirect based on role (FR-001: Role-aware dashboards)
      switch (profile.role) {
        case 'EXECUTIVE':
          router.push('/dashboard/executive')
          break
        case 'PROJECT_MANAGER':
          router.push('/dashboard/manager')
          break
        case 'INSPECTOR':
          router.push('/dashboard/inspector')
          break
        default:
          router.push('/dashboard/inspector') // Default fallback
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">PrimoInspect</h1>
          <p className="mb-8 text-lg text-gray-600">
            Digital Inspection Platform for Renewable Energy Projects
          </p>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-green-700">Mobile-First</h3>
                  <p className="text-sm text-gray-600">Optimized for field work</p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-blue-700">Evidence-Driven</h3>
                  <p className="text-sm text-gray-600">
                    All decisions backed by verification
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-purple-700">Role-Oriented</h3>
                  <p className="text-sm text-gray-600">
                    Executive, Manager, Inspector views
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-orange-700">Real-time</h3>
                  <p className="text-sm text-gray-600">
                    Live updates and instant notifications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            className="w-full"
            onClick={() => router.push('/auth/signin')}
          >
            Sign In to Continue
          </Button>
        </div>
      </main>
    )
  }

  return null // Will redirect via useEffect
}
