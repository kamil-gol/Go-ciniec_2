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
import type { Deposit } from '@/lib/api/deposits'

interface DepositsListProps {
  deposits: Deposit[]
  onUpdate: () => void
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Klient</TableHead>
          <TableHead>Wydarzenie</TableHead>
          <TableHead>Sala</TableHead>
          <TableHead className="text-right">Kwota</TableHead>
          <TableHead className="text-right">Zapłacono</TableHead>
          <TableHead>Termin</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Metoda</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deposits.map((deposit) => (
          <TableRow
            key={deposit.id}
            className={isOverdue(deposit) ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
          >
            <TableCell className="font-medium">
              {deposit.reservation?.client ? (
                <div>
                  <p className="font-semibold text-sm">
                    {deposit.reservation.client.firstName} {deposit.reservation.client.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {deposit.reservation.client.phone || deposit.reservation.client.email}
                  </p>
                </div>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </TableCell>
            <TableCell>
              {deposit.reservation?.eventType ? (
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: deposit.reservation.eventType.color }}
                  />
                  <div>
                    <p className="text-sm">{deposit.reservation.eventType.name}</p>
                    <p className="text-xs text-neutral-500">
                      {deposit.reservation.date ? formatDate(deposit.reservation.date) : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {deposit.reservation?.hall?.name || '—'}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatMoney(deposit.amount)}
            </TableCell>
            <TableCell className="text-right">
              <span className={Number(deposit.paidAmount) > 0 ? 'text-emerald-600 font-medium' : 'text-neutral-400'}>
                {formatMoney(deposit.paidAmount)}
              </span>
            </TableCell>
            <TableCell>
              <span className={isOverdue(deposit) ? 'text-red-600 font-semibold' : 'text-sm'}>
                {formatDate(deposit.dueDate)}
              </span>
            </TableCell>
            <TableCell>
              <DepositStatusBadge status={deposit.status} />
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {deposit.paymentMethod === 'TRANSFER' && 'Przelew'}
              {deposit.paymentMethod === 'CASH' && 'Gotówka'}
              {deposit.paymentMethod === 'BLIK' && 'BLIK'}
              {!deposit.paymentMethod && '—'}
            </TableCell>
            <TableCell>
              <DepositActions deposit={deposit} onUpdate={onUpdate} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
