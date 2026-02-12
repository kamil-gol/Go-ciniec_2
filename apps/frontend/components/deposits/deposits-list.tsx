'use client'

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
import { CalendarDays, Users, Building2, CreditCard, Banknote, Smartphone, ArrowDownUp } from 'lucide-react'
import type { Deposit } from '@/lib/api/deposits'

interface DepositsListProps {
  deposits: Deposit[]
  onUpdate: () => void
}

const paymentMethodConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  TRANSFER: { label: 'Przelew', icon: ArrowDownUp, className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  CASH: { label: 'Gotówka', icon: Banknote, className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
  BLIK: { label: 'BLIK', icon: Smartphone, className: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400' },
  CARD: { label: 'Karta', icon: CreditCard, className: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400' },
}

export function DepositsList({ deposits, onUpdate }: DepositsListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatMoney = (value: string | number) => {
    return Number(value).toLocaleString('pl-PL', { minimumFractionDigits: 0 }) + ' zł'
  }

  const isOverdue = (deposit: Deposit) => {
    if (deposit.status === 'PAID' || deposit.status === 'CANCELLED') return false
    return new Date(deposit.dueDate) < new Date()
  }

  const getDaysInfo = (deposit: Deposit) => {
    if (deposit.status === 'PAID' || deposit.status === 'CANCELLED') return null
    const now = new Date()
    const due = new Date(deposit.dueDate)
    const diffMs = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} dni temu`, overdue: true }
    if (diffDays === 0) return { text: 'Dziś', overdue: true }
    if (diffDays <= 7) return { text: `za ${diffDays} dni`, overdue: false }
    return null
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-neutral-50/50 dark:bg-neutral-800/50">
          <TableHead className="font-semibold">Klient</TableHead>
          <TableHead className="font-semibold">Wydarzenie</TableHead>
          <TableHead className="font-semibold">Sala</TableHead>
          <TableHead className="text-right font-semibold">Kwota</TableHead>
          <TableHead className="text-right font-semibold">Wpłacono</TableHead>
          <TableHead className="font-semibold">Termin</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Metoda</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deposits.map((deposit) => {
          const overdue = isOverdue(deposit)
          const daysInfo = getDaysInfo(deposit)
          const method = deposit.paymentMethod ? paymentMethodConfig[deposit.paymentMethod] : null

          return (
            <TableRow
              key={deposit.id}
              className={`transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                overdue ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50/60' : ''
              }`}
            >
              {/* Klient */}
              <TableCell>
                {deposit.reservation?.client ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {deposit.reservation.client.firstName[0]}{deposit.reservation.client.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {deposit.reservation.client.firstName} {deposit.reservation.client.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {deposit.reservation.client.phone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </TableCell>

              {/* Wydarzenie */}
              <TableCell>
                {deposit.reservation?.eventType ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-neutral-900"
                      style={{ backgroundColor: deposit.reservation.eventType.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{deposit.reservation.eventType.name}</p>
                      {deposit.reservation.date && (
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(deposit.reservation.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </TableCell>

              {/* Sala */}
              <TableCell>
                {deposit.reservation?.hall?.name ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                    {deposit.reservation.hall.name}
                  </div>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </TableCell>

              {/* Kwota */}
              <TableCell className="text-right">
                <span className="font-bold text-sm tabular-nums">
                  {formatMoney(deposit.amount)}
                </span>
              </TableCell>

              {/* Wpłacono */}
              <TableCell className="text-right">
                <span
                  className={`font-semibold text-sm tabular-nums ${
                    Number(deposit.paidAmount) > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-neutral-300 dark:text-neutral-600'
                  }`}
                >
                  {formatMoney(deposit.paidAmount)}
                </span>
              </TableCell>

              {/* Termin */}
              <TableCell>
                <div>
                  <span className={`text-sm font-medium ${
                    overdue ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {formatDate(deposit.dueDate)}
                  </span>
                  {daysInfo && (
                    <p className={`text-[11px] font-medium mt-0.5 ${
                      daysInfo.overdue ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {daysInfo.text}
                    </p>
                  )}
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>
                <DepositStatusBadge status={deposit.status} />
              </TableCell>

              {/* Metoda */}
              <TableCell>
                {method ? (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${method.className}`}>
                    <method.icon className="h-3 w-3" />
                    {method.label}
                  </span>
                ) : (
                  <span className="text-neutral-300 dark:text-neutral-600">—</span>
                )}
              </TableCell>

              {/* Akcje */}
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
