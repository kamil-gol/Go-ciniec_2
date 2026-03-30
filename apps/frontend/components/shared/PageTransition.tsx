'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { motionTokens } from '@/lib/design-tokens'

interface PageTransitionProps {
  children: React.ReactNode
}

/**
 * PageTransition — Framer Motion AnimatePresence wrapper for smooth page transitions.
 *
 * Wraps page content with fade + slide-up animation on route change.
 * Uses usePathname as animation key for route-based transitions.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: motionTokens.duration.normal,
          ease: motionTokens.ease.smooth,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
