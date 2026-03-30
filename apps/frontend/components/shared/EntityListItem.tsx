'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface EntityListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Wrap in next/link */
  href?: string
  /** Click handler — adds cursor-pointer */
  onClick?: () => void
  /** Stagger animation delay */
  delay?: number
  /** Show skeleton loading state */
  isLoading?: boolean
  /** Dim the item (e.g. deleted client) */
  dimmed?: boolean
}

export function EntityListItem({
  children,
  href,
  onClick,
  delay = 0,
  isLoading = false,
  dimmed = false,
  className,
  ...rest
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
      {...rest}
    >
      {children}
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
