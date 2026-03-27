'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderStat {
  label: string
  value: string | number
  icon?: LucideIcon
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  gradient?: string
  actions?: React.ReactNode
  stats?: PageHeaderStat[]
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  gradient = 'from-primary-600 to-primary-700',
  actions,
  stats,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-gradient-to-br text-white p-6 sm:p-8",
      gradient,
      className
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-white/80">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex gap-2 w-full sm:w-auto">
              {actions}
            </div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  {stat.icon && <stat.icon className="h-4 w-4 text-white/70" />}
                  <span className="text-xs text-white/70">{stat.label}</span>
                </div>
                <p className="mt-1 text-xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
