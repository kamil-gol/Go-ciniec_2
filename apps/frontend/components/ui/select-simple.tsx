'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectSimpleProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

const SelectSimple = React.forwardRef<HTMLSelectElement, SelectSimpleProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        )}
        <select
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 shadow-sm ring-offset-background',
            'text-sm text-foreground',
            'focus:outline-none focus:ring-1 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)
SelectSimple.displayName = 'SelectSimple'

export { SelectSimple }
