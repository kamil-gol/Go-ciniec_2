import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'error' | 'info'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200': variant === 'default',
          'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300': variant === 'secondary',
          'border border-current bg-transparent': variant === 'outline',
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': variant === 'destructive' || variant === 'error',
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400': variant === 'warning',
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
