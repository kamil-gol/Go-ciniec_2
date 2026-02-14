'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DollarSign, Plus, FileDown, CheckCircle2, Clock, AlertTriangle,
  XCircle, ArrowDownUp, Banknote, Smartphone, CreditCard, Loader2,
  ExternalLink, CalendarDays, Undo2, Mail, TrendingUp, Receipt,
  Package, ShoppingCart, Users, Sparkles, ChevronDown, ChevronUp,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, DepositStatus, PaymentMethod } from '@/lib/api/deposits'
import { useReservationMenu } from '@/hooks/use-menu'
import { toast } from 'sonner'
import Link from 'next/link'

// Constants
const STANDARD_HOURS = 6
const DEFAULT_EXTRA_HOUR_RATE = 500

// Types
interface ReservationFinancialSummaryProps {
  reservationId: string
  adults: number
  children: number
  toddlers: number
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  totalPrice: number
  /** ISO datetime string for event start */
  startDateTime?: string
  /** ISO datetime string for event end */
  endDateTime?: string
  /** Cost per extra hour beyond standard 6h (default: 500 PLN) */
  extraHourRate?: number
}

// Config
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

// Helpers
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

function formatPLN(amount: number): string {
  return amount.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function suggestDueDate(daysFromNow: number = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// Component
export function ReservationFinancialSummary({
  reservationId,
  adults,
  children,
  toddlers,
  pricePerAdult,
  pricePerChild,
  pricePerToddler,
  totalPrice,
  startDateTime,
  endDateTime,
  extraHourRate = DEFAULT_EXTRA_HOUR_RATE,
}: ReservationFinancialSummaryProps) {
  // Menu data
  const { data: menuData } = useReservationMenu(reservationId)
  const hasMenu = !!menuData?.snapshot
  const priceBreakdown = menuData?.priceBreakdown

  // Resolve prices: use menu snapshot prices when available, fallback to reservation props
  const effectivePricePerAdult = hasMenu && priceBreakdown?.packageCost?.adults?.priceEach != null
    ? priceBreakdown.packageCost.adults.priceEach
    : pricePerAdult
  const effectivePricePerChild = hasMenu && priceBreakdown?.packageCost?.children?.priceEach != null
    ? priceBreakdown.packageCost.children.priceEach
    : pricePerChild
  const effectivePricePerToddler = hasMenu && priceBreakdown?.packageCost?.toddlers?.priceEach != null
    ? priceBreakdown.packageCost.toddlers.priceEach
    : pricePerToddler

  // Extra hours calculation
  const extraHoursInfo = useMemo(() => {
    if (!startDateTime || !endDateTime) return null
    const start = new Date(startDateTime)
    const end = new Date(endDateTime)
    const durationMs = end.getTime() - start.getTime()
    if (durationMs <= 0) return null
    const durationHours = durationMs / (1000 * 60 * 60)
    const extraHours = Math.max(0, Math.ceil(durationHours - STANDARD_HOURS))
    const extraCost = extraHours * extraHourRate
    return { durationHours: Math.round(durationHours * 10) / 10, extraHours, extraCost }
  }, [startDateTime, endDateTime, extraHourRate])

  // Effective total: use menu total when available, fallback to reservation prop, + extra hours
  const baseTotalPrice = hasMenu && priceBreakdown?.totalMenuPrice != null
    ? priceBreakdown.totalMenuPrice
    : totalPrice
  const extraHoursCost = extraHoursInfo?.extraCost || 0
  const effectiveTotalPrice = baseTotalPrice + extraHoursCost

  // Deposits state
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [depositsLoading, setDepositsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [showCostDetails, setShowCostDetails] = useState(false)
  const [showDepositsDetails, setShowDepositsDetails] = useState(true)

  // Create form
  const [createAmount, setCreateAmount] = useState('')
  const [createDueDate, setCreateDueDate] = useState('')
  const [createTitle, setCreateTitle] = useState('')
  const [creating, setCreating] = useState(false)

  // Pay form
  const [payMethod, setPayMethod] = useState<PaymentMethod>('TRANSFER')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [paying, setPaying] = useState(false)

  // Action loading
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadDeposits = useCallback(async () => {
    try {
      setDepositsLoading(true)
      const data = await depositsApi.getByReservation(reservationId)
      setDeposits(data)
    } catch (error) {
      console.error('Error loading deposits:', error)
    } finally {
      setDepositsLoading(false)
    }
  }, [reservationId])

  useEffect(() => {
    loadDeposits()
  }, [loadDeposits])

  // Calculations
  const financials = useMemo(() => {
    const activeDeposits = deposits.filter(d => d.status !== 'CANCELLED')
    const totalPaid = activeDeposits.reduce((sum, d) => sum + Number(d.paidAmount || 0), 0)
    const totalCommitted = activeDeposits.reduce((sum, d) => sum + Number(d.amount), 0)
    const totalPending = totalCommitted - totalPaid
    const remaining = Math.max(effectiveTotalPrice - totalPaid, 0)
    const percentPaid = effectiveTotalPrice > 0 ? Math.min(Math.round((totalPaid / effectiveTotalPrice) * 100), 100) : 0
    const percentCommitted = effectiveTotalPrice > 0 ? Math.min(Math.round((totalCommitted / effectiveTotalPrice) * 100), 100) : 0

    const menuPackageCost = priceBreakdown?.packageCost?.subtotal || 0
    const menuOptionsCost = priceBreakdown?.optionsSubtotal || 0
    const menuTotalCost = priceBreakdown?.totalMenuPrice || 0

    return {
      activeDeposits,
      totalPaid,
      totalCommitted,
      totalPending,
      remaining,
      percentPaid,
      percentCommitted,
      menuPackageCost,
      menuOptionsCost,
      menuTotalCost,
      depositsCount: activeDeposits.length,
    }
  }, [deposits, effectiveTotalPrice, priceBreakdown])

  // Deposit handlers
  const handleOpenCreate = () => {
    const suggested = Math.round(effectiveTotalPrice * 0.3)
    setCreateAmount(suggested > 0 ? suggested.toString() : '')
    setCreateDueDate(suggestDueDate(14))
    setCreateTitle('')
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    if (!createAmount || Number(createAmount) <= 0) { toast.error('Podaj prawidłową kwotę'); return }
    if (!createDueDate) { toast.error('Podaj termin płatności'); return }
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
    } catch { toast.error('Nie udało się utworzyć zaliczki') } finally { setCreating(false) }
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
      toast.success('Zaliczka opłacona')
      setShowPayModal(false)
      loadDeposits()
    } catch { toast.error('Nie udało się oznaczyć jako opłaconą') } finally { setPaying(false) }
  }

  const handleMarkUnpaid = async (deposit: Deposit) => {
    try { setActionLoading(deposit.id); await depositsApi.markAsUnpaid(deposit.id); toast.success('Cofnięto płatność'); loadDeposits() }
    catch { toast.error('Nie udało się cofnąć płatności') } finally { setActionLoading(null) }
  }

  const handleDownloadPdf = async (deposit: Deposit) => {
    try { setPdfLoading(deposit.id); await depositsApi.downloadPdf(deposit.id); toast.success('PDF pobrany') }
    catch { toast.error('Nie udało się pobrać PDF') } finally { setPdfLoading(null) }
  }

  const handleSendEmail = async (deposit: Deposit) => {
    try { setActionLoading(deposit.id); await depositsApi.sendEmail(deposit.id); toast.success('Email wysłany') }
    catch { toast.error('Nie udało się wysłać emaila') } finally { setActionLoading(null) }
  }

  const handleCancel = async (deposit: Deposit) => {
    try { setActionLoading(deposit.id); await depositsApi.cancel(deposit.id); toast.success('Zaliczka anulowana'); loadDeposits() }
    catch { toast.error('Nie udało się anulować zaliczki') } finally { setActionLoading(null) }
  }

  return (
    <>
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30">
          {/* HEADER */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Podsumowanie finansowe</h2>
            </div>
          </div>

          {/* COST BREAKDOWN */}
          <div className="px-6">
            <button
              onClick={() => setShowCostDetails(!showCostDetails)}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-xl mb-3 hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold">Koszty usług</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{formatPLN(effectiveTotalPrice)} zł</span>
                {showCostDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {showCostDetails && (
              <div className="space-y-3 mb-4 animate-in slide-in-from-top-2 duration-200">
                {/* Package / Base pricing */}
                <div className="bg-white dark:bg-black/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      {hasMenu ? 'Pakiet gastronomiczny' : 'Cennik za osobę'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {adults > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dorośli ({adults} × {formatPLN(effectivePricePerAdult)} zł)</span>
                        <span className="font-semibold">{formatPLN(adults * effectivePricePerAdult)} zł</span>
                      </div>
                    )}
                    {children > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dzieci ({children} × {formatPLN(effectivePricePerChild)} zł)</span>
                        <span className="font-semibold">{formatPLN(children * effectivePricePerChild)} zł</span>
                      </div>
                    )}
                    {toddlers > 0 && effectivePricePerToddler > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Maluchy ({toddlers} × {formatPLN(effectivePricePerToddler)} zł)</span>
                        <span className="font-semibold">{formatPLN(toddlers * effectivePricePerToddler)} zł</span>
                      </div>
                    )}
                    {toddlers > 0 && effectivePricePerToddler === 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Maluchy ({toddlers})</span>
                        <span className="font-semibold text-emerald-600">bezpłatnie</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Suma podstawowa</span>
                      <span>{formatPLN(hasMenu && priceBreakdown ? priceBreakdown.packageCost.subtotal : (adults * effectivePricePerAdult + children * effectivePricePerChild + toddlers * effectivePricePerToddler))} zł</span>
                    </div>
                  </div>
                </div>

                {/* Menu options */}
                {hasMenu && priceBreakdown?.optionsCost && priceBreakdown.optionsCost.length > 0 && (
                  <div className="bg-white dark:bg-black/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingCart className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-muted-foreground">Opcje dodatkowe</p>
                    </div>
                    <div className="space-y-2">
                      {priceBreakdown.optionsCost.map((opt: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {opt.option} ({opt.priceType === 'PER_PERSON' ? `${opt.quantity} × ${formatPLN(opt.priceEach)} zł` : 'stała kwota'})
                          </span>
                          <span className="font-semibold">{formatPLN(opt.total)} zł</span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Suma opcji</span>
                        <span>{formatPLN(priceBreakdown.optionsSubtotal)} zł</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extra hours */}
                {extraHoursInfo && extraHoursInfo.extraHours > 0 && (
                  <div className="bg-white dark:bg-black/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-muted-foreground">Dodatkowe godziny</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Czas trwania wydarzenia
                        </span>
                        <span className="font-medium">{extraHoursInfo.durationHours}h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Czas w cenie (standard)
                        </span>
                        <span className="font-medium text-emerald-600">{STANDARD_HOURS}h</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Dodatkowe godziny ({extraHoursInfo.extraHours} × {formatPLN(extraHourRate)} zł/h)
                        </span>
                        <span className="font-semibold text-blue-700">{formatPLN(extraHoursInfo.extraCost)} zł</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TOTAL */}
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white mb-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 opacity-80" />
                  <span className="font-bold">Razem do zapłaty</span>
                </div>
                <span className="text-2xl font-bold">{formatPLN(effectiveTotalPrice)} zł</span>
              </div>
              {extraHoursInfo && extraHoursInfo.extraHours > 0 && (
                <div className="flex items-center justify-between mt-1 text-white/80 text-xs">
                  <span>w tym dopłata za {extraHoursInfo.extraHours} dodatkow{extraHoursInfo.extraHours === 1 ? 'ą godzinę' : extraHoursInfo.extraHours < 5 ? 'e godziny' : 'ych godzin'}</span>
                  <span>+{formatPLN(extraHoursInfo.extraCost)} zł</span>
                </div>
              )}
            </div>
          </div>

          {/* DEPOSITS + BALANCE */}
          <div className="px-6 pb-6">
            {/* Balance bar */}
            <div className="p-4 bg-white dark:bg-black/20 rounded-xl mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold">Stan rozliczeń</span>
                </div>
                <span className="text-sm font-bold">
                  {formatPLN(financials.totalPaid)} / {formatPLN(effectiveTotalPrice)} zł
                </span>
              </div>

              <div className="relative h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-300 dark:bg-amber-700 rounded-full transition-all duration-700"
                  style={{ width: `${financials.percentCommitted}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${financials.percentPaid}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    Wpłacono ({financials.percentPaid}%)
                  </span>
                  {financials.totalPending > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-300 dark:bg-amber-700" />
                      Oczekuje
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    Brakuje
                  </span>
                </div>
              </div>

              {financials.remaining > 0 && (
                <div className="mt-3 flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Pozostało do zapłaty</span>
                  <span className="text-lg font-bold text-amber-800 dark:text-amber-300">{formatPLN(financials.remaining)} zł</span>
                </div>
              )}
              {financials.remaining === 0 && financials.totalPaid > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Całkowicie opłacone!</span>
                </div>
              )}
            </div>

            {/* Deposits header */}
            <button
              onClick={() => setShowDepositsDetails(!showDepositsDetails)}
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
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${status?.className || ''}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status?.label || deposit.status}
                            </span>
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
                            {isPending && (
                              <button onClick={() => handleOpenPay(deposit)} disabled={isActioning}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50 transition-colors">
                                <CheckCircle2 className="h-3 w-3" /> Opłać
                              </button>
                            )}
                            {isPaid && (
                              <>
                                <button onClick={() => handleDownloadPdf(deposit)} disabled={pdfLoading === deposit.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50 transition-colors">
                                  {pdfLoading === deposit.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />} PDF
                                </button>
                                <button onClick={() => handleSendEmail(deposit)} disabled={isActioning}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 transition-colors">
                                  {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />} Email
                                </button>
                                <button onClick={() => handleMarkUnpaid(deposit)} disabled={isActioning}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/50 transition-colors">
                                  <Undo2 className="h-3 w-3" /> Cofnij
                                </button>
                              </>
                            )}
                            {!isCancelled && !isPaid && (
                              <button onClick={() => handleCancel(deposit)} disabled={isActioning}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-50 text-neutral-500 border border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700 transition-colors">
                                <XCircle className="h-3 w-3" /> Anuluj
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Dodaj zaliczkę
                </Button>

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
          </div>
        </div>
      </Card>

      {/* Create Deposit Modal */}
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
              Sugerowana kwota: 30% ({formatPLN(Math.round(effectiveTotalPrice * 0.3))} zł)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Kwota (zł) *</Label>
              <Input type="number" min="1" step="0.01" placeholder={`np. ${Math.round(effectiveTotalPrice * 0.3)}`}
                value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} className="h-10" />
              {createAmount && effectiveTotalPrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  {((Number(createAmount) / effectiveTotalPrice) * 100).toFixed(1)}% ceny rezerwacji
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Termin płatności *</Label>
              <Input type="date" value={createDueDate} onChange={(e) => setCreateDueDate(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tytuł (opcjonalnie)</Label>
              <Input placeholder="np. Zaliczka na wesele" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} className="h-10" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Anuluj</Button>
            <Button onClick={handleCreate} disabled={creating} className="bg-rose-600 hover:bg-rose-700 text-white">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Utwórz zaliczkę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Modal */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Potwierdź płatność
            </DialogTitle>
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
                      <button key={m.value} type="button" onClick={() => setPayMethod(m.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          selected ? `${m.color} border-current ring-2 ring-current/20`
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}>
                        <Icon className="h-4 w-4" />{m.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Data płatności</Label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-10" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayModal(false)}>Anuluj</Button>
            <Button onClick={handlePay} disabled={paying} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Potwierdź płatność
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
