'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type ModuleAccent } from '@/lib/design-tokens'
import { type LucideIcon } from 'lucide-react'

interface PageHeroProps {
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
}

/**
 * PageHero — Premium hero section used at the top of every dashboard page.
 * 
 * Provides:
 * - Gradient background per module
 * - Consistent layout (icon + title + subtitle)
 * - Optional CTA button on the right
 * - Optional inline stats row
 * - Framer Motion entrance animation
 * - Full dark mode support
 */
export function PageHero({ accent, title, subtitle, icon: Icon, action, stats }: PageHeroProps) {
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

      <div className="relative z-10 p-8">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Icon + Title */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-white/15 backdrop-blur-sm rounded-2xl shadow-lg">
                <Icon className="h-9 w-9" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-white/85 text-lg mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Inline stats */}
            {stats && stats.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-6">
                {stats.map((stat) => {
                  const StatIcon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/15 hover:bg-white/15 transition-colors"
                    >
                      <StatIcon className="h-5 w-5 text-white/80" />
                      <div>
                        <p className="text-xs text-white/70 leading-none">{stat.label}</p>
                        <p className="text-xl font-bold leading-tight mt-0.5">{stat.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Action button */}
          {action && (
            <div className="flex-shrink-0 pt-1">
              {action}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
