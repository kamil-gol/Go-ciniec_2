import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import {
  Trash2, Archive, ArchiveRestore, FileText, Eye,
  Users, Baby, Smile, Clock, DollarSign, Building2, User,
  Phone, Mail, Loader2, XCircle,
} from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { moduleAccents } from '@/lib/design-tokens'
import type { Deposit } from '@/lib/api/deposits'
import { getFormattedTimeRange, getGuestBreakdown } from './reservation-list.helpers'
import { DepositBadge, ExtrasBadge, ContractBadge, RodoBadge } from './ReservationBadges'

const accent = moduleAccents.reservations

export interface ReservationCardHandlers {
  onPdf: (reservationId: string) => void
  onArchive: (reservationId: string) => void
  onUnarchive: (reservationId: string) => void
  onDelete: (reservationId: string, status: string) => void
}

interface ReservationCardProps {
  reservation: any
  depositMap: Record<string, Deposit[]>
  contractMap: Record<string, boolean>
  rodoMap: Record<string, boolean>
  handlers: ReservationCardHandlers
  generatingPdfId: string | null
}

export function ReservationCard({
  reservation,
  depositMap,
  contractMap,
  rodoMap,
  handlers,
  generatingPdfId,
}: ReservationCardProps) {
  const guestInfo = getGuestBreakdown(reservation)
  const resDeposits = depositMap[reservation.id] || []
  const hasContract = contractMap[reservation.id]
  const clientId = reservation.clientId || reservation.client?.id
  const hasRodo = clientId ? rodoMap[clientId] : undefined
  const isPdfGenerating = generatingPdfId === reservation.id

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden active:scale-[0.99]">
      <div className={cn(
        'p-4 sm:p-6',
        `bg-gradient-to-r ${accent.gradientSubtle}`
      )}>
        {/* Header: Time + Status + Badges */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-xl bg-gradient-to-br shadow-sm',
              accent.iconBg
            )}>
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                {getFormattedTimeRange(reservation)}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-300">
                {reservation.eventType?.name || 'Inne wydarzenie'}
                {reservation.customEventType && ` - ${reservation.customEventType}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {reservation.archivedAt && (
              <Badge variant="secondary" className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                <Archive className="h-3 w-3 mr-1" />
                Zarchiwizowane
              </Badge>
            )}
            <RodoBadge hasRodo={hasRodo} />
            <ContractBadge hasContract={hasContract} />
            <ExtrasBadge extrasCount={reservation.extrasCount} extrasTotalPrice={reservation.extrasTotalPrice} />
            <DepositBadge deposits={resDeposits} />
            <StatusBadge type="reservation" status={reservation.status} />
          </div>
        </div>

        {/* Mini status progress */}
        {reservation.status === 'CANCELLED' ? (
          <div className="flex items-center gap-1 mt-2">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs text-red-500">Anulowana</span>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 mt-2">
            {[
              { done: true, label: 'Utworzona' },
              { done: ['CONFIRMED', 'COMPLETED'].includes(reservation.status), label: 'Potwierdzona' },
              { done: reservation.status === 'COMPLETED', label: 'Zrealizowana' },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    step.done ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                  title={step.label}
                />
                {i < arr.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-4 transition-colors',
                      step.done && arr[i + 1].done ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="my-4 border-t border-neutral-200/50 dark:border-neutral-700/30" />

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-300">
              <Building2 className="h-3 w-3 flex-shrink-0" /> Sala
            </div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100">{reservation.hall?.name || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-300">
              <User className="h-3 w-3 flex-shrink-0" /> Klient
            </div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100">
              {reservation.client
                ? `${reservation.client.firstName} ${reservation.client.lastName}`
                : 'N/A'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-300">
              <Users className="h-3 w-3 flex-shrink-0" /> Goście
            </div>
            <div className="flex items-center gap-2">
              <div className="font-medium text-neutral-900 dark:text-neutral-100">{guestInfo.total}</div>
              {(guestInfo.adults > 0 || guestInfo.childrenCount > 0 || guestInfo.toddlers > 0) && (
                <div className="flex gap-2 text-xs">
                  {guestInfo.adults > 0 && (
                    <div className="flex items-center gap-0.5 text-neutral-500 dark:text-neutral-300" title="Dorośli">
                      <Users className="w-3 h-3" />{guestInfo.adults}
                    </div>
                  )}
                  {guestInfo.childrenCount > 0 && (
                    <div className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title="Dzieci 4-12">
                      <Smile className="w-3 h-3" />{guestInfo.childrenCount}
                    </div>
                  )}
                  {guestInfo.toddlers > 0 && (
                    <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400" title="Maluchy 0-3">
                      <Baby className="w-3 h-3" />{guestInfo.toddlers}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-300">
              <DollarSign className="h-3 w-3" /> Wartosc
            </div>
            <div className="font-bold text-sm sm:text-lg text-green-600 dark:text-green-400 truncate">
              {reservation.totalPrice ? formatCurrency(reservation.totalPrice) : 'N/A'}
            </div>
            {reservation.extrasTotalPrice > 0 && (
              <div className="text-xs text-violet-600 dark:text-violet-400">
                w tym extras: {formatCurrency(reservation.extrasTotalPrice)}
              </div>
            )}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/30">
          {reservation.client && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-300">
              {reservation.client.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />{reservation.client.phone}
                </div>
              )}
              {reservation.client.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[180px] sm:max-w-none">{reservation.client.email}</span>
                </div>
              )}
            </div>
          )}

          <TooltipProvider delayDuration={300}>
            <div className="flex gap-1 self-end sm:self-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/dashboard/reservations/${reservation.id}`}>
                    <Button size="sm" variant="ghost" aria-label="Podgląd szczegółów" className="rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Podgląd szczegółów</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlers.onPdf(reservation.id)}
                    aria-label="Generuj PDF"
                    className="rounded-lg"
                    disabled={isPdfGenerating}
                  >
                    {isPdfGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Generuj PDF</p></TooltipContent>
              </Tooltip>
              {!reservation.archivedAt ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlers.onArchive(reservation.id)}
                      aria-label="Zarchiwizuj"
                      disabled={!['CANCELLED', 'COMPLETED'].includes(reservation.status)}
                      className="rounded-lg"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Zarchiwizuj</p></TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlers.onUnarchive(reservation.id)}
                      aria-label="Przywróć z archiwum"
                      className="rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Przywróć z archiwum</p></TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlers.onDelete(reservation.id, reservation.status)}
                    aria-label="Anuluj rezerwację"
                    disabled={reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'}
                    className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Anuluj rezerwację</p></TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
