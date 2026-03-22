'use client'

import { cn } from '@/lib/utils'

export interface FilterTab {
  key: string
  label: string
  count?: number
}

export interface FilterTabsProps {
  tabs: FilterTab[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

/**
 * FilterTabs — Unified pill-style tab filter used across all modules.
 *
 * Provides:
 * - Pill tabs inside a container background
 * - Active state with white bg + shadow
 * - Optional badge count per tab
 * - Full dark mode support
 */
export function FilterTabs({ tabs, activeKey, onChange, className }: FilterTabsProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1',
      className
    )}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center rounded-full text-[10px] font-bold h-5 min-w-[20px] px-1',
                isActive
                  ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
                  : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
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
