'use client'

import { cn } from '@/lib/utils'

interface GradientDividerProps {
  className?: string
  /** Accent color for the center of the gradient, defaults to border color */
  accent?: 'primary' | 'border' | 'muted'
}

/**
 * GradientDivider — Premium section separator with gradient fade.
 * Transparent at both ends, colored in the middle.
 */
export function GradientDivider({ className, accent = 'border' }: GradientDividerProps) {
  return (
    <div
      className={cn(
        'h-px w-full',
        accent === 'border' && 'bg-gradient-to-r from-transparent via-border to-transparent',
        accent === 'primary' && 'bg-gradient-to-r from-transparent via-primary/20 to-transparent',
        accent === 'muted' && 'bg-gradient-to-r from-transparent via-muted-foreground/15 to-transparent',
        className
      )}
      role="separator"
    />
  )
}
