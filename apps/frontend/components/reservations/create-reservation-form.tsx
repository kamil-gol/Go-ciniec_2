'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stepper, StepNavigation, StepConfig } from '@/components/ui/stepper'
import { useCreateReservation } from '@/hooks/use-reservations'
import {
  Users, UtensilsCrossed, Sparkles, Building2, User, ClipboardCheck,
} from 'lucide-react'
import { CreateReservationInput } from '@/types'
import { CreateClientModal } from '@/components/clients/create-client-modal'
import type { SelectedExtra } from '@/components/service-extras/CreateReservationExtrasSection'
import { useQueryClient } from '@tanstack/react-query'

// Extracted sub-components
import { reservationSchema, STEP_FIELDS } from './create-form/validation'
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

// Extracted hooks
import { useFormQueries } from './create-form/hooks/useFormQueries'
import { useFormComputed } from './create-form/hooks/useFormComputed'
import { useFormEffects } from './create-form/hooks/useFormEffects'

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

  // ═══ DATA QUERIES ═══

  const queries = useFormQueries({
    selectedEventTypeId: watchAll.eventTypeId,
    menuTemplateId: watchAll.menuTemplateId,
    hallId: watchAll.hallId,
    startDateTimeISO: watchAll.startDate && watchAll.startTime ? toLocalISO(watchAll.startDate, watchAll.startTime) : undefined,
    endDateTimeISO: watchAll.endDate && watchAll.endTime ? toLocalISO(watchAll.endDate, watchAll.endTime) : undefined,
  })

  // ═══ COMPUTED VALUES ═══

  const c = useFormComputed({
    watchAll,
    hallsArray: queries.hallsArray,
    eventTypesArray: queries.eventTypesArray,
    menuTemplatesArray: queries.menuTemplatesArray,
    menuTemplatesLoading: queries.menuTemplatesLoading,
    templatePackagesArray: queries.templatePackagesArray,
    clientsArray: queries.clientsArray,
    selectedExtras,
  })

  // ═══ SIDE EFFECTS ═══

  useFormEffects({
    watch,
    setValue,
    defaultHallId,
    hallsArray: queries.hallsArray,
    standardHours: c.standardHours,
    useMenuPackage: c.useMenuPackage,
    selectedPackage: c.selectedPackage,
    pricePerAdult: c.pricePerAdult,
    selectedEventTypeId: c.selectedEventTypeId,
    menuTemplateId: c.menuTemplateId,
    menuPackageId: c.menuPackageId,
    menuTemplatesArray: queries.menuTemplatesArray,
    templatePackagesArray: queries.templatePackagesArray,
    hallId: c.hallId,
    childPriceManuallySet,
    setChildPriceManuallySet,
    toddlerPriceManuallySet,
    setToddlerPriceManuallySet,
  })

  // ═══ SHARED FORM CONTEXT ═══

  const formCtx: FormContext = useMemo(() => ({
    control,
    register,
    errors,
    watch,
    setValue,
  }), [control, register, errors, watch, setValue])

  // ═══ PRICE SUMMARY WRAPPER ═══

  const BoundPriceSummary = useCallback(({ compact = false }: { compact?: boolean }) => (
    <PriceSummary
      compact={compact}
      adults={c.adults}
      children={c.children}
      toddlers={c.toddlers}
      pricePerAdult={c.pricePerAdult}
      pricePerChild={c.pricePerChild}
      pricePerToddler={c.pricePerToddler}
      calculatedPrice={c.calculatedPrice}
      extraHours={c.extraHours}
      extraHoursCost={c.extraHoursCost}
      extraHourRate={c.extraHourRate}
      extrasTotal={c.extrasTotal}
      selectedExtras={selectedExtras}
      totalWithExtras={c.totalWithExtras}
      useMenuPackage={c.useMenuPackage}
      selectedTemplate={c.selectedTemplate}
      selectedPackage={c.selectedPackage}
      venueSurchargeAmount={c.venueSurchargeAmount}
      venueSurcharge={c.venueSurcharge}
    />
  ), [c.adults, c.children, c.toddlers, c.pricePerAdult, c.pricePerChild, c.pricePerToddler, c.calculatedPrice, c.extraHours, c.extraHoursCost, c.extraHourRate, c.extrasTotal, selectedExtras, c.totalWithExtras, c.useMenuPackage, c.selectedTemplate, c.selectedPackage, c.venueSurchargeAmount, c.venueSurcharge])

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
      if (c.adults + c.children + c.toddlers < 1) {
        await trigger('adults')
        return false
      }
      if (c.isMultiBookingHall && queries.availableCapacity && (c.adults + c.children + c.toddlers) > queries.availableCapacity.availableCapacity) {
        return false
      }
    }

    if (currentStep === 3) {
      if (!c.useMenuPackage && (!c.pricePerAdult || c.pricePerAdult <= 0)) {
        await trigger('pricePerAdult')
        return false
      }
      if (c.useMenuPackage && (!c.menuTemplateId || !c.menuPackageId)) return false
    }

    return await trigger(fields)
  }, [currentStep, trigger, c.adults, c.children, c.toddlers, c.useMenuPackage, c.pricePerAdult, c.menuTemplateId, c.menuPackageId, c.isMultiBookingHall, queries.availableCapacity])

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
      if (data.menuTemplateId) input.menuTemplateId = data.menuTemplateId
    } else {
      input.pricePerAdult = data.pricePerAdult
      input.pricePerChild = data.pricePerChild
      input.pricePerToddler = data.pricePerToddler
    }

    const shouldApplyDiscount =
      !!data.discountEnabled &&
      Number(data.discountValue) > 0 &&
      (data.discountReason || '').trim().length >= 3

    if (shouldApplyDiscount) {
      input.discountType = (data.discountType || 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED'
      input.discountValue = Number(data.discountValue)
      input.discountReason = (data.discountReason || '').trim()
    }

    if (selectedExtras.length > 0) {
      input.serviceExtras = selectedExtras.map((extra) => {
        const item = extra.serviceItem
        let unitPrice = item.basePrice
        let totalPrice = 0

        if (item.priceType === 'FREE') {
          unitPrice = 0
          totalPrice = 0
        } else if (item.priceType === 'PER_PERSON') {
          totalPrice = item.basePrice * c.totalGuests * extra.quantity
        } else {
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
  }, [selectedExtras, c.totalGuests, onSubmitProp, createReservation, router, onSuccess])

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

  // ═══ STEP RENDERERS ═══

  const renderStep = (step: number) => {
    switch (step) {
      case 0:
        return <EventSection formCtx={formCtx} eventTypesArray={queries.eventTypesArray} isBirthday={c.isBirthday} isAnniversary={c.isAnniversary} isCustom={c.isCustom} />
      case 1:
        return (
          <VenueSection formCtx={formCtx} hallsArray={queries.hallsArray} selectedHall={c.selectedHall} selectedHallCapacity={c.selectedHallCapacity} isMultiBookingHall={c.isMultiBookingHall} defaultHallId={defaultHallId} watchAll={watchAll} startDate={c.startDate} startTime={c.startTime} endDate={c.endDate} endTime={c.endTime} startDateTimeISO={c.startDateTimeISO} endDateTimeISO={c.endDateTimeISO} durationHours={c.durationHours} extraHours={c.extraHours} standardHours={c.standardHours} extraHourRate={c.extraHourRate} availability={queries.availability} availabilityLoading={queries.availabilityLoading} availableCapacity={queries.availableCapacity} capacityLoading={queries.capacityLoading} />
        )
      case 2:
        return <GuestsSection formCtx={formCtx} adults={c.adults} children={c.children} toddlers={c.toddlers} totalGuests={c.totalGuests} selectedHallCapacity={c.selectedHallCapacity} isMultiBookingHall={c.isMultiBookingHall} availableCapacity={queries.availableCapacity} />
      case 3:
        return (
          <MenuSection formCtx={formCtx} useMenuPackage={c.useMenuPackage} selectedEventTypeId={c.selectedEventTypeId} menuTemplateId={c.menuTemplateId} menuPackageId={c.menuPackageId} menuTemplatesArray={queries.menuTemplatesArray} menuTemplatesLoading={queries.menuTemplatesLoading} templatePackagesArray={queries.templatePackagesArray} templatePackagesLoading={queries.templatePackagesLoading} selectedTemplate={c.selectedTemplate} selectedPackage={c.selectedPackage} hasNoTemplatesForEventType={c.hasNoTemplatesForEventType} pricePerAdult={c.pricePerAdult} childPriceManuallySet={childPriceManuallySet} setChildPriceManuallySet={setChildPriceManuallySet} toddlerPriceManuallySet={toddlerPriceManuallySet} setToddlerPriceManuallySet={setToddlerPriceManuallySet} selectedExtras={selectedExtras} onExtrasChange={setSelectedExtras} totalGuests={c.totalGuests} totalWithExtras={c.totalWithExtras} PriceSummary={BoundPriceSummary} />
        )
      case 4:
        return <ClientSection formCtx={formCtx} clientComboboxOptions={c.clientComboboxOptions} clientsLoading={queries.clientsLoading} selectedClient={c.selectedClient} isPromotingFromQueue={isPromotingFromQueue} showCreateClientModal={showCreateClientModal} setShowCreateClientModal={setShowCreateClientModal} />
      case 5:
        return (
          <SummarySection goToStep={goToStep} selectedEventTypeName={c.selectedEventTypeName} isBirthday={c.isBirthday} isAnniversary={c.isAnniversary} isCustom={c.isCustom} watchAll={watchAll} selectedHall={c.selectedHall} startDate={c.startDate} startTime={c.startTime} endTime={c.endTime} durationHours={c.durationHours} extraHours={c.extraHours} standardHours={c.standardHours} venueSurcharge={c.venueSurcharge} venueSurchargeAmount={c.venueSurchargeAmount} totalGuests={c.totalGuests} adults={c.adults} children={c.children} toddlers={c.toddlers} selectedClient={c.selectedClient} useMenuPackage={c.useMenuPackage} selectedTemplate={c.selectedTemplate} selectedPackage={c.selectedPackage} discountEnabled={c.discountEnabled} discountType={c.discountType} discountValue={c.discountValue} discountReason={c.discountReason} discountAmount={c.discountAmount} isDiscountValid={c.isDiscountValid} totalWithExtras={c.totalWithExtras} finalTotalPrice={c.finalTotalPrice} selectedExtras={selectedExtras} extrasTotal={c.extrasTotal} formCtx={formCtx} PriceSummary={BoundPriceSummary} />
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
              isNextDisabled={false}
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
