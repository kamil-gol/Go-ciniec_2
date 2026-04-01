'use client'

import { type LucideIcon, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ErrorStateProps {
  /** Komunikat błędu */
  message?: string
  /** Opis szczegółowy */
  description?: string
  /** Callback retry */
  onRetry?: () => void
  /** Tekst przycisku retry */
  retryLabel?: string
  /** Ikona (domyślnie AlertCircle) */
  icon?: LucideIcon
  /** Kompaktowy wariant (inline zamiast centered) */
  compact?: boolean
  className?: string
}

/**
 * ErrorState — zunifikowany komponent błędu.
 *
 * Użycie:
 * ```tsx
 * <ErrorState message="Nie udało się pobrać danych" onRetry={refetch} />
 * <ErrorState message="Błąd połączenia" compact />
 * ```
 */
export function ErrorState({
  message = 'Wystąpił błąd',
  description,
  onRetry,
  retryLabel = 'Spróbuj ponownie',
  icon: Icon = AlertCircle,
  compact = false,
  className,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 p-4',
        className
      )}>
        <Icon className="h-5 w-5 text-error-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-error-800 dark:text-error-300">{message}</p>
          {description && (
            <p className="text-xs text-error-600 dark:text-error-400 mt-0.5">{description}</p>
          )}
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {retryLabel}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-6',
      className
    )}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-900/20 mb-4">
        <Icon className="h-8 w-8 text-error-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{message}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
