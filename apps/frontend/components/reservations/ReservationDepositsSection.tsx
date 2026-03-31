'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DollarSign,
  Plus,
  FileDown,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  CalendarDays,
  Undo2,
  Mail,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/shared/SectionCard'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import { toast } from 'sonner'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  paymentMethodIcons,
  getDaysLabel,
  formatDate,
  suggestDueDate,
  type ReservationDepositsSectionProps,
} from './deposits-section/deposits-config'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DeletePaidDepositDialog } from './deposits-section/DeletePaidDepositDialog'
import { CreateDepositDialog } from './deposits-section/CreateDepositDialog'
import { MarkAsPaidDialog } from './deposits-section/MarkAsPaidDialog'

export function ReservationDepositsSection({ reservationId, totalPrice }: ReservationDepositsSectionProps) {
  const queryClient = useQueryClient()
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const currentRequestId = useRef(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)

  // Delete paid deposit dialog
  const [deleteTarget, setDeleteTarget] = useState<Deposit | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Create form state
  const [createAmount, setCreateAmount] = useState('')
  const [createDueDate, setCreateDueDate] = useState('')
  const [createTitle, setCreateTitle] = useState('')
  const [creating, setCreating] = useState(false)

  // Pay form state
  const [payMethod, setPayMethod] = useState<PaymentMethod>('TRANSFER')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [paying, setPaying] = useState(false)

  // Action loading states
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadDeposits = useCallback(async () => {
    const requestId = ++currentRequestId.current
    try {
      setLoading(true)
      const data = await depositsApi.getByReservation(reservationId)
      // Only update state if this is still the latest request (prevents race condition)
      if (requestId === currentRequestId.current) {
        setDeposits(data)
      }
    } catch (err) {
      console.error('Error loading deposits:', err)
    } finally {
      if (requestId === currentRequestId.current) {
        setLoading(false)
      }
    }
  }, [reservationId])

  useEffect(() => {
    loadDeposits()
  }, [loadDeposits])

  /** Reload deposits + invalidate reservations cache so list badges update */
  const reloadAndInvalidate = useCallback(() => {
    loadDeposits()
    queryClient.invalidateQueries({ queryKey: ['reservations'] })
  }, [loadDeposits, queryClient])

  // ── Summary calculations ──
  const activeDeposits = deposits.filter(d => d.status !== 'CANCELLED')
  const totalDepositsAmount = activeDeposits.reduce((sum, d) => sum + Number(d.amount), 0)
  const totalPaidAmount = activeDeposits.reduce((sum, d) => sum + Number(d.paidAmount || 0), 0)
  const percentPaid = totalPrice > 0 ? Math.min(Math.round((totalPaidAmount / totalPrice) * 100), 100) : 0
  const percentDeposits = totalPrice > 0 ? Math.min(Math.round((totalDepositsAmount / totalPrice) * 100), 100) : 0

  // ── Handlers ──
  const handleOpenCreate = () => {
    const suggested = Math.round(totalPrice * 0.3)
    setCreateAmount(suggested > 0 ? suggested.toString() : '')
    setCreateDueDate(suggestDueDate(0))
    setCreateTitle('')
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    if (!createAmount || Number(createAmount) <= 0) {
      toast.error('Podaj prawidłową kwotę')
      return
    }
    if (!createDueDate) {
      toast.error('Podaj termin płatności')
      return
    }
    try {
      setCreating(true)
      await depositsApi.create(reservationId, {
        amount: Number(createAmount),
        dueDate: createDueDate,
        title: createTitle || undefined,
      })
      toast.success('Zaliczka utworzona')
      setShowCreateModal(false)
      reloadAndInvalidate()
    } catch (err) {
      console.error('Error creating deposit:', err)
      toast.error('Nie udało się utworzyć zaliczki')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenPay = (deposit: Deposit) => {
    setSelectedDeposit(deposit)
    setPayMethod('TRANSFER')
    setPayDate(new Date().toISOString().split('T')[0])
    setShowPayModal(true)
  }

  const handlePay = async () => {
    if (!selectedDeposit) return
    try {
      setPaying(true)
      await depositsApi.markAsPaid(selectedDeposit.id, { paymentMethod: payMethod, paidAt: payDate })
      toast.success('Zaliczka oznaczona jako opłacona')
      setShowPayModal(false)
      reloadAndInvalidate()
    } catch (err) {
      console.error('Error marking deposit as paid:', err)
      toast.error('Nie udało się oznaczyć jako opłaconej')
    } finally {
      setPaying(false)
    }
  }

  const handleMarkUnpaid = async (deposit: Deposit) => {
    try {
      setActionLoading(deposit.id)
      await depositsApi.markAsUnpaid(deposit.id)
      toast.success('Cofnięto płatność')
      reloadAndInvalidate()
    } catch {
      toast.error('Nie udało się cofnąć płatności')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPdf = async (deposit: Deposit) => {
    try {
      setPdfLoading(deposit.id)
      await depositsApi.downloadPdf(deposit.id)
      toast.success('PDF pobrany')
    } catch {
      toast.error('Nie udało się pobrać PDF')
    } finally {
      setPdfLoading(null)
    }
  }

  const handleSendEmail = async (deposit: Deposit) => {
    try {
      setActionLoading(deposit.id)
      await depositsApi.sendEmail(deposit.id)
      toast.success('Email wysłany')
    } catch {
      toast.error('Nie udało się wysłać emaila')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (deposit: Deposit) => {
    try {
      setActionLoading(deposit.id)
      await depositsApi.cancel(deposit.id)
      toast.success('Zaliczka anulowana')
      reloadAndInvalidate()
    } catch {
      toast.error('Nie udało się anulować zaliczki')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeletePaid = async () => {
    if (!deleteTarget) return
    try {
      setDeleteLoading(true)
      await depositsApi.delete(deleteTarget.id)
      toast.success('Zaliczka została usunięta')
      setDeleteTarget(null)
      reloadAndInvalidate()
    } catch {
      toast.error('Nie udało się usunąć zaliczki')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Render ──
  return (
    <>
      <SectionCard
        variant="gradient"
        title="Zaliczki"
        icon={<DollarSign className="h-5 w-5 text-white" />}
        iconGradient="from-rose-500 to-pink-500"
        headerGradient="from-rose-50 via-pink-50 to-red-50 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-red-950/30"
        action={
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-md"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Dodaj
          </Button>
        }
      >

          {/* Summary */}
          {!loading && activeDeposits.length > 0 && (
            <div className="mb-5 p-4 bg-white dark:bg-black/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Wpłacono</span>
                <span className="text-sm font-semibold">
                  {totalPaidAmount.toLocaleString('pl-PL')} / {totalPrice.toLocaleString('pl-PL')} zł
                </span>
              </div>
              {/* Progress bar */}
              <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-rose-200 dark:bg-rose-800 rounded-full transition-all duration-500"
                  style={{ width: `${percentDeposits}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">{percentPaid}% wpłacono</span>
                <span className="text-xs text-muted-foreground">
                  {activeDeposits.length} {activeDeposits.length === 1 ? 'zaliczka' : activeDeposits.length < 5 ? 'zaliczki' : 'zaliczek'}
                </span>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
            </div>
          )}

          {/* Empty state */}
          {!loading && deposits.length === 0 && (
            <div className="text-center py-6">
              <DollarSign className="h-10 w-10 text-rose-300 dark:text-rose-700 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Brak zaliczek dla tej rezerwacji</p>
              <p className="text-xs text-muted-foreground mt-1">Kliknij „Dodaj" aby utworzyć pierwszą</p>
            </div>
          )}

          {/* Deposits list */}
          {!loading && deposits.length > 0 && (
            <div className="space-y-3">
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
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCancelled
                        ? 'bg-neutral-50/60 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700 opacity-60'
                        : 'bg-white dark:bg-black/20 border-neutral-200 dark:border-neutral-700 hover:shadow-md'
                    }`}
                  >
                    {/* Row 1: Amount + Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tabular-nums">
                          {Number(deposit.amount).toLocaleString('pl-PL')} zł
                        </span>
                        {deposit.title && (
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            — {deposit.title}
                          </span>
                        )}
                      </div>
                      <StatusBadge type="deposit" status={deposit.status} />
                    </div>

                    {/* Row 2: Due date + Payment method */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" />
                        <span>Termin: {formatDate(deposit.dueDate)}</span>
                        {daysInfo && (
                          <span className={`ml-1 ${daysInfo.className}`}>({daysInfo.text})</span>
                        )}
                      </div>
                      {method && MethodIcon && (
                        <div className="flex items-center gap-1">
                          <MethodIcon className="h-3 w-3" />
                          <span>{method.label}</span>
                        </div>
                      )}
                    </div>

                    {/* Row 3: Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPending && (
                        <button
                          onClick={() => handleOpenPay(deposit)}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Opłać
                        </button>
                      )}
                      {isPaid && (
                        <>
                          <button
                            onClick={() => handleDownloadPdf(deposit)}
                            disabled={pdfLoading === deposit.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50 transition-colors"
                          >
                            {pdfLoading === deposit.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                            PDF
                          </button>
                          <button
                            onClick={() => handleSendEmail(deposit)}
                            disabled={isActioning}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                            Email
                          </button>
                          <button
                            onClick={() => handleMarkUnpaid(deposit)}
                            disabled={isActioning}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/50 transition-colors"
                          >
                            <Undo2 className="h-3 w-3" />
                            Cofnij
                          </button>
                          <button
                            onClick={() => setDeleteTarget(deposit)}
                            disabled={isActioning}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Usuń
                          </button>
                        </>
                      )}
                      {!isCancelled && !isPaid && (
                        <button
                          onClick={() => handleCancel(deposit)}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-50 text-neutral-500 border border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                          Anuluj
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Link to full deposits module */}
          {!loading && deposits.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/dashboard/deposits"
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors"
              >
                Zobacz wszystkie zaliczki
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
      </SectionCard>

      {/* Dialogs */}
      <DeletePaidDepositDialog
        deposit={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePaid}
        loading={deleteLoading}
      />

      <CreateDepositDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        totalPrice={totalPrice}
        createAmount={createAmount}
        setCreateAmount={setCreateAmount}
        createDueDate={createDueDate}
        setCreateDueDate={setCreateDueDate}
        createTitle={createTitle}
        setCreateTitle={setCreateTitle}
        creating={creating}
        onCreate={handleCreate}
      />

      <MarkAsPaidDialog
        open={showPayModal}
        onOpenChange={setShowPayModal}
        selectedDeposit={selectedDeposit}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        payDate={payDate}
        setPayDate={setPayDate}
        paying={paying}
        onPay={handlePay}
      />
    </>
  )
}
