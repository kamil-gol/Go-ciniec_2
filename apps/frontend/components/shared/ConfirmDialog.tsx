'use client'

import { type ReactNode } from 'react'
import { type LucideIcon, AlertTriangle, Info, ShieldAlert, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string | ReactNode
  /** Visual variant: destructive (red), warning (amber), info (blue) */
  variant?: 'destructive' | 'warning' | 'info'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  isLoading?: boolean
  /** Override default icon (default is based on variant) */
  icon?: LucideIcon
  /** Additional content between description and footer */
  children?: ReactNode
}

const VARIANT_CONFIG = {
  destructive: {
    icon: ShieldAlert,
    iconBg: 'bg-error-100 dark:bg-error-900/30',
    iconColor: 'text-error-600 dark:text-error-400',
    actionClass: 'bg-destructive hover:bg-destructive/90 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-info-600 dark:text-info-400',
    actionClass: '',
  },
} as const

/**
 * ConfirmDialog — Unified confirmation dialog for destructive/important actions.
 *
 * Wraps AlertDialog with consistent header (icon + title), description,
 * optional children, and footer (cancel + confirm).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'destructive',
  confirmLabel = 'Potwierdź',
  cancelLabel = 'Anuluj',
  onConfirm,
  isLoading = false,
  icon: CustomIcon,
  children,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = CustomIcon || config.icon

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.iconBg)}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription asChild={typeof description !== 'string'}>
              {typeof description === 'string' ? (
                <span>{description}</span>
              ) : (
                description
              )}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(config.actionClass)}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
