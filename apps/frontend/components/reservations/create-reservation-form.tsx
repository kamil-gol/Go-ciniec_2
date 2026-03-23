'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stepper, StepNavigation, StepConfig } from '@/components/ui/stepper'
import { useCreateReservation } from '@/hooks/use-reservations'
import { useHalls, useAvailableCapacity } from '@/hooks/use-halls'
import { useClients } from '@/hooks/use-clients'
import { useEventTypes } from '@/hooks/use-event-types'
import { useMenuTemplates, usePackagesByTemplate } from '@/hooks/use-menu-config'
import { useCheckAvailability } from '@/hooks/use-check-availability'
import {
  Users, UtensilsCrossed, Sparkles, Building2, User, ClipboardCheck,
} from 'lucide-react'
import { CreateReservationInput } from '@/types'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import type { SelectedExtra } from '@/components/service-extras/CreateReservationExtrasSection'
// #216: CategoryExtrasSelector removed — extras now handled exclusively via DishSelector
import { useQueryClient } from '@tanstack/react-query'

// Extracted sub-components
import { reservationSchema, STEP_FIELDS, DEFAULT_EXTRA_HOUR_RATE, DEFAULT_STANDARD_HOURS } from './create-form/validation'
import type { ReservationFormData } from './create-form/validation'
import type { CreateReservationFormProps, FormContext } from './create-form/types'
import { stepVariants, toLocalISO } from './create-form/utils'
import { EventSection } from './create-form/EventSection'
import { VenueSection } from './create-form/VenueSection'
import { GuestsSection } from './create-form/GuestsSection'
import { MenuSection } from './create-form/MenuSection'
import { ClientSection } from './create-form/ClientSection'
import { SummarySection } from './create-form/SummarySection'
import { PriceSummary } from './create-form/PriceSummary'

// ═══ STEP CONFIGURATION ═══

const STEPS: StepConfig[] = [
  { id: 'event', title: 'Wydarzenie', icon: Sparkles },
  { id: 'venue', title: 'Sala i termin', icon: Building2 },
  { id: 'guests', title: 'Goście', icon: Users },
  { id: 'menu', title: 'Menu i ceny', icon: UtensilsCrossed },
  { id: 'client', title: 'Klient', icon: User },
  { id: 'summary', title: 'Podsumowanie', icon: ClipboardCheck },
]

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
  // #216: categoryExtras removed from create form — handled via DishSelector in edit flow

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

  // #137: Venue surcharge for "Caly Obiekt"
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

  // ═══ SHARED FORM CONTEXT ═══

  const formCtx: FormContext = useMemo(() => ({
    control,
    register,
    errors,
    watch,
    setValue,
  }), [control, register, errors, watch, setValue])

  // ═══ PRICE SUMMARY WRAPPER ═══
  // Wraps the extracted PriceSummary component to pass all computed values,
  // so child sections can render it as <BoundPriceSummary compact />

  const BoundPriceSummary = useCallback(({ compact = false }: { compact?: boolean }) => (
    <PriceSummary
      compact={compact}
      adults={adults}
      children={children}
      toddlers={toddlers}
      pricePerAdult={pricePerAdult}
      pricePerChild={pricePerChild}
      pricePerToddler={pricePerToddler}
      calculatedPrice={calculatedPrice}
      extraHours={extraHours}
      extraHoursCost={extraHoursCost}
      extraHourRate={extraHourRate}
      extrasTotal={extrasTotal}
      selectedExtras={selectedExtras}
      totalWithExtras={totalWithExtras}
      useMenuPackage={useMenuPackage}
      selectedTemplate={selectedTemplate}
      selectedPackage={selectedPackage}
      venueSurchargeAmount={venueSurchargeAmount}
      venueSurcharge={venueSurcharge}
    />
  ), [adults, children, toddlers, pricePerAdult, pricePerChild, pricePerToddler, calculatedPrice, extraHours, extraHoursCost, extraHourRate, extrasTotal, selectedExtras, totalWithExtras, useMenuPackage, selectedTemplate, selectedPackage, venueSurchargeAmount, venueSurcharge])

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
          // #216: categoryExtras reset removed — handled via DishSelector
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
        // #216: categoryExtras reset removed — handled via DishSelector
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

  const onFormSubmit = useCallback(async (data: ReservationFormData) => {
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

    // #216: Category extras removed from create form — handled via DishSelector in edit flow

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
  }, [selectedExtras, totalGuests, onSubmitProp, createReservation, router, onSuccess])

  const handleFinalSubmit = useCallback(async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) {
      console.error('[handleFinalSubmit] validateCurrentStep failed')
      return
    }
    handleSubmit(onFormSubmit, (validationErrors) => {
      console.error('[handleFinalSubmit] Form validation errors:', validationErrors)
    })()
  }, [validateCurrentStep, handleSubmit, onFormSubmit])

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

  // ═════════════════════════════════════════════════════════
  // STEP RENDERERS — delegate to extracted components
  // ═════════════════════════════════════════════════════════

  const renderStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <EventSection
            formCtx={formCtx}
            eventTypesArray={eventTypesArray}
            isBirthday={isBirthday}
            isAnniversary={isAnniversary}
            isCustom={isCustom}
          />
        )
      case 1:
        return (
          <VenueSection
            formCtx={formCtx}
            hallsArray={hallsArray}
            selectedHall={selectedHall}
            selectedHallCapacity={selectedHallCapacity}
            isMultiBookingHall={isMultiBookingHall}
            defaultHallId={defaultHallId}
            watchAll={watchAll}
            startDate={startDate}
            startTime={startTime}
            endDate={endDate}
            endTime={endTime}
            startDateTimeISO={startDateTimeISO}
            endDateTimeISO={endDateTimeISO}
            durationHours={durationHours}
            extraHours={extraHours}
            standardHours={standardHours}
            extraHourRate={extraHourRate}
            availability={availability}
            availabilityLoading={availabilityLoading}
            availableCapacity={availableCapacity}
            capacityLoading={capacityLoading}
          />
        )
      case 2:
        return (
          <GuestsSection
            formCtx={formCtx}
            adults={adults}
            children={children}
            toddlers={toddlers}
            totalGuests={totalGuests}
            selectedHallCapacity={selectedHallCapacity}
            isMultiBookingHall={isMultiBookingHall}
            availableCapacity={availableCapacity}
          />
        )
      case 3:
        return (
          <MenuSection
            formCtx={formCtx}
            useMenuPackage={useMenuPackage}
            selectedEventTypeId={selectedEventTypeId}
            menuTemplateId={menuTemplateId}
            menuPackageId={menuPackageId}
            menuTemplatesArray={menuTemplatesArray}
            menuTemplatesLoading={menuTemplatesLoading}
            templatePackagesArray={templatePackagesArray}
            templatePackagesLoading={templatePackagesLoading}
            selectedTemplate={selectedTemplate}
            selectedPackage={selectedPackage}
            hasNoTemplatesForEventType={hasNoTemplatesForEventType}
            pricePerAdult={pricePerAdult}
            childPriceManuallySet={childPriceManuallySet}
            setChildPriceManuallySet={setChildPriceManuallySet}
            toddlerPriceManuallySet={toddlerPriceManuallySet}
            setToddlerPriceManuallySet={setToddlerPriceManuallySet}
            selectedExtras={selectedExtras}
            onExtrasChange={setSelectedExtras}
            totalGuests={totalGuests}
            totalWithExtras={totalWithExtras}
            PriceSummary={BoundPriceSummary}
          />
        )
      case 4:
        return (
          <ClientSection
            formCtx={formCtx}
            clientComboboxOptions={clientComboboxOptions}
            clientsLoading={clientsLoading}
            selectedClient={selectedClient}
            isPromotingFromQueue={isPromotingFromQueue}
            showCreateClientModal={showCreateClientModal}
            setShowCreateClientModal={setShowCreateClientModal}
          />
        )
      case 5:
        return (
          <SummarySection
            goToStep={goToStep}
            selectedEventTypeName={selectedEventTypeName}
            isBirthday={isBirthday}
            isAnniversary={isAnniversary}
            isCustom={isCustom}
            watchAll={watchAll}
            selectedHall={selectedHall}
            startDate={startDate}
            startTime={startTime}
            endTime={endTime}
            durationHours={durationHours}
            extraHours={extraHours}
            standardHours={standardHours}
            venueSurcharge={venueSurcharge}
            venueSurchargeAmount={venueSurchargeAmount}
            totalGuests={totalGuests}
            adults={adults}
            children={children}
            toddlers={toddlers}
            selectedClient={selectedClient}
            useMenuPackage={useMenuPackage}
            selectedTemplate={selectedTemplate}
            selectedPackage={selectedPackage}
            discountEnabled={discountEnabled}
            discountType={discountType}
            discountValue={discountValue}
            discountReason={discountReason}
            discountAmount={discountAmount}
            isDiscountValid={isDiscountValid}
            totalWithExtras={totalWithExtras}
            finalTotalPrice={finalTotalPrice}
            selectedExtras={selectedExtras}
            extrasTotal={extrasTotal}
            formCtx={formCtx}
            PriceSummary={BoundPriceSummary}
          />
        )
      default:
        return null
    }
  }

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
                {renderStep(currentStep)}
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
