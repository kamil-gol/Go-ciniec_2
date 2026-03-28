'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface DetailHeroProps {
  /** Gradient classes, e.g. "from-blue-600 via-cyan-600 to-teal-600" */
  gradient: string
  /** Back link href */
  backHref: string
  /** Back link label */
  backLabel?: string
  /** Hero icon */
  icon: LucideIcon
  /** Main title */
  title: string
  /** Subtitle below title */
  subtitle?: string
  /** Additional line below subtitle (e.g. company contact person) */
  extraLine?: string
  /** Badges rendered below title area */
  badges?: ReactNode
  /** Action buttons rendered on the right */
  actions?: ReactNode
  /** Additional className */
  className?: string
}

/**
 * DetailHero — Premium gradient header for detail pages.
 *
 * Provides consistent structure:
 * - Back navigation
 * - Icon + Title + Subtitle
 * - Badges row
 * - Action buttons
 * - Decorative grid pattern + blur blobs
 */
export function DetailHero({
  gradient,
  backHref,
  backLabel = 'Powrót do listy',
  icon: Icon,
  title,
  subtitle,
  extraLine,
  badges,
  actions,
  className,
}: DetailHeroProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5 sm:p-8 text-white shadow-2xl bg-gradient-to-r',
      gradient,
      className
    )}>
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

      <div className="relative z-10 space-y-4 sm:space-y-6">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold">{title}</h1>
                {extraLine && (
                  <p className="text-white/80 text-base mt-0.5">{extraLine}</p>
                )}
                {subtitle && (
                  <p className="text-white/90 text-base sm:text-lg mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            {badges && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {badges}
              </div>
            )}
          </div>

          {actions && (
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
    </div>
  )
}
