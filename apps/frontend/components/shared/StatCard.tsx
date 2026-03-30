'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-tokens'
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  /** Card title / label */
  label: string
  /** Main value */
  value: string | number
  /** Optional change text (e.g. "+15%" or "ten miesiąc") */
  change?: string
  /** Type of change: positive (green), negative (red), neutral (gray) */
  changeType?: 'positive' | 'negative' | 'neutral'
  /** Lucide icon */
  icon: LucideIcon
  /** Gradient for icon container, e.g. "from-blue-500 to-cyan-500" */
  iconGradient: string
  /** Optional subtitle under value */
  subtitle?: string
  /** Stagger animation delay (index * 0.1) */
  delay?: number
  /** Optional onClick handler */
  onClick?: () => void
  /** Show skeleton loading state */
  isLoading?: boolean
}

/**
 * StatCard — Unified statistics card used across all modules.
 *
 * Features:
 * - Gradient icon with shadow + scale on hover
 * - Subtle gradient overlay on hover (accent tint)
 * - Change indicator with trending icon
 * - Framer Motion staggered entrance
 * - Hover lift effect with gradient border hint
 * - Shimmer skeleton loading
 * - tabular-nums for values
 * - Full dark mode support
 */
export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconGradient,
  subtitle,
  delay = 0,
  onClick,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className={cn(
        'rounded-2xl bg-white dark:bg-neutral-800/80 p-5 sm:p-6 shadow-soft',
        'border border-neutral-100 dark:border-neutral-700/50',
        'overflow-hidden relative'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-1/2 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" />
            <div className="h-7 w-1/3 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-skeleton" style={{ animationDelay: '150ms' }} />
            <div className="h-3 w-2/3 rounded-lg bg-neutral-100 dark:bg-neutral-700/50 animate-skeleton" style={{ animationDelay: '300ms' }} />
          </div>
          <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-skeleton flex-shrink-0" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: motionTokens.duration.normal, ease: motionTokens.ease.default }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-white dark:bg-neutral-800/80',
        'p-5 sm:p-6 shadow-soft hover:shadow-medium',
        'transition-all duration-300 hover:-translate-y-1',
        'border border-neutral-100 dark:border-neutral-700/50',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300',
          'bg-gradient-to-br',
          iconGradient
        )}
      />
      {/* Decorative blob */}
      <div
        className={cn(
          'absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity',
          'bg-gradient-to-br',
          iconGradient
        )}
      />

      <div className="relative flex flex-col h-full">
        {/* Row 1: Icon + Label */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-300 leading-snug flex-1 min-w-0" title={label}>
            {label}
          </p>
          <div
            className={cn(
              'flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl',
              'bg-gradient-to-br shadow-lg',
              'group-hover:scale-110 group-hover:shadow-xl transition-all duration-300',
              iconGradient
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Row 2: Value */}
        <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
          {value}
        </p>

        {/* Row 3: Change indicator */}
        {(change || subtitle) && (
          <div className="mt-auto pt-2 flex items-center gap-1.5 flex-wrap">
            {change && (
              <>
                {changeType === 'positive' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                {changeType === 'negative' && <TrendingDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                {changeType === 'neutral' && <Minus className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />}
                <span
                  className={cn(
                    'text-xs font-medium',
                    changeType === 'positive' && 'text-emerald-700 dark:text-emerald-400',
                    changeType === 'negative' && 'text-red-600 dark:text-red-400',
                    changeType === 'neutral' && 'text-neutral-500 dark:text-neutral-300'
                  )}
                >
                  {change}
                </span>
              </>
            )}
            {subtitle && !change && (
              <span className="text-xs text-neutral-500 dark:text-neutral-300">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
