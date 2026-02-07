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
import { Calendar, Clock, Users, DollarSign, FileText, UserPlus, AlertCircle, Baby, CheckCircle } from 'lucide-react'
import { CreateReservationInput } from '@/types'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import { useQueryClient } from '@tanstack/react-query'

const reservationSchema = z.object({
  hallId: z.string().min(1, 'Wybierz sal\u0119'),
  clientId: z.string().min(1, 'Wybierz klienta'),
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  
  // Split datetime into date and time
  startDate: z.string().min(1, 'Wybierz dat\u0119 rozpocz\u0119cia'),
  startTime: z.string().min(1, 'Wybierz czas rozpocz\u0119cia'),
  endDate: z.string().min(1, 'Wybierz dat\u0119 zako\u0144czenia'),
  endTime: z.string().min(1, 'Wybierz czas zako\u0144czenia'),
  
  // Split guest counts
  adults: z.coerce.number().min(0, 'Liczba doros\u0142ych musi by\u0107 >= 0'),
  children: z.coerce.number().min(0, 'Liczba dzieci musi by\u0107 >= 0'),
  
  // Pricing
  pricePerAdult: z.coerce.number().min(0, 'Cena za doros\u0142ego musi by\u0107 >= 0'),
  pricePerChild: z.coerce.number().min(0, 'Cena za dziecko musi by\u0107 >= 0'),
  
  // Confirmation deadline
  confirmationDeadline: z.string().optional(),
  
  // Custom event fields
  customEventType: z.string().optional(),
  birthdayAge: z.coerce.number().optional(),
  anniversaryYear: z.coerce.number().optional(),
  anniversaryOccasion: z.string().optional(),
  
  notes: z.string().optional(),
  
  // Deposit fields
  hasDeposit: z.boolean(),
  depositAmount: z.coerce.number().optional(),
  depositDueDate: z.string().optional(),
  depositPaid: z.boolean().optional(),
  depositPaymentMethod: z.string().optional(),
  depositPaidAt: z.string().optional(),
}).refine((data) => data.adults + data.children >= 1, {
  message: '\u0141\u0105czna liczba go\u015bci musi by\u0107 >= 1',
  path: ['adults'],
}).refine((data) => {
  const start = new Date(`${data.startDate}T${data.startTime}`)
  const end = new Date(`${data.endDate}T${data.endTime}`)
  return end > start
}, {
  message: 'Czas zako\u0144czenia musi by\u0107 po czasie rozpocz\u0119cia',
  path: ['endTime'],
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
  const [childPriceManuallySet, setChildPriceManuallySet] = useState(false)
  
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
      depositPaid: false,
    },
  })

  const watchedFields = watch()
  const hasDeposit = watch('hasDeposit')
  const depositPaid = watch('depositPaid')
  
  const adults = Number(watch('adults')) || 0
  const children = Number(watch('children')) || 0
  const pricePerAdult = Number(watch('pricePerAdult')) || 0
  const pricePerChild = Number(watch('pricePerChild')) || 0
  const selectedEventTypeId = watch('eventTypeId')
  const startDate = watch('startDate')
  const startTime = watch('startTime')

  // Auto-set child price to half of adult price
  useEffect(() => {
    if (adults > 0 && pricePerAdult > 0 && !childPriceManuallySet) {
      const halfPrice = Math.round(pricePerAdult / 2)
      setValue('pricePerChild', halfPrice)
    }
  }, [adults, pricePerAdult, setValue, childPriceManuallySet])

  // Auto-set default paid date to today when marking as paid
  useEffect(() => {
    if (depositPaid && !watchedFields.depositPaidAt) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      setValue('depositPaidAt', dateStr)
    }
  }, [depositPaid, watchedFields.depositPaidAt, setValue])

  const isChildPriceDisabled = adults === 0 || pricePerAdult === 0

  // Auto-fill end date/time when start date/time changes (default: +6 hours)
  useEffect(() => {
    if (startDate && startTime && !watchedFields.endDate && !watchedFields.endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000)
      
      const endDateStr = end.toISOString().split('T')[0]
      const endTimeStr = end.toTimeString().slice(0, 5)
      
      setValue('endDate', endDateStr)
      setValue('endTime', endTimeStr)
    }
  }, [startDate, startTime, watchedFields.endDate, watchedFields.endTime, setValue])

  // Calculate total guests in real-time
  useEffect(() => {
    const total = Number(adults) + Number(children)
    setTotalGuests(total)
  }, [adults, children])

  // Calculate price in real-time
  useEffect(() => {
    const price = (Number(adults) * Number(pricePerAdult)) + (Number(children) * Number(pricePerChild))
    setCalculatedPrice(price)
  }, [adults, children, pricePerAdult, pricePerChild])

  // Calculate duration and auto-add extra hours note
  useEffect(() => {
    const { startDate, startTime, endDate, endTime, notes } = watchedFields
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      const diffMs = end.getTime() - start.getTime()
      const hours = diffMs / (1000 * 60 * 60)
      const roundedHours = Math.round(hours * 10) / 10
      setDurationHours(roundedHours)
      
      if (roundedHours > 6) {
        const extraHours = Math.ceil(roundedHours - 6)
        const extraCost = extraHours * 500
        const extraNote = `\n\n\u23f0 Dodatkowe godziny: ${extraHours}h \u00d7 500 PLN = ${extraCost} PLN`
        
        if (!notes?.includes('\u23f0 Dodatkowe godziny')) {
          setValue('notes', (notes || '') + extraNote)
        }
      } else {
        if (notes?.includes('\u23f0 Dodatkowe godziny')) {
          const cleanedNotes = notes.replace(/\n\n\u23f0 Dodatkowe godziny:.*/, '')
          setValue('notes', cleanedNotes)
        }
      }
    }
  }, [watchedFields.startDate, watchedFields.startTime, watchedFields.endDate, watchedFields.endTime, watchedFields.notes, setValue])

  // Auto-fill prices when hall changes
  useEffect(() => {
    if (watchedFields.hallId) {
      const selectedHall = halls?.data?.find((h) => h.id === watchedFields.hallId) || halls?.find((h) => h.id === watchedFields.hallId)
      if (selectedHall) {
        setSelectedHallCapacity(selectedHall.capacity)
        
        if (!watchedFields.pricePerAdult) {
          setValue('pricePerAdult', selectedHall.pricePerPerson)
        }
      }
    }
  }, [watchedFields.hallId, halls, setValue, watchedFields.pricePerAdult])

  // Track selected event type name
  useEffect(() => {
    if (selectedEventTypeId) {
      const eventTypesArray = eventTypes?.data || eventTypes || []
      const selectedType = eventTypesArray.find((t) => t.id === selectedEventTypeId)
      setSelectedEventTypeName(selectedType?.name || '')
    }
  }, [selectedEventTypeId, eventTypes])

  const handleClientCreated = async (newClient: any) => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] })
    setValue('clientId', newClient.id)
    setShowCreateClientModal(false)
  }

  const onSubmit = async (data: ReservationFormData) => {
    // Combine date and time into ISO datetime
    const startDateTime = `${data.startDate}T${data.startTime}`
    const endDateTime = `${data.endDate}T${data.endTime}`
    
    const input: CreateReservationInput = {
      hallId: data.hallId,
      clientId: data.clientId,
      eventTypeId: data.eventTypeId,
      startDateTime,
      endDateTime,
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
        paid: data.depositPaid || false,
        paymentMethod: data.depositPaid ? data.depositPaymentMethod : undefined,
        paidAt: data.depositPaid ? data.depositPaidAt : undefined,
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
    { value: '', label: 'Wybierz sal\u0119...' },
    ...hallsArray.map((hall) => ({
      value: hall.id,
      label: `${hall.name} (max ${hall.capacity} os\u00f3b)`,
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

  const paymentMethodOptions = [
    { value: '', label: 'Wybierz metod\u0119 p\u0142atno\u015bci...' },
    { value: 'CASH', label: 'Got\u00f3wka' },
    { value: 'TRANSFER', label: 'Przelew' },
    { value: 'BLIK', label: 'BLIK' },
  ]

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
            <div>
              <Select
                label="Sala"
                options={hallOptions}
                error={errors.hallId?.message}
                {...register('hallId')}
              />
              {selectedHallCapacity > 0 && (
                <p className="mt-1 text-sm text-secondary-600">
                  Maksymalna pojemno\u015b\u0107: {selectedHallCapacity} os\u00f3b
                </p>
              )}
            </div>

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

            <Select
              label="Typ Wydarzenia"
              options={eventTypeOptions}
              error={errors.eventTypeId?.message}
              {...register('eventTypeId')}
            />

            {isBirthday && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  type="number"
                  label="Kt\u00f3re urodziny"
                  placeholder="np. 18"
                  error={errors.birthdayAge?.message}
                  {...register('birthdayAge')}
                />
              </motion.div>
            )}

            {isCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  label="Typ wydarzenia (w\u0142asny)"
                  placeholder="np. Spotkanie rodzinne, Impreza firmowa"
                  error={errors.customEventType?.message}
                  {...register('customEventType')}
                />
              </motion.div>
            )}

            {isAnniversary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Input
                  type="number"
                  label="Kt\u00f3ra rocznica"
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

            {/* UPDATED: Separate date and time fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Data i czas rozpocz\u0119cia
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <Input
                        type="date"
                        error={errors.startDate?.message}
                        {...register('startDate')}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <Input
                        type="time"
                        placeholder="16:00"
                        error={errors.startTime?.message}
                        {...register('startTime')}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Data i czas zako\u0144czenia
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <Input
                        type="date"
                        error={errors.endDate?.message}
                        {...register('endDate')}
                        disabled={!startDate}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                      <Input
                        type="time"
                        placeholder="22:00"
                        error={errors.endTime?.message}
                        {...register('endTime')}
                        disabled={!startDate || !startTime}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {(!startDate || !startTime) && (
                <p className="text-xs text-secondary-500">
                  Najpierw wybierz dat\u0119 i czas rozpocz\u0119cia
                </p>
              )}
            </div>

            {durationHours > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > 6 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}
              >
                {durationHours > 6 && <AlertCircle className="w-5 h-5 text-amber-600" />}
                <span className={`text-sm ${durationHours > 6 ? 'text-amber-800' : 'text-blue-800'}`}>
                  Czas trwania: {durationHours}h
                  {durationHours > 6 && ` (${Math.ceil(durationHours - 6)}h ponad standard - ${Math.ceil(durationHours - 6) * 500} PLN dop\u0142aty)`}
                </span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary-500" />
                <Input
                  type="number"
                  label="Liczba doros\u0142ych"
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

            {totalGuests > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-secondary-700">\u0141\u0105cznie go\u015bci:</span>
                <span className="text-lg font-bold text-secondary-900">{totalGuests}</span>
              </div>
            )}

            {totalGuests > selectedHallCapacity && selectedHallCapacity > 0 && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Liczba go\u015bci ({totalGuests}) przekracza pojemno\u015b\u0107 sali ({selectedHallCapacity})!
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-secondary-500" />
                <Input
                  type="number"
                  label="Cena za doros\u0142ego (PLN)"
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
                  placeholder={isChildPriceDisabled ? 'Najpierw uzupe\u0142nij cen\u0119 za doros\u0142ego' : '0.00'}
                  error={errors.pricePerChild?.message}
                  disabled={isChildPriceDisabled}
                  {...register('pricePerChild', {
                    onChange: () => setChildPriceManuallySet(true)
                  })}
                />
              </div>
            </div>
            {isChildPriceDisabled && (
              <p className="text-xs text-secondary-500 -mt-4">
                Cena za dziecko b\u0119dzie dost\u0119pna po uzupe\u0142nieniu liczby i ceny za doros\u0142ych (domy\u015blnie po\u0142owa ceny za doros\u0142ego)
              </p>
            )}

            {calculatedPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-primary-50 border border-primary-200 rounded-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-secondary-700">
                    <span>Doro\u015bli: {adults} \u00d7 {pricePerAdult} PLN</span>
                    <span className="font-medium">{adults * pricePerAdult} PLN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-secondary-700">
                    <span>Dzieci: {children} \u00d7 {pricePerChild} PLN</span>
                    <span className="font-medium">{children * pricePerChild} PLN</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-primary-300">
                    <span className="font-medium text-secondary-900">Cena ca\u0142kowita:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(calculatedPrice)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <Input
                type="date"
                label="Termin potwierdzenia (opcjonalnie)"
                error={errors.confirmationDeadline?.message}
                {...register('confirmationDeadline')}
              />
              <p className="mt-1 text-xs text-secondary-500">
                Musi by\u0107 co najmniej 1 dzie\u0144 przed rozpocz\u0119ciem wydarzenia
              </p>
            </div>

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

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasDeposit"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  {...register('hasDeposit')}
                />
                <label htmlFor="hasDeposit" className="ml-2 text-sm font-medium text-secondary-700">
                  Dodaj zaliczk\u0119
                </label>
              </div>

              {hasDeposit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Kwota zaliczki (PLN)"
                      placeholder="0.00"
                      error={errors.depositAmount?.message}
                      {...register('depositAmount')}
                    />
                    <Input
                      type="date"
                      label="Termin p\u0142atno\u015bci"
                      error={errors.depositDueDate?.message}
                      {...register('depositDueDate')}
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="depositPaid"
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        {...register('depositPaid')}
                      />
                      <label htmlFor="depositPaid" className="ml-2 text-sm font-medium text-secondary-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Zaliczka zosta\u0142a ju\u017c zap\u0142acona
                      </label>
                    </div>

                    {depositPaid && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-3 rounded border border-green-200"
                      >
                        <Select
                          label="Spos\u00f3b p\u0142atno\u015bci"
                          options={paymentMethodOptions}
                          error={errors.depositPaymentMethod?.message}
                          {...register('depositPaymentMethod')}
                        />
                        <Input
                          type="date"
                          label="Data p\u0142atno\u015bci"
                          error={errors.depositPaidAt?.message}
                          {...register('depositPaidAt')}
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

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
                {createReservation.isPending ? 'Tworzenie...' : 'Utw\u00f3rz Rezerwacj\u0119'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <CreateClientModal
        open={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        onSuccess={handleClientCreated}
      />
    </motion.div>
  )
}
