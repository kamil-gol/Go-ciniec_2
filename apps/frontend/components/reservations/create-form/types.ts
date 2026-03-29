import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { ReservationFormData } from './validation'
import type { SelectedExtra } from '@/components/service-extras/CreateReservationExtrasSection'
import type { Hall, EventType } from '@/types/hall.types'
import type { Client } from '@/types/client.types'
import type { MenuTemplate, MenuPackage } from '@/types/menu.types'

// ═══ PROPS — main form ═══

export interface CreateReservationFormProps {
  onSubmit?: (data: ReservationFormData) => void | Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<ReservationFormData>
  isPromotingFromQueue?: boolean
  defaultHallId?: string
}

// ═══ SHARED FORM CONTEXT passed to step sections ═══

export interface FormContext {
  control: Control<ReservationFormData>
  register: UseFormRegister<ReservationFormData>
  errors: FieldErrors<ReservationFormData>
  watch: UseFormWatch<ReservationFormData>
  setValue: UseFormSetValue<ReservationFormData>
}

// ═══ SECTION PROPS ═══

export interface EventSectionProps {
  formCtx: FormContext
  eventTypesArray: EventType[]
  isBirthday: boolean
  isAnniversary: boolean
  isCustom: boolean
}

export interface VenueSectionProps {
  formCtx: FormContext
  hallsArray: Hall[]
  selectedHall: Hall | undefined
  selectedHallCapacity: number
  isMultiBookingHall: boolean
  defaultHallId?: string
  watchAll: ReservationFormData
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  startDateTimeISO: string | undefined
  endDateTimeISO: string | undefined
  durationHours: number
  extraHours: number
  standardHours: number
  extraHourRate: number
  availability: any
  availabilityLoading: boolean
  availableCapacity: any
  capacityLoading: boolean
}

export interface GuestsSectionProps {
  formCtx: FormContext
  adults: number
  children: number
  toddlers: number
  totalGuests: number
  selectedHallCapacity: number
  isMultiBookingHall: boolean
  availableCapacity: any
}

export interface MenuSectionProps {
  formCtx: FormContext
  useMenuPackage: boolean
  selectedEventTypeId: string
  menuTemplateId: string | undefined
  menuPackageId: string | undefined
  menuTemplatesArray: MenuTemplate[]
  menuTemplatesLoading: boolean
  templatePackagesArray: MenuPackage[]
  templatePackagesLoading: boolean
  selectedTemplate: MenuTemplate | null
  selectedPackage: MenuPackage | null
  hasNoTemplatesForEventType: boolean | string
  pricePerAdult: number
  childPriceManuallySet: boolean
  setChildPriceManuallySet: (v: boolean) => void
  toddlerPriceManuallySet: boolean
  setToddlerPriceManuallySet: (v: boolean) => void
  selectedExtras: SelectedExtra[]
  onExtrasChange: (extras: SelectedExtra[]) => void
  totalGuests: number
  totalWithExtras: number
  PriceSummary: React.ComponentType<{ compact?: boolean }>
}

export interface ClientSectionProps {
  formCtx: FormContext
  clientComboboxOptions: { value: string; label: string; description?: string; secondaryLabel?: string }[]
  clientsLoading: boolean
  selectedClient: Client | null
  isPromotingFromQueue: boolean
  showCreateClientModal: boolean
  setShowCreateClientModal: (v: boolean) => void
}

export interface SummarySectionProps {
  goToStep: (step: number) => void
  selectedEventTypeName: string
  isBirthday: boolean
  isAnniversary: boolean
  isCustom: boolean
  watchAll: ReservationFormData
  selectedHall: Hall | undefined
  startDate: string
  startTime: string
  endTime: string
  durationHours: number
  extraHours: number
  standardHours: number
  venueSurcharge: { amount: number; label: string | null }
  venueSurchargeAmount: number
  totalGuests: number
  adults: number
  children: number
  toddlers: number
  selectedClient: Client | null
  useMenuPackage: boolean
  selectedTemplate: MenuTemplate | null
  selectedPackage: MenuPackage | null
  discountEnabled: boolean
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  discountReason: string
  discountAmount: number
  isDiscountValid: boolean
  totalWithExtras: number
  finalTotalPrice: number
  selectedExtras: SelectedExtra[]
  extrasTotal: number
  formCtx: FormContext
  PriceSummary: React.ComponentType<{ compact?: boolean }>
}

export interface PriceSummaryProps {
  compact?: boolean
  adults: number
  children: number
  toddlers: number
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  calculatedPrice: number
  extraHours: number
  extraHoursCost: number
  extraHourRate: number
  extrasTotal: number
  selectedExtras: SelectedExtra[]
  totalWithExtras: number
  useMenuPackage: boolean
  selectedTemplate: MenuTemplate | null
  selectedPackage: MenuPackage | null
  venueSurchargeAmount: number
  venueSurcharge: { amount: number; label: string | null }
}
