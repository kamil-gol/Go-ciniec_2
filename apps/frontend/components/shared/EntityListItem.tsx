'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface EntityListItemProps {
  children: React.ReactNode
  /** Wrap in next/link */
  href?: string
  /** Click handler — adds cursor-pointer */
  onClick?: (e: React.MouseEvent) => void
  /** Stagger animation delay */
  delay?: number
  /** Show skeleton loading state */
  isLoading?: boolean
  /** Dim the item (e.g. deleted client) */
  dimmed?: boolean
  /** Additional classes */
  className?: string
  /** A11y: role attribute */
  role?: string
  /** A11y: tabIndex */
  tabIndex?: number
  /** A11y: keyboard handler */
  onKeyDown?: (e: React.KeyboardEvent) => void
  /** A11y: aria-label */
  'aria-label'?: string
}

export function EntityListItem({
  children,
  href,
  onClick,
  delay = 0,
  isLoading = false,
  dimmed = false,
  className,
  role,
  tabIndex,
  onKeyDown,
  'aria-label': ariaLabel,
}: EntityListItemProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-sm p-4 sm:p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-700/50" />
          </div>
          <div className="h-8 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    )
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      onClick={!href ? onClick : undefined}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      className={cn(
        'group relative rounded-2xl',
        'bg-white dark:bg-neutral-800/80',
        'border border-neutral-200/80 dark:border-neutral-700/50',
        'shadow-sm hover:shadow-md',
        'transition-all duration-300 hover:-translate-y-0.5',
        'p-4 sm:p-5',
        (onClick || href) && 'cursor-pointer',
        dimmed && 'opacity-60',
        className
      )}
    >
      {children}
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
