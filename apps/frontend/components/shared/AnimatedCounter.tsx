'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  /** Target value to count up to */
  value: number
  /** Duration of the animation in ms */
  duration?: number
  /** Format function for the displayed value */
  formatFn?: (n: number) => string
  className?: string
}

/**
 * AnimatedCounter — Smooth count-up animation for numeric values.
 * Triggers when the element enters the viewport.
 */
export function AnimatedCounter({
  value,
  duration = 800,
  formatFn,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    const startValue = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (value - startValue) * eased)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, value, duration])

  const formatted = formatFn ? formatFn(displayValue) : String(displayValue)

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  )
}
