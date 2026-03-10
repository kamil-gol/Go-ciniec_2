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

// ═══ HELPER: Convert local date+time strings to ISO with timezone offset ═══
// Fixes UTC+1 (Warsaw) shift: without offset, backend stores 14:00Z instead of 13:00Z,
// causing the UI to display times 1 hour later than entered.
function toLocalISO(dateStr: string, timeStr: string): string {
  const dt = new Date(`${dateStr}T${timeStr}:00`)
  const offsetMin = -dt.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${dateStr}T${timeStr}:00${sign}${hh}:${mm}`
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
  }, [selectedEventTypeId, eventTypesArray])

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

  // tz-aware ISO strings for availability checks
  const startDateTimeISO = useMemo(() => {
    if (startDate && startTime) return toLocalISO(startDate, startTime)
    return undefined
  }, [startDate, startTime])

  const endDateTimeISO = useMemo(() => {
    if (endDate && endTime) return toLocalISO(endDate, endTime)
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
      setValue('endDate', `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`)
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
    // toLocalISO ensures the ISO string includes the Warsaw UTC+1 offset,
    // preventing the backend (UTC) from shifting the time by +1h on storage.
    const startDateTime = toLocalISO(data.startDate, data.startTime)
    const endDateTime = toLocalISO(data.endDate, data.endTime)

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

  // ═══ STEP 3 — SZABLON → PAKIET → CENY ═══

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white mb-3">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Menu i wycena</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Wybierz szablon menu i pakiet cenowy, lub ustaw ceny ręcznie</p>
      </div>

      {/* Toggle: use menu package */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800/50 dark:to-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Gotowe menu</span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Wybierz szablon i pakiet — ceny ustawią się automatycznie</p>
          </div>
        </div>
        <Controller name="useMenuPackage" control={control} render={({ field }) => (
          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!selectedEventTypeId || !!hasNoTemplatesForEventType} />
        )} />
      </div>

      {hasNoTemplatesForEventType && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">Brak szablonów menu dla tego typu wydarzenia. Użyj ręcznego ustalania cen.</p>
        </div>
      )}

      {/* ═══ MENU FLOW: Szablon → Pakiet ═══ */}
      {useMenuPackage && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">

          {/* STEP A: Wybierz szablon menu */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">1</div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Szablon menu</span>
              </div>
            </div>

            <Controller name="menuTemplateId" control={control} render={({ field }) => (
              <Select value={field.value || ''} onValueChange={(val) => {
                field.onChange(val)
                setValue('menuPackageId', '')
              }}>
                <SelectTrigger className="h-11 bg-white dark:bg-neutral-900">
                  <SelectValue placeholder={menuTemplatesLoading ? 'Ładowanie szablonów...' : 'Wybierz szablon menu...'} />
                </SelectTrigger>
                <SelectContent>
                  {menuTemplatesArray.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      <div className="flex items-center gap-2">
                        <span>{tmpl.name}</span>
                        {tmpl.variant && <span className="text-xs text-muted-foreground">({tmpl.variant})</span>}
                        {tmpl._count?.packages != null && (
                          <span className="text-xs text-indigo-500 dark:text-indigo-400 ml-1">
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
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg p-2">
                {selectedTemplate.description}
              </motion.p>
            )}
          </div>

          {/* STEP B: Wybierz pakiet (after template is chosen) */}
          {menuTemplateId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Pakiet cenowy</span>
                </div>
              </div>

              {templatePackagesLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Ładowanie pakietów...</span>
                </div>
              ) : templatePackagesArray.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">Brak pakietów w tym szablonie. Wybierz inny szablon lub ustaw ceny ręcznie.</p>
                </div>
              ) : (
                <Controller name="menuPackageId" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 bg-white dark:bg-neutral-900">
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedPackage.name}</h4>
                      {selectedPackage.shortDescription && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{selectedPackage.shortDescription}</p>}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3">
                        <div className="text-center sm:text-left">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Dorosły</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(selectedPackage.pricePerAdult))}</p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Dziecko 4–12</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(selectedPackage.pricePerChild))}</p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Dziecko 0–3</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(selectedPackage.pricePerToddler))}</p>
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
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 px-1">
              <span className={menuTemplateId ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}>Szablon</span>
              <ChevronRight className="w-3 h-3" />
              <span className={menuPackageId ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}>Pakiet</span>
              <ChevronRight className="w-3 h-3" />
              <span className={selectedPackage ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'}>Ceny</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ MANUAL PRICING ═══ */}
      {!useMenuPackage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              <Input type="number" label="Cena za dorosłego (PLN)" placeholder="0.00" error={errors.pricePerAdult?.message} onFocus={selectAllOnFocus} {...register('pricePerAdult')} />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              <Input type="number" label="Cena za dziecko 4–12 (PLN)" placeholder="0.00" error={errors.pricePerChild?.message} disabled={pricePerAdult === 0} onFocus={selectAllOnFocus} {...register('pricePerChild', { onChange: () => setChildPriceManuallySet(true) })} />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
              <Input type="number" label="Cena za dziecko 0–3 (PLN)" placeholder="0.00" error={errors.pricePerToddler?.message} disabled={pricePerAdult === 0} onFocus={selectAllOnFocus} {...register('pricePerToddler', { onChange: () => setToddlerPriceManuallySet(true) })} />
            </div>
          </div>
          {pricePerAdult > 0 && !childPriceManuallySet && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">💡 Cena za dziecko ustawiona automatycznie na 50% ceny dorosłego. Cena za malucha na 25%. Możesz je zmienić ręcznie.</p>
          )}
        </motion.div>
      )}

      <PriceSummary />

      <CreateReservationDiscountSection
        control={control}
        register={register}
        totalPrice={totalWithExtras}
      />

      {/* Service Extras — Sprint 8 */}         <CreateReservationExtrasSection           selectedExtras={selectedExtras}           onExtrasChange={setSelectedExtras}           totalGuests={totalGuests}         />
      <CreateReservationExtrasSection
        selectedExtras={selectedExtras}
        onExtrasChange={setSelectedExtras}
        totalGuests={totalGuests}
      />
    </div>
  )

  const renderStep4 = () => {
    const isClientCompany = (selectedClient as any)?.clientType === 'COMPANY'
    const clientCompanyName = (selectedClient as any)?.companyName
    const clientNip = (selectedClient as any)?.nip
    const clientPrimaryContact = (selectedClient as any)?.contacts?.find((c: any) => c.isPrimary)

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white mb-3">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Kto rezerwuje?</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Wyszukaj istniejącego klienta lub dodaj nowego</p>
        </div>

        {isPromotingFromQueue ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Klient przekazany z kolejki</span>
            </div>
            {selectedClient && (
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {isClientCompany && clientCompanyName ? (
                  <div className="space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {clientCompanyName}
                    </p>
                    <p>{selectedClient.firstName} {selectedClient.lastName}{clientNip && ` · NIP: ${clientNip}`}</p>
                  </div>
                ) : (
                  <p>{selectedClient.firstName} {selectedClient.lastName}{selectedClient.phone && ` • ${selectedClient.phone}`}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Controller name="clientId" control={control} render={({ field }) => (
              <Combobox
                options={clientComboboxOptions}
                value={field.value}
                onChange={field.onChange}
                label="Klient"
                placeholder="Wyszukaj po nazwisku, firmie lub NIP..."
                searchPlaceholder="Wpisz imię, nazwisko, firmę lub NIP..."
                emptyMessage="Nie znaleziono klienta."
                error={errors.clientId?.message}
                disabled={clientsLoading}
              />
            )} />
            <button
              type="button"
              onClick={() => setShowCreateClientModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Dodaj nowego klienta
            </button>
          </div>
        )}

        {selectedClient && !isPromotingFromQueue && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isClientCompany ? 'bg-purple-200 dark:bg-purple-800' : 'bg-green-200 dark:bg-green-800'}`}>
                {isClientCompany ? <Building2 className="w-5 h-5 text-purple-700 dark:text-purple-300" /> : <User className="w-5 h-5 text-green-700 dark:text-green-300" />}
              </div>
              <div className="flex-1 min-w-0">
                {isClientCompany && clientCompanyName ? (
                  <>
                    <p className="font-semibold text-green-900 dark:text-green-100">{clientCompanyName}</p>
                    {clientNip && <p className="text-xs text-green-700 dark:text-green-300">NIP: {clientNip}</p>}
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mt-1">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedClient.firstName} {selectedClient.lastName}</span>
                      {clientPrimaryContact && clientPrimaryContact.firstName !== selectedClient.firstName && (
                        <span className="text-xs">· {clientPrimaryContact.firstName} {clientPrimaryContact.lastName}{clientPrimaryContact.role ? ` (${clientPrimaryContact.role})` : ''}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-green-900 dark:text-green-100">{selectedClient.firstName} {selectedClient.lastName}</p>
                    <div className="flex items-center gap-3 text-sm text-green-700 dark:text-green-300">
                      {selectedClient.phone && <span>{selectedClient.phone}</span>}
                      {selectedClient.email && <span>{selectedClient.email}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white mb-3">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Sprawdź i utwórz</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Przejrzyj dane przed utworzeniem rezerwacji</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors" onClick={() => goToStep(0)}>
          <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /><span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">Wydarzenie</span></div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedEventTypeName || '—'}</p>
          {isBirthday && watchAll.birthdayAge && <p className="text-sm text-neutral-600 dark:text-neutral-400">{watchAll.birthdayAge}. urodziny</p>}
          {isAnniversary && watchAll.anniversaryYear && <p className="text-sm text-neutral-600 dark:text-neutral-400">{watchAll.anniversaryYear}. rocznica</p>}
          {isCustom && watchAll.customEventType && <p className="text-sm text-neutral-600 dark:text-neutral-400">{watchAll.customEventType}</p>}
        </div>

        <div className="p-4 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors" onClick={() => goToStep(1)}>
          <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /><span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Sala i termin</span></div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedHall?.name || '—'}</p>
          {startDate && startTime && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {new Date(`${startDate}T${startTime}`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {startTime}–{endTime || '?'}
            </p>
          )}
          {durationHours > 0 && (
            <p className={`text-xs ${durationHours > standardHours ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {durationHours}h{durationHours > standardHours && ` (w tym ${extraHours}h dodatkowych)`}
            </p>
          )}
          {venueSurchargeAmount > 0 && (
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3" />
              {venueSurcharge.label}: +{formatCurrency(venueSurchargeAmount)}
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors" onClick={() => goToStep(2)}>
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-green-600 dark:text-green-400" /><span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Goście</span></div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalGuests} osób</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{adults} dor. {children > 0 && `+ ${children} dzieci `}{toddlers > 0 && `+ ${toddlers} mal.`}</p>
        </div>

        <div className="p-4 rounded-xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors" onClick={() => goToStep(4)}>
          <div className="flex items-center gap-2 mb-2">
            {(selectedClient as any)?.clientType === 'COMPANY' ? <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">Klient</span>
            {(selectedClient as any)?.clientType === 'COMPANY' && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">Firma</span>}
          </div>
          {selectedClient ? (
            <div>
              {(selectedClient as any).clientType === 'COMPANY' && (selectedClient as any).companyName ? (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{(selectedClient as any).companyName}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{selectedClient.firstName} {selectedClient.lastName}{(selectedClient as any).nip ? ` · NIP: ${(selectedClient as any).nip}` : ''}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {selectedClient.phone && <span>{selectedClient.phone}</span>
                    }
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                  </div>
                </>
              )}
            </div>
          ) : <p className="text-neutral-500 dark:text-neutral-400">—</p>}
        </div>
      </div>

      <div className="cursor-pointer" onClick={() => goToStep(3)}>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Podsumowanie finansowe</span>
          {useMenuPackage && selectedTemplate && selectedPackage && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              • {selectedTemplate.name} <ChevronRight className="w-3 h-3" /> {selectedPackage.name}
            </span>
          )}
        </div>
        <PriceSummary compact />

        {discountEnabled && (
          <div className="mt-3">
            {isDiscountValid ? (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-1 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Rabat</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    {discountType === 'PERCENTAGE' ? `${discountValue}%` : formatCurrency(discountValue)}
                  </span>
                </div>

                {discountReason.trim().length >= 3 && (
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70 italic">{discountReason}</p>
                )}

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Cena bazowa</span>
                    <span>{formatCurrency(totalWithExtras)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 dark:text-orange-400 font-medium">
                    <span>Rabat</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-orange-200 dark:border-orange-800 pt-1">
                    <span className="text-neutral-900 dark:text-neutral-100">Po rabacie</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(finalTotalPrice)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span className="font-semibold text-amber-900 dark:text-amber-100">Rabat nie zostanie zastosowany</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Uzupełnij wartość rabatu i powód (min. 3 znaki).</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service extras compact view — Stage 3 */}
      {selectedExtras.length > 0 && (
        <div className="cursor-pointer" onClick={() => goToStep(3)}>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase">Usługi dodatkowe</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              • {selectedExtras.length} {selectedExtras.length === 1 ? 'usługa' : selectedExtras.length < 5 ? 'usługi' : 'usług'}
            </span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
            {selectedExtras.map((extra) => (
              <div key={extra.serviceItem.id} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">
                  {extra.serviceItem.name} {extra.quantity > 1 ? `×${extra.quantity}` : ''}
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {extra.serviceItem.priceType === 'FREE'
                    ? 'Gratis'
                    : extra.serviceItem.priceType === 'PER_PERSON'
                      ? formatCurrency(extra.serviceItem.basePrice * totalGuests * extra.quantity)
                      : formatCurrency(extra.serviceItem.basePrice * extra.quantity)}
                </span>
              </div>
            ))}
            {extrasTotal > 0 && (
              <div className="flex justify-between text-sm font-semibold border-t border-rose-200 dark:border-rose-700 pt-1 mt-1">
                <span className="text-neutral-800 dark:text-neutral-200">Razem usługi dodatkowe</span>
                <span className="text-rose-600 dark:text-rose-400">+{formatCurrency(extrasTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <Controller name="confirmationDeadline" control={control} render={({ field }) => (
          <DatePicker value={field.value || ''} onChange={field.onChange} label="Termin potwierdzenia (opcjonalnie)" placeholder="Wybierz datę..." error={errors.confirmationDeadline?.message} minDate={new Date()} />
        )} />
        <p className="-mt-2 text-xs text-neutral-500 dark:text-neutral-400">Musi być co najmniej 1 dzień przed rozpoczęciem wydarzenia</p>

        <div>
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Notatki</label></div>
          <textarea className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 dark:hover:border-primary-600 transition-colors resize-none" rows={3} placeholder="Dodatkowe informacje..." {...register('notes')} />
        </div>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Zaliczka</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Zaliczkę można dodać po utworzeniu rezerwacji, w widoku szczegółów rezerwacji (sekcja finansowa).</p>
        </div>
      </div>
    </div>
  )

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
          <CardHeader className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
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
              <button type="button" onClick={onCancel} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors" disabled={createReservation.isPending}>
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
