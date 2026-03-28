import { cn } from '@/lib/utils'
import { getStatusConfig, type StatusType } from '@/lib/status-colors'

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
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(type, status)
  const Icon = config.icon
  const shouldShowIcon = showIcon ?? (variant !== 'dot')

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
        <span className={cn('h-2 w-2 rounded-full', config.dot)} />
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
