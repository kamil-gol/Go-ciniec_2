'use client'

import { useEffect, useRef } from 'react'
import { useSpring, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
  /** Wartość docelowa */
  value: number
  /** Format: 'number' (1 234) lub 'currency' (1 234,00 zł) */
  format?: 'number' | 'currency'
  /** Locale dla formatowania */
  locale?: string
  className?: string
}

/**
 * AnimatedCounter — count-up animacja dla wartości liczbowych.
 *
 * Używa Framer Motion useSpring dla płynnej animacji.
 * Automatycznie formatuje liczby wg PL locale.
 *
 * Użycie:
 * ```tsx
 * <AnimatedCounter value={1234} />
 * <AnimatedCounter value={5678.90} format="currency" />
 * ```
 */
export function AnimatedCounter({
  value,
  format = 'number',
  locale = 'pl-PL',
  className,
}: AnimatedCounterProps) {
  const springValue = useSpring(0, { stiffness: 100, damping: 30 })
  const ref = useRef<HTMLSpanElement>(null)

  const formatter = format === 'currency'
    ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 })
    : new Intl.NumberFormat(locale)

  const display = useTransform(springValue, (v) => {
    return format === 'currency'
      ? formatter.format(v)
      : formatter.format(Math.round(v))
  })

  useEffect(() => {
    springValue.set(value)
  }, [value, springValue])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsubscribe
  }, [display])

  return (
    <span ref={ref} className={className}>
      {formatter.format(value)}
    </span>
  )
}
