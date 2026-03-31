'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Receipt, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { SectionCard } from '@/components/shared/SectionCard'
import { depositsApi } from '@/lib/api/deposits'
import type { Deposit, PaymentMethod } from '@/lib/api/deposits'
import { useReservationMenu } from '@/hooks/use-menu'
import { useReservationExtras } from '@/hooks/use-service-extras'
import { toast } from 'sonner'
import { DiscountSection } from '@/components/reservations/DiscountSection'

import { PriceBreakdown } from './financial/PriceBreakdown'
import { TotalsSummary } from './financial/TotalsSummary'
import { DepositSummary } from './financial/DepositSummary'
import { CreateDepositModal, PayDepositModal, DeleteDepositModal } from './financial/DepositModals'
import {
  STANDARD_HOURS,
  DEFAULT_EXTRA_HOUR_RATE,
  type ReservationFinancialSummaryProps,
  type Financials,
} from './financial/types'
import { formatCurrency } from '@/lib/utils'
import { suggestDueDate } from './financial/utils'

// Component
export function ReservationFinancialSummary({
  reservationId,
  adults,
  childrenCount,
  toddlers,
  pricePerAdult,
  pricePerChild,
  pricePerToddler,
  totalPrice,
  startDateTime,
  endDateTime,
  standardHours = STANDARD_HOURS,
  extraHourRate = DEFAULT_EXTRA_HOUR_RATE,
  status,
  discountType,
  discountValue,
  discountAmount,
  discountReason,
  priceBeforeDiscount,
  categoryExtras,
  categoryExtrasTotal: categoryExtrasTotalProp,
  venueSurcharge,
  venueSurchargeLabel,
  readOnly = false,
  onDepositChange,
}: ReservationFinancialSummaryProps) {
  // Menu data
  const { data: menuData } = useReservationMenu(reservationId)
  const hasMenu = !!menuData?.snapshot
  const priceBreakdown = menuData?.priceBreakdown

  // Service extras data
  const { data: extrasData } = useReservationExtras(reservationId)
  const extras = extrasData?.data || []
  const activeExtras = extras.filter((e: any) => e.status !== 'CANCELLED')
  const extrasTotalPrice = extrasData?.totalExtrasPrice || 0

  // #216: Category extras
  const activeCategoryExtras = categoryExtras || []
  const effectiveCategoryExtrasTotal = categoryExtrasTotalProp || activeCategoryExtras.reduce(
    (sum, e) => sum + Number(e.totalPrice), 0
  )

  // Venue surcharge
  const effectiveVenueSurcharge = Number(venueSurcharge) || 0
  const hasVenueSurcharge = effectiveVenueSurcharge > 0

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
    const extraHours = Math.max(0, Math.ceil(durationHours - standardHours))
    const extraCost = extraHours * extraHourRate
    return { durationHours: Math.round(durationHours * 10) / 10, extraHours, extraCost }
  }, [startDateTime, endDateTime, standardHours, extraHourRate])

  const isExtraHoursExempt = extraHourRate === 0

  const activeDiscountAmount = Number(discountAmount) || 0
  const hasActiveDiscount = !!discountType && activeDiscountAmount > 0

  const perPersonBase = adults * pricePerAdult
    + childrenCount * pricePerChild
    + toddlers * pricePerToddler

  const baseTotalPrice = hasMenu && priceBreakdown?.totalMenuPrice != null
    ? priceBreakdown.totalMenuPrice
    : perPersonBase
  const extraHoursCost = extraHoursInfo?.extraCost || 0
  const effectiveTotalPrice = baseTotalPrice + extraHoursCost + extrasTotalPrice + effectiveCategoryExtrasTotal + effectiveVenueSurcharge

  const finalTotalPrice = hasActiveDiscount
    ? Math.max(0, effectiveTotalPrice - activeDiscountAmount)
    : effectiveTotalPrice

  // Deposits state
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [depositsLoading, setDepositsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [showCostDetails, setShowCostDetails] = useState(false)
  const [showDepositsDetails, setShowDepositsDetails] = useState(true)

  // #deposits-fix (P4): delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [depositToDelete, setDepositToDelete] = useState<Deposit | null>(null)

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
  const financials: Financials = useMemo(() => {
    const activeDeposits = deposits.filter(d => d.status !== 'CANCELLED')
    const totalPaid = activeDeposits.reduce((sum, d) => sum + Number(d.paidAmount || 0), 0)
    const totalCommitted = activeDeposits.reduce((sum, d) => sum + Number(d.amount), 0)
    const totalPending = totalCommitted - totalPaid
    const remaining = Math.max(finalTotalPrice - totalPaid, 0)
    const percentPaid = finalTotalPrice > 0 ? Math.min(Math.round((totalPaid / finalTotalPrice) * 100), 100) : 0
    const percentCommitted = finalTotalPrice > 0 ? Math.min(Math.round((totalCommitted / finalTotalPrice) * 100), 100) : 0

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
  }, [deposits, finalTotalPrice, priceBreakdown])

  // Deposit handlers
  const handleOpenCreate = () => {
    if (readOnly) return
    const suggested = Math.round(finalTotalPrice * 0.3)
    setCreateAmount(suggested > 0 ? suggested.toString() : '')
    setCreateDueDate(suggestDueDate(0))
    setCreateTitle('')
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    if (readOnly) return
    if (!createAmount || Number(createAmount) <= 0) { toast.error('Podaj prawidłową kwotę'); return }
    if (!createDueDate) { toast.error('Podaj termin płatności'); return }
    if (startDateTime) {
      const eventDate = new Date(startDateTime)
      eventDate.setHours(0, 0, 0, 0)
      const dueDate = new Date(createDueDate + 'T00:00:00')
      if (dueDate >= eventDate) { toast.error('Termin płatności musi być przed dniem wydarzenia'); return }
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
      onDepositChange?.()
    } catch { toast.error('Nie udało się utworzyć zaliczki') } finally { setCreating(false) }
  }

  const handleOpenPay = (deposit: Deposit) => {
    if (readOnly) return
    setSelectedDeposit(deposit)
    setPayMethod('TRANSFER')
    setPayDate(new Date().toISOString().split('T')[0])
    setShowPayModal(true)
  }

  const handlePay = async () => {
    if (readOnly) return
    if (!selectedDeposit) return
    try {
      setPaying(true)
      await depositsApi.markAsPaid(selectedDeposit.id, { paymentMethod: payMethod, paidAt: payDate })
      toast.success('Zaliczka opłacona')
      setShowPayModal(false)
      loadDeposits()
      onDepositChange?.()
    } catch { toast.error('Nie udało się oznaczyć jako opłaconą') } finally { setPaying(false) }
  }

  const handleMarkUnpaid = async (deposit: Deposit) => {
    if (readOnly) return
    try { setActionLoading(deposit.id); await depositsApi.markAsUnpaid(deposit.id); toast.success('Cofnięto płatność'); loadDeposits(); onDepositChange?.() }
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
    if (readOnly) return
    try { setActionLoading(deposit.id); await depositsApi.cancel(deposit.id); toast.success('Zaliczka anulowana'); loadDeposits(); onDepositChange?.() }
    catch { toast.error('Nie udało się anulować zaliczki') } finally { setActionLoading(null) }
  }

  // #deposits-fix (P4): permanently delete a CANCELLED deposit
  const handleOpenDelete = (deposit: Deposit) => {
    if (readOnly) return
    setDepositToDelete(deposit)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (readOnly || !depositToDelete) return
    try {
      setActionLoading(depositToDelete.id)
      await depositsApi.delete(depositToDelete.id)
      toast.success('Zaliczka usunięta')
      setShowDeleteModal(false)
      setDepositToDelete(null)
      loadDeposits()
      onDepositChange?.()
    } catch { toast.error('Nie udało się usunąć zaliczki') } finally { setActionLoading(null) }
  }

  return (
    <>
      <SectionCard
        variant="gradient"
        title="Podsumowanie finansowe"
        icon={<Receipt className="h-5 w-5 text-white" />}
        iconGradient="from-emerald-500 to-teal-500"
        headerGradient="from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30"
        headerSpacing="mb-4"
      >
          {/* COST BREAKDOWN */}
          <div>
            <button
              onClick={() => setShowCostDetails(!showCostDetails)}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-xl mb-3 hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold">Koszty usług</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{formatCurrency(effectiveTotalPrice)}</span>
                {showCostDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {showCostDetails && (
              <PriceBreakdown
                adults={adults}
                childrenCount={childrenCount}
                toddlers={toddlers}
                effectivePricePerAdult={effectivePricePerAdult}
                effectivePricePerChild={effectivePricePerChild}
                effectivePricePerToddler={effectivePricePerToddler}
                hasMenu={hasMenu}
                priceBreakdown={priceBreakdown}
                activeExtras={activeExtras}
                extrasTotalPrice={extrasTotalPrice}
                activeCategoryExtras={activeCategoryExtras}
                effectiveCategoryExtrasTotal={effectiveCategoryExtrasTotal}
                hasVenueSurcharge={hasVenueSurcharge}
                effectiveVenueSurcharge={effectiveVenueSurcharge}
                venueSurchargeLabel={venueSurchargeLabel}
                extraHoursInfo={extraHoursInfo}
                isExtraHoursExempt={isExtraHoursExempt}
                standardHours={standardHours}
                extraHourRate={extraHourRate}
              />
            )}

            {/* DISCOUNT SECTION */}
            {status && (
              <div className="mb-3">
                <DiscountSection
                  reservation={{
                    id: reservationId,
                    status,
                    totalPrice: effectiveTotalPrice,
                    discountType: discountType || null,
                    discountValue: discountValue ?? null,
                    discountAmount: discountAmount ?? null,
                    discountReason: discountReason || null,
                    priceBeforeDiscount: priceBeforeDiscount ?? null,
                  }}
                  readOnly={readOnly}
                />
              </div>
            )}

            {/* TOTAL + BALANCE */}
            <TotalsSummary
              finalTotalPrice={finalTotalPrice}
              hasActiveDiscount={hasActiveDiscount}
              activeDiscountAmount={activeDiscountAmount}
              hasVenueSurcharge={hasVenueSurcharge}
              effectiveVenueSurcharge={effectiveVenueSurcharge}
              extrasTotalPrice={extrasTotalPrice}
              activeExtrasCount={activeExtras.length}
              effectiveCategoryExtrasTotal={effectiveCategoryExtrasTotal}
              activeCategoryExtrasCount={activeCategoryExtras.length}
              extraHoursInfo={extraHoursInfo}
              financials={financials}
            />
          </div>

          {/* DEPOSITS */}
          <div>
            <DepositSummary
              deposits={deposits}
              depositsLoading={depositsLoading}
              financials={financials}
              readOnly={readOnly}
              showDepositsDetails={showDepositsDetails}
              onToggleDepositsDetails={() => setShowDepositsDetails(!showDepositsDetails)}
              pdfLoading={pdfLoading}
              actionLoading={actionLoading}
              onOpenCreate={handleOpenCreate}
              onOpenPay={handleOpenPay}
              onMarkUnpaid={handleMarkUnpaid}
              onDownloadPdf={handleDownloadPdf}
              onSendEmail={handleSendEmail}
              onCancel={handleCancel}
              onOpenDelete={handleOpenDelete}
            />
          </div>
      </SectionCard>

      {/* Deposit Modals */}
      {!readOnly && (
        <>
          <CreateDepositModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            createAmount={createAmount}
            setCreateAmount={setCreateAmount}
            createDueDate={createDueDate}
            setCreateDueDate={setCreateDueDate}
            createTitle={createTitle}
            setCreateTitle={setCreateTitle}
            creating={creating}
            finalTotalPrice={finalTotalPrice}
            startDateTime={startDateTime}
            onCreate={handleCreate}
          />
          <PayDepositModal
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
          <DeleteDepositModal
            open={showDeleteModal}
            onOpenChange={(open) => { if (!open) { setShowDeleteModal(false); setDepositToDelete(null) } }}
            depositToDelete={depositToDelete}
            actionLoading={actionLoading}
            onDeleteConfirm={handleDeleteConfirm}
          />
        </>
      )}
    </>
  )
}
