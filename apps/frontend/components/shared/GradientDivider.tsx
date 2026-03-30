'use client'

import { cn } from '@/lib/utils'

interface GradientDividerProps {
  /** Optional label rendered centered on the divider */
  label?: string
  /** Use module accent color instead of border color */
  accent?: boolean
  /** Additional className */
  className?: string
}

/**
 * GradientDivider — Horizontal divider with gradient fade-to-transparent ends.
 *
 * Provides:
 * - Clean visual separation between sections
 * - Optional centered label
 * - Accent variant for module-specific color
 */
export function GradientDivider({ label, accent = false, className }: GradientDividerProps) {
  const lineClass = accent
    ? 'h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent'
    : 'h-px bg-gradient-to-r from-transparent via-border to-transparent'

  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className={cn(lineClass, 'flex-1')} />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          {label}
        </span>
        <div className={cn(lineClass, 'flex-1')} />
      </div>
    )
  }

  return <div className={cn(lineClass, className)} />
}
