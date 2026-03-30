'use client'

import { cn } from '@/lib/utils'

interface StatusDotProps {
  /** Variant determines color */
  variant: 'success' | 'warning' | 'error' | 'neutral'
  /** Size: sm (8px), md (10px), lg (12px) */
  size?: 'sm' | 'md' | 'lg'
  /** Show ping animation (for "live/active" states) */
  ping?: boolean
  /** Optional label text next to the dot */
  label?: string
  /** Additional className */
  className?: string
}

const VARIANT_COLORS = {
  success: {
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
  },
  warning: {
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
  },
  error: {
    dot: 'bg-red-500',
    ping: 'bg-red-400',
  },
  neutral: {
    dot: 'bg-neutral-400 dark:bg-neutral-500',
    ping: 'bg-neutral-300 dark:bg-neutral-400',
  },
} as const

const SIZE_CLASSES = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
} as const

/**
 * StatusDot — Compact status indicator with optional ping animation.
 *
 * Provides:
 * - 4 semantic variants (success, warning, error, neutral)
 * - 3 sizes (sm, md, lg)
 * - Optional ping animation for "live" states
 * - Optional label text
 */
export function StatusDot({
  variant,
  size = 'md',
  ping = false,
  label,
  className,
}: StatusDotProps) {
  const colors = VARIANT_COLORS[variant]
  const sizeClass = SIZE_CLASSES[size]

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex">
        {ping && (
          <span
            className={cn(
              'absolute inset-0 rounded-full opacity-75 animate-ping',
              colors.ping,
              sizeClass
            )}
          />
        )}
        <span className={cn('relative rounded-full', colors.dot, sizeClass)} />
      </span>
      {label && (
        <span className="text-xs font-medium text-foreground">{label}</span>
      )}
    </span>
  )
}
