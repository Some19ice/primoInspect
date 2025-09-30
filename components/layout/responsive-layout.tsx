'use client'

import { ReactNode } from 'react'
import { MobileNav } from './mobile-nav'

interface ResponsiveLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  className?: string
}

export function ResponsiveLayout({ children, sidebar, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {sidebar && (
          <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200">
            {sidebar}
          </div>
        )}
        <div className={`flex-1 ${sidebar ? 'ml-64' : ''}`}>
          <div className={`p-6 ${className}`}>
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Account for fixed mobile header */}
        <div className="pt-16">
          <div className={`p-4 ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}