'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  /** 'inline' = alert box, 'card' = centered page error, 'banner' = compact bar */
  variant?: 'inline' | 'card' | 'banner'
  className?: string
}

/**
 * ErrorState — Unified error display for all modules.
 * Three variants for different contexts.
 */
export function ErrorState({
  title = 'Wystąpił błąd',
  message,
  onRetry,
  variant = 'inline',
  className,
}: ErrorStateProps) {
  if (variant === 'card') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Spróbuj ponownie
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-2.5',
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
        className,
      )}>
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        <p className="text-sm font-medium text-red-800 dark:text-red-300 flex-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline flex-shrink-0"
          >
            Ponów
          </button>
        )}
      </div>
    )
  }

  // Default: inline alert box
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl p-4',
      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
      className,
    )}>
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800 dark:text-red-300">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline flex-shrink-0"
        >
          Spróbuj ponownie
        </button>
      )}
    </div>
  )
}
