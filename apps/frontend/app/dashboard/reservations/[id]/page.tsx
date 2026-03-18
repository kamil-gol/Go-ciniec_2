'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Trash2, Clock, Archive, ArchiveRestore,
  Calendar, Users, User, Mail, Phone,
  Download, CheckCircle2, XCircle, History,
  AlertTriangle, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useReservation, useCancelReservation, useArchiveReservation, useUnarchiveReservation, downloadReservationPDF } from '@/lib/api/reservations'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { ReservationMenuSection } from '@/components/reservations/ReservationMenuSection'
import { ReservationFinancialSummary } from '@/components/reservations/ReservationFinancialSummary'
import CategoryExtrasList from '@/components/reservations/CategoryExtrasList'
import CategoryExtrasAddButton from '@/components/reservations/CategoryExtrasAddButton'
import { ReservationExtrasPanel } from '@/components/service-extras/ReservationExtrasPanel'
import {
  StatusChanger,
  EditableHallCard,
  EditableEventCard,
  EditableGuestsCard,
  EditableNotesCard,
  EditableInternalNotesCard,
} from '@/components/reservations/editable'
import AttachmentPanel from '@/components/attachments/attachment-panel'
import { EntityActivityTimeline } from '@/components/audit-log/EntityActivityTimeline'

type TabType = 'details' | 'history'

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
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
      toast({
        title: 'Sukces',
        description: 'PDF został pobrany',
      })
    } catch {
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać PDF',
        variant: 'destructive',
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleArchive = async () => {
    if (!reservation) return

    if (!confirm('Czy na pewno chcesz zarchiwizować tę rezerwację?')) return

    try {
      await archiveMutation.mutateAsync({
        id: reservation.id,
        reason: 'Zarchiwizowano przez użytkownika'
      })
      toast({
        title: 'Sukces',
        description: 'Rezerwacja została zarchiwizowana',
      })
      refetch()
    } catch {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zarchiwizować rezerwacji',
        variant: 'destructive',
      })
    }
  }

  const handleUnarchive = async () => {
    if (!reservation) return

    try {
      await unarchiveMutation.mutateAsync({
        id: reservation.id,
        reason: 'Przywrócono z archiwum'
      })
      toast({
        title: 'Sukces',
        description: 'Rezerwacja została przywrócona z archiwum',
      })
      refetch()
    } catch {
      toast({
        title: 'Błąd',
        description: 'Nie udało się przywrócić rezerwacji',
        variant: 'destructive',
      })
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
      toast({
        title: 'Sukces',
        description: 'Rezerwacja została anulowana',
      })
    } catch {
      toast({
        title: 'Błąd',
        description: 'Nie udało się anulować rezerwacji',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
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
        {/* Read-only info banner */}
        {isReadOnly && readOnlyBannerMessage && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
            <Lock className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{readOnlyBannerMessage}</p>
          </div>
        )}

        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-5 sm:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

          <div className="relative z-10 space-y-4 sm:space-y-6">
            <Link href="/dashboard/reservations">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do listy
              </Button>
            </Link>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-bold">Rezerwacja #{reservation.id.slice(0, 8)}</h1>
                    <p className="text-white/90 text-base sm:text-lg mt-1">Szczegóły rezerwacji</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isArchived && reservation.status !== 'ARCHIVED' && (
                    <Badge className="bg-neutral-200 text-neutral-800 border-neutral-300">
                      <Archive className="h-3 w-3 mr-1" />
                      Zarchiwizowane
                    </Badge>
                  )}
                  <StatusChanger
                    reservationId={reservation.id}
                    currentStatus={reservation.status}
                    onStatusChanged={handleRefetch}
                    disabled={isReadOnly}
                  />
                  {eventDate && (
                    <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(eventDate, 'dd MMMM yyyy', { locale: pl })}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button
                  size="lg"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <Download className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">{downloading ? 'Pobieranie...' : 'Pobierz PDF'}</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
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
                  children={reservation.children || 0}
                  toddlers={reservation.toddlers || 0}
                  readOnly={isReadOnly}
                />
              )}

              {/* #216: Category Extras */}
              {reservation.categoryExtras && reservation.categoryExtras.length > 0 ? (
                <CategoryExtrasList
                  reservationId={reservation.id}
                  categoryExtras={reservation.categoryExtras as any}
                  categoryExtrasTotal={reservation.categoryExtrasTotal}
                  readOnly={isReadOnly}
                  onUpdated={handleRefetch}
                />
              ) : reservation.menuSnapshot && (reservation.menuSnapshot as any).menuData?.packageId ? (
                <CategoryExtrasAddButton
                  reservationId={reservation.id}
                  menuPackageId={(reservation.menuSnapshot as any).menuData.packageId}
                  readOnly={isReadOnly}
                  onAdded={handleRefetch}
                />
              ) : null}

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
                children={reservation.children || 0}
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
                children={reservation.children || 0}
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
              <Card className="border-0 shadow-xl">
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold mb-4">Szybkie akcje</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      size="lg"
                      onClick={handleDownloadPDF}
                      disabled={downloading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {downloading ? 'Pobieranie...' : 'Pobierz PDF'}
                    </Button>

                    {!isArchived ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-neutral-600 hover:text-neutral-700"
                        size="lg"
                        disabled={archiveMutation.isPending || isReadOnly}
                        onClick={handleArchive}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        {archiveMutation.isPending ? 'Archiwizowanie...' : 'Zarchiwizuj rezerwację'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-green-600 hover:text-green-700"
                        size="lg"
                        disabled={unarchiveMutation.isPending}
                        onClick={handleUnarchive}
                      >
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        {unarchiveMutation.isPending ? 'Przywracanie...' : 'Przywróć z archiwum'}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      size="lg"
                      disabled={!isCancellable || cancelMutation.isPending || isReadOnly}
                      onClick={handleCancel}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {cancelMutation.isPending ? 'Anulowanie...' : 'Anuluj rezerwację'}
                    </Button>
                  </div>
                </div>
              </Card>
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
    </div>
  )
}
