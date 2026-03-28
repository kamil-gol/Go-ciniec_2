import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label="Ładowanie">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size]
        )}
      />
      <span className="sr-only">Ładowanie...</span>
    </div>
  )
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center z-50" role="status" aria-live="polite">
      <Loading size="lg" />
    </div>
  )
}
