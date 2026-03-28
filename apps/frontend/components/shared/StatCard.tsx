'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
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
 * - Gradient icon with shadow
 * - Subtle background gradient overlay
 * - Change indicator with trending icon
 * - Framer Motion staggered entrance
 * - Hover lift effect
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
        'rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-soft',
        'border border-neutral-100 dark:border-neutral-700/50 animate-pulse'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-7 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-2/3 rounded bg-neutral-100 dark:bg-neutral-700/50" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-white dark:bg-neutral-800/80',
        'p-6 shadow-soft hover:shadow-medium',
        'transition-all duration-300 hover:-translate-y-1',
        'border border-neutral-100 dark:border-neutral-700/50',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          'bg-gradient-to-br',
          iconGradient.replace('from-', 'from-').replace('to-', 'to-'),
          '[&]:opacity-0 group-hover:[&]:opacity-[0.04]'
        )}
        style={{ opacity: 0 }}
      />
      {/* Decorative blob */}
      <div
        className={cn(
          'absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity',
          'bg-gradient-to-br',
          iconGradient
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-tight">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {value}
            </p>
            {(change || subtitle) && (
              <div className="mt-2 flex items-center gap-1.5">
                {change && (
                  <>
                    {changeType === 'positive' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                    {changeType === 'negative' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                    {changeType === 'neutral' && <Minus className="h-3.5 w-3.5 text-neutral-400" />}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        changeType === 'positive' && 'text-emerald-700 dark:text-emerald-400',
                        changeType === 'negative' && 'text-red-600 dark:text-red-400',
                        changeType === 'neutral' && 'text-neutral-500 dark:text-neutral-400'
                      )}
                    >
                      {change}
                    </span>
                  </>
                )}
                {subtitle && !change && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</span>
                )}
              </div>
            )}
          </div>

          {/* Icon with gradient background */}
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
              'bg-gradient-to-br shadow-lg',
              'group-hover:scale-110 group-hover:shadow-xl transition-all duration-300',
              iconGradient
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
