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
import { calculateTotalPrice, formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, FileText } from 'lucide-react'
import { CreateReservationInput } from '@/types'

const reservationSchema = z.object({
  hallId: z.string().min(1, 'Wybierz salę'),
  clientId: z.string().min(1, 'Wybierz klienta'),
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  date: z.string().min(1, 'Wybierz datę'),
  startTime: z.string().min(1, 'Wybierz czas rozpoczęcia'),
  endTime: z.string().min(1, 'Wybierz czas zakończenia'),
  guests: z.coerce.number().min(1, 'Liczba gości musi być większa od 0'),
  notes: z.string().optional(),
  hasDeposit: z.boolean(),
  depositAmount: z.coerce.number().optional(),
  depositDueDate: z.string().optional(),
})

type ReservationFormData = z.infer<typeof reservationSchema>

interface CreateReservationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateReservationForm({ onSuccess, onCancel }: CreateReservationFormProps) {
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [selectedHallCapacity, setSelectedHallCapacity] = useState(0)
  
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
    },
  })

  const watchedFields = watch()
  const hasDeposit = watch('hasDeposit')

  // Calculate price in real-time
  useEffect(() => {
    const { hallId, guests } = watchedFields
    if (hallId && guests) {
      const selectedHall = halls?.find((h) => h.id === hallId)
      if (selectedHall) {
        const price = calculateTotalPrice(guests, selectedHall.pricePerPerson)
        setCalculatedPrice(price)
      }
    }
  }, [watchedFields.hallId, watchedFields.guests, halls])

  // Update capacity when hall changes
  useEffect(() => {
    if (watchedFields.hallId) {
      const selectedHall = halls?.find((h) => h.id === watchedFields.hallId)
      if (selectedHall) {
        setSelectedHallCapacity(selectedHall.capacity)
      }
    }
  }, [watchedFields.hallId, halls])

  const onSubmit = async (data: ReservationFormData) => {
    const input: CreateReservationInput = {
      hallId: data.hallId,
      clientId: data.clientId,
      eventTypeId: data.eventTypeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      guests: data.guests,
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

  const hallOptions = halls?.map((hall) => ({
    value: hall.id,
    label: `${hall.name} (max ${hall.capacity} osób)`,
  })) || [{ value: '', label: 'Wybierz salę...' }]

  const clientOptions = clientsData?.data?.map((client) => ({
    value: client.id,
    label: `${client.firstName} ${client.lastName}`,
  })) || [{ value: '', label: 'Wybierz klienta...' }]

  const eventTypeOptions = eventTypes?.map((type) => ({
    value: type.id,
    label: type.name,
  })) || [{ value: '', label: 'Wybierz typ wydarzenia...' }]

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

            {/* Client Selection */}
            <Select
              label="Klient"
              options={clientOptions}
              error={errors.clientId?.message}
              {...register('clientId')}
            />

            {/* Event Type */}
            <Select
              label="Typ Wydarzenia"
              options={eventTypeOptions}
              error={errors.eventTypeId?.message}
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
                  {...register('date')}
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary-500" />
                <Input
                  type="time"
                  label="Od"
                  error={errors.startTime?.message}
                  {...register('startTime')}
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary-500" />
                <Input
                  type="time"
                  label="Do"
                  error={errors.endTime?.message}
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
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-primary-50 border border-primary-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                    <span className="font-medium text-secondary-900">Szacowana cena:</span>
                  </div>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(calculatedPrice)}
                  </span>
                </div>
              </motion.div>
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
                disabled={createReservation.isPending}
              >
                {createReservation.isPending ? 'Tworzenie...' : 'Utwórz Rezerwację'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
