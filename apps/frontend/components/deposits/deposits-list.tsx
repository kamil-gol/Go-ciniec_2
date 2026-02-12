'use client'

import { CalendarDays, Building2 } from 'lucide-react'
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
import { ArrowDownUp, Banknote, Smartphone, CreditCard } from 'lucide-react'

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

export function DepositsList({ deposits, onUpdate }: DepositsListProps) {
  return (
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
          const eventDate = deposit.reservation?.date
          const paidAmount = Number(deposit.paidAmount || 0)
          const daysInfo = deposit.status === 'PENDING' || deposit.status === 'OVERDUE'
            ? getDaysInfo(deposit.dueDate)
            : null

          const initials = client
            ? `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
            : '?'

          return (
            <TableRow
              key={deposit.id}
              className="group hover:bg-rose-50/40 dark:hover:bg-rose-900/10 transition-colors"
            >
              {/* Client */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {client ? `${client.firstName} ${client.lastName}` : 'Brak danych'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {client?.phone || ''}
                    </p>
                  </div>
                </div>
              </TableCell>

              {/* Event */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {eventType && (
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
                      style={{ backgroundColor: eventType.color || '#6b7280' }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{eventType?.name || 'Brak'}</p>
                    {eventDate && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(eventDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
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
                  if (!config) return <span className="text-sm text-neutral-400">—</span>
                  const Icon = config.icon
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  )
                })() : (
                  <span className="text-sm text-neutral-300 dark:text-neutral-600">—</span>
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
  )
}
