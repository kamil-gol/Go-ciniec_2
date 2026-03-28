'use client'

import {
  DollarSign, Plus, FileDown, CheckCircle2,
  XCircle, Loader2, ExternalLink, CalendarDays,
  Undo2, Mail, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import { paymentMethodIcons } from './types'
import type { Financials } from './types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { getDaysLabel, formatDate } from './utils'

interface DepositSummaryProps {
  deposits: Deposit[]
  depositsLoading: boolean
  financials: Financials
  readOnly: boolean
  showDepositsDetails: boolean
  onToggleDepositsDetails: () => void
  pdfLoading: string | null
  actionLoading: string | null
  onOpenCreate: () => void
  onOpenPay: (deposit: Deposit) => void
  onMarkUnpaid: (deposit: Deposit) => void
  onDownloadPdf: (deposit: Deposit) => void
  onSendEmail: (deposit: Deposit) => void
  onCancel: (deposit: Deposit) => void
  onOpenDelete: (deposit: Deposit) => void
}

export function DepositSummary({
  deposits,
  depositsLoading,
  financials,
  readOnly,
  showDepositsDetails,
  onToggleDepositsDetails,
  pdfLoading,
  actionLoading,
  onOpenCreate,
  onOpenPay,
  onMarkUnpaid,
  onDownloadPdf,
  onSendEmail,
  onCancel,
  onOpenDelete,
}: DepositSummaryProps) {
  return (
    <>
      {/* Deposits header */}
      <button
        onClick={onToggleDepositsDetails}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-xl mb-3 hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-rose-600" />
          <span className="text-sm font-semibold">Zaliczki</span>
          {financials.depositsCount > 0 && (
            <span className="text-xs text-muted-foreground">({financials.depositsCount})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showDepositsDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {showDepositsDetails && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {depositsLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
            </div>
          )}

          {!depositsLoading && deposits.length === 0 && (
            <div className="text-center py-4">
              <DollarSign className="h-8 w-8 text-rose-300 dark:text-rose-700 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Brak zaliczek</p>
            </div>
          )}

          {!depositsLoading && deposits.length > 0 && (
            <div className="space-y-2 mb-3">
              {deposits.map((deposit) => {
                const isPending = deposit.status === 'PENDING' || deposit.status === 'OVERDUE'
                const isPaid = deposit.status === 'PAID'
                const isCancelled = deposit.status === 'CANCELLED'
                const daysInfo = isPending ? getDaysLabel(deposit.dueDate) : null
                const method = deposit.paymentMethod ? paymentMethodIcons[deposit.paymentMethod as PaymentMethod] : null
                const MethodIcon = method?.icon
                const isActioning = actionLoading === deposit.id

                return (
                  <div
                    key={deposit.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCancelled
                        ? 'bg-neutral-50/60 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700 opacity-60'
                        : 'bg-white dark:bg-black/20 border-neutral-200 dark:border-neutral-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold tabular-nums">
                          {Number(deposit.amount).toLocaleString('pl-PL')} zł
                        </span>
                        {deposit.title && (
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            — {deposit.title}
                          </span>
                        )}
                      </div>
                      <StatusBadge type="deposit" status={deposit.status} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatDate(deposit.dueDate)}</span>
                        {daysInfo && <span className={`ml-1 ${daysInfo.className}`}>({daysInfo.text})</span>}
                      </div>
                      {method && MethodIcon && (
                        <div className="flex items-center gap-1">
                          <MethodIcon className="h-3 w-3" />
                          <span>{method.label}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPending && !readOnly && (
                        <button onClick={() => onOpenPay(deposit)} disabled={isActioning}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50 transition-colors">
                          <CheckCircle2 className="h-3 w-3" /> Opłać
                        </button>
                      )}
                      {isPaid && (
                        <>
                          <button onClick={() => onDownloadPdf(deposit)} disabled={pdfLoading === deposit.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50 transition-colors">
                            {pdfLoading === deposit.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />} PDF
                          </button>
                          <button onClick={() => onSendEmail(deposit)} disabled={isActioning}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 transition-colors">
                            {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />} Email
                          </button>
                          {!readOnly && (
                            <button onClick={() => onMarkUnpaid(deposit)} disabled={isActioning}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/50 transition-colors">
                              <Undo2 className="h-3 w-3" /> Cofnij
                            </button>
                          )}
                        </>
                      )}
                      {!isCancelled && !isPaid && !readOnly && (
                        <button onClick={() => onCancel(deposit)} disabled={isActioning}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-50 text-neutral-500 border border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700 transition-colors">
                          <XCircle className="h-3 w-3" /> Anuluj
                        </button>
                      )}
                      {/* #deposits-fix (P4): permanently delete CANCELLED deposit */}
                      {isCancelled && !readOnly && (
                        <button
                          onClick={() => onOpenDelete(deposit)}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 transition-colors"
                        >
                          {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Usuń
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!readOnly && (
            <Button
              size="sm"
              onClick={onOpenCreate}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-md"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Dodaj zaliczkę
            </Button>
          )}

          {!depositsLoading && deposits.length > 0 && (
            <div className="mt-3 text-center">
              <Link href="/dashboard/deposits"
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors">
                Zobacz wszystkie zaliczki <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
