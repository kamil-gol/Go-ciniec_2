'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  Plus,
  FileDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowDownUp,
  Banknote,
  Smartphone,
  CreditCard,
  Loader2,
  ExternalLink,
  CalendarDays,
  Undo2,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, DepositStatus, PaymentMethod, CreateDepositInput } from '@/lib/api/deposits'
import { toast } from 'sonner'
import Link from 'next/link'

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface ReservationDepositsSectionProps {
  reservationId: string
  totalPrice: number
}

// ═══════════════════════════════════════════
// Config
// ═══════════════════════════════════════════

const statusConfig: Record<DepositStatus, {
  label: string
  icon: React.ElementType
  className: string
  dotColor: string
}> = {
  PENDING: {
    label: 'Oczekująca',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-400',
  },
  PAID: {
    label: 'Opłacona',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-400',
  },
  OVERDUE: {
    label: 'Przetermin.',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    dotColor: 'bg-red-400',
  },
  PARTIALLY_PAID: {
    label: 'Częściowa',
    icon: Clock,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-400',
  },
  CANCELLED: {
    label: 'Anulowana',
    icon: XCircle,
    className: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
    dotColor: 'bg-neutral-400',
  },
}

const paymentMethodIcons: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  TRANSFER: { label: 'Przelew', icon: ArrowDownUp },
  CASH: { label: 'Gotówka', icon: Banknote },
  BLIK: { label: 'BLIK', icon: Smartphone },
  CARD: { label: 'Karta', icon: CreditCard },
}

const paymentMethodOptions: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'TRANSFER', label: 'Przelew', icon: ArrowDownUp, color: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'CASH', label: 'Gotówka', icon: Banknote, color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'BLIK', label: 'BLIK', icon: Smartphone, color: 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'CARD', label: 'Karta', icon: CreditCard, color: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
]

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function getDaysLabel(dateStr: string): { text: string; className: string } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return { text: 'dziś', className: 'text-amber-600 dark:text-amber-400' }
  if (diff === 1) return { text: 'jutro', className: 'text-amber-600 dark:text-amber-400' }
  if (diff > 1 && diff <= 7) return { text: `za ${diff} dni`, className: 'text-blue-600 dark:text-blue-400' }
  if (diff < 0) return { text: `${Math.abs(diff)} dni temu`, className: 'text-red-600 dark:text-red-400 font-medium' }
  return null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function suggestDueDate(daysFromNow: number = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function ReservationDepositsSection({ reservationId, totalPrice }: ReservationDepositsSectionProps) {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)

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
    try {
      setLoading(true)
      const data = await depositsApi.getByReservation(reservationId)
      setDeposits(data)
    } catch (error) {
      console.error('Error loading deposits:', error)
    } finally {
      setLoading(false)
    }
  }, [reservationId])

  useEffect(() => {
    loadDeposits()
  }, [loadDeposits])

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
    setCreateDueDate(suggestDueDate(14))
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
      loadDeposits()
    } catch (error) {
      console.error('Error creating deposit:', error)
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
      loadDeposits()
    } catch (error) {
      console.error('Error marking deposit as paid:', error)
      toast.error('Nie udało się oznaczyć jako opłaconą')
    } finally {
      setPaying(false)
    }
  }

  const handleMarkUnpaid = async (deposit: Deposit) => {
    try {
      setActionLoading(deposit.id)
      await depositsApi.markAsUnpaid(deposit.id)
      toast.success('Cofnięto płatność')
      loadDeposits()
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
      loadDeposits()
    } catch (error) {
      toast.error('Nie udało się anulować zaliczki')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Render ──
  return (
    <>
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-red-950/30 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Zaliczki</h2>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-md"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Dodaj
            </Button>
          </div>

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
                {/* Deposits committed (lighter) */}
                <div
                  className="absolute inset-y-0 left-0 bg-rose-200 dark:bg-rose-800 rounded-full transition-all duration-500"
                  style={{ width: `${percentDeposits}%` }}
                />
                {/* Actually paid (solid) */}
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
              <p className="text-xs text-muted-foreground mt-1">Kliknij „Dodaj” aby utworzyć pierwszą</p>
            </div>
          )}

          {/* Deposits list */}
          {!loading && deposits.length > 0 && (
            <div className="space-y-3">
              {deposits.map((deposit) => {
                const status = statusConfig[deposit.status]
                const StatusIcon = status?.icon || Clock
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${status?.className || ''}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status?.label || deposit.status}
                      </span>
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
                        </>
                      )}
                      {!isCancelled && !isPaid && (
                        <button
                          onClick={() => handleCancel(deposit)}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-50 text-neutral-500 border border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700 transition-colors"
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
        </div>
      </Card>

      {/* ═══════════════════════════════════ */}
      {/* Create Deposit Modal */}
      {/* ═══════════════════════════════════ */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              Nowa zaliczka
            </DialogTitle>
            <DialogDescription>
              Dodaj zaliczkę do tej rezerwacji. Sugerowana kwota to 30% ceny ({Math.round(totalPrice * 0.3).toLocaleString('pl-PL')} zł).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Kwota (zł) *</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder={`np. ${Math.round(totalPrice * 0.3)}`}
                value={createAmount}
                onChange={(e) => setCreateAmount(e.target.value)}
                className="h-10"
              />
              {createAmount && totalPrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  {((Number(createAmount) / totalPrice) * 100).toFixed(1)}% ceny rezerwacji
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Termin płatności *</Label>
              <Input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tytuł (opcjonalnie)</Label>
              <Input
                placeholder="np. Zaliczka na wesele"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Anuluj</Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Utwórz zaliczkę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════ */}
      {/* Mark as Paid Modal */}
      {/* ═══════════════════════════════════ */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Potwierdź płatność
            </DialogTitle>
            <DialogDescription>
              Oznacz zaliczkę jako opłaconą.
            </DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-5 py-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Kwota</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {Number(selectedDeposit.amount).toLocaleString('pl-PL')} zł
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Metoda płatności</Label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethodOptions.map((m) => {
                    const Icon = m.icon
                    const selected = payMethod === m.value
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPayMethod(m.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          selected
                            ? `${m.color} border-current ring-2 ring-current/20`
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {m.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Data płatności</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayModal(false)}>Anuluj</Button>
            <Button
              onClick={handlePay}
              disabled={paying}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Potwierdź płatność
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
