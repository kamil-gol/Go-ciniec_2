'use client'

import { CalendarDays, Building2, ExternalLink, Clock, Users, DollarSign, Banknote, Smartphone, CreditCard, ArrowDownUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DepositStatusBadge } from './deposit-status-badge'
import { DepositActions } from './deposit-actions'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import Link from 'next/link'

interface DepositsListProps {
  deposits: Deposit[]
  onUpdate: () => void
}

const paymentMethodConfig: Record<PaymentMethod, { label: string; icon: React.ElementType; className: string }> = {
  TRANSFER: { label: 'Przelew', icon: ArrowDownUp, className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  CASH: { label: 'Gotówka', icon: Banknote, className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  BLIK: { label: 'BLIK', icon: Smartphone, className: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' },
  CARD: { label: 'Karta', icon: CreditCard, className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800' },
}

function getDaysInfo(dateStr: string): { text: string; className: string } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return { text: 'dzisiaj', className: 'text-amber-600 dark:text-amber-400' }
  if (diffDays === 1) return { text: 'jutro', className: 'text-amber-600 dark:text-amber-400' }
  if (diffDays > 1 && diffDays <= 7) return { text: `za ${diffDays} dni`, className: 'text-blue-600 dark:text-blue-400' }
  if (diffDays < 0) return { text: `${Math.abs(diffDays)} dni temu`, className: 'text-red-600 dark:text-red-400' }
  return null
}

/**
 * #deposits-fix (5/5): resolve event date from startDateTime first, then fall
 * back to the legacy `date` field so both old and new reservations display
 * correctly in the deposits list.
 */
function resolveEventDate(reservation: Deposit['reservation']): string | undefined {
  if (!reservation) return undefined
  // New reservations use startDateTime; legacy ones may only have date
  return (reservation as any).startDateTime ?? reservation.date ?? undefined
}

export function DepositsList({ deposits, onUpdate }: DepositsListProps) {
  return (
    <>
      {/* ===== MOBILE CARD VIEW (<md) ===== */}
      <div className="md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-700/50">
        {deposits.map((deposit) => {
          const client = deposit.reservation?.client
          const hall = deposit.reservation?.hall
          const eventType = deposit.reservation?.eventType
          // #deposits-fix (5/5): use startDateTime with date fallback
          const eventDate = resolveEventDate(deposit.reservation)
          const paidAmount = Number(deposit.paidAmount || 0)
          const amount = Number(deposit.amount)
          const daysInfo = deposit.status === 'PENDING' || deposit.status === 'OVERDUE'
            ? getDaysInfo(deposit.dueDate)
            : null
          const initials = client
            ? `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
            : '?'
          const reservationLink = `/dashboard/reservations/${deposit.reservationId}`

          return (
            <div key={deposit.id} className="p-4 space-y-3">
              {/* Row 1: Client + Amount */}
              <div className="flex items-start justify-between gap-3">
                <Link href={reservationLink} className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {client ? `${client.firstName} ${client.lastName}` : 'Brak danych'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {eventType?.name || 'Brak'}
                      {hall?.name && ` \u00b7 ${hall.name}`}
                    </p>
                  </div>
                </Link>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm tabular-nums text-neutral-900 dark:text-neutral-100">
                    {amount.toLocaleString('pl-PL')} zł
                  </p>
                  {paidAmount > 0 && paidAmount < amount && (
                    <p className="text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                      wpłacono {paidAmount.toLocaleString('pl-PL')} zł
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Status + Due Date + Method + Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <DepositStatusBadge status={deposit.status} />
                  {deposit.paymentMethod && (() => {
                    const config = paymentMethodConfig[deposit.paymentMethod as PaymentMethod]
                    if (!config) return null
                    const Icon = config.icon
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.className}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    )
                  })()}
                </div>
                <DepositActions deposit={deposit} onUpdate={onUpdate} />
              </div>

              {/* Row 3: Due date info */}
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Termin: {new Date(deposit.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
                  {daysInfo && (
                    <span className={`font-medium ${daysInfo.className}`}>({daysInfo.text})</span>
                  )}
                </div>
                {eventDate && (
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>{new Date(eventDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== DESKTOP TABLE VIEW (md+) ===== */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50 dark:bg-neutral-800/50">
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400">Klient</TableHead>
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400">Wydarzenie</TableHead>
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400">Sala</TableHead>
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400 text-right">Kwota</TableHead>
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400 text-right">Wpłacono</TableHead>
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400">Termin</TableHead>
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400">Status</TableHead>
              <TableHead className="font-semibold text-rose-600 dark:text-rose-400">Metoda</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => {
              const client = deposit.reservation?.client
              const hall = deposit.reservation?.hall
              const eventType = deposit.reservation?.eventType
              // #deposits-fix (5/5): use startDateTime with date fallback
              const eventDate = resolveEventDate(deposit.reservation)
              const paidAmount = Number(deposit.paidAmount || 0)
              const daysInfo = deposit.status === 'PENDING' || deposit.status === 'OVERDUE'
                ? getDaysInfo(deposit.dueDate)
                : null

              const initials = client
                ? `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
                : '?'

              const reservationLink = `/dashboard/reservations/${deposit.reservationId}`

              return (
                <TableRow
                  key={deposit.id}
                  className="group hover:bg-rose-50/40 dark:hover:bg-rose-900/10 transition-colors"
                >
                  {/* Client */}
                  <TableCell>
                    <Link href={reservationLink} className="flex items-center gap-3 group/link">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate group-hover/link:text-rose-600 dark:group-hover/link:text-rose-400 transition-colors">
                          {client ? `${client.firstName} ${client.lastName}` : 'Brak danych'}
                          <ExternalLink className="inline h-3 w-3 ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {client?.phone || ''}
                        </p>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Event */}
                  <TableCell>
                    <Link href={reservationLink} className="flex items-center gap-2 group/link">
                      {eventType && (
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
                          style={{ backgroundColor: eventType.color || '#6b7280' }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover/link:text-rose-600 dark:group-hover/link:text-rose-400 transition-colors">
                          {eventType?.name || 'Brak'}
                        </p>
                        {eventDate && (
                          <p className="text-xs text-neutral-500 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(eventDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </Link>
                  </TableCell>

                  {/* Hall */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="truncate">{hall?.name || 'Brak'}</span>
                    </div>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right">
                    <span className="font-semibold tabular-nums text-sm">
                      {Number(deposit.amount).toLocaleString('pl-PL')} zł
                    </span>
                  </TableCell>

                  {/* Paid */}
                  <TableCell className="text-right">
                    <span className={`font-semibold tabular-nums text-sm ${paidAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-300 dark:text-neutral-600'}`}>
                      {paidAmount > 0 ? `${paidAmount.toLocaleString('pl-PL')} zł` : `0 zł`}
                    </span>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>
                    <div>
                      <p className={`text-sm tabular-nums ${daysInfo && deposit.status === 'OVERDUE' ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                        {new Date(deposit.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {daysInfo && (
                        <p className={`text-xs ${daysInfo.className}`}>{daysInfo.text}</p>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <DepositStatusBadge status={deposit.status} />
                  </TableCell>

                  {/* Payment Method */}
                  <TableCell>
                    {deposit.paymentMethod ? (() => {
                      const config = paymentMethodConfig[deposit.paymentMethod as PaymentMethod]
                      if (!config) return <span className="text-sm text-neutral-400">\u2014</span>
                      const Icon = config.icon
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      )
                    })() : (
                      <span className="text-sm text-neutral-300 dark:text-neutral-600">\u2014</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DepositActions deposit={deposit} onUpdate={onUpdate} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
