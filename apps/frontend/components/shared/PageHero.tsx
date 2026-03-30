'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type ModuleAccent } from '@/lib/design-tokens'
import { type LucideIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export interface PageHeroProps {
  /** Module accent colors from design-tokens */
  accent: ModuleAccent
  /** Main page title */
  title: string
  /** Optional subtitle / description */
  subtitle?: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Optional right-side action (e.g. a Button) */
  action?: React.ReactNode
  /** Optional inline stats shown below subtitle */
  stats?: Array<{
    icon: LucideIcon
    label: string
    value: string | number
  }>
  /** Optional back navigation link */
  backHref?: string
  /** Optional back navigation label */
  backLabel?: string
  /** Compact variant — smaller padding, no subtitle/stats. For table-heavy pages. */
  compact?: boolean
}

/**
 * PageHero \u2014 Premium hero section used at the top of every dashboard page.
 * 
 * Provides:
 * - Gradient background per module
 * - Consistent layout (icon + title + subtitle)
 * - Optional CTA button on the right
 * - Optional inline stats row
 * - Optional back navigation link
 * - Framer Motion entrance animation
 * - Full dark mode support
 */
export function PageHero({ accent, title, subtitle, icon: Icon, action, stats, backHref, backLabel, compact }: PageHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl text-white shadow-hard',
        'bg-gradient-to-r',
        accent.gradient
      )}
    >
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-white/5 rounded-full blur-3xl" />

      <div className={cn('relative z-10', compact ? 'p-4 sm:p-5' : 'p-4 sm:p-6 lg:p-8')}>
        {/* Back navigation */}
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel || 'Powrót'}
          </Link>
        )}

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          {/* Left: Icon + Title */}
          <div className={compact ? 'space-y-0' : 'space-y-4'}>
            <div className="flex items-center gap-3 sm:gap-5">
              <div className={cn(
                'bg-white/15 backdrop-blur-sm shadow-lg',
                compact ? 'p-2 rounded-xl' : 'p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl'
              )}>
                <Icon className={compact ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-7 w-7 sm:h-9 sm:w-9'} />
              </div>
              <div>
                <h1 className={cn(
                  'font-bold tracking-tight',
                  compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'
                )}>{title}</h1>
                {subtitle && !compact && (
                  <p className="text-white/85 text-sm sm:text-lg mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Inline stats */}
            {!compact && stats && stats.length > 0 && (
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-6">
                {stats.map((stat) => {
                  const StatIcon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/15 hover:bg-white/15 transition-colors"
                    >
                      <StatIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-white/70 leading-none">{stat.label}</p>
                        <p className="text-base sm:text-xl font-bold leading-tight mt-0.5">{stat.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Action button */}
          {action && (
            <div className="flex-shrink-0 self-end sm:self-auto sm:pt-1">
              {action}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
