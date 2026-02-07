'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateReservation } from '@/hooks/use-reservations'
import { useHalls } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, FileText, UserPlus, AlertCircle, Baby } from 'lucide-react'
import { CreateReservationInput } from '@/types'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import { useQueryClient } from '@tanstack/react-query'

const reservationSchema = z.object({
  hallId: z.string().min(1, 'Wybierz salę'),
  clientId: z.string().min(1, 'Wybierz klienta'),
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  
  // New datetime fields
  startDateTime: z.string().min(1, 'Wybierz datę i czas rozpoczęcia'),
  endDateTime: z.string().min(1, 'Wybierz datę i czas zakończenia'),
  
  // Split guest counts
  adults: z.coerce.number().min(0, 'Liczba dorosłych musi być >= 0'),
  children: z.coerce.number().min(0, 'Liczba dzieci musi być >= 0'),
  
  // Pricing
  pricePerAdult: z.coerce.number().min(0, 'Cena za dorosłego musi być >= 0'),
  pricePerChild: z.coerce.number().min(0, 'Cena za dziecko musi być >= 0'),
  
  // Confirmation deadline
  confirmationDeadline: z.string().optional(),
  
  // Custom event fields
  customEventType: z.string().optional(),
  birthdayAge: z.coerce.number().optional(), // For "Urodziny" event type
  anniversaryYear: z.coerce.number().optional(),
  anniversaryOccasion: z.string().optional(),
  
  notes: z.string().optional(),
  hasDeposit: z.boolean(),
  depositAmount: z.coerce.number().optional(),
  depositDueDate: z.string().optional(),
}).refine((data) => data.adults + data.children >= 1, {
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

interface CreateReservationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateReservationForm({ onSuccess, onCancel }: CreateReservationFormProps) {
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [totalGuests, setTotalGuests] = useState(0)
  const [selectedHallCapacity, setSelectedHallCapacity] = useState(0)
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [selectedEventTypeName, setSelectedEventTypeName] = useState('')
  const [durationHours, setDurationHours] = useState(0)
  
  const queryClient = useQueryClient()
  const { data: halls } = useHalls()
  const { data: clientsData } = useClients()
  const { data: eventTypes } = useEventTypes()
  const createReservation = useCreateReservation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      hasDeposit: false,
      // No default values for adults and children
    },
  })

  const watchedFields = watch()
  const hasDeposit = watch('hasDeposit')
  const adults = watch('adults') || 0
  const children = watch('children') || 0
  const pricePerAdult = watch('pricePerAdult') || 0
  const pricePerChild = watch('pricePerChild') || 0
  const selectedEventTypeId = watch('eventTypeId')
  const startDateTime = watch('startDateTime')

  // Auto-fill end time when start time changes (default: +6 hours)
  useEffect(() => {
    if (startDateTime && !watchedFields.endDateTime) {
      const start = new Date(startDateTime)
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000) // +6 hours
      const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setValue('endDateTime', endStr)
    }
  }, [startDateTime, watchedFields.endDateTime, setValue])

  // Calculate total guests in real-time
  useEffect(() => {
    const total = adults + children
    setTotalGuests(total)
  }, [adults, children])

  // Calculate price in real-time
  useEffect(() => {
    const price = (adults * pricePerAdult) + (children * pricePerChild)
    setCalculatedPrice(price)
  }, [adults, children, pricePerAdult, pricePerChild])

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

  // Auto-fill prices when hall changes
  useEffect(() => {
    if (watchedFields.hallId) {
      const selectedHall = halls?.data?.find((h) => h.id === watchedFields.hallId) || halls?.find((h) => h.id === watchedFields.hallId)
      if (selectedHall) {
        setSelectedHallCapacity(selectedHall.capacity)
        
        // Auto-fill pricePerAdult if not set
        if (!watchedFields.pricePerAdult) {
          setValue('pricePerAdult', selectedHall.pricePerPerson)
        }
        
        // Auto-fill pricePerChild if not set
        if (!watchedFields.pricePerChild) {
          setValue('pricePerChild', selectedHall.pricePerChild || selectedHall.pricePerPerson)
        }
      }
    }
  }, [watchedFields.hallId, halls, setValue, watchedFields.pricePerAdult, watchedFields.pricePerChild])

  // Track selected event type name
  useEffect(() => {
    if (selectedEventTypeId) {
      const eventTypesArray = eventTypes?.data || eventTypes || []
      const selectedType = eventTypesArray.find((t) => t.id === selectedEventTypeId)
      setSelectedEventTypeName(selectedType?.name || '')
    }
  }, [selectedEventTypeId, eventTypes])

  const handleClientCreated = async (newClient: any) => {
    console.log('Client created successfully:', newClient)
    // Invalidate and refetch clients
    await queryClient.invalidateQueries({ queryKey: ['clients'] })
    // Auto-assign newly created client
    setValue('clientId', newClient.id)
    setShowCreateClientModal(false)
  }

  const onSubmit = async (data: ReservationFormData) => {
    const input: CreateReservationInput = {
      hallId: data.hallId,
      clientId: data.clientId,
      eventTypeId: data.eventTypeId,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      adults: data.adults,
      children: data.children,
      pricePerAdult: data.pricePerAdult,
      pricePerChild: data.pricePerChild,
      confirmationDeadline: data.confirmationDeadline,
      customEventType: data.customEventType,
      birthdayAge: data.birthdayAge,
      anniversaryYear: data.anniversaryYear,
      anniversaryOccasion: data.anniversaryOccasion,
      notes: data.notes,
    }

    if (data.hasDeposit && data.depositAmount && data.depositDueDate) {
      input.deposit = {
        amount: data.depositAmount,
        dueDate: data.depositDueDate,
      }
    }

    try {
      await createReservation.mutateAsync(input)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create reservation:', error)
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

  // Check if event is "Urodziny", "Rocznica" or "Inne"
  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica'
  const isCustom = selectedEventTypeName === 'Inne'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Nowa Rezerwacja</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Hall Selection */}
            <div>
              <Select
                label="Sala"
                options={hallOptions}
                error={errors.hallId?.message}
                {...register('hallId')}
              />
              {selectedHallCapacity > 0 && (
                <p className="mt-1 text-sm text-secondary-600">
                  Maksymalna pojemność: {selectedHallCapacity} osób
                </p>
              )}
            </div>

            {/* Client Selection with Add Button */}
            <div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    label="Klient"
                    options={clientOptions}
                    error={errors.clientId?.message}
                    {...register('clientId')}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCreateClientModal(true)}
                    title="Dodaj nowego klienta"
                    className="h-10 w-10"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Event Type */}
            <Select
              label="Typ Wydarzenia"
              options={eventTypeOptions}
              error={errors.eventTypeId?.message}
              {...register('eventTypeId')}
            />

            {/* Birthday Age (for "Urodziny") */}
            {isBirthday && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  type="number"
                  label="Które urodziny"
                  placeholder="np. 18"
                  error={errors.birthdayAge?.message}
                  {...register('birthdayAge')}
                />
              </motion.div>
            )}

            {/* Custom Event Type (for "Inne") */}
            {isCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  label="Typ wydarzenia (własny)"
                  placeholder="np. Spotkanie rodzinne, Impreza firmowa"
                  error={errors.customEventType?.message}
                  {...register('customEventType')}
                />
              </motion.div>
            )}

            {/* Anniversary Fields (for "Rocznica") */}
            {isAnniversary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
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
              </motion.div>
            )}

            {/* Date and Time - New Format */}
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
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > 6 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}
              >
                {durationHours > 6 && <AlertCircle className="w-5 h-5 text-amber-600" />}
                <span className={`text-sm ${durationHours > 6 ? 'text-amber-800' : 'text-blue-800'}`}>
                  Czas trwania: {durationHours}h
                  {durationHours > 6 && ` (${Math.ceil(durationHours - 6)}h ponad standard - ${Math.ceil(durationHours - 6) * 500} PLN dopłaty)`}
                </span>
              </motion.div>
            )}

            {/* Guest Counts - Split by Adults and Children */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary-500" />
                <Input
                  type="number"
                  label="Liczba dorosłych"
                  placeholder=""
                  error={errors.adults?.message}
                  {...register('adults')}
                />
              </div>
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-secondary-500" />
                <Input
                  type="number"
                  label="Liczba dzieci"
                  placeholder=""
                  error={errors.children?.message}
                  {...register('children')}
                />
              </div>
            </div>

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

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  label="Cena za dziecko (PLN)"
                  placeholder="0.00"
                  error={errors.pricePerChild?.message}
                  {...register('pricePerChild')}
                />
              </div>
            </div>

            {/* Price Calculator */}
            {calculatedPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-primary-50 border border-primary-200 rounded-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-secondary-700">
                    <span>Dorośli: {adults} × {pricePerAdult} PLN</span>
                    <span className="font-medium">{adults * pricePerAdult} PLN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-secondary-700">
                    <span>Dzieci: {children} × {pricePerChild} PLN</span>
                    <span className="font-medium">{children * pricePerChild} PLN</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-primary-300">
                    <span className="font-medium text-secondary-900">Cena całkowita:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(calculatedPrice)}
                    </span>
                  </div>
                </div>
              </motion.div>
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

            {/* Deposit */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasDeposit"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  {...register('hasDeposit')}
                />
                <label htmlFor="hasDeposit" className="ml-2 text-sm text-secondary-700">
                  Dodaj zaliczkę
                </label>
              </div>

              {hasDeposit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Input
                    type="number"
                    label="Kwota zaliczki (PLN)"
                    placeholder="0.00"
                    error={errors.depositAmount?.message}
                    {...register('depositAmount')}
                  />
                  <Input
                    type="date"
                    label="Termin płatności"
                    error={errors.depositDueDate?.message}
                    {...register('depositDueDate')}
                  />
                </motion.div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createReservation.isPending}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={createReservation.isPending || (totalGuests > selectedHallCapacity && selectedHallCapacity > 0)}
              >
                {createReservation.isPending ? 'Tworzenie...' : 'Utwórz Rezerwację'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Create Client Modal */}
      <CreateClientModal
        open={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        onSuccess={handleClientCreated}
      />
    </motion.div>
  )
}
