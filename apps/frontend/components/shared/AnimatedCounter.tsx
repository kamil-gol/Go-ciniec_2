'use client'

import { cn } from '@/lib/utils'
import { useCountUp } from '@/hooks/use-count-up'

interface AnimatedCounterProps {
  /** Target value to count up to */
  value: number
  /** Format: 'number' (default), 'currency' (PLN), 'percentage' */
  format?: 'number' | 'currency' | 'percentage'
  /** Decimal places (default: 0, currency defaults to 2) */
  decimals?: number
  /** Animation duration in ms (default: 1200) */
  duration?: number
  /** Additional className for the value text */
  className?: string
}

/**
 * AnimatedCounter — Spring-animated number counter with formatting.
 *
 * Provides:
 * - Smooth count-up animation from 0
 * - Intersection Observer trigger (animates on scroll into view)
 * - Number / currency (PLN) / percentage formatting
 * - tabular-nums for stable width during animation
 * - prefers-reduced-motion support
 */
export function AnimatedCounter({
  value,
  format = 'number',
  decimals,
  duration = 1200,
  className,
}: AnimatedCounterProps) {
  const resolvedDecimals = decimals ?? (format === 'currency' ? 2 : 0)

  const [displayValue, ref] = useCountUp({
    end: value,
    duration,
    decimals: resolvedDecimals,
    startOnView: true,
  })

  const formatted = format === 'currency'
    ? `${displayValue} zł`
    : format === 'percentage'
      ? `${displayValue}%`
      : displayValue

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={cn('tabular-nums', className)}
    >
      {formatted}
    </span>
  )
}
