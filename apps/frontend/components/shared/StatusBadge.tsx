import { cn } from '@/lib/utils'
import { getStatusConfig, type StatusType } from '@/lib/status-colors'

/** Statuses that represent "in progress" — get a ping animation on the dot */
const ACTIVE_STATUSES = new Set([
  'PENDING', 'CONFIRMED', 'IN_PREPARATION', 'WAITING', 'DRAFT', 'INQUIRY', 'QUOTED',
])

interface StatusBadgeProps {
  /** Entity type — selects the correct color map */
  type: StatusType
  /** Status key, e.g. "CONFIRMED", "PAID" */
  status: string
  /** 'default' = colored bg+border, 'solid' = solid bg+white text, 'dot' = dot indicator */
  variant?: 'default' | 'solid' | 'dot'
  /** Show icon before label (default: true for 'default', false for 'dot') */
  showIcon?: boolean
  /** Show text label (default: true) */
  showLabel?: boolean
  /** Show ping animation on dot for active statuses (default: true) */
  ping?: boolean
  className?: string
}

/**
 * StatusBadge — Unified status badge for all entity types.
 * Reads colors/icons/labels from lib/status-colors.ts.
 */
export function StatusBadge({
  type,
  status,
  variant = 'default',
  showIcon,
  showLabel = true,
  ping = true,
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(type, status)
  const Icon = config.icon
  const shouldShowIcon = showIcon ?? (variant !== 'dot')
  const showPing = ping && ACTIVE_STATUSES.has(status)

  if (variant === 'solid') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-0',
        config.solid,
        className,
      )}>
        {shouldShowIcon && <Icon className="h-3 w-3" />}
        {showLabel && config.label}
      </span>
    )
  }

  if (variant === 'dot') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.text,
        className,
      )}>
        <span className="relative flex h-2 w-2">
          {showPing && (
            <span className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.dot,
            )} />
          )}
          <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dot)} />
        </span>
        {showLabel && config.label}
      </span>
    )
  }

  // Default: colored background + border
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bg,
      config.text,
      config.border,
      className,
    )}>
      {shouldShowIcon && <Icon className="h-3 w-3" />}
      {showLabel && config.label}
    </span>
  )
}
