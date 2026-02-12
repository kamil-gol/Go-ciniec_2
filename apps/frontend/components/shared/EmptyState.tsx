'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type LucideIcon, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  /** Lucide icon (defaults to Inbox) */
  icon?: LucideIcon
  /** Main title */
  title: string
  /** Description text */
  description?: string
  /** Optional CTA button label */
  actionLabel?: string
  /** Optional CTA onClick */
  onAction?: () => void
  /** Additional className */
  className?: string
}

/**
 * EmptyState — Shown when a list or table has no data.
 * 
 * Provides:
 * - Soft icon with gradient background
 * - Title + description
 * - Optional action button
 * - Entrance animation
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="relative mb-6">
        {/* Glow behind icon */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 blur-xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-800/50 shadow-soft">
          <Icon className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-lg">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
