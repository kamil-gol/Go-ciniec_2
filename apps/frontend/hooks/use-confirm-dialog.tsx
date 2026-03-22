'use client'

import { useState, useCallback, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2, Archive, Info } from 'lucide-react'

type ConfirmVariant = 'destructive' | 'warning' | 'info' | 'archive'

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

const variantConfig: Record<ConfirmVariant, {
  icon: typeof Trash2
  iconClass: string
  bgClass: string
  actionClass: string
}> = {
  destructive: {
    icon: Trash2,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    actionClass: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    actionClass: 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    actionClass: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
  },
  archive: {
    icon: Archive,
    iconClass: 'text-orange-500',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    actionClass: 'bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800',
  },
}

export function useConfirmDialog() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
  })
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(true)
    resolveRef.current = null
  }, [])

  const handleCancel = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(false)
    resolveRef.current = null
  }, [])

  const variant = options.variant || 'destructive'
  const config = variantConfig[variant]
  const Icon = config.icon

  const ConfirmDialog = (
    <AlertDialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <AlertDialogContent className="dark:bg-neutral-900 dark:border-neutral-700">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgClass} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.iconClass}`} />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="dark:text-neutral-100">
                {options.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 dark:text-neutral-400">
                {options.description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            className="dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            {options.cancelLabel || 'Anuluj'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={config.actionClass}
          >
            {options.confirmLabel || 'Potwierdź'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { confirm, ConfirmDialog }
}
