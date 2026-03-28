'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  page: number
  totalPages: number
  total?: number
  onPageChange: (page: number) => void
  /** Show prev/next labels (default true) */
  showLabels?: boolean
  className?: string
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  showLabels = true,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
      className
    )}>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Strona{' '}
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{page}</span>
        {' '}z{' '}
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{totalPages}</span>
        {total != null && (
          <span className="ml-2 text-xs">({total} wyników)</span>
        )}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-8 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {showLabels && 'Poprzednia'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-8 rounded-xl"
        >
          {showLabels && 'Następna'}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
