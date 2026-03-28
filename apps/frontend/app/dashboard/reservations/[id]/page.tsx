'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Calendar, User, Mail, Phone,
  XCircle, History, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useReservation, useCancelReservation, useArchiveReservation, useUnarchiveReservation, downloadReservationPDF } from '@/lib/api/reservations'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import Link from 'next/link'
import { ReservationMenuSection } from '@/components/reservations/ReservationMenuSection'
import { ReservationFinancialSummary } from '@/components/reservations/ReservationFinancialSummary'
import CategoryExtrasList from '@/components/reservations/CategoryExtrasList'
import { ReservationExtrasPanel } from '@/components/service-extras/ReservationExtrasPanel'
import {
  EditableHallCard,
  EditableEventCard,
  EditableGuestsCard,
  EditableNotesCard,
  EditableInternalNotesCard,
} from '@/components/reservations/editable'
import AttachmentPanel from '@/components/attachments/attachment-panel'
import { EntityActivityTimeline } from '@/components/audit-log/EntityActivityTimeline'
import { toast } from 'sonner'
import { ReservationHero } from './components/ReservationHero'
import { QuickActionsCard } from './components/QuickActionsCard'
import { ReservationTimeline } from '@/components/reservations/ReservationTimeline'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

type TabType = 'details' | 'history'

export default function ReservationDetailsPage() {
  const params = useParams()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('details')

  const reservationId = params.id as string

  const { data: reservation, isLoading, isError, refetch } = useReservation(reservationId)
  const cancelMutation = useCancelReservation()
  const archiveMutation = useArchiveReservation()
  const unarchiveMutation = useUnarchiveReservation()

  // Bug fix: scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [reservationId])

  const handleRefetch = () => {
    refetch()
  }

  const handleDownloadPDF = async () => {
    if (!reservation) return

    try {
      setDownloading(true)
      await downloadReservationPDF(reservation.id)
      toast.success('PDF został pobrany',)
    } catch {
      toast.error('Nie udało się pobrać PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleArchive = async () => {
    if (!reservation) return

    if (!await confirm({ title: 'Archiwizacja rezerwacji', description: 'Czy na pewno chcesz zarchiwizować tę rezerwację?', variant: 'archive', confirmLabel: 'Zarchiwizuj' })) return

    try {
      await archiveMutation.mutateAsync({
        id: reservation.id,
        reason: 'Zarchiwizowano przez użytkownika'
      })
      toast.success('Rezerwacja została zarchiwizowana',)
      refetch()
    } catch {
      toast.error('Nie udało się zarchiwizować rezerwacji')
    }
  }

  const handleUnarchive = async () => {
    if (!reservation) return

    try {
      await unarchiveMutation.mutateAsync({
        id: reservation.id,
        reason: 'Przywrócono z archiwum'
      })
      toast.success('Rezerwacja została przywrócona z archiwum',)
      refetch()
    } catch {
      toast.error('Nie udało się przywrócić rezerwacji')
    }
  }

  const handleCancel = async () => {
    if (!reservation) return

    const reason = prompt('Podaj powód anulowania rezerwacji:')
    if (!reason) return

    try {
      await cancelMutation.mutateAsync({
        id: reservation.id,
        input: { reason }
      })
      toast.success('Rezerwacja została anulowana',)
    } catch {
      toast.error('Nie udało się anulować rezerwacji')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-6 sm:py-8 px-4 space-y-6">
          {/* Hero skeleton */}
          <div className="h-48 rounded-2xl bg-muted animate-pulse" />
          {/* Timeline skeleton */}
          <div className="h-20 rounded-xl bg-muted animate-pulse" />
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-6">
              <div className="h-48 rounded-2xl bg-muted animate-pulse" />
              <div className="h-32 rounded-2xl bg-muted animate-pulse" />
              <div className="h-40 rounded-2xl bg-muted animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-36 rounded-2xl bg-muted animate-pulse" />
              <div className="h-64 rounded-2xl bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="h-16 w-16 text-red-400 mx-auto" />
          <p className="text-muted-foreground">Nie udało się załadować rezerwacji</p>
          <Link href="/dashboard/reservations">
            <Button><ArrowLeft className="mr-2 h-4 w-4" />Powrót do listy</Button>
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = reservation.startDateTime
    ? new Date(reservation.startDateTime)
    : reservation.date
      ? new Date(reservation.date)
      : null

  const isCancellable = reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED'
  const isEditable = reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED' && reservation.status !== 'ARCHIVED'
  const isReadOnly = !isEditable
  const totalGuests = (reservation.adults || 0) + (reservation.children || 0) + (reservation.toddlers || 0)
  const isArchived = !!reservation.archivedAt

  // Pricing config — read directly from reservation.eventType (backend includes standardHours & extraHourRate).
  // Fallback to legacy defaults (6h / 500 PLN) only if eventType somehow lacks the fields.
  const resolvedStandardHours =
    typeof reservation.eventType?.standardHours === 'number'
      ? reservation.eventType.standardHours
      : 6

  const resolvedExtraHourRate =
    reservation.eventType?.extraHourRate != null
      ? Number(reservation.eventType.extraHourRate)
      : 500

  // Banner message for read-only mode
  const readOnlyBannerMessage = reservation.status === 'CANCELLED'
    ? 'Ta rezerwacja została anulowana. Dane są dostępne tylko do odczytu.'
    : reservation.status === 'ARCHIVED'
      ? 'Ta rezerwacja jest zarchiwizowana. Dane są dostępne tylko do odczytu.'
      : reservation.status === 'COMPLETED'
        ? 'Ta rezerwacja została zrealizowana. Dane są dostępne tylko do odczytu.'
        : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-6 sm:py-8 px-4 space-y-6 sm:space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Read-only info banner */}
        {isReadOnly && readOnlyBannerMessage && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
            <Lock className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{readOnlyBannerMessage}</p>
          </div>
        )}

        {/* Premium Hero Section */}
        <ReservationHero
          reservation={reservation}
          eventDate={eventDate}
          isArchived={isArchived}
          isReadOnly={isReadOnly}
          downloading={downloading}
          onDownloadPDF={handleDownloadPDF}
          onRefetch={handleRefetch}
        />

        {/* Status Timeline */}
        <ReservationTimeline status={reservation.status} />

        {/* US-9.8: Tab bar */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Szczegóły
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <History className="h-4 w-4" />
            Historia
          </button>
        </div>

        {/* Tab: Szczegóły */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Left Column - Main Info */}
            <div className="space-y-6">
              {/* Client Info (read-only) */}
              <Card className="border-0 shadow-xl">
                <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-5 sm:mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">Klient</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">Imię i nazwisko</p>
                        <p className="text-base sm:text-lg font-semibold truncate">
                          {reservation.client?.firstName} {reservation.client?.lastName}
                        </p>
                      </div>
                    </div>
                    {reservation.client?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-base sm:text-lg font-semibold truncate">{reservation.client.email}</p>
                        </div>
                      </div>
                    )}
                    {reservation.client?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Telefon</p>
                          <p className="text-base sm:text-lg font-semibold">{reservation.client.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Hall Info */}
              <EditableHallCard
                reservationId={reservation.id}
                hallId={reservation.hall?.id || ''}
                hallName={reservation.hall?.name || 'Brak'}
                hallCapacity={reservation.hall?.capacity || null}
                hallIsWholeVenue={reservation.hall?.isWholeVenue || false}
                startDateTime={reservation.startDateTime}
                endDateTime={reservation.endDateTime}
                totalGuests={totalGuests}
                currentVenueSurcharge={reservation.venueSurcharge != null ? Number(reservation.venueSurcharge) : null}
                onUpdated={handleRefetch}
                disabled={isReadOnly}
              />

              {/* Event Details */}
              <EditableEventCard
                reservationId={reservation.id}
                eventTypeId={reservation.eventType?.id || ''}
                eventTypeName={reservation.eventType?.name || 'Brak'}
                startDateTime={reservation.startDateTime}
                endDateTime={reservation.endDateTime}
                customEventType={reservation.customEventType}
                birthdayAge={reservation.birthdayAge}
                anniversaryYear={reservation.anniversaryYear}
                anniversaryOccasion={reservation.anniversaryOccasion}
                onUpdated={handleRefetch}
                disabled={isReadOnly}
              />

              {/* Menu Section */}
              {reservation.eventType?.id && eventDate && (
                <ReservationMenuSection
                  reservationId={reservation.id}
                  eventTypeId={reservation.eventType.id}
                  eventDate={eventDate}
                  adults={reservation.adults || 0}
                  childrenCount={reservation.children || 0}
                  toddlers={reservation.toddlers || 0}
                  categoryExtras={reservation.categoryExtras as any}
                  onMenuUpdated={handleRefetch}
                  readOnly={isReadOnly}
                />
              )}

              {/* #216: Category Extras (per-person pricing) */}
              {reservation.categoryExtras && reservation.categoryExtras.length > 0 && (
                <CategoryExtrasList
                  reservationId={reservation.id}
                  categoryExtras={reservation.categoryExtras as any}
                  categoryExtrasTotal={reservation.categoryExtrasTotal}
                  readOnly={isReadOnly}
                  onUpdated={handleRefetch}
                />
              )}

              {/* Service Extras */}
              <ReservationExtrasPanel
                reservationId={reservation.id}
                readOnly={isReadOnly}
              />

              {/* Notes */}
              <EditableNotesCard
                reservationId={reservation.id}
                notes={reservation.notes ?? null}
                confirmationDeadline={reservation.confirmationDeadline ?? null}
                startDateTime={reservation.startDateTime ?? null}
                onUpdated={handleRefetch}
                disabled={isReadOnly}
              />

              {/* Notatka wewnętrzna (Etap 5) \u2014 nie trafia do PDF */}
              <EditableInternalNotesCard
                reservationId={reservation.id}
                internalNotes={reservation.internalNotes ?? null}
                onUpdated={handleRefetch}
                disabled={isReadOnly}
              />

              {/* Attachments */}
              <AttachmentPanel
                entityType="RESERVATION"
                entityId={reservation.id}
                title="Załączniki rezerwacji"
                className="shadow-xl"
                readOnly={isReadOnly}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Guests */}
              <EditableGuestsCard
                reservationId={reservation.id}
                adults={reservation.adults || 0}
                childrenCount={reservation.children || 0}
                toddlers={reservation.toddlers || 0}
                hallCapacity={reservation.hall?.capacity || 0}
                isWholeVenue={reservation.hall?.isWholeVenue || false}
                onUpdated={handleRefetch}
                disabled={isReadOnly}
              />

              {/* Financial Summary — always renders immediately, no hydration needed */}
              {/* #deposits-fix (4/5): onDepositChange wires deposit mutations back to handleRefetch so the */}
              {/* reservation status badge in the hero updates instantly after auto-confirm. */}
              <ReservationFinancialSummary
                reservationId={reservation.id}
                adults={reservation.adults || 0}
                childrenCount={reservation.children || 0}
                toddlers={reservation.toddlers || 0}
                pricePerAdult={Number(reservation.pricePerAdult) || 0}
                pricePerChild={Number(reservation.pricePerChild) || 0}
                pricePerToddler={Number(reservation.pricePerToddler) || 0}
                totalPrice={Number(reservation.totalPrice) || 0}
                startDateTime={reservation.startDateTime}
                endDateTime={reservation.endDateTime}
                standardHours={resolvedStandardHours}
                extraHourRate={resolvedExtraHourRate}
                status={reservation.status}
                discountType={reservation.discountType}
                discountValue={reservation.discountValue}
                discountAmount={reservation.discountAmount}
                discountReason={reservation.discountReason}
                priceBeforeDiscount={reservation.priceBeforeDiscount}
                categoryExtras={reservation.categoryExtras}
                categoryExtrasTotal={reservation.categoryExtrasTotal != null ? Number(reservation.categoryExtrasTotal) : undefined}
                venueSurcharge={reservation.venueSurcharge != null ? Number(reservation.venueSurcharge) : null}
                venueSurchargeLabel={reservation.venueSurchargeLabel}
                readOnly={isReadOnly}
                onDepositChange={handleRefetch}
              />

              {/* Quick Actions */}
              <QuickActionsCard
                isArchived={isArchived}
                isCancellable={isCancellable}
                isReadOnly={isReadOnly}
                downloading={downloading}
                archivePending={archiveMutation.isPending}
                unarchivePending={unarchiveMutation.isPending}
                cancelPending={cancelMutation.isPending}
                onDownloadPDF={handleDownloadPDF}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onCancel={handleCancel}
              />
            </div>
          </div>
        )}

        {/* Tab: Historia (US-9.8) */}
        {activeTab === 'history' && (
          <div className="max-w-4xl">
            <EntityActivityTimeline
              entityType="RESERVATION"
              entityId={reservationId}
            />
          </div>
        )}
      </div>
      {ConfirmDialog}
    </div>
  )
}
