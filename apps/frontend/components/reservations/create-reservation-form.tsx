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
import { Stepper, StepNavigation, StepConfig } from '@/components/ui/stepper'
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
import { useApplyDiscount } from '@/hooks/use-discount'
import { useHalls } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { useMenuTemplates } from '@/hooks/use-menu-templates'
import { usePackagesByTemplate } from '@/hooks/use-menu-packages'
import { useCheckAvailability } from '@/hooks/use-check-availability'
import { formatCurrency } from '@/lib/utils'
import {
  Calendar, Clock, Users, DollarSign, FileText, UserPlus,
  AlertCircle, Baby, CheckCircle, Smile, UtensilsCrossed,
  Sparkles, Building2, User, ClipboardCheck, AlertTriangle,
  BookOpen, Package, Tag, ChevronRight,
} from 'lucide-react'
import { CreateReservationInput } from '@/types'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import { CreateReservationDiscountSection } from '@/components/reservations/CreateReservationDiscountSection'
import { useQueryClient } from '@tanstack/react-query'

// ═══ STEP CONFIGURATION ═══

const STEPS: StepConfig[] = [
  { id: 'event', title: 'Wydarzenie', icon: Sparkles },
  { id: 'venue', title: 'Sala i termin', icon: Building2 },
  { id: 'guests', title: 'Goście', icon: Users },
  { id: 'menu', title: 'Menu i ceny', icon: UtensilsCrossed },
  { id: 'client', title: 'Klient', icon: User },
  { id: 'summary', title: 'Podsumowanie', icon: ClipboardCheck },
]

const EXTRA_HOUR_RATE = 500
const STANDARD_HOURS = 6

// ═══ SCHEMA ═══

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
  menuTemplateId: z.string().optional(),
  menuPackageId: z.string().optional(),
  pricePerAdult: z.coerce.number().min(0).optional(),
  pricePerChild: z.coerce.number().min(0).optional(),
  pricePerToddler: z.coerce.number().min(0).optional(),
  clientId: z.string().min(1, 'Wybierz klienta'),
  confirmationDeadline: z.string().optional(),
  notes: z.string().optional(),

  // Sprint 7 — Discount (optional)
  discountEnabled: z.boolean().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  discountReason: z.string().optional(),
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
  3: ['useMenuPackage', 'menuTemplateId', 'menuPackageId', 'pricePerAdult', 'pricePerChild', 'pricePerToddler'],
  4: ['clientId'],
  5: ['confirmationDeadline', 'notes'],
}

// ═══ STEP ANIMATION VARIANTS ═══

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

// ═══ PROPS ═══

interface CreateReservationFormProps {
  onSubmit?: (data: any) => void | Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<ReservationFormData>
  isPromotingFromQueue?: boolean
  defaultHallId?: string
}

// ═══ COMPONENT ═══

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

  const { data: halls } = useHalls()
  const { data: clientsData, isLoading: clientsLoading } = useClients()
  const { data: eventTypes } = useEventTypes()
  const createReservation = useCreateReservation()
  const applyDiscount = useApplyDiscount()

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
      discountEnabled: false,
      discountType: 'PERCENTAGE',
      discountReason: '',
      ...initialData,
    },
  })

  const watchAll = watch()
  const useMenuPackage = watch('useMenuPackage')
  const menuTemplateId = watch('menuTemplateId')
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

  // Discount (Sprint 7)
  const discountEnabled = !!watch('discountEnabled')
  const discountType = (watch('discountType') || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED'
  const discountValue = Number(watch('discountValue')) || 0
  const discountReason = watch('discountReason') || ''

  const hallsArray = useMemo(() => Array.isArray(halls?.halls) ? halls.halls : [], [halls])
  const clientsArray = useMemo(() => Array.isArray(clientsData) ? clientsData : [], [clientsData])
  const eventTypesArray = useMemo(() => Array.isArray(eventTypes) ? eventTypes : [], [eventTypes])

  // Menu templates filtered by event type
  const { data: menuTemplates, isLoading: menuTemplatesLoading } = useMenuTemplates(
    selectedEventTypeId ? { eventTypeId: selectedEventTypeId, isActive: true } : undefined
  )
  const menuTemplatesArray = useMemo(() => Array.isArray(menuTemplates) ? menuTemplates : [], [menuTemplates])

  // Packages filtered by selected template
  const { data: templatePackages, isLoading: templatePackagesLoading } = usePackagesByTemplate(menuTemplateId)
  const templatePackagesArray = useMemo(() => Array.isArray(templatePackages) ? templatePackages : [], [templatePackages])

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

  const selectedTemplate = useMemo(() => {
    if (!menuTemplateId || !menuTemplates) return null
    return menuTemplatesArray.find((t) => t.id === menuTemplateId) || null
  }, [menuTemplateId, menuTemplates, menuTemplatesArray])

  const selectedPackage = useMemo(() => {
    if (!menuPackageId || !templatePackages) return null
    return templatePackagesArray.find((pkg) => pkg.id === menuPackageId) || null
  }, [menuPackageId, templatePackages, templatePackagesArray])

  const hasNoTemplatesForEventType = selectedEventTypeId && !menuTemplatesLoading && menuTemplatesArray.length === 0

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

  const discountAmount = useMemo(() => {
    if (!discountEnabled || discountValue <= 0 || totalWithExtras <= 0) return 0
    if (discountType === 'PERCENTAGE') {
      return Math.round((totalWithExtras * discountValue) / 100)
    }
    return Math.min(discountValue, totalWithExtras)
  }, [discountEnabled, discountType, discountValue, totalWithExtras])

  const finalTotalPrice = Math.max(0, totalWithExtras - discountAmount)
  const isDiscountValid = discountEnabled && discountAmount > 0 && discountReason.trim().length >= 3

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

  // Set prices from selected package
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

  // Clear template + package when event type changes
  useEffect(() => {
    if (selectedEventTypeId) {
      // Check if current template belongs to selected event type
      if (menuTemplateId && menuTemplatesArray.length > 0) {
        const isValid = menuTemplatesArray.some((t) => t.id === menuTemplateId)
        if (!isValid) {
          setValue('menuTemplateId', '')
          setValue('menuPackageId', '')
        }
      }
    }
  }, [selectedEventTypeId, menuTemplateId, menuTemplatesArray, setValue])

  // Clear package when template changes
  useEffect(() => {
    if (menuTemplateId && templatePackagesArray.length > 0 && menuPackageId) {
      const isValid = templatePackagesArray.some((pkg) => pkg.id === menuPackageId)
      if (!isValid) {
        setValue('menuPackageId', '')
      }
    }
  }, [menuTemplateId, menuPackageId, templatePackagesArray, setValue])

  // Clear template/package when toggling off menu
  useEffect(() => {
    if (!useMenuPackage) {
      // Don't clear — user might toggle back on
    }
  }, [useMenuPackage])

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
      const hall = hallsArray.find((h) => h.id === hallId) as any
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
      if (useMenuPackage && (!menuTemplateId || !menuPackageId)) return false
    }

    return await trigger(fields)
  }, [currentStep, trigger, adults, children, toddlers, useMenuPackage, pricePerAdult, menuTemplateId, menuPackageId])

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
      if (data.menuTemplateId) {
        input.menuTemplateId = data.menuTemplateId
      }
    } else {
      input.pricePerAdult = data.pricePerAdult
      input.pricePerChild = data.pricePerChild
      input.pricePerToddler = data.pricePerToddler
    }

    const shouldApplyDiscount =
      !!data.discountEnabled &&
      Number(data.discountValue) > 0 &&
      (data.discountReason || '').trim().length >= 3

    try {
      if (onSubmitProp) {
        await onSubmitProp(input)
      } else {
        const result = await createReservation.mutateAsync(input)

        if (result?.id && shouldApplyDiscount) {
          try {
            await applyDiscount.mutateAsync({
              id: result.id,
              input: {
                type: (data.discountType || 'PERCENTAGE') as any,
                value: Number(data.discountValue),
                reason: (data.discountReason || '').trim(),
              },
            })
          } catch (e) {
            // Discount failure shouldn't block reservation creation
          }
        }

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

  const isNextDisabled = useMemo(() => false, [])

  // ═══ PRICE SUMMARY ═══

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
          {useMenuPackage && selectedTemplate && selectedPackage && (
            <p className="text-xs text-primary-700 flex items-center gap-1 pt-1">
              <UtensilsCrossed className="w-3 h-3" />
              {selectedTemplate.name}
              <ChevronRight className="w-3 h-3" />
              {selectedPackage.name}
            </p>
          )}
        </div>
      </motion.div>
    )
  }, [adults, children, toddlers, pricePerAdult, pricePerChild, pricePerToddler, calculatedPrice, extraHours, extraHoursCost, totalWithExtras, useMenuPackage, selectedTemplate, selectedPackage])

  // ═════════════════════════════════════════════════════
  // STEP RENDERERS
  // ═════════════════════════════════════════════════════

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900">Jaki typ wydarzenia?</h2>
        <p className="text-sm text-secondary-500 mt-1">Określ rodzaj imprezy — wpłynie na dostępne szablony menu</p>
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
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.eventTypeId && <p className="text-xs text-red-500">{errors.eventTypeId.message}</p>}
      </div>

      {isBirthday && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Input type="number" label="Które urodziny" placeholder="np. 18" error={errors.birthdayAge?.message} {...register('birthdayAge')} />
        </motion.div>
      )}

      {isCustom && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Input label="Typ wydarzenia (własny)" placeholder="np. Spotkanie rodzinne" error={errors.customEventType?.message} {...register('customEventType')} />
        </motion.div>
      )}

      {isAnniversary && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="number" label="Która rocznica" placeholder="np. 25" error={errors.anniversaryYear?.message} {...register('anniversaryYear')} />
          <Input label="Jaka okazja" placeholder="np. Srebrne wesele" error={errors.anniversaryOccasion?.message} {...register('anniversaryOccasion')} />
        </motion.div>
      )}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900">Wybierz salę i termin</h2>
        <p className="text-sm text-secondary-500 mt-1">Sprawdzimy dostępność automatycznie</p>
      </div>

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
        {errors.hallId && <p className="text-xs text-red-500">{errors.hallId.message}</p>}
      </div>

      {selectedHallCapacity > 0 && (
        <p className="-mt-4 text-sm text-secondary-600">Maksymalna pojemność: {selectedHallCapacity} osób</p>
      )}

      {defaultHallId && watchAll.hallId === defaultHallId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800">Sala wybrana automatycznie z widoku szczegółów</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-secondary-800">Rozpoczęcie</p>
          <Controller name="startDate" control={control} render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} label="Data" placeholder="Wybierz datę..." error={errors.startDate?.message} minDate={new Date()} />
          )} />
          <Controller name="startTime" control={control} render={({ field }) => (
            <TimePicker value={field.value} onChange={field.onChange} label="Godzina" placeholder="Wybierz godzinę..." error={errors.startTime?.message} />
          )} />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-secondary-800">Zakończenie</p>
          <Controller name="endDate" control={control} render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} label="Data" placeholder="Wybierz datę..." error={errors.endDate?.message} disabled={!startDate} minDate={startDate ? new Date(startDate) : undefined} />
          )} />
          <Controller name="endTime" control={control} render={({ field }) => (
            <TimePicker value={field.value} onChange={field.onChange} label="Godzina" placeholder="Wybierz godzinę..." error={errors.endTime?.message} disabled={!startDate || !startTime} />
          )} />
        </div>
      </div>

      {durationHours > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > STANDARD_HOURS ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}
        >
          {durationHours > STANDARD_HOURS && <AlertCircle className="w-5 h-5 text-amber-600" />}
          <span className={`text-sm ${durationHours > STANDARD_HOURS ? 'text-amber-800' : 'text-blue-800'}`}>
            Czas trwania: {durationHours}h
            {durationHours > STANDARD_HOURS && ` (${extraHours}h ponad standard — dopłata zostanie doliczona w wycenie)`}
          </span>
        </motion.div>
      )}

      {hallId && startDateTimeISO && endDateTimeISO && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`p-4 rounded-lg border ${
            availabilityLoading ? 'bg-gray-50 border-gray-200'
              : availability?.available ? 'bg-green-50 border-green-200'
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
              {availability?.conflicts?.map((c: any) => (
                <div key={c.id} className="ml-7 text-xs text-red-700">
                  • {c.clientName} — {c.eventType} ({new Date(c.startDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–{new Date(c.endDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )

  const renderStep2 = () => (
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
          <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-primary-600" /><span className="font-medium text-secondary-700">Dorośli</span></div>
          <Input type="number" placeholder="0" error={errors.adults?.message} className="text-center text-2xl font-bold h-14" {...register('adults')} />
        </div>
        <div className="p-4 rounded-xl border-2 border-secondary-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Smile className="w-5 h-5 text-blue-600" /><span className="font-medium text-secondary-700">Dzieci (4–12)</span></div>
          <Input type="number" placeholder="0" error={errors.children?.message} disabled={adults === 0} className="text-center text-2xl font-bold h-14" {...register('children')} />
        </div>
        <div className="p-4 rounded-xl border-2 border-secondary-200 hover:border-green-300 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Baby className="w-5 h-5 text-green-600" /><span className="font-medium text-secondary-700">Maluchy (0–3)</span></div>
          <Input type="number" placeholder="0" error={errors.toddlers?.message} disabled={adults === 0} className="text-center text-2xl font-bold h-14" {...register('toddlers')} />
        </div>
      </div>

      {totalGuests > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center p-4 bg-primary-50 rounded-xl border border-primary-200">
          <span className="text-secondary-700 mr-3">Łącznie gości:</span>
          <span className="text-3xl font-bold text-primary-600">{totalGuests}</span>
        </motion.div>
      )}

      {totalGuests > selectedHallCapacity && selectedHallCapacity > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-800">Liczba gości ({totalGuests}) przekracza pojemność sali ({selectedHallCapacity})!</span>
        </motion.div>
      )}
    </div>
  )

  // ═══ STEP 3 — SZABLON → PAKIET → CENY ═══

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white mb-3">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900">Menu i wycena</h2>
        <p className="text-sm text-secondary-500 mt-1">Wybierz szablon menu i pakiet cenowy, lub ustaw ceny ręcznie</p>
      </div>

      {/* Toggle: use menu package */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-secondary-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <span className="font-medium text-secondary-800">Gotowe menu</span>
            <p className="text-xs text-secondary-500">Wybierz szablon i pakiet — ceny ustawią się automatycznie</p>
          </div>
        </div>
        <Controller name="useMenuPackage" control={control} render={({ field }) => (
          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!selectedEventTypeId || !!hasNoTemplatesForEventType} />
        )} />
      </div>

      {hasNoTemplatesForEventType && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">Brak szablonów menu dla tego typu wydarzenia. Użyj ręcznego ustalania cen.</p>
        </div>
      )}

      {/* ═══ MENU FLOW: Szablon → Pakiet ═══ */}
      {useMenuPackage && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">

          {/* STEP A: Wybierz szablon menu */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">1</div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-secondary-800">Szablon menu</span>
              </div>
            </div>

            <Controller name="menuTemplateId" control={control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={(val) => {
                field.onChange(val)
                // Clear package when template changes
                setValue('menuPackageId', '')
              }}>
                <SelectTrigger className="h-11 bg-white">
                  <SelectValue placeholder={menuTemplatesLoading ? 'Ładowanie szablonów...' : 'Wybierz szablon menu...'} />
                </SelectTrigger>
                <SelectContent>
                  {menuTemplatesArray.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      <div className="flex items-center gap-2">
                        <span>{tmpl.name}</span>
                        {tmpl.variant && <span className="text-xs text-muted-foreground">({tmpl.variant})</span>}
                        {tmpl._count?.packages != null && (
                          <span className="text-xs text-indigo-500 ml-1">
                            {tmpl._count.packages} {tmpl._count.packages === 1 ? 'pakiet' : tmpl._count.packages < 5 ? 'pakiety' : 'pakietów'}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />

            {selectedTemplate && selectedTemplate.description && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-indigo-700 bg-indigo-100/50 rounded-lg p-2">
                {selectedTemplate.description}
              </motion.p>
            )}
          </div>

          {/* STEP B: Wybierz pakiet (after template is chosen) */}
          {menuTemplateId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-secondary-800">Pakiet cenowy</span>
                </div>
              </div>

              {templatePackagesLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-secondary-600">Ładowanie pakietów...</span>
                </div>
              ) : templatePackagesArray.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">Brak pakietów w tym szablonie. Wybierz inny szablon lub ustaw ceny ręcznie.</p>
                </div>
              ) : (
                <Controller name="menuPackageId" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue placeholder="Wybierz pakiet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templatePackagesArray.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} — {formatCurrency(parseFloat(pkg.pricePerAdult))}/osoba
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              )}

              {/* Package details card */}
              {selectedPackage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white rounded-lg border border-emerald-300">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-secondary-900">{selectedPackage.name}</h4>
                      {selectedPackage.shortDescription && <p className="text-sm text-secondary-600 mt-1">{selectedPackage.shortDescription}</p>}
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-secondary-500">Dorosły</p>
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(parseFloat(selectedPackage.pricePerAdult))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary-500">Dziecko 4–12</p>
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(parseFloat(selectedPackage.pricePerChild))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-secondary-500">Dziecko 0–3</p>
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(parseFloat(selectedPackage.pricePerToddler))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Breadcrumb indicator */}
          {useMenuPackage && (
            <div className="flex items-center gap-2 text-xs text-secondary-500 px-1">
              <span className={menuTemplateId ? 'text-indigo-600 font-medium' : 'text-secondary-400'}>Szablon</span>
              <ChevronRight className="w-3 h-3" />
              <span className={menuPackageId ? 'text-emerald-600 font-medium' : 'text-secondary-400'}>Pakiet</span>
              <ChevronRight className="w-3 h-3" />
              <span className={selectedPackage ? 'text-primary-600 font-medium' : 'text-secondary-400'}>Ceny</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ MANUAL PRICING ═══ */}
      {!useMenuPackage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary-500" />
              <Input type="number" label="Cena za dorosłego (PLN)" placeholder="0.00" error={errors.pricePerAdult?.message} {...register('pricePerAdult')} />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary-500" />
              <Input type="number" label="Cena za dziecko 4–12 (PLN)" placeholder="0.00" error={errors.pricePerChild?.message} disabled={pricePerAdult === 0} {...register('pricePerChild', { onChange: () => setChildPriceManuallySet(true) })} />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary-500" />
              <Input type="number" label="Cena za dziecko 0–3 (PLN)" placeholder="0.00" error={errors.pricePerToddler?.message} disabled={pricePerAdult === 0} {...register('pricePerToddler', { onChange: () => setToddlerPriceManuallySet(true) })} />
            </div>
          </div>
          {pricePerAdult > 0 && !childPriceManuallySet && (
            <p className="text-xs text-secondary-500">💡 Cena za dziecko ustawiona automatycznie na 50% ceny dorosłego. Cena za malucha na 25%. Możesz je zmienić ręcznie.</p>
          )}
        </motion.div>
      )}

      <PriceSummary />

      <CreateReservationDiscountSection
        control={control}
        register={register}
        totalPrice={totalWithExtras}
      />
    </div>
  )

  const renderStep4 = () => (
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
          {selectedClient && <p className="text-sm text-blue-700">{selectedClient.firstName} {selectedClient.lastName}{selectedClient.phone && ` • ${selectedClient.phone}`}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <Controller name="clientId" control={control} render={({ field }) => (
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
            />
          )} />
          <button
            type="button"
            onClick={() => setShowCreateClientModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-primary-300 text-primary-600 font-medium text-sm hover:bg-primary-50 hover:border-primary-400 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Dodaj nowego klienta
          </button>
        </div>
      )}

      {selectedClient && !isPromotingFromQueue && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center"><User className="w-5 h-5 text-green-700" /></div>
            <div>
              <p className="font-semibold text-green-900">{selectedClient.firstName} {selectedClient.lastName}</p>
              <div className="flex items-center gap-3 text-sm text-green-700">
                {selectedClient.phone && <span>{selectedClient.phone}</span>}
                {selectedClient.email && <span>{selectedClient.email}</span>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )

  const renderStep5 = () => (
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
          <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-purple-600" /><span className="text-xs font-medium text-purple-600 uppercase">Wydarzenie</span></div>
          <p className="font-semibold text-secondary-900">{selectedEventTypeName || '—'}</p>
          {isBirthday && watchAll.birthdayAge && <p className="text-sm text-secondary-600">{watchAll.birthdayAge}. urodziny</p>}
          {isAnniversary && watchAll.anniversaryYear && <p className="text-sm text-secondary-600">{watchAll.anniversaryYear}. rocznica</p>}
          {isCustom && watchAll.customEventType && <p className="text-sm text-secondary-600">{watchAll.customEventType}</p>}
        </div>

        <div className="p-4 rounded-xl border bg-blue-50 border-blue-200 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => goToStep(1)}>
          <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-600" /><span className="text-xs font-medium text-blue-600 uppercase">Sala i termin</span></div>
          <p className="font-semibold text-secondary-900">{selectedHall?.name || '—'}</p>
          {startDate && startTime && (
            <p className="text-sm text-secondary-600">
              {new Date(`${startDate}T${startTime}`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {startTime}–{endTime || '?'}
            </p>
          )}
          {durationHours > 0 && (
            <p className={`text-xs ${durationHours > STANDARD_HOURS ? 'text-amber-700 font-medium' : 'text-secondary-500'}`}>
              {durationHours}h{durationHours > STANDARD_HOURS && ` (w tym ${extraHours}h dodatkowych)`}
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl border bg-green-50 border-green-200 cursor-pointer hover:border-green-400 transition-colors" onClick={() => goToStep(2)}>
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-green-600" /><span className="text-xs font-medium text-green-600 uppercase">Goście</span></div>
          <p className="text-2xl font-bold text-secondary-900">{totalGuests} osób</p>
          <p className="text-sm text-secondary-600">{adults} dor. {children > 0 && `+ ${children} dzieci `}{toddlers > 0 && `+ ${toddlers} mal.`}</p>
        </div>

        <div className="p-4 rounded-xl border bg-indigo-50 border-indigo-200 cursor-pointer hover:border-indigo-400 transition-colors" onClick={() => goToStep(4)}>
          <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-indigo-600" /><span className="text-xs font-medium text-indigo-600 uppercase">Klient</span></div>
          {selectedClient ? (
            <div>
              <p className="font-semibold text-secondary-900">{selectedClient.firstName} {selectedClient.lastName}</p>
              <div className="flex items-center gap-3 text-sm text-secondary-600">
                {selectedClient.phone && <span>{selectedClient.phone}</span>}
                {selectedClient.email && <span>{selectedClient.email}</span>}
              </div>
            </div>
          ) : <p className="text-secondary-500">—</p>}
        </div>
      </div>

      <div className="cursor-pointer" onClick={() => goToStep(3)}>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-medium text-orange-600 uppercase">Podsumowanie finansowe</span>
          {useMenuPackage && selectedTemplate && selectedPackage && (
            <span className="text-xs text-secondary-500 flex items-center gap-1">
              • {selectedTemplate.name} <ChevronRight className="w-3 h-3" /> {selectedPackage.name}
            </span>
          )}
        </div>
        <PriceSummary compact />

        {discountEnabled && (
          <div className="mt-3">
            {isDiscountValid ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-secondary-800">Rabat</span>
                  <span className="text-xs text-orange-600 font-medium">
                    {discountType === 'PERCENTAGE' ? `${discountValue}%` : formatCurrency(discountValue)}
                  </span>
                </div>

                {discountReason.trim().length >= 3 && (
                  <p className="text-xs text-orange-600/70 italic">{discountReason}</p>
                )}

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-secondary-600">
                    <span>Cena bazowa</span>
                    <span>{formatCurrency(totalWithExtras)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Rabat</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-orange-200 pt-1">
                    <span>Po rabacie</span>
                    <span className="text-emerald-700">{formatCurrency(finalTotalPrice)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-700" />
                  <span className="font-semibold text-amber-900">Rabat nie zostanie zastosowany</span>
                </div>
                <p className="text-xs text-amber-800 mt-1">Uzupełnij wartość rabatu i powód (min. 3 znaki).</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <Controller name="confirmationDeadline" control={control} render={({ field }) => (
          <DatePicker value={field.value || ''} onChange={field.onChange} label="Termin potwierdzenia (opcjonalnie)" placeholder="Wybierz datę..." error={errors.confirmationDeadline?.message} minDate={new Date()} />
        )} />
        <p className="-mt-2 text-xs text-secondary-500">Musi być co najmniej 1 dzień przed rozpoczęciem wydarzenia</p>

        <div>
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5 text-secondary-500" /><label className="block text-sm font-medium text-secondary-700">Notatki</label></div>
          <textarea className="w-full rounded-xl border border-secondary-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 transition-colors resize-none" rows={3} placeholder="Dodatkowe informacje..." {...register('notes')} />
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Zaliczka</p>
          <p className="text-xs text-blue-700">Zaliczkę można dodać po utworzeniu rezerwacji, w widoku szczegółów rezerwacji (sekcja finansowa).</p>
        </div>
      </div>
    </div>
  )

  // Map step index to renderer
  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5]

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
              <motion.div
                key={`step-${currentStep}`}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {stepRenderers[currentStep]()}
              </motion.div>
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
              <button type="button" onClick={onCancel} className="text-sm text-secondary-500 hover:text-secondary-700 transition-colors" disabled={createReservation.isPending}>
                Anuluj tworzenie rezerwacji
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {!isPromotingFromQueue && (
        <CreateClientModal open={showCreateClientModal} onClose={() => setShowCreateClientModal(false)} onSuccess={handleClientCreated} />
      )}
    </motion.div>
  )
}
