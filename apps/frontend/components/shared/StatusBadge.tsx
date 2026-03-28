'use client'

import { cn } from '@/lib/utils'
import {
  type StatusType,
  type StatusColorConfig,
  getStatusConfig,
  getStatusBadgeClass,
} from '@/lib/status-colors'

interface StatusBadgeProps {
  /** Status type: 'reservation' | 'deposit' | 'queue' | 'catering' */
  type: StatusType
  /** Status key, e.g. 'PENDING', 'CONFIRMED' */
  status: string
  /** 'default' = colored bg + border, 'solid' = solid bg + white text (for hero), 'dot' = dot indicator only */
  variant?: 'default' | 'solid' | 'dot'
  /** Show icon before label */
  showIcon?: boolean
  /** Show text label */
  showLabel?: boolean
  /** Additional className */
  className?: string
}

/**
 * StatusBadge — Unified status badge for all entity types.
 *
 * Single source of truth: reads colors/icons/labels from `lib/status-colors.ts`.
 * Use this instead of defining status badges inline in components.
 */
export function StatusBadge({
  type,
  status,
  variant = 'default',
  showIcon = true,
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(type, status)
  if (!config) return null

  const Icon = config.icon

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span className={cn('h-2 w-2 rounded-full', config.dot)} />
        {showLabel && (
          <span className={cn('text-xs font-medium', config.text)}>{config.label}</span>
        )}
      </span>
    )
  }

  if (variant === 'solid') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white border-0',
          config.solid,
          className
        )}
      >
        {showIcon && <Icon className="h-3 w-3" />}
        {showLabel && config.label}
      </span>
    )
  }

  // Default variant
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border',
        getStatusBadgeClass(config),
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {showLabel && config.label}
    </span>
  )
}
