'use client'

import { useRouter } from 'next/navigation'
import { useEffect, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeNotifications } from '@/lib/hooks/use-realtime-notifications'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  role: 'executive' | 'manager' | 'inspector'
}

// Context for sharing real-time data across dashboard components
interface DashboardContextType {
  notifications: any[]
  notificationCount: number
  refreshNotifications: () => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardLayout')
  }
  return context
}

export function DashboardLayout({ children, title, role }: DashboardLayoutProps) {
  const { profile, signOut, loading, isAuthenticated, hasRole } = useSupabaseAuth()
  const router = useRouter()

  // Real-time notifications for authenticated user
  const {
    notifications,
    stats,
    loading: notificationsLoading,
    refresh: refreshNotifications
  } = useRealtimeNotifications({
    userId: profile?.id
  })

  // Role mapping
  const roleMapping = {
    executive: 'EXECUTIVE',
    manager: 'PROJECT_MANAGER', 
    inspector: 'INSPECTOR'
  }

  // Check authentication and role access
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin')
        return
      }

      if (profile) {
        const requiredRole = roleMapping[role]
        
        // Check if user has access to this role
        if (!hasRole(requiredRole)) {
          // Redirect to appropriate dashboard for user's role
          const userDashboard = profile.role === 'EXECUTIVE' ? '/dashboard/executive' :
                               profile.role === 'PROJECT_MANAGER' ? '/dashboard/manager' :
                               '/dashboard/inspector'
          
          router.push(userDashboard)
        }
      }
    }
  }, [loading, isAuthenticated, profile, hasRole, role, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'executive': return 'bg-purple-600'
      case 'manager': return 'bg-blue-600' 
      case 'inspector': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'EXECUTIVE': return 'Executive'
      case 'PROJECT_MANAGER': return 'Project Manager'
      case 'INSPECTOR': return 'Inspector'
      default: return 'User'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !profile) {
    return null // Will redirect in useEffect
  }

  // Dashboard context value
  const dashboardContextValue: DashboardContextType = {
    notifications,
    notificationCount: stats.unread,
    refreshNotifications
  }

  return (
    <DashboardContext.Provider value={dashboardContextValue}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile-first header with real-time notifications */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full ${getRoleColor(role)} flex items-center justify-center`}>
                  <span className="text-white text-sm font-bold">
                    {role.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                  <p className="text-xs text-gray-500">{getRoleLabel(profile.role)} Dashboard</p>
                  <p className="text-xs text-gray-400">{profile.name} • {profile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Notification indicator */}
                {stats.unread > 0 && (
                  <div className="relative">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {stats.unread > 9 ? '9+' : stats.unread}
                      </span>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content with real-time context */}
        <main className="px-4 py-6">
          {children}
        </main>

        {/* Mobile navigation bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 min-h-[44px]"
              onClick={() => router.push(`/dashboard/${role}`)}
            >
              <span className="text-xs">Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 min-h-[44px]"
              onClick={() => router.push('/projects')}
            >
              <span className="text-xs">Projects</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 min-h-[44px]"
              onClick={() => router.push('/inspections')}
            >
              <span className="text-xs">Inspections</span>
            </Button>
          </div>
        </nav>

        {/* Bottom padding to account for fixed nav */}
        <div className="h-16"></div>
      </div>
    </DashboardContext.Provider>
  )
}
