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
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, FileText, AlertCircle, Baby, Lock } from 'lucide-react'
import { ReservationStatus } from '@/types'
import { reservationsApi } from '@/lib/api/reservations'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const reservationSchema = z.object({
  hallId: z.string().min(1, 'Wybierz salę'),
  clientId: z.string().min(1, 'Wybierz klienta'),
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  
  // New datetime fields
  startDateTime: z.string().min(1, 'Wybierz datę i czas rozpoczęcia'),
  endDateTime: z.string().min(1, 'Wybierz datę i czas zakończenia'),
  
  // Split guest counts by age
  adults: z.coerce.number().min(0, 'Liczba dorosłych musi być >= 0'),
  children: z.coerce.number().min(0, 'Liczba dzieci (4-12) musi być >= 0'),
  toddlers: z.coerce.number().min(0, 'Liczba dzieci (0-3) musi być >= 0'),
  
  // Pricing
  pricePerAdult: z.coerce.number().min(0, 'Cena za dorosłego musi być >= 0'),
  pricePerChild: z.coerce.number().min(0, 'Cena za dziecko (4-12) musi być >= 0'),
  pricePerToddler: z.coerce.number().min(0, 'Cena za dziecko (0-3) musi być >= 0'),
  
  // Confirmation deadline
  confirmationDeadline: z.string().optional(),
  
  // Custom event fields
  customEventType: z.string().optional(),
  birthdayAge: z.coerce.number().optional(), // For "Urodziny" event type
  anniversaryYear: z.coerce.number().optional(),
  anniversaryOccasion: z.string().optional(),
  
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
  reason: z.string().min(10, 'Powód musi mieć co najmniej 10 znaków'),
}).refine((data) => data.adults + data.children + data.toddlers >= 1, {
  message: 'Łączna liczba gości musi być >= 1',
  path: ['adults'],
}).refine((data) => {
  const start = new Date(data.startDateTime)
  const end = new Date(data.endDateTime)
  return end > start
}, {
  message: 'Czas zakończenia musi być po czasie rozpoczęcia',
  path: ['endDateTime'],
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
  const [totalGuests, setTotalGuests] = useState(0)
  const [selectedHallCapacity, setSelectedHallCapacity] = useState(0)
  const [isFormReady, setIsFormReady] = useState(false)
  const [originalStatus, setOriginalStatus] = useState<ReservationStatus>('PENDING')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedEventTypeName, setSelectedEventTypeName] = useState('')
  const [durationHours, setDurationHours] = useState(0)
  const [childPriceManuallySet, setChildPriceManuallySet] = useState(false)
  const [toddlerPriceManuallySet, setToddlerPriceManuallySet] = useState(false)

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
      adults: 0,
      children: 0,
      toddlers: 0,
    },
  })

  const watchedFields = watch()
  // Convert to numbers explicitly to prevent string concatenation
  const adults = Number(watch('adults')) || 0
  const children = Number(watch('children')) || 0
  const toddlers = Number(watch('toddlers')) || 0
  const pricePerAdult = Number(watch('pricePerAdult')) || 0
  const pricePerChild = Number(watch('pricePerChild')) || 0
  const pricePerToddler = Number(watch('pricePerToddler')) || 0
  const selectedEventTypeId = watch('eventTypeId')
  const startDateTime = watch('startDateTime')

  // Disable children fields if adults is 0
  const isChildrenFieldsDisabled = adults === 0
  const isChildPriceDisabled = adults === 0 || pricePerAdult === 0
  const isToddlerPriceDisabled = adults === 0 || pricePerAdult === 0

  // Auto-set child price to half of adult price
  useEffect(() => {
    if (adults > 0 && pricePerAdult > 0 && !childPriceManuallySet && isFormReady) {
      const halfPrice = Math.round(pricePerAdult / 2)
      setValue('pricePerChild', halfPrice)
    }
  }, [adults, pricePerAdult, setValue, childPriceManuallySet, isFormReady])

  // ✅ IMPROVED: Auto-set toddler price to 25% of adult price when toddlers added
  useEffect(() => {
    // Auto-calculate only if:
    // 1. Adults and adult price are set
    // 2. User hasn't manually edited toddler price
    // 3. Form is ready
    // 4. Either: toddler price is 0 OR price hasn't been manually set
    if (adults > 0 && pricePerAdult > 0 && isFormReady) {
      // If toddlers > 0 and price is 0, always calculate
      if (toddlers > 0 && pricePerToddler === 0) {
        const quarterPrice = Math.round(pricePerAdult * 0.25)
        setValue('pricePerToddler', quarterPrice)
      }
      // If not manually set and toddlers count changes, recalculate
      else if (!toddlerPriceManuallySet) {
        const quarterPrice = Math.round(pricePerAdult * 0.25)
        setValue('pricePerToddler', quarterPrice)
      }
    }
  }, [adults, pricePerAdult, toddlers, pricePerToddler, setValue, toddlerPriceManuallySet, isFormReady])

  // Auto-fill end time when start time changes (default: +6 hours)
  useEffect(() => {
    if (startDateTime && !watchedFields.endDateTime && isFormReady) {
      const start = new Date(startDateTime)
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000) // +6 hours
      const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setValue('endDateTime', endStr)
    }
  }, [startDateTime, watchedFields.endDateTime, setValue, isFormReady])

  // Calculate total guests in real-time - FIXED: explicitly convert to numbers
  useEffect(() => {
    const total = Number(adults) + Number(children) + Number(toddlers)
    setTotalGuests(total)
  }, [adults, children, toddlers])

  // Calculate price - FIXED: explicitly convert to numbers
  useEffect(() => {
    const price = (Number(adults) * Number(pricePerAdult)) + 
                  (Number(children) * Number(pricePerChild)) + 
                  (Number(toddlers) * Number(pricePerToddler))
    setCalculatedPrice(price)
  }, [adults, children, toddlers, pricePerAdult, pricePerChild, pricePerToddler])

  // Calculate duration and auto-add extra hours note
  useEffect(() => {
    const { startDateTime, endDateTime, notes } = watchedFields
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
      const diffMs = end.getTime() - start.getTime()
      const hours = diffMs / (1000 * 60 * 60)
      const roundedHours = Math.round(hours * 10) / 10
      setDurationHours(roundedHours)
      
      // Auto-add extra hours info to notes if > 6 hours
      if (roundedHours > 6) {
        const extraHours = Math.ceil(roundedHours - 6)
        const extraCost = extraHours * 500
        const extraNote = `\n\n⏰ Dodatkowe godziny: ${extraHours}h × 500 PLN = ${extraCost} PLN`
        
        // Only add if not already present
        if (!notes?.includes('⏰ Dodatkowe godziny')) {
          setValue('notes', (notes || '') + extraNote)
        }
      } else {
        // Remove extra hours note if duration <= 6h
        if (notes?.includes('⏰ Dodatkowe godziny')) {
          const cleanedNotes = notes.replace(/\n\n⏰ Dodatkowe godziny:.*/, '')
          setValue('notes', cleanedNotes)
        }
      }
    }
  }, [watchedFields.startDateTime, watchedFields.endDateTime, watchedFields.notes, setValue])

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

  // Track selected event type name
  useEffect(() => {
    if (selectedEventTypeId) {
      const eventTypesArray = eventTypes?.data || eventTypes || []
      const selectedType = eventTypesArray.find((t) => t.id === selectedEventTypeId)
      setSelectedEventTypeName(selectedType?.name || '')
    }
  }, [selectedEventTypeId, eventTypes])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setIsFormReady(false)
      setChildPriceManuallySet(false)
      setToddlerPriceManuallySet(false)
      reset()
    }
  }, [open, reset])

  // Load reservation data into form
  useEffect(() => {
    if (reservation && open) {
      console.log('=== Loading reservation into form ===')
      console.log('Reservation data:', reservation)
      
      // Extract datetime
      let startDateTime = ''
      let endDateTime = ''
      
      if (reservation.startDateTime && reservation.endDateTime) {
        // Convert to local datetime-local format
        const start = new Date(reservation.startDateTime)
        const end = new Date(reservation.endDateTime)
        startDateTime = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        endDateTime = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      }
      
      // Store original status
      setOriginalStatus(reservation.status || 'PENDING')
      
      // Set form values - NOW LOADS TODDLERS FROM BACKEND
      setValue('hallId', reservation.hallId || '')
      setValue('clientId', reservation.clientId || '')
      setValue('eventTypeId', reservation.eventTypeId || '')
      setValue('startDateTime', startDateTime)
      setValue('endDateTime', endDateTime)
      setValue('adults', reservation.adults || 0)
      setValue('children', reservation.children || 0)
      setValue('toddlers', reservation.toddlers || 0) // ✅ NOW LOADS FROM BACKEND
      setValue('pricePerAdult', Number(reservation.pricePerAdult) || 0)
      setValue('pricePerChild', Number(reservation.pricePerChild) || 0)
      setValue('pricePerToddler', Number(reservation.pricePerToddler) || 0) // ✅ NOW LOADS FROM BACKEND
      
      // ✅ IMPROVED: Only mark as manually set if there are actual values
      // This allows auto-calculation when adding new children/toddlers
      setChildPriceManuallySet(reservation.pricePerChild > 0)
      setToddlerPriceManuallySet(reservation.pricePerToddler > 0 && reservation.toddlers > 0)
      
      // Confirmation deadline - convert to date only
      if (reservation.confirmationDeadline) {
        const deadline = new Date(reservation.confirmationDeadline)
        const dateOnly = deadline.toISOString().split('T')[0]
        setValue('confirmationDeadline', dateOnly)
      } else {
        setValue('confirmationDeadline', '')
      }
      
      setValue('customEventType', reservation.customEventType || '')
      setValue('anniversaryYear', reservation.anniversaryYear || undefined)
      setValue('anniversaryOccasion', reservation.anniversaryOccasion || '')
      setValue('status', reservation.status || 'PENDING')
      setValue('notes', reservation.notes || '')
      setValue('reason', '') // Empty by default - user must provide
      
      setIsFormReady(true)
    }
  }, [reservation, open, setValue])

  const onSubmit = async (data: ReservationFormData) => {
    console.log('=== Submitting form ===')
    console.log('Form data:', data)
    setIsSaving(true)
    
    try {
      // Check if status changed
      const statusChanged = data.status !== originalStatus
      
      // Update reservation details - ✅ NOW SENDS TODDLERS SEPARATELY
      await reservationsApi.update(reservationId, {
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        adults: data.adults,
        children: data.children, // ✅ FIXED: Send children separately
        toddlers: data.toddlers, // ✅ FIXED: Send toddlers separately
        pricePerAdult: data.pricePerAdult,
        pricePerChild: data.pricePerChild,
        pricePerToddler: data.pricePerToddler, // ✅ FIXED: Send toddler price
        confirmationDeadline: data.confirmationDeadline,
        customEventType: data.customEventType,
        anniversaryYear: data.anniversaryYear,
        anniversaryOccasion: data.anniversaryOccasion,
        notes: data.notes,
        reason: data.reason,
      })
      
      console.log('Reservation updated successfully')
      
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
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      await queryClient.invalidateQueries({ queryKey: ['reservations', reservationId] })
      
      if (typeof onSuccess === 'function') {
        try {
          onSuccess()
        } catch (err) {
          console.warn('onSuccess callback error:', err)
        }
      }
      
      toast.success('Rezerwacja zaktualizowana pomyślnie')
      onClose()
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
      label: `${client.firstName} ${client.lastName} ${client.phone ? '(' + client.phone + ')' : ''}`,
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

  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica'
  const isCustom = selectedEventTypeName === 'Inne'

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

          {/* Client Selection - DISABLED */}
          <div>
            <div className="relative">
              <Select
                label="Klient"
                options={clientOptions}
                error={errors.clientId?.message}
                value={watchedFields.clientId}
                disabled={true}
                {...register('clientId')}
              />
              <div className="absolute right-3 top-9 pointer-events-none">
                <Lock className="w-4 h-4 text-secondary-400" />
              </div>
            </div>
            <p className="mt-1 text-xs text-secondary-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Klient nie może być zmieniony po utworzeniu rezerwacji
            </p>
          </div>

          {/* Event Type */}
          <Select
            label="Typ Wydarzenia"
            options={eventTypeOptions}
            error={errors.eventTypeId?.message}
            value={watchedFields.eventTypeId}
            {...register('eventTypeId')}
          />

          {/* Birthday Age (for "Urodziny") */}
          {isBirthday && (
            <Input
              type="number"
              label="Które urodziny"
              placeholder="np. 18"
              error={errors.birthdayAge?.message}
              {...register('birthdayAge')}
            />
          )}

          {/* Custom Event Type (for "Inne") */}
          {isCustom && (
            <Input
              label="Typ wydarzenia (własny)"
              placeholder="np. Spotkanie rodzinne"
              error={errors.customEventType?.message}
              {...register('customEventType')}
            />
          )}

          {/* Anniversary Fields (for "Rocznica") */}
          {isAnniversary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Która rocznica"
                placeholder="np. 25"
                error={errors.anniversaryYear?.message}
                {...register('anniversaryYear')}
              />
              <Input
                label="Jaka okazja"
                placeholder="np. Srebrne wesele"
                error={errors.anniversaryOccasion?.message}
                {...register('anniversaryOccasion')}
              />
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary-500" />
              <Input
                type="datetime-local"
                label="Data i czas rozpoczęcia"
                error={errors.startDateTime?.message}
                {...register('startDateTime')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" />
              <Input
                type="datetime-local"
                label="Data i czas zakończenia"
                error={errors.endDateTime?.message}
                {...register('endDateTime')}
                disabled={!startDateTime}
              />
            </div>
          </div>
          {!startDateTime && (
            <p className="text-xs text-secondary-500 -mt-4">
              Najpierw wybierz datę i czas rozpoczęcia
            </p>
          )}

          {/* Duration Info */}
          {durationHours > 0 && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > 6 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
              {durationHours > 6 && <AlertCircle className="w-5 h-5 text-amber-600" />}
              <span className={`text-sm ${durationHours > 6 ? 'text-amber-800' : 'text-blue-800'}`}>
                Czas trwania: {durationHours}h
                {durationHours > 6 && ` (${Math.ceil(durationHours - 6)}h ponad standard - ${Math.ceil(durationHours - 6) * 500} PLN dopłaty)`}
              </span>
            </div>
          )}

          {/* Guest Counts - UPDATED: Three age groups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Liczba dorosłych"
                placeholder="0"
                error={errors.adults?.message}
                {...register('adults')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Liczba dzieci (4-12)"
                placeholder={isChildrenFieldsDisabled ? 'Najpierw wprowadź liczbę dorosłych' : '0'}
                error={errors.children?.message}
                disabled={isChildrenFieldsDisabled}
                {...register('children')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Liczba dzieci (0-3)"
                placeholder={isChildrenFieldsDisabled ? 'Najpierw wprowadź liczbę dorosłych' : '0'}
                error={errors.toddlers?.message}
                disabled={isChildrenFieldsDisabled}
                {...register('toddlers')}
              />
            </div>
          </div>
          {isChildrenFieldsDisabled && (
            <p className="text-xs text-secondary-500 -mt-4">
              Pola dzieci będą dostępne po wprowadzeniu liczby dorosłych
            </p>
          )}

          {/* Total Guests Display - Always visible if > 0 */}
          {totalGuests > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-secondary-700">Łącznie gości:</span>
              <span className="text-lg font-bold text-secondary-900">{totalGuests}</span>
            </div>
          )}

          {totalGuests > selectedHallCapacity && selectedHallCapacity > 0 && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Liczba gości ({totalGuests}) przekracza pojemność sali ({selectedHallCapacity})!
            </p>
          )}

          {/* Pricing - UPDATED: Three price fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Cena za dorosłego (PLN)"
                placeholder="0.00"
                error={errors.pricePerAdult?.message}
                {...register('pricePerAdult')}
              />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Cena za dziecko 4-12 (PLN)"
                placeholder={isChildPriceDisabled ? 'Najpierw uzupełnij cenę za dorosłego' : '0.00'}
                error={errors.pricePerChild?.message}
                disabled={isChildPriceDisabled}
                {...register('pricePerChild', {
                  onChange: () => setChildPriceManuallySet(true)
                })}
              />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Cena za dziecko 0-3 (PLN)"
                placeholder={isToddlerPriceDisabled ? 'Najpierw uzupełnij cenę za dorosłego' : '0.00'}
                error={errors.pricePerToddler?.message}
                disabled={isToddlerPriceDisabled}
                {...register('pricePerToddler', {
                  onChange: () => setToddlerPriceManuallySet(true)
                })}
              />
            </div>
          </div>
          {(isChildPriceDisabled || isToddlerPriceDisabled) && (
            <p className="text-xs text-secondary-500 -mt-4">
              Ceny za dzieci będą dostępne po uzupełnieniu liczby i ceny za dorosłych (domyślnie 50% i 25% ceny za dorosłego)
            </p>
          )}

          {/* Price Calculator - UPDATED: Three rows */}
          {calculatedPrice > 0 && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-secondary-700">
                  <span>Dorośli: {adults} × {pricePerAdult} PLN</span>
                  <span className="font-medium">{adults * pricePerAdult} PLN</span>
                </div>
                <div className="flex items-center justify-between text-sm text-secondary-700">
                  <span>Dzieci (4-12): {children} × {pricePerChild} PLN</span>
                  <span className="font-medium">{children * pricePerChild} PLN</span>
                </div>
                <div className="flex items-center justify-between text-sm text-secondary-700">
                  <span>Dzieci (0-3): {toddlers} × {pricePerToddler} PLN</span>
                  <span className="font-medium">{toddlers * pricePerToddler} PLN</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-primary-300">
                  <span className="font-medium text-secondary-900">Nowa cena:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(calculatedPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Deadline - DATE ONLY */}
          <div>
            <Input
              type="date"
              label="Termin potwierdzenia (opcjonalnie)"
              error={errors.confirmationDeadline?.message}
              {...register('confirmationDeadline')}
            />
            <p className="mt-1 text-xs text-secondary-500">
              Musi być co najmniej 1 dzień przed rozpoczęciem wydarzenia
            </p>
          </div>

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
              {...register('notes')}
            />
          </div>

          {/* REASON FIELD (REQUIRED) */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Powód zmiany (wymagane, min. 10 znaków)
                </label>
                <textarea
                  className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="np. Klient zmienił liczbę gości po rozmowie telefonicznej"
                  {...register('reason')}
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>
            </div>
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
              disabled={isSaving || (totalGuests > selectedHallCapacity && selectedHallCapacity > 0)}
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
