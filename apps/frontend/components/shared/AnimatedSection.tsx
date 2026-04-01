'use client'

import { motion } from 'framer-motion'
import { motionTokens } from '@/lib/design-tokens'

interface AnimatedSectionProps {
  children: React.ReactNode
  /** Delay index for stagger effect (0, 1, 2, ...) */
  index?: number
  className?: string
}

/**
 * Wrapper that gives its children a staggered entrance animation
 * (fade-in + slight slide-up). Use `index` to control stagger delay.
 */
export function AnimatedSection({ children, index = 0, className }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * motionTokens.stagger.cards,
        duration: motionTokens.duration.normal,
        ease: motionTokens.ease.default,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
