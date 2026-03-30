'use client'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  /** "spinner" (default), "skeleton", "card-skeleton", "table-skeleton" */
  variant?: 'spinner' | 'skeleton' | 'card-skeleton' | 'table-skeleton'
  /** Text shown below spinner */
  message?: string
  /** Number of skeleton rows/cards to render */
  rows?: number
  /** Alias for rows — number of skeleton items to render */
  count?: number
  /** Number of columns for card-skeleton grid (default: 3) */
  columns?: number
  /** Additional className */
  className?: string
}

/**
 * LoadingState — Unified loading indicator for all modules.
 *
 * Four variants:
 * - spinner: Animated ring with gradient glow + optional message
 * - skeleton: Shimmer rows mimicking list items
 * - card-skeleton: Shimmer grid mimicking stat/entity cards
 * - table-skeleton: Shimmer rows mimicking table with header
 */
export function LoadingState({
  variant = 'spinner',
  message = 'Ładowanie...',
  rows,
  count,
  columns = 3,
  className,
}: LoadingStateProps) {
  const skeletonCount = rows ?? count ?? 3

  if (variant === 'card-skeleton') {
    return (
      <div className={cn(
        'grid gap-4 sm:gap-6',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-2 lg:grid-cols-4',
        className,
      )}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-700/50 p-5 sm:p-6 space-y-4"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-1/2 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" />
              <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-skeleton" />
            </div>
            <div className="h-7 w-1/3 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: '150ms' }} />
            <div className="h-3 w-2/3 rounded-lg bg-neutral-100 dark:bg-neutral-700/50 animate-skeleton" style={{ animationDelay: '300ms' }} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table-skeleton') {
    return (
      <div className={cn('rounded-xl border border-neutral-100 dark:border-neutral-700/50 overflow-hidden', className)}>
        {/* Table header */}
        <div className="flex gap-4 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-700/50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-neutral-200 dark:bg-neutral-700 animate-skeleton flex-1" style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-neutral-100/50 dark:border-neutral-700/30 last:border-b-0"
          >
            <div className="h-4 rounded bg-neutral-200 dark:bg-neutral-700 animate-skeleton flex-[2]" style={{ animationDelay: `${i * 80}ms` }} />
            <div className="h-4 rounded bg-neutral-100 dark:bg-neutral-700/50 animate-skeleton flex-1" style={{ animationDelay: `${i * 80 + 40}ms` }} />
            <div className="h-4 rounded bg-neutral-100 dark:bg-neutral-700/50 animate-skeleton flex-1" style={{ animationDelay: `${i * 80 + 80}ms` }} />
            <div className="h-6 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: `${i * 80 + 120}ms` }} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="space-y-3" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/50">
              {/* Avatar skeleton */}
              <div className="h-12 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-skeleton" />
              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: '100ms' }} />
                <div className="h-3 w-1/2 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: '200ms' }} />
              </div>
              {/* Action skeleton */}
              <div className="h-8 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: '150ms' }} />
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
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-300">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
