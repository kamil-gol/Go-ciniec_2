'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { SelectField } from '@/components/form/select-field'
import { Loading } from '@/components/ui/loading'
import { useReservation } from '@/hooks/use-reservations'
import { useHalls } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, FileText, AlertCircle, Baby, Lock, Smile, User, Mail, Phone, CheckCircle } from 'lucide-react'
import { ReservationStatus } from '@/types'
import { reservationsApi } from '@/lib/api/reservations'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'

const reservationSchema = z.object({
  hallId: z.string().min(1, 'Wybierz sal\u0119'),
  clientId: z.string().min(1, 'Wybierz klienta'),
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  
  startDateTime: z.string().min(1, 'Wybierz dat\u0119 i czas rozpocz\u0119cia'),
  endDateTime: z.string().min(1, 'Wybierz dat\u0119 i czas zako\u0144czenia'),
  
  adults: z.coerce.number().min(0, 'Liczba doros\u0142ych musi by\u0107 >= 0'),
  children: z.coerce.number().min(0, 'Liczba dzieci (4-12) musi by\u0107 >= 0'),
  toddlers: z.coerce.number().min(0, 'Liczba dzieci (0-3) musi by\u0107 >= 0'),
  
  pricePerAdult: z.coerce.number().min(0, 'Cena za doros\u0142ego musi by\u0107 >= 0'),
  pricePerChild: z.coerce.number().min(0, 'Cena za dziecko (4-12) musi by\u0107 >= 0'),
  pricePerToddler: z.coerce.number().min(0, 'Cena za dziecko (0-3) musi by\u0107 >= 0'),
  
  confirmationDeadline: z.string().optional(),
  
  customEventType: z.string().optional(),
  birthdayAge: z.coerce.number().optional(),
  anniversaryYear: z.coerce.number().optional(),
  anniversaryOccasion: z.string().optional(),
  
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
  reason: z.string().min(10, 'Pow\u00f3d musi mie\u0107 co najmniej 10 znak\u00f3w'),
  
  // Deposit fields
  hasDeposit: z.boolean(),
  depositAmount: z.coerce.number().optional(),
  depositDueDate: z.string().optional(),
  depositPaid: z.boolean().optional(),
  depositPaymentMethod: z.string().optional(),
  depositPaidAt: z.string().optional(),
}).refine((data) => data.adults + data.children + data.toddlers >= 1, {
  message: '\u0141\u0105czna liczba go\u015bci musi by\u0107 >= 1',
  path: ['adults'],
}).refine((data) => {
  const start = new Date(data.startDateTime)
  const end = new Date(data.endDateTime)
  return end > start
}, {
  message: 'Czas zako\u0144czenia musi by\u0107 po czasie rozpocz\u0119cia',
  path: ['endDateTime'],
})

type ReservationFormData = z.infer<typeof reservationSchema>

interface EditReservationModalProps {
  reservationId: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const getPolishStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Oczekuj\u0105ca',
    'CONFIRMED': 'Potwierdzona',
    'COMPLETED': 'Zako\u0144czona',
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
    control,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      adults: 0,
      children: 0,
      toddlers: 0,
      hasDeposit: false,
      depositPaid: false,
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
  const startDateTime = watch('startDateTime')

  const isChildrenFieldsDisabled = adults === 0
  const isChildPriceDisabled = adults === 0 || pricePerAdult === 0
  const isToddlerPriceDisabled = adults === 0 || pricePerAdult === 0

  // Auto-set default paid date to today when marking as paid
  useEffect(() => {
    if (depositPaid && !watchedFields.depositPaidAt) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      setValue('depositPaidAt', dateStr)
    }
  }, [depositPaid, watchedFields.depositPaidAt, setValue])

  useEffect(() => {
    if (adults > 0 && pricePerAdult > 0 && !childPriceManuallySet && isFormReady) {
      const halfPrice = Math.round(pricePerAdult / 2)
      setValue('pricePerChild', halfPrice)
    }
  }, [adults, pricePerAdult, setValue, childPriceManuallySet, isFormReady])

  useEffect(() => {
    if (adults > 0 && pricePerAdult > 0 && isFormReady) {
      if (toddlers > 0 && pricePerToddler === 0) {
        const quarterPrice = Math.round(pricePerAdult * 0.25)
        setValue('pricePerToddler', quarterPrice)
      }
      else if (!toddlerPriceManuallySet) {
        const quarterPrice = Math.round(pricePerAdult * 0.25)
        setValue('pricePerToddler', quarterPrice)
      }
    }
  }, [adults, pricePerAdult, toddlers, pricePerToddler, setValue, toddlerPriceManuallySet, isFormReady])

  useEffect(() => {
    if (startDateTime && !watchedFields.endDateTime && isFormReady) {
      const start = new Date(startDateTime)
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000)
      const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setValue('endDateTime', endStr)
    }
  }, [startDateTime, watchedFields.endDateTime, setValue, isFormReady])

  useEffect(() => {
    const total = Number(adults) + Number(children) + Number(toddlers)
    setTotalGuests(total)
  }, [adults, children, toddlers])

  useEffect(() => {
    const price = (Number(adults) * Number(pricePerAdult)) + 
                  (Number(children) * Number(pricePerChild)) + 
                  (Number(toddlers) * Number(pricePerToddler))
    setCalculatedPrice(price)
  }, [adults, children, toddlers, pricePerAdult, pricePerChild, pricePerToddler])

  useEffect(() => {
    const { startDateTime, endDateTime, notes } = watchedFields
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
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
  }, [watchedFields.startDateTime, watchedFields.endDateTime, watchedFields.notes, setValue])

  useEffect(() => {
    if (watchedFields.hallId) {
      const hallsArray = halls?.data || halls || []
      const selectedHall = hallsArray.find((h) => h.id === watchedFields.hallId)
      if (selectedHall) {
        setSelectedHallCapacity(selectedHall.capacity)
      }
    }
  }, [watchedFields.hallId, halls])

  useEffect(() => {
    if (selectedEventTypeId) {
      const eventTypesArray = eventTypes?.data || eventTypes || []
      const selectedType = eventTypesArray.find((t) => t.id === selectedEventTypeId)
      setSelectedEventTypeName(selectedType?.name || '')
    }
  }, [selectedEventTypeId, eventTypes])

  useEffect(() => {
    if (!open) {
      setIsFormReady(false)
      setChildPriceManuallySet(false)
      setToddlerPriceManuallySet(false)
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    if (reservation && open) {
      console.log('=== Loading reservation into form ===')
      console.log('Reservation data:', reservation)
      
      let startDateTime = ''
      let endDateTime = ''
      
      if (reservation.startDateTime && reservation.endDateTime) {
        const start = new Date(reservation.startDateTime)
        const end = new Date(reservation.endDateTime)
        startDateTime = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        endDateTime = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      }
      
      setOriginalStatus(reservation.status || 'PENDING')
      
      setValue('hallId', reservation.hallId || '')
      setValue('clientId', reservation.clientId || '')
      setValue('eventTypeId', reservation.eventTypeId || '')
      setValue('startDateTime', startDateTime)
      setValue('endDateTime', endDateTime)
      setValue('adults', reservation.adults || 0)
      setValue('children', reservation.children || 0)
      setValue('toddlers', reservation.toddlers || 0)
      setValue('pricePerAdult', Number(reservation.pricePerAdult) || 0)
      setValue('pricePerChild', Number(reservation.pricePerChild) || 0)
      setValue('pricePerToddler', Number(reservation.pricePerToddler) || 0)
      
      setChildPriceManuallySet(reservation.pricePerChild > 0)
      setToddlerPriceManuallySet(reservation.pricePerToddler > 0 && reservation.toddlers > 0)
      
      if (reservation.confirmationDeadline) {
        const deadline = new Date(reservation.confirmationDeadline)
        const dateOnly = deadline.toISOString().split('T')[0]
        setValue('confirmationDeadline', dateOnly)
      } else {
        setValue('confirmationDeadline', '')
      }
      
      setValue('customEventType', reservation.customEventType || '')
      setValue('birthdayAge', reservation.birthdayAge || undefined)
      setValue('anniversaryYear', reservation.anniversaryYear || undefined)
      setValue('anniversaryOccasion', reservation.anniversaryOccasion || '')
      setValue('status', reservation.status || 'PENDING')
      setValue('notes', reservation.notes || '')
      setValue('reason', '')
      
      // Load deposit data
      if (reservation.deposit) {
        setValue('hasDeposit', true)
        setValue('depositAmount', Number(reservation.deposit.amount) || 0)
        if (reservation.deposit.dueDate) {
          const dueDate = new Date(reservation.deposit.dueDate)
          setValue('depositDueDate', dueDate.toISOString().split('T')[0])
        }
        setValue('depositPaid', reservation.deposit.paid || false)
        setValue('depositPaymentMethod', reservation.deposit.paymentMethod || '')
        if (reservation.deposit.paidAt) {
          const paidAt = new Date(reservation.deposit.paidAt)
          setValue('depositPaidAt', paidAt.toISOString().split('T')[0])
        }
      } else {
        setValue('hasDeposit', false)
      }
      
      setIsFormReady(true)
    }
  }, [reservation, open, setValue])

  const onSubmit = async (data: ReservationFormData) => {
    console.log('=== Submitting form ===')
    console.log('Form data:', data)
    setIsSaving(true)
    
    try {
      const statusChanged = data.status !== originalStatus
      
      const updateData: any = {
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
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
        reason: data.reason,
        eventTypeId: data.eventTypeId,
      }
      
      // Add deposit data
      if (data.hasDeposit && data.depositAmount && data.depositDueDate) {
        updateData.deposit = {
          amount: data.depositAmount,
          dueDate: data.depositDueDate,
          paid: data.depositPaid || false,
          paymentMethod: data.depositPaid ? data.depositPaymentMethod : undefined,
          paidAt: data.depositPaid ? data.depositPaidAt : undefined,
        }
      } else if (!data.hasDeposit) {
        // Remove deposit if unchecked
        updateData.deposit = null
      }
      
      await reservationsApi.update(reservationId, updateData)
      
      console.log('Reservation updated successfully')
      
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
      
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      await queryClient.invalidateQueries({ queryKey: ['reservations', reservationId] })
      
      if (typeof onSuccess === 'function') {
        try {
          onSuccess()
        } catch (err) {
          console.warn('onSuccess callback error:', err)
        }
      }
      
      toast.success('Rezerwacja zaktualizowana pomy\u015blnie')
      onClose()
    } catch (error: any) {
      console.error('Failed to update reservation:', error)
      const errorMessage = error.response?.data?.error || error.message || 'B\u0142\u0105d podczas aktualizacji rezerwacji'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
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

  const eventTypeOptions = [
    { value: '', label: 'Wybierz typ wydarzenia...' },
    ...eventTypesArray.map((type) => ({
      value: type.id,
      label: type.name,
    }))
  ]

  const statusOptions = [
    { value: 'PENDING', label: 'Oczekuj\u0105ca' },
    { value: 'CONFIRMED', label: 'Potwierdzona' },
    { value: 'COMPLETED', label: 'Zako\u0144czona' },
    { value: 'CANCELLED', label: 'Anulowana' },
  ]
  
  const paymentMethodOptions = [
    { value: 'CASH', label: 'Got\u00f3wka' },
    { value: 'TRANSFER', label: 'Przelew' },
    { value: 'BLIK', label: 'BLIK' },
  ]

  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica' || selectedEventTypeName === 'Rocznica/Jubileusz'
  const isCustom = selectedEventTypeName === 'Inne'
  
  // Get client info for display
  const clientInfo = reservation?.client

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
          <DialogTitle>Edytuj Rezerwacj\u0119</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Client Info Display (Read-only) */}
          {clientInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800"
            >
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informacje o kliencie (tylko do odczytu)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{clientInfo.firstName} {clientInfo.lastName}</span>
                </div>
                {clientInfo.email && (
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${clientInfo.email}`} className="hover:underline">{clientInfo.email}</a>
                  </div>
                )}
                {clientInfo.phone && (
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${clientInfo.phone}`} className="hover:underline">{clientInfo.phone}</a>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Klient nie mo\u017ce by\u0107 zmieniony po utworzeniu rezerwacji
              </p>
            </motion.div>
          )}

          <div>
            <Select
              label="Status Rezerwacji"
              options={statusOptions}
              error={errors.status?.message}
              value={watch('status')}
              {...register('status')}
            />
            {watchedFields.status !== originalStatus && (
              <p className="mt-1 text-sm text-amber-600">
                \u26a0\ufe0f Zmiana statusu: {getPolishStatusLabel(originalStatus)} \u2192 {getPolishStatusLabel(watchedFields.status)}
              </p>
            )}
          </div>

          <div>
            <Select
              label="Sala"
              options={hallOptions}
              error={errors.hallId?.message}
              value={watch('hallId')}
              {...register('hallId')}
            />
            {selectedHallCapacity > 0 && (
              <p className="mt-1 text-sm text-secondary-600">
                Maksymalna pojemno\u015b\u0107: {selectedHallCapacity} os\u00f3b
              </p>
            )}
          </div>

          <Select
            label="Typ Wydarzenia"
            options={eventTypeOptions}
            error={errors.eventTypeId?.message}
            value={watch('eventTypeId')}
            {...register('eventTypeId')}
          />

          {isBirthday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
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
            >
              <Input
                label="Typ wydarzenia (w\u0142asny)"
                placeholder="np. Spotkanie rodzinne"
                error={errors.customEventType?.message}
                {...register('customEventType')}
              />
            </motion.div>
          )}

          {isAnniversary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary-500" />
              <Input
                type="datetime-local"
                label="Data i czas rozpocz\u0119cia"
                error={errors.startDateTime?.message}
                {...register('startDateTime')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" />
              <Input
                type="datetime-local"
                label="Data i czas zako\u0144czenia"
                error={errors.endDateTime?.message}
                {...register('endDateTime')}
                disabled={!startDateTime}
              />
            </div>
          </div>
          {!startDateTime && (
            <p className="text-xs text-secondary-500 -mt-4">
              Najpierw wybierz dat\u0119 i czas rozpocz\u0119cia
            </p>
          )}

          {durationHours > 0 && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > 6 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
              {durationHours > 6 && <AlertCircle className="w-5 h-5 text-amber-600" />}
              <span className={`text-sm ${durationHours > 6 ? 'text-amber-800' : 'text-blue-800'}`}>
                Czas trwania: {durationHours}h
                {durationHours > 6 && ` (${Math.ceil(durationHours - 6)}h ponad standard - ${Math.ceil(durationHours - 6) * 500} PLN dop\u0142aty)`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary-500" />
              <Input
                type="number"
                label="Liczba doros\u0142ych"
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
                placeholder={isChildrenFieldsDisabled ? 'Najpierw wprowad\u017a liczb\u0119 doros\u0142ych' : '0'}
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
                placeholder={isChildrenFieldsDisabled ? 'Najpierw wprowad\u017a liczb\u0119 doros\u0142ych' : '0'}
                error={errors.toddlers?.message}
                disabled={isChildrenFieldsDisabled}
                {...register('toddlers')}
              />
            </div>
          </div>
          {isChildrenFieldsDisabled && (
            <p className="text-xs text-secondary-500 -mt-4">
              Pola dzieci b\u0119d\u0105 dost\u0119pne po wprowadzeniu liczby doros\u0142ych
            </p>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                label="Cena za dziecko 4-12 (PLN)"
                placeholder={isChildPriceDisabled ? 'Najpierw uzupe\u0142nij cen\u0119 za doros\u0142ego' : '0.00'}
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
                placeholder={isToddlerPriceDisabled ? 'Najpierw uzupe\u0142nij cen\u0119 za doros\u0142ego' : '0.00'}
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
              Ceny za dzieci b\u0119d\u0105 dost\u0119pne po uzupe\u0142nieniu liczby i ceny za doros\u0142ych (domy\u015blnie 50% i 25% ceny za doros\u0142ego)
            </p>
          )}

          {calculatedPrice > 0 && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-secondary-700">
                  <span>Doros\u0142i: {adults} \u00d7 {pricePerAdult} PLN</span>
                  <span className="font-medium">{adults * pricePerAdult} PLN</span>
                </div>
                <div className="flex items-center justify-between text-sm text-secondary-700">
                  <span>Dzieci (4-12): {children} \u00d7 {pricePerChild} PLN</span>
                  <span className="font-medium">{children * pricePerChild} PLN</span>
                </div>
                <div className="flex items-center justify-between text-sm text-secondary-700">
                  <span>Dzieci (0-3): {toddlers} \u00d7 {pricePerToddler} PLN</span>
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

          {/* Deposit Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasDeposit"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                {...register('hasDeposit')}
              />
              <label htmlFor="hasDeposit" className="ml-2 text-sm font-medium text-secondary-700">
                Zarz\u0105dzaj zaliczk\u0105
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
                      <Controller
                        name="depositPaymentMethod"
                        control={control}
                        render={({ field }) => (
                          <SelectField
                            label="Spos\u00f3b p\u0142atno\u015bci"
                            placeholder="Wybierz metod\u0119 p\u0142atno\u015bci..."
                            options={paymentMethodOptions}
                            error={errors.depositPaymentMethod?.message}
                            {...field}
                          />
                        )}
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

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Pow\u00f3d zmiany (wymagane, min. 10 znak\u00f3w)
                </label>
                <textarea
                  className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="np. Klient zmieni\u0142 liczb\u0119 go\u015bci po rozmowie telefonicznej"
                  {...register('reason')}
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>
            </div>
          </div>

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
