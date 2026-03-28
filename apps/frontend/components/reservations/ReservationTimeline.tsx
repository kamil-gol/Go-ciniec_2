'use client'

import { Clock, CheckCircle2, Loader2, PartyPopper, XCircle, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusSteps = [
  { key: 'PENDING', label: 'Oczekująca', icon: Clock },
  { key: 'CONFIRMED', label: 'Potwierdzona', icon: CheckCircle2 },
  { key: 'IN_PROGRESS', label: 'W realizacji', icon: Loader2 },
  { key: 'COMPLETED', label: 'Zakończona', icon: PartyPopper },
] as const

const terminalStatuses: Record<string, { label: string; icon: typeof XCircle; color: string }> = {
  CANCELLED: { label: 'Anulowana', icon: XCircle, color: 'text-error-500' },
  ARCHIVED: { label: 'Zarchiwizowana', icon: Archive, color: 'text-muted-foreground' },
}

function getStepIndex(status: string): number {
  const idx = statusSteps.findIndex(s => s.key === status)
  return idx >= 0 ? idx : -1
}

interface ReservationTimelineProps {
  status: string
  className?: string
}

export function ReservationTimeline({ status, className }: ReservationTimelineProps) {
  const terminal = terminalStatuses[status]
  const currentIdx = getStepIndex(status)

  if (terminal) {
    const Icon = terminal.icon
    return (
      <div className={cn('flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border', className)}>
        <div className={cn('p-2 rounded-full bg-muted', terminal.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Status: {terminal.label}</p>
          <p className="text-xs text-muted-foreground">Ta rezerwacja nie jest już aktywna</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-0 p-4 rounded-xl bg-card border border-border overflow-x-auto', className)}>
      {statusSteps.map((step, idx) => {
        const Icon = step.icon
        const isCompleted = currentIdx > idx
        const isCurrent = currentIdx === idx
        const isFuture = currentIdx < idx

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  isCompleted && 'bg-success-100 dark:bg-success-900/30 border-success-500 text-success-600 dark:text-success-400',
                  isCurrent && 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/20',
                  isFuture && 'bg-muted border-border text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className={cn('h-5 w-5', isCurrent && step.key === 'IN_PROGRESS' && 'animate-spin')} />
                )}
              </div>
              <span className={cn(
                'text-xs font-medium text-center whitespace-nowrap',
                isCompleted && 'text-success-600 dark:text-success-400',
                isCurrent && 'text-blue-600 dark:text-blue-400',
                isFuture && 'text-muted-foreground',
              )}>
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < statusSteps.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-1 rounded-full transition-all min-w-[16px]',
                isCompleted ? 'bg-success-500' : 'bg-border',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
