'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export function ResponsiveGrid({ 
  children, 
  className = '',
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 4
}: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid',
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  )

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  fullWidthOnMobile?: boolean
}

export function ResponsiveCard({ 
  children, 
  className = '',
  fullWidthOnMobile = false 
}: ResponsiveCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 shadow-sm',
      'p-4 sm:p-6',
      fullWidthOnMobile && 'mx-0 sm:mx-0',
      className
    )}>
      {children}
    </div>
  )
}