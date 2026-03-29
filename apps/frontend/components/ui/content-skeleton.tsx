import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

interface ContentSkeletonProps {
  variant: 'stat-card' | 'card' | 'table-row' | 'list-item'
  count?: number
  className?: string
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 p-6 shadow-soft border border-neutral-100 dark:border-neutral-700/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white dark:bg-neutral-800/80 p-5 shadow-soft border border-neutral-100 dark:border-neutral-700/50 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-700/50 animate-pulse">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20 ml-auto" />
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

const VARIANT_MAP = {
  'stat-card': StatCardSkeleton,
  'card': CardSkeleton,
  'table-row': TableRowSkeleton,
  'list-item': ListItemSkeleton,
}

export function ContentSkeleton({ variant, count = 3, className }: ContentSkeletonProps) {
  const Component = VARIANT_MAP[variant]

  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Ładowanie treści">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
      <span className="sr-only">Ładowanie...</span>
    </div>
  )
}
