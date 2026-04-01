'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface StatPillDef {
  icon: React.ElementType
  label?: string
  value: string
}

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
  /** Small text above the title (e.g. order number), rendered in mono font */
  orderNumber?: string
  /** Badges rendered below title area */
  badges?: ReactNode
  /** Stat pills row below badges */
  statPills?: StatPillDef[]
  /** Action buttons rendered on the right (flex row) */
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
 * - Stat pills row
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
  orderNumber,
  badges,
  statPills,
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
      {/* Noise texture overlay for premium depth */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
          </Link>

          {actions && (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {actions}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {orderNumber && (
            <span className="font-mono text-white/60 text-sm tracking-wide">{orderNumber}</span>
          )}
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
          {statPills && statPills.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {statPills.map((pill, i) => {
                const PillIcon = pill.icon
                return (
                  <div key={i} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <PillIcon className="w-4 h-4 shrink-0" />
                    {pill.label && <span className="text-xs text-white/70">{pill.label}</span>}
                    <span className="text-sm font-semibold">{pill.value}</span>
                  </div>
                )
              })}
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
