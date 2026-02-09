'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectSimple } from '@/components/ui/select-simple'
import { SelectField } from '@/components/form/select-field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateReservation } from '@/hooks/use-reservations'
import { useHalls } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, FileText, UserPlus, AlertCircle, Baby, CheckCircle, Smile } from 'lucide-react'
import { CreateReservationInput } from '@/types'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import { useQueryClient } from '@tanstack/react-query'

const reservationSchema = z.object({
  hallId: z.string().min(1, 'Wybierz salę'),
  clientId: z.string().min(1, 'Wybierz klienta'),
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  
  // Split datetime into date and time
  startDate: z.string().min(1, 'Wybierz datę rozpoczęcia'),
  startTime: z.string().min(1, 'Wybierz czas rozpoczęcia'),
  endDate: z.string().min(1, 'Wybierz datę zakończenia'),
  endTime: z.string().min(1, 'Wybierz czas zakończenia'),
  
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
}).refine((data) => data.adults + data.children + data.toddlers >= 1, {
  message: 'Łączna liczba gości musi być >= 1',
  path: ['adults'],
}).refine((data) => {
  const start = new Date(`${data.startDate}T${data.startTime}`)
  const end = new Date(`${data.endDate}T${data.endTime}`)
  return end > start
}, {
  message: 'Czas zakończenia musi być po czasie rozpoczęcia',
  path: ['endTime'],
})

type ReservationFormData = z.infer<typeof reservationSchema>

interface CreateReservationFormProps {
  onSubmit?: (data: any) => void | Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<ReservationFormData>
  isPromotingFromQueue?: boolean
}

export function CreateReservationForm({ 
  onSubmit: onSubmitProp, 
  onSuccess, 
  onCancel,
  initialData,
  isPromotingFromQueue = false
}: CreateReservationFormProps) {
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [totalGuests, setTotalGuests] = useState(0)
  const [selectedHallCapacity, setSelectedHallCapacity] = useState(0)
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [durationHours, setDurationHours] = useState(0)
  const [childPriceManuallySet, setChildPriceManuallySet] = useState(false)
  const [toddlerPriceManuallySet, setToddlerPriceManuallySet] = useState(false)
  
  const queryClient = useQueryClient()
  const { data: halls, isLoading: hallsLoading, error: hallsError } = useHalls()
  const { data: clientsData, isLoading: clientsLoading } = useClients()
  const { data: eventTypes, isLoading: eventTypesLoading, error: eventTypesError } = useEventTypes()
  const createReservation = useCreateReservation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      hasDeposit: false,
      depositPaid: false,
      adults: 0,
      children: 0,
      toddlers: 0,
      ...initialData,
    },
  })

  const watchedFields = watch()
  const hasDeposit = watch('hasDeposit')
  const depositPaid = watch('depositPaid')
  
  const adults = Number(watch('adults')) || 0
  const children = Number(watch('children')) || 0
  const toddlers = Number(watch('toddlers')) || 0
  const pricePerAdult = Number(watch('pricePerAdult')) || 0
  const pricePerChild = Number(watch('pricePerChild')) || 0
  const pricePerToddler = Number(watch('pricePerToddler')) || 0
  const selectedEventTypeId = watch('eventTypeId')
  const startDate = watch('startDate')
  const startTime = watch('startTime')

  // ✅ OPTIMIZED: Calculate selected event type name directly instead of useEffect
  // This ensures immediate rendering of conditional fields
  const selectedEventTypeName = useMemo(() => {
    if (!selectedEventTypeId) return ''
    const eventTypesArray = eventTypes?.data || eventTypes || []
    const selectedType = eventTypesArray.find((t) => t.id === selectedEventTypeId)
    return selectedType?.name || ''
  }, [selectedEventTypeId, eventTypes])

  // ✅ BUGFIX 2026-02-07: Support both "Rocznica" and "Rocznica/Jubileusz" naming variations
  // Calculate conditions immediately without useEffect delay
  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica' || selectedEventTypeName === 'Rocznica/Jubileusz'
  const isCustom = selectedEventTypeName === 'Inne'

  // Auto-set child price to half of adult price
  useEffect(() => {
    if (adults > 0 && pricePerAdult > 0 && !childPriceManuallySet) {
      const halfPrice = Math.round(pricePerAdult / 2)
      setValue('pricePerChild', halfPrice)
    }
  }, [adults, pricePerAdult, setValue, childPriceManuallySet])

  // Auto-set toddler price to 25% of adult price
  useEffect(() => {
    if (adults > 0 && pricePerAdult > 0 && !toddlerPriceManuallySet) {
      const quarterPrice = Math.round(pricePerAdult * 0.25)
      setValue('pricePerToddler', quarterPrice)
    }
  }, [adults, pricePerAdult, setValue, toddlerPriceManuallySet])

  // Auto-set default paid date to today when marking as paid
  useEffect(() => {
    if (depositPaid && !watchedFields.depositPaidAt) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      setValue('depositPaidAt', dateStr)
    }
  }, [depositPaid, watchedFields.depositPaidAt, setValue])

  // Disable children fields if adults is 0
  const isChildrenFieldsDisabled = adults === 0
  const isChildPriceDisabled = adults === 0 || pricePerAdult === 0
  const isToddlerPriceDisabled = adults === 0 || pricePerAdult === 0

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
    const total = Number(adults) + Number(children) + Number(toddlers)
    setTotalGuests(total)
  }, [adults, children, toddlers])

  // Calculate price in real-time
  useEffect(() => {
    const price = (Number(adults) * Number(pricePerAdult)) + 
                  (Number(children) * Number(pricePerChild)) + 
                  (Number(toddlers) * Number(pricePerToddler))
    setCalculatedPrice(price)
  }, [adults, children, toddlers, pricePerAdult, pricePerChild, pricePerToddler])

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
        const extraNote = `\n\n⏰ Dodatkowe godziny: ${extraHours}h × 500 PLN = ${extraCost} PLN`
        
        if (!notes?.includes('⏰ Dodatkowe godziny')) {
          setValue('notes', (notes || '') + extraNote)
        }
      } else {
        if (notes?.includes('⏰ Dodatkowe godziny')) {
          const cleanedNotes = notes.replace(/\n\n⏰ Dodatkowe godziny:.*/, '')
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

  const handleClientCreated = async (newClient: any) => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] })
    setValue('clientId', newClient.id)
    setShowCreateClientModal(false)
  }

  const onSubmit = async (data: ReservationFormData) => {
    // Combine date and time into ISO datetime
    const startDateTime = `${data.startDate}T${data.startTime}`
    const endDateTime = `${data.endDate}T${data.endTime}`
    
    const input: CreateReservationInput | any = {
      hallId: data.hallId,
      clientId: data.clientId,
      eventTypeId: data.eventTypeId,
      startDateTime,
      endDateTime,
      adults: data.adults,
      children: data.children,
      toddlers: data.toddlers,
      pricePerAdult: data.pricePerAdult,
      pricePerChild: data.pricePerChild,
      pricePerToddler: data.pricePerToddler,
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
      // If custom onSubmit provided (e.g. from promote modal), use it
      if (onSubmitProp) {
        await onSubmitProp(input)
      } else {
        await createReservation.mutateAsync(input)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create reservation:', error)
    }
  }

  const hallsArray = halls?.data || halls || []
  const clientsArray = clientsData?.data || []
  const eventTypesArray = eventTypes?.data || eventTypes || []

  console.log('🏢 Halls array length:', hallsArray.length)
  console.log('🎉 EventTypes array length:', eventTypesArray.length)

  // ✅ HYBRID APPROACH: Native Select options (includes empty placeholder)
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

  // SelectField options (no empty value - Radix UI doesn't support it)
  const paymentMethodOptions = [
    { value: 'CASH', label: 'Gotówka' },
    { value: 'TRANSFER', label: 'Przelew' },
    { value: 'BLIK', label: 'BLIK' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        {!isPromotingFromQueue && (
          <CardHeader>
            <CardTitle>Nowa Rezerwacja</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          {/* 🔍 DEBUG INFO */}
          {(hallsLoading || eventTypesLoading) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">⏳ Ładowanie danych...</p>
              {hallsLoading && <p className="text-xs text-blue-600">• Ładowanie sal...</p>}
              {eventTypesLoading && <p className="text-xs text-blue-600">• Ładowanie typów wydarzeń...</p>}
            </div>
          )}
          
          {(hallsError || eventTypesError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800">❌ Błąd ładowania danych</p>
              {hallsError && <p className="text-xs text-red-600">• Sale: {String(hallsError)}</p>}
              {eventTypesError && <p className="text-xs text-red-600">• Typy wydarzeń: {String(eventTypesError)}</p>}
            </div>
          )}

          {hallsArray.length === 0 && !hallsLoading && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">⚠️ Brak sal w bazie danych</p>
            </div>
          )}

          {eventTypesArray.length === 0 && !eventTypesLoading && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">⚠️ Brak typów wydarzeń w bazie danych</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ✅ CRITICAL: Native Select for hallId */}
            <SelectSimple
              label="Sala"
              options={hallOptions}
              error={errors.hallId?.message}
              {...register('hallId')}
            />
            {selectedHallCapacity > 0 && (
              <p className="-mt-4 text-sm text-secondary-600">
                Maksymalna pojemność: {selectedHallCapacity} osób
              </p>
            )}

            <div>
              <div className="flex gap-2">
                <div className="flex-1">
                  {/* ✅ CRITICAL: Native Select for clientId */}
                  <SelectSimple
                    label="Klient"
                    options={clientOptions}
                    error={errors.clientId?.message}
                    disabled={isPromotingFromQueue}
                    {...register('clientId')}
                  />
                  {isPromotingFromQueue && (
                    <p className="mt-1 text-xs text-blue-600">
                      Klient przekazany z kolejki rezerwacji
                    </p>
                  )}
                </div>
                {!isPromotingFromQueue && (
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
                )}
              </div>
            </div>

            {/* ✅ CRITICAL: Native Select for eventTypeId (drives conditional logic) */}
            <SelectSimple
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
                  label="Które urodziny"
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
                  label="Typ wydarzenia (własny)"
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Data i czas rozpoczęcia
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
                    Data i czas zakończenia
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
                  Najpierw wybierz datę i czas rozpoczęcia
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
                  {durationHours > 6 && ` (${Math.ceil(durationHours - 6)}h ponad standard - ${Math.ceil(durationHours - 6) * 500} PLN dopłaty)`}
                </span>
              </motion.div>
            )}

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
                <Smile className="w-5 h-5 text-blue-600" />
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
                <Baby className="w-5 h-5 text-green-600" />
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
                    <span>Dzieci (4-12): {children} × {pricePerChild} PLN</span>
                    <span className="font-medium">{children * pricePerChild} PLN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-secondary-700">
                    <span>Dzieci (0-3): {toddlers} × {pricePerToddler} PLN</span>
                    <span className="font-medium">{toddlers * pricePerToddler} PLN</span>
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
                  Dodaj zaliczkę
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
                      label="Termin płatności"
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
                        Zaliczka została już zapłacona
                      </label>
                    </div>

                    {depositPaid && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-3 rounded border border-green-200"
                      >
                        {/* ✨ NON-CRITICAL: Keep SelectField for better UX */}
                        <Controller
                          name="depositPaymentMethod"
                          control={control}
                          render={({ field }) => (
                            <SelectField
                              label="Sposób płatności"
                              placeholder="Wybierz metodę płatności..."
                              options={paymentMethodOptions}
                              error={errors.depositPaymentMethod?.message}
                              {...field}
                            />
                          )}
                        />
                        <Input
                          type="date"
                          label="Data płatności"
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
                {createReservation.isPending ? 'Tworzenie...' : isPromotingFromQueue ? 'Awansuj do rezerwacji' : 'Utwórz Rezerwację'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!isPromotingFromQueue && (
        <CreateClientModal
          open={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          onSuccess={handleClientCreated}
        />
      )}
    </motion.div>
  )
}
