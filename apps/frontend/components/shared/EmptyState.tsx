'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-tokens'
import { type LucideIcon, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export interface EmptyStateProps {
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
  /** Optional CTA link href (alternative to onAction) */
  actionHref?: string
  /** 'default' = full size with glow, 'compact' = smaller for sidebars/panels, 'dashed' = dashed border container */
  variant?: 'default' | 'compact' | 'dashed'
  /** Additional className */
  className?: string
}

/**
 * EmptyState — Shown when a list or table has no data.
 *
 * Provides:
 * - Soft icon with gradient glow background
 * - Floating decorative shapes (subtle, non-animated)
 * - Title + friendly description
 * - Optional action button (onClick) or link (href)
 * - Entrance animation with spring physics
 * - Border on icon container in default variant
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const isCompact = variant === 'compact'
  const isDashed = variant === 'dashed'

  const actionButton = actionLabel && (actionHref || onAction) ? (
    actionHref ? (
      <Link href={actionHref}>
        <Button className={isCompact ? '' : 'shadow-lg'} size={isCompact ? 'sm' : 'default'}>
          {actionLabel}
        </Button>
      </Link>
    ) : (
      <Button onClick={onAction} className={isCompact ? '' : 'shadow-lg'} size={isCompact ? 'sm' : 'default'}>
        {actionLabel}
      </Button>
    )
  ) : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.ease.default }}
      className={cn(
        'relative flex flex-col items-center justify-center text-center overflow-hidden',
        isCompact && 'py-8 px-4',
        isDashed && 'py-12 px-6 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700',
        !isCompact && !isDashed && 'py-16 px-6',
        className
      )}
    >
      {/* Floating decorative shapes — only in default variant */}
      {!isCompact && !isDashed && (
        <>
          <div className="absolute top-8 left-1/4 w-16 h-16 rounded-full bg-primary/5 dark:bg-primary/10 blur-xl" />
          <div className="absolute bottom-12 right-1/4 w-20 h-20 rounded-full bg-primary/3 dark:bg-primary/5 blur-xl" />
        </>
      )}

      <div className={cn('relative', isCompact ? 'mb-3' : 'mb-6')}>
        {!isCompact && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 blur-xl scale-150" />
        )}
        <div className={cn(
          'relative flex items-center justify-center rounded-2xl',
          isCompact
            ? 'h-12 w-12 bg-neutral-100 dark:bg-neutral-800'
            : 'h-20 w-20 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-800/50 shadow-soft border border-neutral-200/50 dark:border-neutral-700/50'
        )}>
          <Icon className={cn(
            'text-neutral-500 dark:text-neutral-500',
            isCompact ? 'h-6 w-6' : 'h-10 w-10'
          )} />
        </div>
      </div>

      <h3 className={cn(
        'relative font-bold text-neutral-900 dark:text-neutral-100 mb-2',
        isCompact ? 'text-sm' : 'text-xl'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          'relative text-neutral-500 dark:text-neutral-300 max-w-sm',
          isCompact ? 'text-xs mb-3' : 'mb-6'
        )}>
          {description}
        </p>
      )}
      {actionButton && <div className="relative">{actionButton}</div>}
    </motion.div>
  )
}
