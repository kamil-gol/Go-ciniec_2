'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { typography, surfaces } from '@/lib/design-tokens'
import { pageVariants } from '@/lib/motion-tokens'
import { motion } from 'framer-motion'
import { Breadcrumb } from './Breadcrumb'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface DetailHeaderProps {
  /** Link powrotny */
  backHref: string
  /** Label linku powrotnego */
  backLabel?: string
  /** Ikona obok tytulu */
  icon?: LucideIcon
  /** Tytul glowny */
  title: string
  /** Podtytul */
  subtitle?: string
  /** Dodatkowa linia (np. nazwa firmy) */
  extraLine?: string
  /** Badges (np. StatusBadge) */
  badges?: ReactNode
  /** Przyciski akcji po prawej */
  actions?: ReactNode
  /** Dodatkowy className */
  className?: string
}

/**
 * DetailHeader — lekki naglowek detail page bez gradient background.
 *
 * Zastepuje DetailHero. Bez per-modul kolorow gradient.
 * Breadcrumb + back link + title + badges + actions.
 *
 * Uzycie:
 * ```tsx
 * <DetailHeader
 *   backHref="/dashboard/reservations"
 *   title="Wesele Kowalskich"
 *   subtitle="15 czerwca 2026 • Sala Glowna"
 *   icon={Calendar}
 *   badges={<StatusBadge type="reservation" status="CONFIRMED" />}
 *   actions={<Button>Edytuj</Button>}
 * />
 * ```
 */
export function DetailHeader({
  backHref,
  backLabel = 'Powrot do listy',
  icon: Icon,
  title,
  subtitle,
  extraLine,
  badges,
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className={cn('space-y-4', className)}
    >
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-3">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
      </div>

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className={typography.pageTitle}>{title}</h1>
              {extraLine && (
                <p className="text-sm text-muted-foreground mt-0.5">{extraLine}</p>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {badges && (
            <div className="flex flex-wrap items-center gap-2">
              {badges}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}
