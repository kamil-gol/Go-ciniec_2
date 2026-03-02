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
import { useHalls, useAvailableCapacity } from '@/hooks/use-halls'
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
import { CreateReservationExtrasSection } from '@/components/service-extras/CreateReservationExtrasSection'
import type { SelectedExtra } from '@/components/service-extras/CreateReservationExtrasSection'
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

const DEFAULT_EXTRA_HOUR_RATE = 500
const DEFAULT_STANDARD_HOURS = 6

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

// ═══ HELPER: Select all text on focus for number inputs ═══
const selectAllOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select()
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
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])

  const { data: halls } = useHalls()
  const { data: clientsData, isLoading: clientsLoading } = useClients()
  const { data: eventTypes } = useEventTypes()
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

  const selectedEventType = useMemo(() => {
    if (!selectedEventTypeId) return null
    return (eventTypesArray as any[]).find((t) => t.id === selectedEventTypeId) || null
  }, [eventTypesArray, selectedEventTypeId])

  const standardHours = Number((selectedEventType as any)?.standardHours) || DEFAULT_STANDARD_HOURS
  const extraHourRate = Number((selectedEventType as any)?.extraHourRate) || DEFAULT_EXTRA_HOUR_RATE

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

  // #165: Available capacity for multi-booking halls
  const { data: availableCapacity, isLoading: capacityLoading } = useAvailableCapacity(
    hallId, startDateTimeISO, endDateTimeISO
  )

  const selectedHall = useMemo(() => hallsArray.find((h) => h.id === hallId), [hallsArray, hallId])
  const selectedHallCapacity = selectedHall?.capacity || 0

  // #165: Is this hall in multi-booking mode?
  const isMultiBookingHall = !!(selectedHall as any)?.allowMultipleBookings

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
    if (durationHours > standardHours) return Math.ceil(durationHours - standardHours)
    return 0
  }, [durationHours, standardHours])

  const extraHoursCost = extraHours * extraHourRate

  // Stage 3: Calculate total from selected service extras
  const extrasTotal = useMemo(() => {
    let total = 0
    for (const extra of selectedExtras) {
      const item = extra.serviceItem
      if (item.priceType === 'FREE') continue
      if (item.priceType === 'PER_PERSON') {
        total += item.basePrice * totalGuests * extra.quantity
      } else {
        total += item.basePrice * extra.quantity
      }
    }
    return total
  }, [selectedExtras, totalGuests])

  // #137: Venue surcharge for "Cały Obiekt"
  const venueSurcharge = useMemo(() => {
    if (!selectedHall || !(selectedHall as any).isWholeVenue) {
      return { amount: 0, label: null as string | null }
    }
    if (totalGuests < 30) {
      return { amount: 3000, label: 'Dopłata za cały obiekt (poniżej 30 gości)' }
    }
    return { amount: 2000, label: 'Dopłata za cały obiekt (30+ gości)' }
  }, [selectedHall, totalGuests])
  const venueSurchargeAmount = venueSurcharge.amount

  const totalWithExtras = calculatedPrice + extraHoursCost + extrasTotal + venueSurchargeAmount

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
      const end = new Date(start.getTime() + standardHours * 60 * 60 * 1000)
      setValue('endDate', end.toISOString().split('T')[0])
      setValue('endTime', end.toTimeString().slice(0, 5))
    }
  }, [startDate, startTime, watchAll.endDate, watchAll.endTime, setValue, standardHours])

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
      // #165: Block if guests exceed available capacity for multi-booking halls
      if (isMultiBookingHall && availableCapacity && (adults + children + toddlers) > availableCapacity.availableCapacity) {
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
  }, [currentStep, trigger, adults, children, toddlers, useMenuPackage, pricePerAdult, menuTemplateId, menuPackageId, isMultiBookingHall, availableCapacity])

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

    // Sprint 7: Atomowy rabat
    const shouldApplyDiscount =
      !!data.discountEnabled &&
      Number(data.discountValue) > 0 &&
      (data.discountReason || '').trim().length >= 3

    if (shouldApplyDiscount) {
      input.discountType = (data.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED'
      input.discountValue = Number(data.discountValue)
      input.discountReason = (data.discountReason || '').trim()
    }

    // Sprint 8: Service extras
    if (selectedExtras.length > 0) {
      input.serviceExtras = selectedExtras.map((extra) => {
        const item = extra.serviceItem
        let unitPrice = item.basePrice
        let totalPrice = 0

        if (item.priceType === 'FREE') {
          unitPrice = 0
          totalPrice = 0
        } else if (item.priceType === 'PER_PERSON') {
          totalPrice = item.basePrice * totalGuests * extra.quantity
        } else {
          // FLAT
          totalPrice = item.basePrice * extra.quantity
        }

        return {
          serviceItemId: item.id,
          quantity: extra.quantity,
          unitPrice,
          totalPrice,
        }
      })
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
    clientsArray.map((client) => {
      const isCompany = (client as any).clientType === 'COMPANY'
      const companyName = (client as any).companyName
      const nip = (client as any).nip

      if (isCompany && companyName) {
        return {
          value: client.id,
          label: `🏢 ${companyName} · ${client.firstName} ${client.lastName}`,
          description: nip ? `NIP: ${nip}` : client.email || undefined,
          secondaryLabel: client.phone || undefined,
        }
      }
      return {
        value: client.id,
        label: `${client.firstName} ${client.lastName}`,
        description: client.email || undefined,
        secondaryLabel: client.phone || undefined,
      }
    }),
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
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            : 'bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800'
        }`}
      >
        <div className="space-y-2">
          {adults > 0 && (
            <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
              <span>Dorośli: {adults} × {pricePerAdult} PLN</span>
              <span className="font-medium">{adults * pricePerAdult} PLN</span>
            </div>
          )}
          {children > 0 && (
            <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
              <span>Dzieci (4–12): {children} × {pricePerChild} PLN</span>
              <span className="font-medium">{children * pricePerChild} PLN</span>
            </div>
          )}
          {toddlers > 0 && (
            <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
              <span>Dzieci (0–3): {toddlers} × {pricePerToddler} PLN</span>
              <span className="font-medium">{toddlers * pricePerToddler} PLN</span>
            </div>
          )}
          {calculatedPrice > 0 && extraHoursCost > 0 && (
            <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300 pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span className="font-medium">Podsuma menu / goście:</span>
              <span className="font-medium">{formatCurrency(calculatedPrice)}</span>
            </div>
          )}
          {extraHoursCost > 0 && (
            <div className="flex justify-between text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 -mx-4 px-4 py-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Dodatkowe godziny: {extraHours}h × {extraHourRate} PLN
              </span>
              <span className="font-medium">{formatCurrency(extraHoursCost)}</span>
            </div>
          )}
          {extrasTotal > 0 && (
            <div className="flex justify-between text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 -mx-4 px-4 py-2">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                Usługi dodatkowe ({selectedExtras.length})
              </span>
              <span className="font-medium">+{formatCurrency(extrasTotal)}</span>
            </div>
          )}
          {venueSurchargeAmount > 0 && (
            <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 -mx-4 px-4 py-2">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {venueSurcharge.label}
              </span>
              <span className="font-medium">+{formatCurrency(venueSurchargeAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-primary-300 dark:border-primary-700">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Cena całkowita:</span>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalWithExtras)}</span>
          </div>
          {useMenuPackage && selectedTemplate && selectedPackage && (
            <p className="text-xs text-primary-700 dark:text-primary-300 flex items-center gap-1 pt-1">
              <UtensilsCrossed className="w-3 h-3" />
              {selectedTemplate.name}
              <ChevronRight className="w-3 h-3" />
              {selectedPackage.name}
            </p>
          )}
        </div>
      </motion.div>
    )
  }, [adults, children, toddlers, pricePerAdult, pricePerChild, pricePerToddler, calculatedPrice, extraHours, extraHoursCost, extrasTotal, selectedExtras, totalWithExtras, useMenuPackage, selectedTemplate, selectedPackage, venueSurchargeAmount, venueSurcharge, extraHourRate])

  // ═════════════════════════════════════════════════════════
  // STEP RENDERERS
  // ═════════════════════════════════════════════════════════

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Jaki typ wydarzenia?</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Określ rodzaj imprezy — wpłynie na dostępne szablony menu</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Typ wydarzenia</label>
        <Controller
          name="eventTypeId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={`h-11 ${errors.eventTypeId ? 'border-red-400 dark:border-red-500' : ''}`}>
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
        {errors.eventTypeId && <p className="text-xs text-red-500 dark:text-red-400">{errors.eventTypeId.message}</p>}
      </div>

      {isBirthday && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Input type="number" label="Które urodziny" placeholder="np. 18" error={errors.birthdayAge?.message} onFocus={selectAllOnFocus} {...register('birthdayAge')} />
        </motion.div>
      )}

      {isCustom && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Input label="Typ wydarzenia (własny)" placeholder="np. Spotkanie rodzinne" error={errors.customEventType?.message} {...register('customEventType')} />
        </motion.div>
      )}

      {isAnniversary && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="number" label="Która rocznica" placeholder="np. 25" error={errors.anniversaryYear?.message} onFocus={selectAllOnFocus} {...register('anniversaryYear')} />
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
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Wybierz salę i termin</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Sprawdzimy dostępność automatycznie</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sala</label>
        <Controller
          name="hallId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={`h-11 ${errors.hallId ? 'border-red-400 dark:border-red-500' : ''}`}>
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
        {errors.hallId && <p className="text-xs text-red-500 dark:text-red-400">{errors.hallId.message}</p>}
      </div>

      {selectedHallCapacity > 0 && (
        <p className="-mt-4 text-sm text-neutral-600 dark:text-neutral-400">Maksymalna pojemność: {selectedHallCapacity} osób</p>
      )}

      {selectedHall && (selectedHall as any).isWholeVenue && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Cały obiekt</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Do tej rezerwacji zostanie doliczona dopłata za wynajem całego obiektu (2 000 – 3 000 PLN w zależności od liczby gości).</p>
          </div>
        </motion.div>
      )}

      {defaultHallId && watchAll.hallId === defaultHallId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-200">Sala wybrana automatycznie z widoku szczegółów</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Rozpoczęcie</p>
          <Controller name="startDate" control={control} render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} label="Data" placeholder="Wybierz datę..." error={errors.startDate?.message} minDate={new Date()} />
          )} />
          <Controller name="startTime" control={control} render={({ field }) => (
            <TimePicker value={field.value} onChange={field.onChange} label="Godzina" placeholder="Wybierz godzinę..." error={errors.startTime?.message} />
          )} />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Zakończenie</p>
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
          className={`p-3 rounded-lg flex items-center gap-2 ${durationHours > standardHours ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}
        >
          {durationHours > standardHours && <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          <span className={`text-sm ${durationHours > standardHours ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>
            Czas trwania: {durationHours}h
            {durationHours > standardHours && ` (${extraHours}h ponad standard — dopłata zostanie doliczona w wycenie)`}
          </span>
        </motion.div>
      )}

      {hallId && startDateTimeISO && endDateTimeISO && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`p-4 rounded-lg border ${
            availabilityLoading ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
              : availability?.available ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          {availabilityLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Sprawdzanie dostępności...</span>
            </div>
          ) : availability?.available ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Sala jest dostępna w wybranym terminie</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">Kolizja z istniejącą rezerwacją!</span>
              </div>
              {availability?.conflicts?.map((c: any) => (
                <div key={c.id} className="ml-7 text-xs text-red-700 dark:text-red-300">
                  • {c.clientName} — {c.eventType} ({new Date(c.startDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}–{new Date(c.endDateTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })})
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* #165: Capacity banner for multi-booking halls */}
      {isMultiBookingHall && hallId && startDateTimeISO && endDateTimeISO && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
        >
          {capacityLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Sprawdzanie pojemności...</span>
            </div>
          ) : availableCapacity ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Tryb wielu rezerwacji — pojemność sali</span>
              </div>
              <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300">
                <span>Zajęto: {availableCapacity.occupiedCapacity} osób</span>
                <span>Wolne: {availableCapacity.availableCapacity} z {availableCapacity.totalCapacity}</span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    availableCapacity.availableCapacity === 0
                      ? 'bg-red-500'
                      : availableCapacity.occupiedCapacity / availableCapacity.totalCapacity >= 0.9
                      ? 'bg-amber-500'
                      : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((availableCapacity.occupiedCapacity / availableCapacity.totalCapacity) * 100))}%` }}
                />
              </div>
              {availableCapacity.overlappingReservations > 0 && (
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {availableCapacity.overlappingReservations}{' '}
                  {availableCapacity.overlappingReservations === 1 ? 'rezerwacja' : availableCapacity.overlappingReservations < 5 ? 'rezerwacje' : 'rezerwacji'} w tym terminie
                </p>
              )}
              {availableCapacity.availableCapacity === 0 && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  ⚠ Sala jest całkowicie zajęta — brak wolnych miejsc
                </p>
              )}
            </div>
          ) : null}
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
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Ilu gości?</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Podaj liczbę osób w każdej grupie wiekowej</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-primary-600 dark:text-primary-400" /><span className="font-medium text-neutral-700 dark:text-neutral-300">Dorośli</span></div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            error={errors.adults?.message}
            className="text-center text-2xl font-bold h-14"
            onFocus={selectAllOnFocus}
            {...register('adults')}
          />
        </div>
        <div className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Smile className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="font-medium text-neutral-700 dark:text-neutral-300">Dzieci (4–12)</span></div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            error={errors.children?.message}
            disabled={adults === 0}
            className="text-center text-2xl font-bold h-14"
            onFocus={selectAllOnFocus}
            {...register('children')}
          />
        </div>
        <div className="p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-green-300 dark:hover:border-green-600 transition-colors">
          <div className="flex items-center gap-2 mb-3"><Baby className="w-5 h-5 text-green-600 dark:text-green-400" /><span className="font-medium text-neutral-700 dark:text-neutral-300">Maluchy (0–3)</span></div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            error={errors.toddlers?.message}
            disabled={adults === 0}
            className="text-center text-2xl font-bold h-14"
            onFocus={selectAllOnFocus}
            {...register('toddlers')}
          />
        </div>
      </div>

      {totalGuests > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <span className="text-neutral-700 dark:text-neutral-300 mr-3">Łącznie gości:</span>
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalGuests}</span>
        </motion.div>
      )}

      {totalGuests > selectedHallCapacity && selectedHallCapacity > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-200">Liczba gości ({totalGuests}) przekracza pojemność sali ({selectedHallCapacity})!</span>
        </motion.div>
      )}

      {/* #165: Purple warning banner — multi-booking available capacity exceeded */}
      {isMultiBookingHall && availableCapacity && totalGuests > availableCapacity.availableCapacity && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Zbyt wielu gości dla tego terminu
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
              Wpisano {totalGuests} gości, ale w wybranym terminie dostępne jest tylko{' '}
              <strong>{availableCapacity.availableCapacity}</strong> miejsc
              (zajęto {availableCapacity.occupiedCapacity} z {availableCapacity.totalCapacity}).
              Zmniejsz liczbę gości, aby przejść dalej.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )

  // NOTE: Rest of file unchanged

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* ... existing code ... */}
    </div>
  )

  const renderStep4 = () => {
    return (
      <div className="space-y-6">
        {/* ... existing code ... */}
      </div>
    )
  }

  const renderStep5 = () => (
    <div className="space-y-6">
      {/* ... existing code ... */}
    </div>
  )

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5]

  return (
    <motion.div ref={formRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* ... existing code ... */}
    </motion.div>
  )
}
