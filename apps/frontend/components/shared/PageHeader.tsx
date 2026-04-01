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
 * />
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  showBreadcrumb = true,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className={cn('space-y-3', className)}
    >
      {showBreadcrumb && <Breadcrumb />}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
        {actions && (
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}
