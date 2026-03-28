'use client'

import React, { type ReactNode } from 'react'
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
import { AlertTriangle, Trash2, Info, Loader2, type LucideIcon } from 'lucide-react'

const VARIANT_CONFIG = {
  destructive: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    actionClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    actionClass: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  },
} as const

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string | ReactNode
  variant?: 'destructive' | 'warning' | 'info'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  icon?: LucideIcon
  children?: ReactNode
}

/**
 * ConfirmDialog — Unified confirmation dialog wrapping AlertDialog.
 * Consistent icon-in-box header pattern across all modules.
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
  icon,
  children,
}: ConfirmDialogProps) {
  const cfg = VARIANT_CONFIG[variant]
  const Icon = icon ?? cfg.icon

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', cfg.iconBg)}>
              <Icon className={cn('h-5 w-5', cfg.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-1">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(cfg.actionClass)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Przetwarzanie...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
