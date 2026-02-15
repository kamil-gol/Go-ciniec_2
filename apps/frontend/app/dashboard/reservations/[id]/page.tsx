'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Trash2, Clock, 
  Calendar, Users, User, Mail, Phone,
  Download, CheckCircle2, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useReservation, useCancelReservation, downloadReservationPDF } from '@/lib/api/reservations'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { ReservationMenuSection } from '@/components/reservations/ReservationMenuSection'
import { ReservationFinancialSummary } from '@/components/reservations/ReservationFinancialSummary'
import {
  StatusChanger,
  EditableHallCard,
  EditableEventCard,
  EditableGuestsCard,
  EditableNotesCard,
} from '@/components/reservations/editable'

export default function ReservationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [downloading, setDownloading] = useState(false)

  const reservationId = params.id as string

  const { data: reservation, isLoading, isError, refetch } = useReservation(reservationId)
  const cancelMutation = useCancelReservation()

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
  const isEditable = reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED'
  const totalGuests = (reservation.adults || 0) + (reservation.children || 0) + (reservation.toddlers || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-6">
            <Link href="/dashboard/reservations">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do listy
              </Button>
            </Link>

            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Rezerwacja #{reservation.id.slice(0, 8)}</h1>
                    <p className="text-white/90 text-lg mt-1">Szczegóły rezerwacji</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Inline StatusChanger replaces static badge */}
                  <StatusChanger
                    reservationId={reservation.id}
                    currentStatus={reservation.status}
                    onStatusChanged={handleRefetch}
                  />
                  {eventDate && (
                    <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(eventDate, 'dd MMMM yyyy', { locale: pl })}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {downloading ? 'Pobieranie...' : 'Pobierz PDF'}
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info (read-only) */}
            <Card className="border-0 shadow-xl">
              <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Klient</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Imię i nazwisko</p>
                      <p className="text-lg font-semibold">
                        {reservation.client?.firstName} {reservation.client?.lastName}
                      </p>
                    </div>
                  </div>
                  {reservation.client?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-lg font-semibold">{reservation.client.email}</p>
                      </div>
                    </div>
                  )}
                  {reservation.client?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="text-lg font-semibold">{reservation.client.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Hall Info — Editable with availability check */}
            <EditableHallCard
              reservationId={reservation.id}
              hallId={reservation.hall?.id || ''}
              hallName={reservation.hall?.name || 'Brak'}
              hallCapacity={reservation.hall?.capacity || null}
              startDateTime={reservation.startDateTime}
              endDateTime={reservation.endDateTime}
              totalGuests={totalGuests}
              onUpdated={handleRefetch}
            />

            {/* Event Details — Editable with DatePicker/TimePicker */}
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
            />

            {/* Menu Section (already interactive) */}
            {reservation.eventType?.id && eventDate && (
              <ReservationMenuSection
                reservationId={reservation.id}
                eventTypeId={reservation.eventType.id}
                eventDate={eventDate}
                adults={reservation.adults || 0}
                children={reservation.children || 0}
                toddlers={reservation.toddlers || 0}
              />
            )}

            {/* Notes — Editable (always visible) */}
            <EditableNotesCard
              reservationId={reservation.id}
              notes={reservation.notes}
              confirmationDeadline={reservation.confirmationDeadline}
              startDateTime={reservation.startDateTime}
              onUpdated={handleRefetch}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Guests — Editable with capacity validation */}
            <EditableGuestsCard
              reservationId={reservation.id}
              adults={reservation.adults || 0}
              children={reservation.children || 0}
              toddlers={reservation.toddlers || 0}
              hallCapacity={reservation.hall?.capacity || 0}
              onUpdated={handleRefetch}
            />

            {/* UNIFIED FINANCIAL SUMMARY (already interactive) */}
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
            />

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl">
              <div className="p-6">
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
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700" 
                    size="lg"
                    disabled={!isCancellable || cancelMutation.isPending}
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
      </div>
    </div>
  )
}
