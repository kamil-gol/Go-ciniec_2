// apps/frontend/types/catering-order.types.ts

export type CateringOrderStatus =
  | 'DRAFT'
  | 'INQUIRY'
  | 'QUOTED'
  | 'CONFIRMED'
  | 'IN_PREPARATION'
  | 'READY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type CateringDeliveryType = 'PICKUP' | 'DELIVERY' | 'ON_SITE';
export type CateringDiscountType = 'PERCENTAGE' | 'AMOUNT';

export const ORDER_STATUS_LABEL: Record<CateringOrderStatus, string> = {
  DRAFT: 'Szkic',
  INQUIRY: 'Zapytanie',
  QUOTED: 'Oferta wysłana',
  CONFIRMED: 'Potwierdzone',
  IN_PREPARATION: 'W przygotowaniu',
  READY: 'Gotowe',
  DELIVERED: 'Dostarczone',
  COMPLETED: 'Zakończone',
  CANCELLED: 'Anulowane',
};

export const ORDER_STATUS_COLOR: Record<CateringOrderStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  INQUIRY: 'bg-blue-100 text-blue-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  IN_PREPARATION: 'bg-orange-100 text-orange-700',
  READY: 'bg-emerald-100 text-emerald-700',
  DELIVERED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const DELIVERY_TYPE_LABEL: Record<CateringDeliveryType, string> = {
  PICKUP: 'Odbiór osobisty',
  DELIVERY: 'Dostawa',
  ON_SITE: 'U klienta',
};

export interface CateringOrderClient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string;
  companyName?: string | null;
  clientType: 'INDIVIDUAL' | 'COMPANY';
}

export interface CateringOrderCreatedBy {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CateringOrderItem {
  id: string;
  dishId: string;
  dishNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string | null;
  dish?: { id: string; name: string };
}

export interface CateringOrderExtra {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CateringOrderHistoryEntry {
  id: string;
  changeType: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  createdAt: string;
  changedBy?: { id: string; firstName: string; lastName: string };
}

export interface CateringDeposit {
  id: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  paid: boolean;
  paidAt?: string | null;
  paymentMethod?: string | null;
  title?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface CateringOrder {
  id: string;
  orderNumber: string;
  status: CateringOrderStatus;
  deliveryType: CateringDeliveryType;
  client: CateringOrderClient;
  createdBy: CateringOrderCreatedBy;
  templateId?: string | null;
  packageId?: string | null;
  template?: { id: string; name: string; slug: string } | null;
  package?: { id: string; name: string; basePrice: number } | null;
  eventName?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  guestsCount: number;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  subtotal: number;
  extrasTotalPrice: number;
  discountType?: CateringDiscountType | null;
  discountValue?: number | null;
  discountAmount?: number | null;
  discountReason?: string | null;
  totalPrice: number;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  specialRequirements?: string | null;
  quoteExpiresAt?: string | null;
  items: CateringOrderItem[];
  extras: CateringOrderExtra[];
  deposits: CateringDeposit[];
  createdAt: string;
  updatedAt: string;
}

export interface CateringOrderListItem {
  id: string;
  orderNumber: string;
  status: CateringOrderStatus;
  deliveryType: CateringDeliveryType;
  eventDate?: string | null;
  eventName?: string | null;
  guestsCount: number;
  totalPrice: number;
  client: Pick<CateringOrderClient, 'id' | 'firstName' | 'lastName' | 'companyName' | 'clientType'>;
  _count?: { items: number; deposits: number };
  createdAt: string;
}

export interface CateringOrdersListResponse {
  data: CateringOrderListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CateringOrdersFilter {
  status?: CateringOrderStatus;
  deliveryType?: CateringDeliveryType;
  clientId?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

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
}

export interface CreateCateringOrderInput {
  clientId: string;
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

export type UpdateCateringOrderInput = Partial<Omit<CreateCateringOrderInput, 'clientId'>> & {
  changeReason?: string | null;
};

export interface ChangeStatusInput {
  status: CateringOrderStatus;
  reason?: string | null;
}

export interface CreateDepositInput {
  amount: number;
  dueDate: string;
  title?: string | null;
  description?: string | null;
  internalNotes?: string | null;
}

export interface MarkDepositPaidInput {
  paymentMethod?: 'CASH' | 'TRANSFER' | 'BLIK' | 'CARD';
}
