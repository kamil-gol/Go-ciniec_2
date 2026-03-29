'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline'
  icon?: LucideIcon
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center animate-slide-up",
      compact ? "py-8 px-4" : "py-16 px-6",
      className
    )}>
      <div className={cn(
        "flex items-center justify-center rounded-2xl bg-muted/50",
        compact ? "h-12 w-12 mb-3" : "h-16 w-16 mb-4"
      )}>
        <Icon className={cn(
          "text-muted-foreground",
          compact ? "h-6 w-6" : "h-8 w-8"
        )} />
      </div>
      <h3 className={cn(
        "font-semibold text-foreground",
        compact ? "text-sm" : "text-lg"
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          "text-muted-foreground mt-1 max-w-sm",
          compact ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
          className="mt-4"
          size={compact ? "sm" : "default"}
        >
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
