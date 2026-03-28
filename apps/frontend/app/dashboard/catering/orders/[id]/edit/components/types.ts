import type {
  CateringDeliveryType,
  CateringDiscountType,
  CreateOrderItemInput,
  CreateOrderExtraInput,
} from '@/types/catering-order.types';
import { formatCurrency } from '@/lib/utils';

export interface FormState {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestsCount: string;
  templateId: string;
  packageId: string;
  deliveryType: CateringDeliveryType;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryNotes: string;
  discountType: CateringDiscountType | '';
  discountValue: string;
  discountReason: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  internalNotes: string;
  specialRequirements: string;
  quoteExpiresAt: string;
  items: (CreateOrderItemInput & { _key: number })[];
  extras: (CreateOrderExtraInput & { _key: number })[];
}

export type SetFormState = (partial: Partial<FormState>) => void;

export interface Totals {
  subtotal: number;
  extrasTotalPrice: number;
  discountAmount: number;
  totalPrice: number;
}

export function computeTotals(
  items: { quantity: number; unitPrice: number }[],
  extras: { quantity: number; unitPrice: number }[],
  discountType?: CateringDiscountType | null,
  discountValue?: number | null,
): Totals {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const extrasTotalPrice = extras.reduce((s, e) => s + e.quantity * e.unitPrice, 0);
  const gross = subtotal + extrasTotalPrice;
  let discountAmount = 0;
  if (discountType && discountValue && discountValue > 0) {
    discountAmount =
      discountType === 'PERCENTAGE'
        ? Math.round(gross * (discountValue / 100) * 100) / 100
        : Math.min(discountValue, gross);
  }
  return {
    subtotal,
    extrasTotalPrice,
    discountAmount,
    totalPrice: Math.max(0, gross - discountAmount),
  };
}

export const fmt = formatCurrency;
