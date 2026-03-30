'use client'

import { useState, useEffect, useRef } from 'react'

interface UseCountUpOptions {
  /** Target value to count up to */
  end: number
  /** Duration in ms (default: 1200) */
  duration?: number
  /** Decimal places (default: 0) */
  decimals?: number
  /** Start counting when element is in viewport (default: true) */
  startOnView?: boolean
}

/**
 * useCountUp — Animated number counter with spring-like easing.
 *
 * Returns [displayValue, ref] where ref should be attached to the
 * container element for Intersection Observer trigger.
 */
export function useCountUp({
  end,
  duration = 1200,
  decimals = 0,
  startOnView = true,
}: UseCountUpOptions): [string, React.RefObject<HTMLElement | null>] {
  const [value, setValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(!startOnView)
  const ref = useRef<HTMLElement | null>(null)
  const prevEnd = useRef(end)

  // Intersection Observer — start counting when visible
  useEffect(() => {
    if (!startOnView || !ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [startOnView])

  // Animation loop
  useEffect(() => {
    if (!hasStarted) return

    const startValue = prevEnd.current !== end ? prevEnd.current : 0
    prevEnd.current = end

    if (end === 0) {
      setValue(0)
      return
    }

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setValue(end)
      return
    }

    let startTime: number | null = null
    let animationFrame: number

    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = easeOutExpo(progress)
      const currentValue = startValue + (end - startValue) * easedProgress

      setValue(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, hasStarted])

  const displayValue = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString('pl-PL')

  return [displayValue, ref]
}
