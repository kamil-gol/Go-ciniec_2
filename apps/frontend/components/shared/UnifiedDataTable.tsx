'use client'

import { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/shared/Pagination'
import { typography } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

// ── Hover accent presets ─────────────────────────────────────────────────────
// Aligned with moduleAccents groups from design-tokens.ts

const hoverAccentStyles = {
  /** Core/Operations — blue family */
  blue: {
    row: 'hover:bg-blue-50/60 dark:hover:bg-blue-900/10 border-l-2 border-l-transparent hover:border-l-blue-400 dark:hover:border-l-blue-500',
  },
  /** Finance — teal family */
  teal: {
    row: 'hover:bg-teal-50/60 dark:hover:bg-teal-900/10 border-l-2 border-l-transparent hover:border-l-teal-400 dark:hover:border-l-teal-500',
  },
  /** Configuration — slate family */
  slate: {
    row: 'hover:bg-slate-50/60 dark:hover:bg-slate-900/10 border-l-2 border-l-transparent hover:border-l-slate-400 dark:hover:border-l-slate-500',
  },
  /** Culinary — amber/orange family */
  amber: {
    row: 'hover:bg-orange-50/60 dark:hover:bg-orange-900/10 border-l-2 border-l-transparent hover:border-l-orange-400 dark:hover:border-l-orange-500',
  },
  /** Deposits — rose family */
  rose: {
    row: 'hover:bg-rose-50/40 dark:hover:bg-rose-900/10 border-l-2 border-l-transparent hover:border-l-rose-400 dark:hover:border-l-rose-500',
  },
} as const

export type HoverAccent = keyof typeof hoverAccentStyles

// ── Column definition ────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  /** Unique key identifying this column */
  key: string
  /** Header text */
  header: string
  /** Additional header cell className */
  headerClassName?: string
  /** Additional body cell className */
  cellClassName?: string
  /** Render function for cell content */
  render: (item: T) => ReactNode
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface UnifiedDataTableProps<T> {
  /** Data rows to display */
  data: T[]
  /** Column definitions for the desktop table view */
  columns: DataTableColumn<T>[]
  /** Extract a unique key for each row */
  keyExtractor: (item: T) => string
  /** Callback when a row is clicked (desktop) */
  onRowClick?: (item: T) => void
  /** Render a mobile card for each item (shown < md breakpoint) */
  mobileCardRenderer: (item: T) => ReactNode
  /** Color accent for row hover — aligns with module groups */
  hoverAccent?: HoverAccent
  /** Pagination config — omit to hide pagination */
  pagination?: {
    page: number
    totalPages: number
    total?: number
    onPageChange: (page: number) => void
    className?: string
  }
  /** Content shown above the table (e.g. filters, toggles) */
  headerSlot?: ReactNode
  /** Extra className for root wrapper */
  className?: string
  /** Extra className for the desktop table container */
  tableContainerClassName?: string
  /** Per-row className resolver (desktop) */
  rowClassName?: (item: T) => string | undefined
}

// ── Component ────────────────────────────────────────────────────────────────

export function UnifiedDataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  mobileCardRenderer,
  hoverAccent = 'blue',
  pagination,
  headerSlot,
  className,
  tableContainerClassName,
  rowClassName,
}: UnifiedDataTableProps<T>) {
  const accent = hoverAccentStyles[hoverAccent]

  return (
    <div className={cn('space-y-4', className)}>
      {headerSlot}

      {/* ===== Mobile Card View (<md) ===== */}
      <div className="md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-700/50">
        {data.map((item) => (
          <div key={keyExtractor(item)}>{mobileCardRenderer(item)}</div>
        ))}
      </div>

      {/* ===== Desktop Table View (md+) ===== */}
      <div
        className={cn(
          'hidden md:block rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden',
          tableContainerClassName,
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className={typography.tableHeaderRow}>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(typography.tableHeaderCell, col.headerClassName)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const key = keyExtractor(item)
              const extraRowCls = rowClassName?.(item)
              return (
                <TableRow
                  key={key}
                  className={cn(
                    'transition-colors',
                    accent.row,
                    onRowClick && 'cursor-pointer',
                    extraRowCls,
                  )}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* ===== Pagination ===== */}
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
          className={pagination.className}
        />
      )}
    </div>
  )
}
