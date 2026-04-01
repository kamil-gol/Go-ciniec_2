'use client'

import { motion } from 'framer-motion'
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { surfaces, typography } from '@/lib/design-tokens'
import { statCardVariants } from '@/lib/motion-tokens'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface StatCardV2Props {
  /** Etykieta karty */
  label: string
  /** Wartość — liczbowa (animowana) lub string */
  value: number | string
  /** Tekst zmiany (np. "+15% vs poprzedni") */
  change?: string
  /** Typ zmiany: positive (zielony), negative (czerwony), neutral (szary) */
  changeType?: 'positive' | 'negative' | 'neutral'
  /** Ikona Lucide */
  icon: LucideIcon
  /** Delay animacji wejścia (stagger) */
  delay?: number
  /** Click handler */
  onClick?: () => void
  /** Stan ładowania */
  isLoading?: boolean
}

/**
 * StatCardV2 — Surface-based stat card bez gradient icon backgrounds.
 *
 * Zmiany vs StatCard v1:
 * - Usunięty `iconGradient` prop — jeden kolor accent dla wszystkich ikon
 * - AnimatedCounter dla wartości liczbowych
 * - Motion variants z motion-tokens.ts
 * - Skeleton wbudowany (isLoading)
 *
 * Użycie:
 * ```tsx
 * <StatCardV2 label="Rezerwacje" value={42} icon={Calendar} delay={0.08} />
 * ```
 */
export function StatCardV2({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  delay = 0,
  onClick,
  isLoading = false,
}: StatCardV2Props) {
  if (isLoading) {
    return (
      <div className={cn(surfaces.card, 'p-5 animate-pulse')}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
          <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0" />
        </div>
      </div>
    )
  }

  const TrendIcon = changeType === 'positive' ? TrendingUp
    : changeType === 'negative' ? TrendingDown
    : Minus

  const numericValue = typeof value === 'number' ? value : null

  return (
    <motion.div
      custom={delay}
      variants={statCardVariants}
      initial="initial"
      animate="animate"
      whileHover={onClick ? 'hover' : undefined}
      whileTap={onClick ? 'tap' : undefined}
      onClick={onClick}
      className={cn(
        surfaces.card,
        'p-5 group',
        onClick && 'cursor-pointer',
        onClick && surfaces.cardHover,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={typography.small}>{label}</p>
          <p className={cn(typography.value, 'text-2xl sm:text-3xl')}>
            {numericValue !== null
              ? <AnimatedCounter value={numericValue} />
              : value
            }
          </p>
          {change && (
            <div className="flex items-center gap-1 pt-1">
              <TrendIcon className={cn(
                'h-3.5 w-3.5',
                changeType === 'positive' && 'text-success-600 dark:text-success-400',
                changeType === 'negative' && 'text-error-600 dark:text-error-400',
                changeType === 'neutral' && 'text-muted-foreground',
              )} />
              <span className={cn(
                'text-xs',
                changeType === 'positive' && 'text-success-600 dark:text-success-400',
                changeType === 'negative' && 'text-error-600 dark:text-error-400',
                changeType === 'neutral' && 'text-muted-foreground',
              )}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}
