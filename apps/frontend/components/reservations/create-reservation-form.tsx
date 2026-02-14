'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Stepper, StepContent, StepNavigation, StepConfig } from '@/components/ui/stepper'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateReservation } from '@/hooks/use-reservations'
import { useHalls } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { usePackagesByEventType } from '@/hooks/use-menu-packages'
import { useCheckAvailability } from '@/hooks/use-check-availability'
import { formatCurrency } from '@/lib/utils'
import {
  Calendar, Clock, Users, DollarSign, FileText, UserPlus,
  AlertCircle, Baby, CheckCircle, Smile, UtensilsCrossed,
  Sparkles, Building2, User, ClipboardCheck, AlertTriangle,
} from 'lucide-react'
import { CreateReservationInput } from '@/types'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import { useQueryClient } from '@tanstack/react-query'

// ═══════════════════════════════════════════════════
// STEP CONFIGURATION
// ═══════════════════════════════════════════════════

const STEPS: StepConfig[] = [
  { id: 'event', title: 'Wydarzenie', icon: Sparkles },
  { id: 'venue', title: 'Sala i termin', icon: Building2 },
  { id: 'guests', title: 'Goście', icon: Users },
  { id: 'menu', title: 'Menu i ceny', icon: UtensilsCrossed },
  { id: 'client', title: 'Klient', icon: User },
  { id: 'summary', title: 'Podsumowanie', icon: ClipboardCheck },
]

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════

const EXTRA_HOUR_RATE = 500
const STANDARD_HOURS = 6

// ═══════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════

const reservationSchema = z.object({
  eventTypeId: z.string().min(1, 'Wybierz typ wydarzenia'),
  customEventType: z.string().optional(),
  birthdayAge: z.coerce.number().optional(),
  anniversaryYear: z.coerce.number().optional(),
  anniversaryOccasion: z.string().optional(),
  hallId: z.string().min(1, 'Wybierz salę'),
  startDate: z.string().min(1, 'Wybierz datę rozpoczęcia'),
  startTime: z.string().min(1, 'Wybierz czas rozpoczęcia'),
  endDate: z.string().min(1, 'Wybierz datę zakończenia'),
  endTime: z.string().min(1, 'Wybierz czas zakończenia'),
  adults: z.coerce.number().min(0, 'Liczba dorosłych musi być >= 0'),
  children: z.coerce.number().min(0, 'Liczba dzieci (4-12) musi być >= 0'),
  toddlers: z.coerce.number().min(0, 'Liczba dzieci (0-3) musi być >= 0'),
  useMenuPackage: z.boolean(),
  menuPackageId: z.string().optional(),
  pricePerAdult: z.coerce.number().min(0).optional(),
  pricePerChild: z.coerce.number().min(0).optional(),
  pricePerToddler: z.coerce.number().min(0).optional(),
  clientId: z.string().min(1, 'Wybierz klienta'),
  confirmationDeadline: z.string().optional(),
  notes: z.string().optional(),
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
}).refine((data) => {
  if (!data.useMenuPackage || !data.menuPackageId) {
    return data.pricePerAdult && data.pricePerAdult > 0
  }
  return true
}, {
  message: 'Cena za dorosłego jest wymagana gdy nie wybrano pakietu menu',
  path: ['pricePerAdult'],
})

type ReservationFormData = z.infer<typeof reservationSchema>

const STEP_FIELDS: Record<number, (keyof ReservationFormData)[]> = {
  0: ['eventTypeId'],
  1: ['hallId', 'startDate', 'startTime', 'endDate', 'endTime'],
  2: ['adults', 'children', 'toddlers'],
  3: ['useMenuPackage', 'menuPackageId', 'pricePerAdult', 'pricePerChild', 'pricePerToddler'],
  4: ['clientId'],
  5: ['confirmationDeadline', 'notes'],
}

// ═══════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════

interface CreateReservationFormProps {
  onSubmit?: (data: any) => void | Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<ReservationFormData>
  isPromotingFromQueue?: boolean
  defaultHallId?: string
}

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════

export function CreateReservationForm({
  onSubmit: onSubmitProp,
  onSuccess,
  onCancel,
  initialData,
  isPromotingFromQueue = false,
  defaultHallId,
}: CreateReservationFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [childPriceManuallySet, setChildPriceManuallySet] = useState(false)
  const [toddlerPriceManuallySet, setToddlerPriceManuallySet] = useState(false)

  const { data: halls, isLoading: hallsLoading } = useHalls()
  const { data: clientsData, isLoading: clientsLoading } = useClients()
  const { data: eventTypes, isLoading: eventTypesLoading } = useEventTypes()
  const createReservation = useCreateReservation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      useMenuPackage: false,
      adults: 0,
      children: 0,
      toddlers: 0,
      ...initialData,
    },
  })

  const watchAll = watch()
  const useMenuPackage = watch('useMenuPackage')
  const menuPackageId = watch('menuPackageId')
  const selectedEventTypeId = watch('eventTypeId')
  const hallId = watch('hallId')
  const adults = Number(watch('adults')) || 0
  const children = Number(watch('children')) || 0
  const toddlers = Number(watch('toddlers')) || 0
  const pricePerAdult = Number(watch('pricePerAdult')) || 0
  const pricePerChild = Number(watch('pricePerChild')) || 0
  const pricePerToddler = Number(watch('pricePerToddler')) || 0
  const startDate = watch('startDate')
  const startTime = watch('startTime')
  const endDate = watch('endDate')
  const endTime = watch('endTime')

  const hallsArray = useMemo(() => Array.isArray(halls?.halls) ? halls.halls : [], [halls])
  const clientsArray = useMemo(() => Array.isArray(clientsData) ? clientsData : [], [clientsData])
  const eventTypesArray = useMemo(() => Array.isArray(eventTypes) ? eventTypes : [], [eventTypes])

  const { data: menuPackages, isLoading: menuPackagesLoading } = usePackagesByEventType(selectedEventTypeId)
  const menuPackagesArray = useMemo(() => Array.isArray(menuPackages) ? menuPackages : [], [menuPackages])

  const startDateTimeISO = useMemo(() => {
    if (startDate && startTime) return `${startDate}T${startTime}:00`
    return undefined
  }, [startDate, startTime])

  const endDateTimeISO = useMemo(() => {
    if (endDate && endTime) return `${endDate}T${endTime}:00`
    return undefined
  }, [endDate, endTime])

  const { data: availability, isLoading: availabilityLoading } = useCheckAvailability(
    hallId, startDateTimeISO, endDateTimeISO
  )

  const selectedHall = useMemo(() => hallsArray.find((h) => h.id === hallId), [hallsArray, hallId])
  const selectedHallCapacity = selectedHall?.capacity || 0

  const selectedEventTypeName = useMemo(() => {
    const t = eventTypesArray.find((t) => t.id === selectedEventTypeId)
    return t?.name || ''
  }, [selectedEventTypeId, eventTypesArray])

  const isBirthday = selectedEventTypeName === 'Urodziny'
  const isAnniversary = selectedEventTypeName === 'Rocznica' || selectedEventTypeName === 'Rocznica/Jubileusz'
  const isCustom = selectedEventTypeName === 'Inne'

  const selectedPackage = useMemo(() => {
    if (!menuPackageId || !menuPackages) return null
    return menuPackages.find((pkg) => pkg.id === menuPackageId) || null
  }, [menuPackageId, menuPackages])

  const hasNoPackagesForEventType = selectedEventTypeId && !menuPackagesLoading && menuPackagesArray.length === 0

  const totalGuests = adults + children + toddlers
  const calculatedPrice = (adults * pricePerAdult) + (children * pricePerChild) + (toddlers * pricePerToddler)

  const durationHours = useMemo(() => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      const diffMs = end.getTime() - start.getTime()
      return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10
    }
    return 0
  }, [startDate, startTime, endDate, endTime])

  const extraHours = useMemo(() => {
    if (durationHours > STANDARD_HOURS) return Math.ceil(durationHours - STANDARD_HOURS)
    return 0
  }, [durationHours])

  const extraHoursCost = extraHours * EXTRA_HOUR_RATE
  const totalWithExtras = calculatedPrice + extraHoursCost

  // ═══ EFFECTS ═══

  useEffect(() => {
    if (defaultHallId && hallsArray.length > 0 && !watchAll.hallId) {
      const hallExists = hallsArray.some((h) => h.id === defaultHallId)
      if (hallExists) setValue('hallId', defaultHallId)
    }
  }, [defaultHallId, hallsArray, setValue, watchAll.hallId])

  useEffect(() => {
    if (startDate && startTime && !watchAll.endDate && !watchAll.endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000)
      setValue('endDate', end.toISOString().split('T')[0])
      setValue('endTime', end.toTimeString().slice(0, 5))
    }
  }, [startDate, startTime, watchAll.endDate, watchAll.endTime, setValue])

  useEffect(() => {
    if (useMenuPackage && selectedPackage) {
      setValue('pricePerAdult', parseFloat(selectedPackage.pricePerAdult))
      setValue('pricePerChild', parseFloat(selectedPackage.pricePerChild))
      setValue('pricePerToddler', parseFloat(selectedPackage.pricePerToddler))
    }
  }, [useMenuPackage, selectedPackage, setValue])

  useEffect(() => {
    if (useMenuPackage) {
      setChildPriceManuallySet(false)
      setToddlerPriceManuallySet(false)
    }
  }, [useMenuPackage])

  useEffect(() => {
    if (selectedEventTypeId && menuPackageId) {
      const isValid = menuPackages?.some((pkg) => pkg.id === menuPackageId)
      if (!isValid) {
        setValue('menuPackageId', '')
        setValue('useMenuPackage', false)
      }
    }
  }, [selectedEventTypeId, menuPackageId, menuPackages, setValue])

  useEffect(() => {
    if (!useMenuPackage && pricePerAdult > 0 && !childPriceManuallySet) {
      setValue('pricePerChild', Math.round(pricePerAdult / 2))
    }
  }, [useMenuPackage, pricePerAdult, setValue, childPriceManuallySet])

  useEffect(() => {
    if (!useMenuPackage && pricePerAdult > 0 && !toddlerPriceManuallySet) {
      setValue('pricePerToddler', Math.round(pricePerAdult * 0.25))
    }
  }, [useMenuPackage, pricePerAdult, setValue, toddlerPriceManuallySet])

  useEffect(() => {
    if (hallId && !useMenuPackage && !watchAll.pricePerAdult) {
      const hall = hallsArray.find((h) => h.id === hallId)
      if (hall?.pricePerPerson) setValue('pricePerAdult', hall.pricePerPerson)
    }
  }, [hallId, hallsArray, setValue, useMenuPackage, watchAll.pricePerAdult])

  // ═══ HANDLERS ═══

  const handleClientCreated = useCallback(async (newClient: any) => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] })
    setValue('clientId', newClient.id)
    setShowCreateClientModal(false)
  }, [queryClient, setValue])

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const fields = STEP_FIELDS[currentStep]
    if (!fields || fields.length === 0) return true

    if (currentStep === 2) {
      if (adults + children + toddlers < 1) {
        await trigger('adults')
        return false
      }
    }

    if (currentStep === 3) {
      if (!useMenuPackage && (!pricePerAdult || pricePerAdult <= 0)) {
        await trigger('pricePerAdult')
        return false
      }
      if (useMenuPackage && !menuPackageId) {
        return false
      }
    }

    const result = await trigger(fields)
    return result
  }, [currentStep, trigger, adults, children, toddlers, useMenuPackage, pricePerAdult, menuPackageId])

  const goToNextStep = useCallback(async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [validateCurrentStep, currentStep])

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const goToStep = useCallback((step: number) => {
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentStep, completedSteps])

  const onFormSubmit = async (data: ReservationFormData) => {
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

    if (data.useMenuPackage && data.menuPackageId) {
      input.menuPackageId = data.menuPackageId
    } else {
      input.pricePerAdult = data.pricePerAdult
      input.pricePerChild = data.pricePerChild
      input.pricePerToddler = data.pricePerToddler
    }

    try {
      if (onSubmitProp) {
        await onSubmitProp(input)
      } else {
        const result = await createReservation.mutateAsync(input)
        if (result?.id) router.push(`/dashboard/reservations/${result.id}`)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create reservation:', error)
    }
  }

  const handleFinalSubmit = useCallback(async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return
    handleSubmit(onFormSubmit)()
  }, [validateCurrentStep, handleSubmit])

  // ═══ OPTIONS ═══

  const clientComboboxOptions = useMemo(() =>
    clientsArray.map((client) => ({
      value: client.id,
      label: `${client.firstName} ${client.lastName}`,
      description: client.email || undefined,
      secondaryLabel: client.phone || undefined,
    })),
  [clientsArray])

  const selectedClient = useMemo(() =>
    clientsArray.find((c) => c.id === watchAll.clientId),
  [clientsArray, watchAll.clientId])

  const isNextDisabled = useMemo(() => {
    if (currentStep === 1 && availability && !availability.available) return false
    return false
  }, [currentStep, availability])

  // ═══════════════════════════════════════════════════
  // PRICE SUMMARY
  // ═══════════════════════════════════════════════════

  const PriceSummary = useCallback(({ compact = false }: { compact?: boolean }) => {
    if (calculatedPrice <= 0 && extraHoursCost <= 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-4 border rounded-xl ${
          compact
            ? 'bg-orange-50 border-orange-200'
            : 'bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200'
        }`}
      >
        <div className="space-y-2">
          {adults > 0 && (
            <div className="flex justify-between text-sm text-secondary-700">
              <span>Dorośli: {adults} × {pricePerAdult} PLN</span>
              <span className="font-medium">{adults * pricePerAdult} PLN</span>
            </div>
          )}
          {children > 0 && (
            <div className="flex justify-between text-sm text-secondary-700">
              <span>Dzieci (4–12): {children} × {pricePerChild} PLN</span>
              <span className="font-medium">{children * pricePerChild} PLN</span>
            </div>
          )}
          {toddlers > 0 && (
            <div className="flex justify-between text-sm text-secondary-700">
              <span>Dzieci (0–3): {toddlers} × {pricePerToddler} PLN</span>
              <span className="font-medium">{toddlers * pricePerToddler} PLN</span>
            </div>
          )}

          {calculatedPrice > 0 && extraHoursCost > 0 && (
            <div className="flex justify-between text-sm text-secondary-700 pt-1 border-t border-secondary-200">
              <span className="font-medium">Podsuma menu / goście:</span>
              <span className="font-medium">{formatCurrency(calculatedPrice)}</span>
            </div>
          )}

          {extraHoursCost > 0 && (
            <div className="flex justify-between text-sm text-amber-800 bg-amber-50 -mx-4 px-4 py-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Dodatkowe godziny: {extraHours}h × {EXTRA_HOUR_RATE} PLN
              </span>
              <span className="font-medium">{formatCurrency(extraHoursCost)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-primary-300">
            <span className="font-semibold text-secondary-900">Cena całkowita:</span>
            <span className="text-2xl font-bold text-primary-600">{formatCurrency(totalWithExtras)}</span>
          </div>

          {useMenuPackage && selectedPackage && (
            <p className="text-xs text-primary-700 flex items-center gap-1 pt-1">
              <UtensilsCrossed className="w-3 h-3" /> Ceny z pakietu: {selectedPackage.name}
            </p>
          )}
        </div>
      </motion.div>
    )
  }, [adults, children, toddlers, pricePerAdult, pricePerChild, pricePerToddler, calculatedPrice, extraHours, extraHoursCost, totalWithExtras, useMenuPackage, selectedPackage])

  // ═══ RENDER ═══

  return (
    <motion.div
      ref={formRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        {!isPromotingFromQueue && (
          <CardHeader className="bg-gradient-to-r from-primary-50 to-blue-50 border-b">
            <CardTitle className="text-xl">Nowa Rezerwacja</CardTitle>
          </CardHeader>
        )}

        <CardContent className="pt-6">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            className="mb-8"
          />

          <form onSubmit={handleSubmit(onFormSubmit)}>
            <AnimatePresence mode="wait">

              {/* ═══ STEP 0: Typ wydarzenia ═══ */}
              <StepContent stepIndex={0} currentStep={currentStep}>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-3">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-secondary-900">Jaki typ wydarzenia?</h2>
                    <p className="text-sm text-secondary-500 mt-1">Określ rodzaj imprezy — wpłynie na dostępne pakiety menu</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Typ wydarzenia</label>
                    <Controller
                      name="eventTypeId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={`h-11 ${errors.eventTypeId ? 'border-red-400' : ''}`}>
                            <SelectValue placeholder="Wybierz typ wydarzenia..." />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTypesArray.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.eventTypeId && (
                      <p className="text-xs text-red-500">{errors.eventTypeId.message}</p>
                    )}
                  </div>

                  {isBirthday && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
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
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
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
                </div>
              </StepContent>

              {/* ═══ STEP 1: Sala i termin ═══ */}
              <StepContent stepIndex={1} currentStep={currentStep}>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-3">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-secondary-900">Wybierz salę i termin</h2>
                    <p className="text-sm text-secondary-500 mt-1">Sprawdzimy dostępność automatycznie</p>
                  </div>

                  {/* Hall select */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Sala</label>
                    <Controller
                      name="hallId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={`h-11 ${errors.hallId ? 'border-red-400' : ''}`}>
                            <SelectValue placeholder="Wybierz salę..." />
                          </SelectTrigger>
                          <SelectContent>
                            {hallsArray.map((hall) => (
                              <SelectItem key={hall.id} value={hall.id}>
                                {hall.name} (max {hall.capacity} osób)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.hallId && (
                      <p className="text-xs text-red-500">{errors.hallId.message}</p>
                    )}
                  </div>

                  {selectedHallCapacity > 0 && (
                    <p className="-mt-4 text-sm text-secondary-600">
                      Maksymalna pojemność: {selectedHallCapacity} osób
                    </p>
                  )}

                  {defaultHallId && watchAll.hallId === defaultHallId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-800">Sala wybrana automatycznie z widoku szczegółów</p>
                    </motion.div>
                  )}

                  {/* Date & Time pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-secondary-800">Rozpoczęcie</p>
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            label="Data"
                            placeholder="Wybierz datę..."
                            error={errors.startDate?.message}
                            minDate={new Date()}
                          />
                        )}
                      />
                      <Controller
                        name="startTime"
                        control={control}
                        render={({ field }) => (
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                            label="Godzina"
                            placeholder="Wybierz godzinę..."
                            error={errors.startTime?.message}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-secondary-800">Zakończenie</p>
                      <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            label="Data"
                            placeholder="Wybierz datę..."
                            error={errors.endDate?.message}
                            disabled={!startDate}
                            minDate={startDate ? new Date(startDate) : undefined}
                          />
                        )}
                      />
                      <Controller
                        name="endTime"
                        control={control}
                        render={({ field }) => (
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                            label="Godzina"
                            placeholder="Wybierz godzinę..."
                            error={errors.endTime?.message}
                            disabled={!startDate || !startTime}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {durationHours > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > STANDARD_HOURS ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}
                    >
                      {durationHours > STANDARD_HOURS && <AlertCircle className="w-5 h-5 text-amber-600" />}
                      <span className={`text-sm ${durationHours > STANDARD_HOURS ? 'text-amber-800' : 'text-blue-800'}`}>
                        Czas trwania: {durationHours}h
                        {durationHours > STANDARD_HOURS && ` (${extraHours}h ponad standard — dopłata zostanie doliczona w wycenie)`}
                      </span>
                    </motion.div>
                  )}

                  {/* Availability */}
                  {hallId && startDateTimeISO && endDateTimeISO && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 rounded-lg border ${
                        availabilityLoading
                          ? 'bg-gray-50 border-gray-200'
                          : availability?.available
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {availabilityLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-secondary-600">Sprawdzanie dostępności...</span>
                        </div>
                      ) : availability?.available ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Sala jest dostępna w wybranym terminie</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Kolizja z istniejącą rezerwacją!</span>
                          </div>
                          {availability?.conflicts?.map((c) => (
                            <div key={c.id} className="ml-7 text-xs text-red-700">
                              • {c.clientName} — {c.eventType} ({new Date(c.startDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–{new Date(c.endDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </StepContent>

              {/* ═══ STEP 2: Goście ═══ */}
              <StepContent stepIndex={2} currentStep={currentStep}>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-3">
                      <Users className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-secondary-900">Ilu gości?</h2>
                    <p className="text-sm text-secondary-500 mt-1">Podaj liczbę osób w każdej grupie wiekowej</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl border-2 border-secondary-200 hover:border-primary-300 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-primary-600" />
                        <span className="font-medium text-secondary-700">Dorośli</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        error={errors.adults?.message}
                        className="text-center text-2xl font-bold h-14"
                        {...register('adults')}
                      />
                    </div>

                    <div className="p-4 rounded-xl border-2 border-secondary-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <Smile className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-secondary-700">Dzieci (4–12)</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        error={errors.children?.message}
                        disabled={adults === 0}
                        className="text-center text-2xl font-bold h-14"
                        {...register('children')}
                      />
                    </div>

                    <div className="p-4 rounded-xl border-2 border-secondary-200 hover:border-green-300 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <Baby className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-secondary-700">Maluchy (0–3)</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        error={errors.toddlers?.message}
                        disabled={adults === 0}
                        className="text-center text-2xl font-bold h-14"
                        {...register('toddlers')}
                      />
                    </div>
                  </div>

                  {totalGuests > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center p-4 bg-primary-50 rounded-xl border border-primary-200"
                    >
                      <span className="text-secondary-700 mr-3">Łącznie gości:</span>
                      <span className="text-3xl font-bold text-primary-600">{totalGuests}</span>
                    </motion.div>
                  )}

                  {totalGuests > selectedHallCapacity && selectedHallCapacity > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-800">
                        Liczba gości ({totalGuests}) przekracza pojemność sali ({selectedHallCapacity})!
                      </span>
                    </motion.div>
                  )}
                </div>
              </StepContent>

              {/* ═══ STEP 3: Menu i ceny ═══ */}
              <StepContent stepIndex={3} currentStep={currentStep}>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white mb-3">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-secondary-900">Menu i wycena</h2>
                    <p className="text-sm text-secondary-500 mt-1">Wybierz pakiet menu lub ustaw ceny ręcznie</p>
                  </div>

                  {/* Package toggle — premium Switch */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-secondary-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <span className="font-medium text-secondary-800">Gotowy pakiet menu</span>
                        <p className="text-xs text-secondary-500">Ceny zostaną ustawione automatycznie</p>
                      </div>
                    </div>
                    <Controller
                      name="useMenuPackage"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!selectedEventTypeId || !!hasNoPackagesForEventType}
                        />
                      )}
                    />
                  </div>

                  {hasNoPackagesForEventType && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <p className="text-sm text-amber-800">Brak pakietów menu dla tego typu wydarzenia. Użyj ręcznego ustalania cen.</p>
                    </div>
                  )}

                  {useMenuPackage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 p-4 bg-primary-50 border border-primary-200 rounded-xl"
                    >
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-secondary-700">Wybierz pakiet</label>
                        <Controller
                          name="menuPackageId"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value || ''} onValueChange={field.onChange}>
                              <SelectTrigger className="h-11 bg-white">
                                <SelectValue placeholder="Wybierz pakiet..." />
                              </SelectTrigger>
                              <SelectContent>
                                {menuPackagesArray.map((pkg) => (
                                  <SelectItem key={pkg.id} value={pkg.id}>
                                    {pkg.name} — {formatCurrency(parseFloat(pkg.pricePerAdult))}/osoba
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {selectedPackage && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white rounded-lg border border-primary-300">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-secondary-900">{selectedPackage.name}</h4>
                              {selectedPackage.shortDescription && (
                                <p className="text-sm text-secondary-600 mt-1">{selectedPackage.shortDescription}</p>
                              )}
                              <div className="grid grid-cols-3 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-secondary-500">Dorosły</p>
                                  <p className="text-lg font-bold text-primary-600">{formatCurrency(parseFloat(selectedPackage.pricePerAdult))}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-secondary-500">Dziecko 4–12</p>
                                  <p className="text-lg font-bold text-primary-600">{formatCurrency(parseFloat(selectedPackage.pricePerChild))}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-secondary-500">Dziecko 0–3</p>
                                  <p className="text-lg font-bold text-primary-600">{formatCurrency(parseFloat(selectedPackage.pricePerToddler))}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {!useMenuPackage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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
                            label="Cena za dziecko 4–12 (PLN)"
                            placeholder="0.00"
                            error={errors.pricePerChild?.message}
                            disabled={pricePerAdult === 0}
                            {...register('pricePerChild', { onChange: () => setChildPriceManuallySet(true) })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-secondary-500" />
                          <Input
                            type="number"
                            label="Cena za dziecko 0–3 (PLN)"
                            placeholder="0.00"
                            error={errors.pricePerToddler?.message}
                            disabled={pricePerAdult === 0}
                            {...register('pricePerToddler', { onChange: () => setToddlerPriceManuallySet(true) })}
                          />
                        </div>
                      </div>

                      {pricePerAdult > 0 && !childPriceManuallySet && (
                        <p className="text-xs text-secondary-500">
                          💡 Cena za dziecko ustawiona automatycznie na 50% ceny dorosłego. Cena za malucha na 25%.
                          Możesz je zmienić ręcznie.
                        </p>
                      )}
                    </motion.div>
                  )}

                  <PriceSummary />
                </div>
              </StepContent>

              {/* ═══ STEP 4: Klient ═══ */}
              <StepContent stepIndex={4} currentStep={currentStep}>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white mb-3">
                      <User className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-secondary-900">Kto rezerwuje?</h2>
                    <p className="text-sm text-secondary-500 mt-1">Wyszukaj istniejącego klienta lub dodaj nowego</p>
                  </div>

                  {isPromotingFromQueue ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Klient przekazany z kolejki</span>
                      </div>
                      {selectedClient && (
                        <p className="text-sm text-blue-700">
                          {selectedClient.firstName} {selectedClient.lastName}
                          {selectedClient.phone && ` • ${selectedClient.phone}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Controller
                      name="clientId"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={clientComboboxOptions}
                          value={field.value}
                          onChange={field.onChange}
                          label="Klient"
                          placeholder="Wyszukaj klienta po nazwisku, imieniu lub telefonie..."
                          searchPlaceholder="Wpisz imię, nazwisko lub telefon..."
                          emptyMessage="Nie znaleziono klienta."
                          error={errors.clientId?.message}
                          disabled={clientsLoading}
                          footerAction={{
                            label: 'Dodaj nowego klienta',
                            icon: <UserPlus className="h-4 w-4" />,
                            onClick: () => setShowCreateClientModal(true),
                          }}
                        />
                      )}
                    />
                  )}

                  {selectedClient && !isPromotingFromQueue && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">
                            {selectedClient.firstName} {selectedClient.lastName}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-green-700">
                            {selectedClient.phone && <span>{selectedClient.phone}</span>}
                            {selectedClient.email && <span>{selectedClient.email}</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </StepContent>

              {/* ═══ STEP 5: Podsumowanie ═══ */}
              <StepContent stepIndex={5} currentStep={currentStep}>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white mb-3">
                      <ClipboardCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-secondary-900">Sprawdź i utwórz</h2>
                    <p className="text-sm text-secondary-500 mt-1">Przejrzyj dane przed utworzeniem rezerwacji</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-purple-50 border-purple-200 cursor-pointer hover:border-purple-400 transition-colors" onClick={() => goToStep(0)}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600 uppercase">Wydarzenie</span>
                      </div>
                      <p className="font-semibold text-secondary-900">{selectedEventTypeName || '—'}</p>
                      {isBirthday && watchAll.birthdayAge && <p className="text-sm text-secondary-600">{watchAll.birthdayAge}. urodziny</p>}
                      {isAnniversary && watchAll.anniversaryYear && <p className="text-sm text-secondary-600">{watchAll.anniversaryYear}. rocznica</p>}
                      {isCustom && watchAll.customEventType && <p className="text-sm text-secondary-600">{watchAll.customEventType}</p>}
                    </div>

                    <div className="p-4 rounded-xl border bg-blue-50 border-blue-200 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => goToStep(1)}>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600 uppercase">Sala i termin</span>
                      </div>
                      <p className="font-semibold text-secondary-900">{selectedHall?.name || '—'}</p>
                      {startDate && startTime && (
                        <p className="text-sm text-secondary-600">
                          {new Date(`${startDate}T${startTime}`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          {' '}• {startTime}–{endTime || '?'}
                        </p>
                      )}
                      {durationHours > 0 && (
                        <p className={`text-xs ${durationHours > STANDARD_HOURS ? 'text-amber-700 font-medium' : 'text-secondary-500'}`}>
                          {durationHours}h{durationHours > STANDARD_HOURS && ` (w tym ${extraHours}h dodatkowych)`}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border bg-green-50 border-green-200 cursor-pointer hover:border-green-400 transition-colors" onClick={() => goToStep(2)}>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600 uppercase">Goście</span>
                      </div>
                      <p className="text-2xl font-bold text-secondary-900">{totalGuests} osób</p>
                      <p className="text-sm text-secondary-600">
                        {adults} dor. {children > 0 && `+ ${children} dzieci `}{toddlers > 0 && `+ ${toddlers} mal.`}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-indigo-50 border-indigo-200 cursor-pointer hover:border-indigo-400 transition-colors" onClick={() => goToStep(4)}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-600 uppercase">Klient</span>
                      </div>
                      {selectedClient ? (
                        <div>
                          <p className="font-semibold text-secondary-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                          <div className="flex items-center gap-3 text-sm text-secondary-600">
                            {selectedClient.phone && <span>{selectedClient.phone}</span>}
                            {selectedClient.email && <span>{selectedClient.email}</span>}
                          </div>
                        </div>
                      ) : (
                        <p className="text-secondary-500">—</p>
                      )}
                    </div>
                  </div>

                  <div className="cursor-pointer" onClick={() => goToStep(3)}>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-600 uppercase">Podsumowanie finansowe</span>
                      {useMenuPackage && selectedPackage && (
                        <span className="text-xs text-secondary-500">• Pakiet: {selectedPackage.name}</span>
                      )}
                    </div>
                    <PriceSummary compact />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Controller
                      name="confirmationDeadline"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value || ''}
                          onChange={field.onChange}
                          label="Termin potwierdzenia (opcjonalnie)"
                          placeholder="Wybierz datę..."
                          error={errors.confirmationDeadline?.message}
                          minDate={new Date()}
                        />
                      )}
                    />
                    <p className="-mt-2 text-xs text-secondary-500">
                      Musi być co najmniej 1 dzień przed rozpoczęciem wydarzenia
                    </p>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-secondary-500" />
                        <label className="block text-sm font-medium text-secondary-700">Notatki</label>
                      </div>
                      <textarea
                        className="w-full rounded-xl border border-secondary-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 transition-colors resize-none"
                        rows={3}
                        placeholder="Dodatkowe informacje..."
                        {...register('notes')}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Zaliczka</p>
                      <p className="text-xs text-blue-700">
                        Zaliczkę można dodać po utworzeniu rezerwacji, w widoku szczegółów rezerwacji (sekcja finansowa).
                      </p>
                    </div>
                  </div>
                </div>
              </StepContent>

            </AnimatePresence>

            <StepNavigation
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onNext={goToNextStep}
              onPrev={goToPrevStep}
              onSubmit={handleFinalSubmit}
              isNextDisabled={isNextDisabled}
              isSubmitting={createReservation.isPending}
              submitLabel={isPromotingFromQueue ? 'Awansuj do rezerwacji' : 'Utwórz Rezerwację'}
              className="mt-8"
            />
          </form>

          {onCancel && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-secondary-500 hover:text-secondary-700 transition-colors"
                disabled={createReservation.isPending}
              >
                Anuluj tworzenie rezerwacji
              </button>
            </div>
          )}
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
