'use client'

import { cn } from '@/lib/utils'
import { layout } from '@/lib/design-tokens'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
  /** Remove default max-width constraint */
  fullWidth?: boolean
  /** Use narrower max-width for form/detail pages (max-w-5xl) */
  narrowContent?: boolean
}

/**
 * PageLayout — Shared wrapper for all dashboard pages.
 * Provides consistent container spacing, max-width, and background.
 *
 * Spacing is mobile-first responsive:
 *   - py-6 px-4 → sm:py-8 sm:px-6
 *   - space-y-6 → sm:space-y-8
 */
export function PageLayout({ children, className, fullWidth = false, narrowContent = false }: PageLayoutProps) {
  const width = narrowContent ? layout.narrowWidth : layout.maxWidth

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div
        className={cn(
          layout.containerClass,
          !fullWidth && width,
          !fullWidth && 'mx-auto',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
