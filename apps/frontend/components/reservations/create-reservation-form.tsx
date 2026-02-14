'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
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
import { usePackagesByEventType } from '@/hooks/use-menu-packages'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, DollarSign, FileText, UserPlus, AlertCircle, Baby, CheckCircle, Smile, UtensilsCrossed, Sparkles } from 'lucide-react'
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
  
  // Split guest counts by age
  adults: z.coerce.number().min(0, 'Liczba doros\u0142ych musi by\u0107 >= 0'),
  children: z.coerce.number().min(0, 'Liczba dzieci (4-12) musi by\u0107 >= 0'),
  toddlers: z.coerce.number().min(0, 'Liczba dzieci (0-3) musi by\u0107 >= 0'),
  
  // Menu package
  useMenuPackage: z.boolean(),
  menuPackageId: z.string().optional(),
  
  // Pricing - conditional on menu package
  pricePerAdult: z.coerce.number().min(0, 'Cena za doros\u0142ego musi by\u0107 >= 0').optional(),
  pricePerChild: z.coerce.number().min(0, 'Cena za dziecko (4-12) musi by\u0107 >= 0').optional(),
  pricePerToddler: z.coerce.number().min(0, 'Cena za dziecko (0-3) musi by\u0107 >= 0').optional(),
  
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
  message: '\u0141\u0105czna liczba go\u015bci musi by\u0107 >= 1',
  path: ['adults'],
}).refine((data) => {
  const start = new Date(`${data.startDate}T${data.startTime}`)
  const end = new Date(`${data.endDate}T${data.endTime}`)
  return end > start
}, {
  message: 'Czas zako\u0144czenia musi by\u0107 po czasie rozpocz\u0119cia',
  path: ['endTime'],
}).refine((data) => {
  // If menu package is NOT used, manual prices are required
  if (!data.useMenuPackage || !data.menuPackageId) {
    return data.pricePerAdult && data.pricePerAdult > 0
  }
  return true
}, {
  message: 'Cena za doros\u0142ego jest wymagana gdy nie wybrano pakietu menu',
  path: ['pricePerAdult'],
})

type ReservationFormData = z.infer<typeof reservationSchema>

interface CreateReservationFormProps {
  onSubmit?: (data: any) => void | Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<ReservationFormData>
  isPromotingFromQueue?: boolean
  defaultHallId?: string
}

export function CreateReservationForm({ 
  onSubmit: onSubmitProp, 
  onSuccess, 
  onCancel,
  initialData,
  isPromotingFromQueue = false,
  defaultHallId
}: CreateReservationFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
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
      useMenuPackage: false,
      adults: 0,
      children: 0,
      toddlers: 0,
      ...initialData,
    },
  })

  const watchedFields = watch()
  const hasDeposit = watch('hasDeposit')
  const depositPaid = watch('depositPaid')
  const useMenuPackage = watch('useMenuPackage')
  const menuPackageId = watch('menuPackageId')
  const selectedEventTypeId = watch('eventTypeId')
  
  const adults = Number(watch('adults')) || 0
  const children = Number(watch('children')) || 0
  const toddlers = Number(watch('toddlers')) || 0
  const pricePerAdult = Number(watch('pricePerAdult')) || 0
  const pricePerChild = Number(watch('pricePerChild')) || 0
  const pricePerToddler = Number(watch('pricePerToddler')) || 0
  const startDate = watch('startDate')
  const startTime = watch('startTime')

  const { data: menuPackages, isLoading: menuPackagesLoading } = usePackagesByEventType(selectedEventTypeId)

  // Pre-select hall from defaultHallId (e.g. when navigating from hall detail page)
  const hallsArray = Array.isArray(halls?.halls) ? halls.halls : []

  useEffect(() => {
    if (defaultHallId && hallsArray.length > 0 && !watchedFields.hallId) {
      const hallExists = hallsArray.some((h) => h.id === defaultHallId)
      if (hallExists) {
        setValue('hallId', defaultHallId)
      }
    }
  }, [defaultHallId, hallsArray, setValue, watchedFields.hallId])

  // Auto-scroll to form when opened via URL
  useEffect(() => {
    if (defaultHallId && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [defaultHallId])

  // Get selected menu package
  const selectedPackage = useMemo(() => {
    if (!menuPackageId || !menuPackages) return null
    return menuPackages.find((pkg) => pkg.id === menuPackageId) || null
  }, [menuPackageId, menuPackages])

  // Auto-set prices from menu package
  useEffect(() => {
    if (useMenuPackage && selectedPackage) {
      setValue('pricePerAdult', parseFloat(selectedPackage.pricePerAdult))
      setValue('pricePerChild', parseFloat(selectedPackage.pricePerChild))
      setValue('pricePerToddler', parseFloat(selectedPackage.pricePerToddler))
    }
  }, [useMenuPackage, selectedPackage, setValue])

  // Reset package selection when event type changes
  useEffect(() => {
    if (selectedEventTypeId && menuPackageId) {
      const isPackageStillValid = menuPackages?.some((pkg) => pkg.id === menuPackageId)
      if (!isPackageStillValid) {
        setValue('menuPackageId', '')
        setValue('useMenuPackage', false)
      }
    }
  }, [selectedEventTypeId, menuPackageId, menuPackages, setValue])

  const selectedEventTypeName = useMemo(() => {
    if (!selectedEventTypeId) return ''
    const eventTypesArray = Array.isArray(eventTypes) ? eventTypes : []
    const selectedType = eventTypesArray.find((t) => t.id === selectedEventTypeId)
    return selectedType?.name || ''
  }, [selectedEventTypeId, eventTypes])

  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica' || selectedEventTypeName === 'Rocznica/Jubileusz'
  const isCustom = selectedEventTypeName === 'Inne'

  // Auto-set child price to half of adult price (only if NOT using menu package)
  useEffect(() => {
    if (!useMenuPackage && adults > 0 && pricePerAdult > 0 && !childPriceManuallySet) {
      const halfPrice = Math.round(pricePerAdult / 2)
      setValue('pricePerChild', halfPrice)
    }
  }, [useMenuPackage, adults, pricePerAdult, setValue, childPriceManuallySet])

  // Auto-set toddler price to 25% of adult price (only if NOT using menu package)
  useEffect(() => {
    if (!useMenuPackage && adults > 0 && pricePerAdult > 0 && !toddlerPriceManuallySet) {
      const quarterPrice = Math.round(pricePerAdult * 0.25)
      setValue('pricePerToddler', quarterPrice)
    }
  }, [useMenuPackage, adults, pricePerAdult, setValue, toddlerPriceManuallySet])

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
  const isChildPriceDisabled = useMenuPackage || adults === 0 || pricePerAdult === 0
  const isToddlerPriceDisabled = useMenuPackage || adults === 0 || pricePerAdult === 0

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

  useEffect(() => {
    if (watchedFields.hallId) {
      const selectedHall = hallsArray.find((h) => h.id === watchedFields.hallId)
      if (selectedHall) {
        setSelectedHallCapacity(selectedHall.capacity)
        
        if (!watchedFields.pricePerAdult && !useMenuPackage) {
          setValue('pricePerAdult', selectedHall.pricePerPerson)
        }
      }
    }
  }, [watchedFields.hallId, halls, setValue, watchedFields.pricePerAdult, useMenuPackage])

  const handleClientCreated = async (newClient: any) => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] })
    setValue('clientId', newClient.id)
    setShowCreateClientModal(false)
  }

  const onSubmit = async (data: ReservationFormData) => {
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
      confirmationDeadline: data.confirmationDeadline,
      customEventType: data.customEventType,
      birthdayAge: data.birthdayAge,
      anniversaryYear: data.anniversaryYear,
      anniversaryOccasion: data.anniversaryOccasion,
      notes: data.notes,
    }

    // Menu package integration
    if (data.useMenuPackage && data.menuPackageId) {
      input.menuPackageId = data.menuPackageId
    } else {
      input.pricePerAdult = data.pricePerAdult
      input.pricePerChild = data.pricePerChild
      input.pricePerToddler = data.pricePerToddler
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
      if (onSubmitProp) {
        await onSubmitProp(input)
      } else {
        const result = await createReservation.mutateAsync(input)
        
        if (result?.id) {
          router.push(`/dashboard/reservations/${result.id}`)
        }
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create reservation:', error)
    }
  }

  const clientsArray = Array.isArray(clientsData) ? clientsData : []
  const eventTypesArray = Array.isArray(eventTypes) ? eventTypes : []
  const menuPackagesArray = Array.isArray(menuPackages) ? menuPackages : []

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

  const menuPackageOptions = [
    { value: '', label: 'Wybierz pakiet...' },
    ...menuPackagesArray.map((pkg) => ({
      value: pkg.id,
      label: `${pkg.name} - ${formatCurrency(parseFloat(pkg.pricePerAdult))}/osoba`,
    }))
  ]

  const paymentMethodOptions = [
    { value: 'CASH', label: 'Got\u00f3wka' },
    { value: 'TRANSFER', label: 'Przelew' },
    { value: 'BLIK', label: 'BLIK' },
  ]

  const hasNoPackagesForEventType = selectedEventTypeId && !menuPackagesLoading && menuPackagesArray.length === 0

  return (
    <motion.div
      ref={formRef}
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
          {(hallsLoading || eventTypesLoading || menuPackagesLoading) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">\u23f3 \u0141adowanie danych...</p>
              {hallsLoading && <p className="text-xs text-blue-600">\u2022 \u0141adowanie sal...</p>}
              {eventTypesLoading && <p className="text-xs text-blue-600">\u2022 \u0141adowanie typ\u00f3w wydarze\u0144...</p>}
              {menuPackagesLoading && <p className="text-xs text-blue-600">\u2022 \u0141adowanie pakiet\u00f3w menu...</p>}
            </div>
          )}
          
          {(hallsError || eventTypesError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800">\u274c B\u0142\u0105d \u0142adowania danych</p>
              {hallsError && <p className="text-xs text-red-600">\u2022 Sale: {String(hallsError)}</p>}
              {eventTypesError && <p className="text-xs text-red-600">\u2022 Typy wydarze\u0144: {String(eventTypesError)}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SelectSimple
              label="Sala"
              options={hallOptions}
              error={errors.hallId?.message}
              {...register('hallId')}
            />
            {selectedHallCapacity > 0 && (
              <p className="-mt-4 text-sm text-secondary-600">
                Maksymalna pojemno\u015b\u0107: {selectedHallCapacity} os\u00f3b
              </p>
            )}

            {/* Pre-selected hall indicator */}
            {defaultHallId && watchedFields.hallId === defaultHallId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="-mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-800">Sala zosta\u0142a automatycznie wybrana z widoku szczeg\u00f3\u0142\u00f3w</p>
              </motion.div>
            )}

            <div>
              <div className="flex gap-2">
                <div className="flex-1">
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

            {/* MENU PACKAGE SECTION */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                  <label className="text-sm font-medium text-secondary-700">Pakiet Menu</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useMenuPackage"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    disabled={!selectedEventTypeId || hasNoPackagesForEventType}
                    {...register('useMenuPackage')}
                  />
                  <label htmlFor="useMenuPackage" className="ml-2 text-sm text-secondary-700">
                    U\u017cyj gotowego pakietu
                  </label>
                </div>
              </div>

              {hasNoPackagesForEventType && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Brak dost\u0119pnych pakiet\u00f3w menu dla tego typu wydarzenia. U\u017cyj r\u0119cznego ustalania cen.
                  </p>
                </motion.div>
              )}

              {!selectedEventTypeId && (
                <p className="text-sm text-secondary-500">
                  Wybierz typ wydarzenia aby zobaczy\u0107 dost\u0119pne pakiety menu
                </p>
              )}

              {useMenuPackage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-primary-50 border border-primary-200 rounded-lg"
                >
                  <SelectSimple
                    label="Wybierz pakiet"
                    options={menuPackageOptions}
                    error={errors.menuPackageId?.message}
                    {...register('menuPackageId')}
                  />

                  {selectedPackage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-white rounded-lg border border-primary-300"
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-secondary-900">{selectedPackage.name}</h4>
                          {selectedPackage.shortDescription && (
                            <p className="text-sm text-secondary-600 mt-1">{selectedPackage.shortDescription}</p>
                          )}
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-secondary-500">Doros\u0142y</p>
                              <p className="text-lg font-bold text-primary-600">{formatCurrency(parseFloat(selectedPackage.pricePerAdult))}</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-500">Dziecko 4-12</p>
                              <p className="text-lg font-bold text-primary-600">{formatCurrency(parseFloat(selectedPackage.pricePerChild))}</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-500">Dziecko 0-3</p>
                              <p className="text-lg font-bold text-primary-600">{formatCurrency(parseFloat(selectedPackage.pricePerToddler))}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Manual Pricing (only if NOT using menu package) */}
            {!useMenuPackage && (
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
                    <span>Dzieci (4-12): {children} \u00d7 {pricePerChild} PLN</span>
                    <span className="font-medium">{children * pricePerChild} PLN</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-secondary-700">
                    <span>Dzieci (0-3): {toddlers} \u00d7 {pricePerToddler} PLN</span>
                    <span className="font-medium">{toddlers * pricePerToddler} PLN</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-primary-300">
                    <span className="font-medium text-secondary-900">Cena ca\u0142kowita:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(calculatedPrice)}
                    </span>
                  </div>
                  {useMenuPackage && selectedPackage && (
                    <p className="text-xs text-primary-700 flex items-center gap-1 pt-2">
                      <UtensilsCrossed className="w-3 h-3" />
                      Ceny z pakietu: {selectedPackage.name}
                    </p>
                  )}
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
                {createReservation.isPending ? 'Tworzenie...' : isPromotingFromQueue ? 'Awansuj do rezerwacji' : 'Utw\u00f3rz Rezerwacj\u0119'}
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
