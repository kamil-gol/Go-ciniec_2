'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  /** Error title (optional, shows above message) */
  title?: string
  /** Error message */
  message: string
  /** Retry callback — shows retry button */
  onRetry?: () => void
  /** 'inline' = alert box inside content, 'card' = standalone card, 'banner' = dismissable bar */
  variant?: 'inline' | 'card' | 'banner'
  className?: string
}

/**
 * ErrorState — Unified error display for all modules.
 *
 * Three variants:
 * - inline: Alert box with icon + message + optional retry (default)
 * - card: Centered card with large icon (for full page errors)
 * - banner: Compact top banner (for non-blocking errors)
 */
export function ErrorState({
  title,
  message,
  onRetry,
  variant = 'inline',
  className,
}: ErrorStateProps) {
  if (variant === 'card') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-900/20 mb-4">
          <AlertCircle className="h-8 w-8 text-error-500" />
        </div>
        {title && (
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {title}
          </h3>
        )}
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {message}
        </p>
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
        'p-3 rounded-lg text-sm',
        'bg-destructive/10 border border-destructive/20 text-destructive',
        className
      )}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{message}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium hover:underline flex-shrink-0"
            >
              Ponów
            </button>
          )}
        </div>
      </div>
    )
  }

  // Default: inline
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl p-4',
      'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800',
      className
    )}>
      <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-error-800 dark:text-error-300">{title}</p>
        )}
        <p className={cn(
          'text-sm',
          title ? 'text-error-600 dark:text-error-400 mt-0.5' : 'font-medium text-error-800 dark:text-error-300'
        )}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-error-700 dark:text-error-300 hover:underline flex-shrink-0"
        >
          Ponów
        </button>
      )}
    </div>
  )
}
