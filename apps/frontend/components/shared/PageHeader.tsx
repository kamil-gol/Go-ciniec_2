'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography } from '@/lib/design-tokens'
import { pageVariants } from '@/lib/motion-tokens'
import { Breadcrumb } from './Breadcrumb'

interface PageHeaderProps {
  /** Tytuł strony */
  title: string
  /** Podtytuł / opis */
  subtitle?: string
  /** Ikona obok tytułu */
  icon?: LucideIcon
  /** Elementy akcji (przyciski) po prawej */
  actions?: React.ReactNode
  /** Opcjonalne inline stats wyświetlane poniżej podtytułu */
  stats?: Array<{
    icon: LucideIcon
    label: string
    value: string | number
  }>
  /** Pokaż breadcrumbs nad tytułem */
  showBreadcrumb?: boolean
  className?: string
}

/**
 * PageHeader — lekki nagłówek strony bez gradient background.
 *
 * Zastępuje PageHero. Bez per-moduł kolorów — jeden spójny wygląd.
 *
 * Użycie:
 * ```tsx
 * <PageHeader
 *   title="Rezerwacje"
 *   subtitle="Zarządzaj rezerwacjami i terminami"
 *   icon={Calendar}
 *   actions={<Button>Nowa rezerwacja</Button>}
 *   stats={[
 *     { icon: Users, label: 'Klienci', value: 42 },
 *   ]}
 * />
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  stats,
  showBreadcrumb = true,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className={cn('space-y-4', className)}
    >
      {showBreadcrumb && <Breadcrumb />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className={typography.pageTitle}>{title}</h1>
              {subtitle && <p className={typography.pageSubtitle}>{subtitle}</p>}
            </div>
          </div>
          {/* Inline stats */}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
              {stats.map((stat) => {
                const StatIcon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  >
                    <StatIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-sm font-semibold leading-tight text-foreground">{stat.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}
