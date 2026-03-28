import type { DepositStatus, PaymentMethod, Deposit } from '@/lib/api/deposits'
import {
  Clock, CheckCircle2, AlertTriangle, XCircle,
  ArrowDownUp, Banknote, Smartphone, CreditCard,
} from 'lucide-react'

// Constants
export const STANDARD_HOURS = 6
export const DEFAULT_EXTRA_HOUR_RATE = 500

// Props for the main component
export interface ReservationFinancialSummaryProps {
  reservationId: string
  adults: number
  childrenCount: number
  toddlers: number
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  totalPrice: number
  /** ISO datetime string for event start */
  startDateTime?: string
  /** ISO datetime string for event end */
  endDateTime?: string
  /** Hours included in base price (default: 6h, from eventType.standardHours) */
  standardHours?: number
  /** Cost per extra hour beyond standardHours (default: 500 PLN, from eventType.extraHourRate; 0 = exempt) */
  extraHourRate?: number
  /** Reservation status (needed for discount section) */
  status?: string
  /** Discount fields from DB */
  discountType?: string | null
  discountValue?: number | string | null
  discountAmount?: number | string | null
  discountReason?: string | null
  priceBeforeDiscount?: number | string | null
  /** Venue surcharge amount (for whole venue bookings with fewer guests) */
  venueSurcharge?: number | null
  /** Label explaining the surcharge (e.g. "Doplata za caly obiekt (< 30 os.)") */
  venueSurchargeLabel?: string | null
  /** #216: Category extras from reservation (per-person pricing) */
  categoryExtras?: CategoryExtra[]
  categoryExtrasTotal?: number
  /** When true, hides all mutating controls (deposits, discount editing) */
  readOnly?: boolean
  /**
   * #deposits-fix (4/5): Optional callback fired after any deposit mutation
   * (create / mark-paid / mark-unpaid / cancel / delete). Used by the reservation
   * detail page to re-fetch reservation data so the status badge stays in sync.
   */
  onDepositChange?: () => void
}

export interface CategoryExtra {
  id: string
  packageCategoryId: string
  quantity: number
  pricePerItem: number
  guestCount?: number
  portionTarget?: string
  totalPrice: number
  packageCategory: { category: { id: string; name: string; icon?: string } }
}

export interface ExtraHoursInfo {
  durationHours: number
  extraHours: number
  extraCost: number
}

export interface Financials {
  activeDeposits: Deposit[]
  totalPaid: number
  totalCommitted: number
  totalPending: number
  remaining: number
  percentPaid: number
  percentCommitted: number
  menuPackageCost: number
  menuOptionsCost: number
  menuTotalCost: number
  depositsCount: number
}

// Config
export const statusConfig: Record<DepositStatus, {
  label: string
  icon: React.ElementType
  className: string
  dotColor: string
}> = {
  PENDING: {
    label: 'Oczekująca',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-400',
  },
  PAID: {
    label: 'Opłacona',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-400',
  },
  OVERDUE: {
    label: 'Przetermin.',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    dotColor: 'bg-red-400',
  },
  PARTIALLY_PAID: {
    label: 'Częściowa',
    icon: Clock,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-400',
  },
  CANCELLED: {
    label: 'Anulowana',
    icon: XCircle,
    className: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
    dotColor: 'bg-neutral-400',
  },
}

export const paymentMethodIcons: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  TRANSFER: { label: 'Przelew', icon: ArrowDownUp },
  CASH: { label: 'Gotówka', icon: Banknote },
  BLIK: { label: 'BLIK', icon: Smartphone },
  CARD: { label: 'Karta', icon: CreditCard },
}

export const paymentMethodOptions: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'TRANSFER', label: 'Przelew', icon: ArrowDownUp, color: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'CASH', label: 'Gotowka', icon: Banknote, color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'BLIK', label: 'BLIK', icon: Smartphone, color: 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'CARD', label: 'Karta', icon: CreditCard, color: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
]
