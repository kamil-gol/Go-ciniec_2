import { CateringOrderStatus, CateringDeliveryType, CateringDiscountType } from '@/prisma-client';

// ─── Typy wejściowe ─────────────────────────────────────────────────────

export interface CreateOrderItemInput {
  dishId: string;
  quantity: number;
  unitPrice: number;
  note?: string | null;
}

export interface CreateOrderExtraInput {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  serviceItemId?: string | null;
}

export interface CreateCateringOrderInput {
  clientId: string;
  createdById: string;
  templateId?: string | null;
  packageId?: string | null;
  deliveryType?: CateringDeliveryType;
  eventName?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  guestsCount?: number;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  discountType?: CateringDiscountType | null;
  discountValue?: number | null;
  discountReason?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  specialRequirements?: string | null;
  quoteExpiresAt?: string | null;
  items?: CreateOrderItemInput[];
  extras?: CreateOrderExtraInput[];
}

export interface UpdateCateringOrderInput {
  templateId?: string | null;
  packageId?: string | null;
  status?: CateringOrderStatus;
  deliveryType?: CateringDeliveryType;
  eventName?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  guestsCount?: number;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  discountType?: CateringDiscountType | null;
  discountValue?: number | null;
  discountReason?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  specialRequirements?: string | null;
  quoteExpiresAt?: string | null;
  items?: CreateOrderItemInput[];
  extras?: CreateOrderExtraInput[];
  changedById?: string;
  changeReason?: string | null;
}

export interface ListOrdersFilter {
  status?: CateringOrderStatus;
  deliveryType?: CateringDeliveryType;
  clientId?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Depozyty ─────────────────────────────────────────────────────────

export interface CreateDepositInput {
  amount: number;
  dueDate: string;
  title?: string | null;
  description?: string | null;
  internalNotes?: string | null;
}

export interface UpdateDepositInput {
  amount?: number;
  dueDate?: string;
  title?: string | null;
  description?: string | null;
  internalNotes?: string | null;
}
