'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ═══ StatPill ═══

export function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label?: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
      <Icon className="w-4 h-4 shrink-0" />
      {label && <span className="text-xs text-white/70">{label}</span>}
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

// ═══ SectionCard ═══

interface SectionCardProps {
  title: string
  /** ElementType for default variant, ReactNode for gradient variant */
  icon: React.ElementType | React.ReactNode
  badge?: React.ReactNode
  /** Optional action slot (e.g. button) rendered on the right side of header */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** 'default' = flat header with colored icon pill; 'gradient' = gradient background header */
  variant?: 'default' | 'gradient'
  /** Optional accent gradient stripe at top, e.g. "from-blue-500 to-cyan-500" */
  accentGradient?: string
  // ── Default variant props ──
  /** Background class for the icon pill (default variant) */
  iconBg?: string
  /** Color class for the icon (default variant) */
  iconColor?: string
  // ── Gradient variant props ──
  /** Gradient classes for the icon pill, e.g. "from-blue-500 to-cyan-500" */
  iconGradient?: string
  /** Gradient classes for the header background, e.g. "from-blue-50 via-cyan-50 to-teal-50" */
  headerGradient?: string
  /** Spacing below the header row inside gradient variant */
  headerSpacing?: 'mb-4' | 'mb-6'
}

export function SectionCard({
  title,
  icon,
  badge,
  action,
  children,
  className,
  variant = 'default',
  accentGradient,
  // default variant
  iconBg,
  iconColor,
  // gradient variant
  iconGradient,
  headerGradient,
  headerSpacing = 'mb-6',
}: SectionCardProps) {
  // ── Gradient variant ──
  if (variant === 'gradient') {
    return (
      <Card className={cn('border-0 shadow-soft overflow-hidden', className)}>
        <div className={cn('bg-gradient-to-br p-5', headerGradient)}>
          <div className={cn('flex items-center gap-3', headerSpacing)}>
            <div
              className={cn(
                'p-2 bg-gradient-to-br rounded-lg shadow-lg',
                iconGradient
              )}
            >
              {icon as React.ReactNode}
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
            {badge && <div className="ml-auto">{badge}</div>}
            {action && <div className={badge ? '' : 'ml-auto'}>{action}</div>}
          </div>
          {children}
        </div>
      </Card>
    )
  }

  // ── Default variant ──
  const Icon = icon as React.ElementType

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Optional accent gradient stripe */}
      {accentGradient && (
        <div className={cn('h-1 bg-gradient-to-r', accentGradient)} />
      )}

      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                iconBg
              )}
            >
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {action}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  )
}

// ═══ Field ═══

export function Field({
  label,
  value,
  full,
}: {
  label: string
  value?: string | null
  full?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {value ?? '—'}
      </p>
    </div>
  )
}

// ═══ CountBadge ═══

export function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold">
      {count}
    </span>
  )
}
