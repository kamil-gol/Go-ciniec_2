'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-tokens'

interface EntityCardProps {
  children: React.ReactNode
  /** Tailwind gradient class for accent bar, e.g. "from-blue-500 to-indigo-500" */
  accentGradient?: string
  /** Inline CSS color for accent bar (for dynamic colors like eventType.color) */
  accentColor?: string
  /** Click handler — adds cursor-pointer */
  onClick?: (e: React.MouseEvent) => void
  /** Stagger animation delay */
  delay?: number
  /** Show skeleton loading state */
  isLoading?: boolean
  /** Dim the card (e.g. inactive template) */
  dimmed?: boolean
  /** Skip inner padding (for cards with full-bleed sections) */
  noPadding?: boolean
  /** Additional classes */
  className?: string
}

export function EntityCard({
  children,
  accentGradient,
  accentColor,
  onClick,
  delay = 0,
  isLoading = false,
  dimmed = false,
  noPadding = false,
  className,
}: EntityCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-soft overflow-hidden animate-pulse">
        {(accentGradient || accentColor) && <div className="h-1 bg-neutral-200 dark:bg-neutral-700" />}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-700/50" />
            </div>
          </div>
          <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-700/50" />
          <div className="h-3 w-3/4 rounded bg-neutral-100 dark:bg-neutral-700/50" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: motionTokens.duration.medium, ease: motionTokens.ease.default }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-white dark:bg-neutral-800/80',
        'border border-neutral-200/80 dark:border-neutral-700/50',
        'shadow-soft hover:shadow-medium',
        'transition-all duration-300 hover:-translate-y-1',
        onClick && 'cursor-pointer',
        dimmed && 'opacity-60',
        className
      )}
    >
      {/* Accent bar — gradient or inline color */}
      {accentGradient && (
        <div className={cn('h-1 bg-gradient-to-r', accentGradient)} />
      )}
      {accentColor && !accentGradient && (
        <div className="h-1" style={{ backgroundColor: accentColor }} />
      )}

      {/* Content */}
      {noPadding ? children : (
        <div className="p-5 sm:p-6">{children}</div>
      )}
    </motion.div>
  )
}
