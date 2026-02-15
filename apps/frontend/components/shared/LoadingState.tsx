'use client'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  /** "spinner" (default) or "skeleton" */
  variant?: 'spinner' | 'skeleton'
  /** Text shown below spinner */
  message?: string
  /** Number of skeleton rows to render */
  rows?: number
  /** Alias for rows — number of skeleton items to render */
  count?: number
  /** Additional className */
  className?: string
}

/**
 * LoadingState — Unified loading indicator for all modules.
 * 
 * Two variants:
 * - spinner: Animated ring with optional message
 * - skeleton: Pulsing rows that mimic content shape
 */
export function LoadingState({
  variant = 'spinner',
  message = 'Ładowanie...',
  rows,
  count,
  className,
}: LoadingStateProps) {
  const skeletonCount = rows ?? count ?? 3

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="animate-skeleton space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/50">
              {/* Avatar skeleton */}
              <div className="h-12 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-3 w-1/2 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
              </div>
              {/* Action skeleton */}
              <div className="h-8 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="text-center space-y-4">
        <div className="relative mx-auto h-12 w-12">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 opacity-20 blur-md animate-pulse" />
          {/* Spinning ring */}
          <div className="relative h-12 w-12 rounded-full border-[3px] border-neutral-200 dark:border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
        {message && (
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
