'use client'

import { cn } from '@/lib/utils'
import { layout } from '@/lib/design-tokens'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
  /** Remove default max-width constraint */
  fullWidth?: boolean
}

/**
 * PageLayout — Shared wrapper for all dashboard pages.
 * Provides consistent container spacing, max-width, and background.
 */
export function PageLayout({ children, className, fullWidth = false }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div
        className={cn(
          layout.containerClass,
          !fullWidth && layout.maxWidth,
          !fullWidth && 'mx-auto',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
