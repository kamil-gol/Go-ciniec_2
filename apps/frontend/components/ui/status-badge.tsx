'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import { getStatusConfig, type StatusType } from '@/lib/status-colors'

// ── CVA badge variants ──────────────────────────────────────

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold',
  {
    variants: {
      size: {
        sm: 'text-[10px] px-2 py-0.5 rounded-md',
        md: 'text-xs px-2.5 py-1 rounded-full',
        lg: 'text-sm px-3 py-1.5 rounded-full',
      },
      display: {
        /** Tło + tekst kolorowy */
        default: '',
        /** Solid kolor tło + biały tekst */
        solid: '',
        /** Tylko dot + tekst */
        dot: 'bg-transparent px-0',
      },
    },
    defaultVariants: {
      size: 'md',
      display: 'default',
    },
  }
)

// ── Props ────────────────────────────────────────────────────

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  /** Typ encji — określa mapowanie kolorów */
  type: StatusType
  /** Klucz statusu (np. 'CONFIRMED', 'PENDING', 'PAID') */
  status: string
  /** Pokaż ikonę obok tekstu */
  showIcon?: boolean
  /** Pokaż etykietę tekstową */
  showLabel?: boolean
  /** Nadpisanie etykiety (zamiast domyślnej z status-colors) */
  label?: string
  className?: string
}

/**
 * StatusBadge — zunifikowany badge statusu dla wszystkich encji systemu.
 *
 * Kolory i ikony pobiera z `lib/status-colors.ts` na podstawie `type` + `status`.
 *
 * Użycie:
 * ```tsx
 * <StatusBadge type="reservation" status="CONFIRMED" />
 * <StatusBadge type="deposit" status="PAID" size="sm" />
 * <StatusBadge type="catering" status="IN_PREPARATION" display="solid" />
 * ```
 */
export function StatusBadge({
  type,
  status,
  showIcon = true,
  showLabel = true,
  label: labelOverride,
  size,
  display = 'default',
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(type, status)
  const Icon: LucideIcon = config.icon
  const displayLabel = labelOverride ?? config.label

  const colorClasses = display === 'solid'
    ? config.solid
    : display === 'dot'
      ? config.text
      : `${config.bg} ${config.text}`

  return (
    <span className={cn(statusBadgeVariants({ size, display }), colorClasses, className)}>
      {display === 'dot' && (
        <span className={cn('inline-block h-2 w-2 rounded-full flex-shrink-0', config.dot)} />
      )}
      {showIcon && display !== 'dot' && (
        <Icon className="h-3 w-3 flex-shrink-0" />
      )}
      {showLabel && displayLabel}
    </span>
  )
}

export { statusBadgeVariants }
export type { StatusBadgeProps }
