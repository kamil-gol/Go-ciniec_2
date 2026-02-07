'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { useReservation } from '@/hooks/use-reservations'
import { useHalls } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { calculateTotalPrice, formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, FileText } from 'lucide-react'
import { ReservationStatus } from '@/types'
import { reservationsApi } from '@/lib/api/reservations'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const reservationSchema = z.object({
  hallId: z.string().min(1, 'Wybierz salę'),
  clientId: z.string().min(1, 'Wybierz klienta'),
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  date: z.string().min(1, 'Wybierz datę'),
  startTime: z.string().min(1, 'Wybierz czas rozpoczęcia'),
  endTime: z.string().min(1, 'Wybierz czas zakończenia'),
  guests: z.coerce.number().min(1, 'Liczba gości musi być większa od 0'),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
})

type ReservationFormData = z.infer<typeof reservationSchema>

interface EditReservationModalProps {
  reservationId: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Helper function to get Polish status label
const getPolishStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Oczekująca',
    'CONFIRMED': 'Potwierdzona',
    'COMPLETED': 'Zakończona',
    'CANCELLED': 'Anulowana',
  }
  return statusMap[status] || status
}

export function EditReservationModal({
  reservationId,
  open,
  onClose,
  onSuccess,
}: EditReservationModalProps) {
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [selectedHallCapacity, setSelectedHallCapacity] = useState(0)
  const [isFormReady, setIsFormReady] = useState(false)
  const [originalStatus, setOriginalStatus] = useState<ReservationStatus>('PENDING')
  const [isSaving, setIsSaving] = useState(false)

  const queryClient = useQueryClient()
  const { data: reservation, isLoading: loadingReservation } = useReservation(reservationId)
  const { data: halls } = useHalls()
  const { data: clientsData } = useClients()
  const { data: eventTypes } = useEventTypes()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      hallId: '',
      clientId: '',
      eventTypeId: '',
      date: '',
      startTime: '',
      endTime: '',
      guests: 0,
      status: 'PENDING',
      notes: '',
    },
  })

  const watchedFields = watch()

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setIsFormReady(false)
      reset()
    }
  }, [open, reset])

  // Load reservation data into form
  useEffect(() => {
    if (reservation && open) {
      console.log('=== Loading reservation into form ===')
      
      // Extract date and time from old or new format
      let date = ''
      let startTime = ''
      let endTime = ''
      
      if (reservation.startDateTime && reservation.endDateTime) {
        const start = new Date(reservation.startDateTime)
        const end = new Date(reservation.endDateTime)
        date = start.toISOString().split('T')[0]
        startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
        endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
      } else if (reservation.date && reservation.startTime && reservation.endTime) {
        date = reservation.date
        startTime = reservation.startTime
        endTime = reservation.endTime
      }
      
      // Store original status
      setOriginalStatus(reservation.status || 'PENDING')
      
      // Set form values
      setValue('hallId', reservation.hallId || '')
      setValue('clientId', reservation.clientId || '')
      setValue('eventTypeId', reservation.eventTypeId || '')
      setValue('date', date)
      setValue('startTime', startTime)
      setValue('endTime', endTime)
      setValue('guests', reservation.guests || 0)
      setValue('status', reservation.status || 'PENDING')
      setValue('notes', reservation.notes || '')
      
      setIsFormReady(true)
    }
  }, [reservation, open, setValue])

  // Calculate price in real-time
  useEffect(() => {
    const { hallId, guests } = watchedFields
    if (hallId && guests) {
      const hallsArray = halls?.data || halls || []
      const selectedHall = hallsArray.find((h) => h.id === hallId)
      if (selectedHall) {
        const price = calculateTotalPrice(guests, selectedHall.pricePerPerson)
        setCalculatedPrice(price)
      }
    }
  }, [watchedFields.hallId, watchedFields.guests, halls])

  // Update capacity when hall changes
  useEffect(() => {
    if (watchedFields.hallId) {
      const hallsArray = halls?.data || halls || []
      const selectedHall = hallsArray.find((h) => h.id === watchedFields.hallId)
      if (selectedHall) {
        setSelectedHallCapacity(selectedHall.capacity)
      }
    }
  }, [watchedFields.hallId, halls])

  const onSubmit = async (data: ReservationFormData) => {
    console.log('Submitting form with data:', data)
    setIsSaving(true)
    
    try {
      // Check if status changed
      const statusChanged = data.status !== originalStatus
      
      // Update reservation details (not status)
      await reservationsApi.update(reservationId, {
        hallId: data.hallId,
        clientId: data.clientId,
        eventTypeId: data.eventTypeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        guests: data.guests,
        notes: data.notes,
        reason: 'Edycja rezerwacji',
      })
      
      // If status changed, update it separately
      if (statusChanged) {
        const oldStatusLabel = getPolishStatusLabel(originalStatus)
        const newStatusLabel = getPolishStatusLabel(data.status)
        console.log('Status changed from', originalStatus, 'to', data.status)
        await reservationsApi.updateStatus(
          reservationId,
          data.status,
          `Zmiana statusu z ${oldStatusLabel} na ${newStatusLabel}`
        )
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservations', reservationId] })
      
      toast.success('Rezerwacja zaktualizowana pomyślnie')
      onSuccess?.()
      onClose() // Close modal after successful save
    } catch (error: any) {
      console.error('Failed to update reservation:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Błąd podczas aktualizacji rezerwacji'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const hallsArray = halls?.data || halls || []
  const clientsArray = clientsData?.data || []
  const eventTypesArray = eventTypes?.data || eventTypes || []

  const hallOptions = [
    { value: '', label: 'Wybierz salę...' },
    ...hallsArray.map((hall) => ({
      value: hall.id,
      label: `${hall.name} (max ${hall.capacity} osób)`,
    }))
  ]

  const clientOptions = [
    { value: '', label: 'Wybierz klienta...' },
    ...clientsArray.map((client) => ({
      value: client.id,
      label: `${client.firstName} ${client.lastName}`,
    }))
  ]

  const eventTypeOptions = [
    { value: '', label: 'Wybierz typ wydarzenia...' },
    ...eventTypesArray.map((type) => ({
      value: type.id,
      label: type.name,
    }))
  ]

  const statusOptions = [
    { value: 'PENDING', label: 'Oczekująca' },
    { value: 'CONFIRMED', label: 'Potwierdzona' },
    { value: 'COMPLETED', label: 'Zakończona' },
    { value: 'CANCELLED', label: 'Anulowana' },
  ]

  if (loadingReservation || !isFormReady) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <Loading size="lg" />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj Rezerwację</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Status Selection */}
          <div>
            <Select
              label="Status Rezerwacji"
              options={statusOptions}
              error={errors.status?.message}
              value={watchedFields.status}
              {...register('status')}
            />
            {watchedFields.status !== originalStatus && (
              <p className="mt-1 text-sm text-amber-600">
                ⚠️ Zmiana statusu: {getPolishStatusLabel(originalStatus)} → {getPolishStatusLabel(watchedFields.status)}
              </p>
            )}
          </div>

          {/* Hall Selection */}
          <div>
            <Select
              label="Sala"
              options={hallOptions}
              error={errors.hallId?.message}
              value={watchedFields.hallId}
              {...register('hallId')}
            />
            {selectedHallCapacity > 0 && (
              <p className="mt-1 text-sm text-secondary-600">
                Maksymalna pojemność: {selectedHallCapacity} osób
              </p>
            )}
          </div>

          {/* Client Selection */}
          <Select
            label="Klient"
            options={clientOptions}
            error={errors.clientId?.message}
            value={watchedFields.clientId}
            {...register('clientId')}
          />

          {/* Event Type */}
          <Select
            label="Typ Wydarzenia"
            options={eventTypeOptions}
            error={errors.eventTypeId?.message}
            value={watchedFields.eventTypeId}
            {...register('eventTypeId')}
          />

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary-500" />
              <Input
                type="date"
                label="Data"
                error={errors.date?.message}
                value={watchedFields.date}
                {...register('date')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" />
              <Input
                type="time"
                label="Od"
                error={errors.startTime?.message}
                value={watchedFields.startTime}
                {...register('startTime')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" />
              <Input
                type="time"
                label="Do"
                error={errors.endTime?.message}
                value={watchedFields.endTime}
                {...register('endTime')}
              />
            </div>
          </div>

          {/* Number of Guests */}
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Liczba Gości"
                placeholder="Wprowadź liczbę gości"
                error={errors.guests?.message}
                value={watchedFields.guests}
                {...register('guests')}
              />
            </div>
            {watchedFields.guests > selectedHallCapacity && selectedHallCapacity > 0 && (
              <p className="mt-1 text-sm text-red-600">
                Liczba gości przekracza pojemność sali!
              </p>
            )}
          </div>

          {/* Price Calculator */}
          {calculatedPrice > 0 && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-secondary-900">Nowa szacowana cena:</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(calculatedPrice)}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary-500" />
              <label className="block text-sm font-medium text-secondary-700">Notatki</label>
            </div>
            <textarea
              className="mt-1 w-full rounded-md border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Dodatkowe informacje..."
              value={watchedFields.notes}
              {...register('notes')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
