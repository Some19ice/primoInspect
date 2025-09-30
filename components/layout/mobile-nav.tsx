'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  FolderOpen, 
  FileCheck, 
  Users, 
  Settings,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import { useRealtimeNotifications } from '@/lib/hooks/use-realtime-notifications'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR'] },
  { name: 'Projects', href: '/projects', icon: FolderOpen, roles: ['EXECUTIVE', 'PROJECT_MANAGER'] },
  { name: 'Inspections', href: '/inspections', icon: FileCheck, roles: ['PROJECT_MANAGER', 'INSPECTOR'] },
  { name: 'Team', href: '/team', icon: Users, roles: ['EXECUTIVE', 'PROJECT_MANAGER'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR'] },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useSupabaseAuth()
  const { notifications, stats } = useRealtimeNotifications()
  const unreadCount = stats?.unread || 0

  const filteredNavigation = navigation.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  )

  const handleNavigation = (href: string) => {
    // Role-based navigation
    if (href === '/dashboard') {
      switch (profile?.role) {
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
          router.push('/dashboard/inspector')
      }
    } else {
      router.push(href)
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-semibold text-gray-900">
            PrimoInspect
          </h1>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform md:hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="mt-4">
              <div className="space-y-1 px-3">
                {filteredNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleNavigation(item.href)}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Button>
                  )
                })}
              </div>
            </nav>
            
            {/* User Info */}
            {profile && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {profile.role?.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}