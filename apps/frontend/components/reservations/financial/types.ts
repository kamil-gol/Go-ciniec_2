import type { PaymentMethod, Deposit } from '@/lib/api/deposits'
import {
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

// Status colors moved to lib/status-colors.ts (depositStatusColors)

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
