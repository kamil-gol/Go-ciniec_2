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
          'bg-secondary-100 text-neutral-800': variant === 'default',
          'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300': variant === 'secondary',
          'border border-current bg-transparent': variant === 'outline',
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': variant === 'destructive',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'error',
          'bg-blue-100 text-blue-800': variant === 'info',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
