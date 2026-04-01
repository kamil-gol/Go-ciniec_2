'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface FilterTab {
  key: string
  label: string
  count?: number
  icon?: LucideIcon
}

export interface FilterTabsProps {
  tabs: FilterTab[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
  /** Responsive width — 'auto' (default) = fits content, 'full' = full width on mobile */
  width?: 'auto' | 'full'
}

/**
 * FilterTabs — Unified pill-style tab navigation used across all modules.
 *
 * Provides:
 * - Pill tabs inside a container background
 * - Active state with white bg + shadow
 * - Optional badge count per tab
 * - Optional Lucide icon per tab
 * - Responsive width mode (auto / full on mobile)
 * - Full dark mode support
 */
export function FilterTabs({ tabs, activeKey, onChange, className, width = 'auto' }: FilterTabsProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1',
      width === 'full' && 'w-full sm:w-auto',
      className
    )}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              width === 'full' && 'flex-1 justify-center',
              isActive
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
            )}
          >
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center rounded-full text-[10px] font-bold h-5 min-w-[20px] px-1',
                isActive
                  ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
                  : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
