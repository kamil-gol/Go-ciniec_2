// Price & Status enums

export type ServicePriceType = 'FLAT' | 'PER_PERSON' | 'FREE';
export type ExtraStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export const PRICE_TYPE_LABELS: Record<ServicePriceType, string> = {
  FLAT: 'Kwota sta\u0142a',
  PER_PERSON: 'Za osob\u0119',
  FREE: 'Gratis',
};

export const EXTRA_STATUS_LABELS: Record<ExtraStatus, string> = {
  PENDING: 'Oczekuje',
  CONFIRMED: 'Potwierdzone',
  CANCELLED: 'Anulowane',
};

export const EXTRA_STATUS_COLORS: Record<ExtraStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// Category

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
  isExclusive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: ServiceItem[];
  _count?: { items: number };
}

export interface CreateServiceCategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
  isExclusive?: boolean;
}

export interface UpdateServiceCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  isExclusive?: boolean;
}

// Item

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceType: ServicePriceType;
  basePrice: number;
  icon: string | null;
  displayOrder: number;
  requiresNote: boolean;
  noteLabel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ServiceCategory;
}

export interface CreateServiceItemInput {
  categoryId: string;
  name: string;
  description?: string;
  priceType: ServicePriceType;
  basePrice?: number;
  icon?: string;
  displayOrder?: number;
  requiresNote?: boolean;
  noteLabel?: string;
  isActive?: boolean;
}

export interface UpdateServiceItemInput {
  name?: string;
  description?: string | null;
  priceType?: ServicePriceType;
  basePrice?: number;
  icon?: string | null;
  displayOrder?: number;
  requiresNote?: boolean;
  noteLabel?: string | null;
  isActive?: boolean;
}

// Reservation Extra

export interface ReservationExtra {
  id: string;
  reservationId: string;
  serviceItemId: string;
  quantity: number;
  unitPrice: number;
  priceType: ServicePriceType;
  totalPrice: number;
  note: string | null;
  status: ExtraStatus;
  createdAt: string;
  updatedAt: string;
  serviceItem?: ServiceItem;
}

export interface AssignExtraInput {
  serviceItemId: string;
  quantity?: number;
  note?: string;
  customPrice?: number;
}

export interface BulkAssignExtrasInput {
  extras: AssignExtraInput[];
}

export interface UpdateReservationExtraInput {
  quantity?: number;
  note?: string | null;
  customPrice?: number | null;
  status?: ExtraStatus;
}

// API Response wrappers

export interface ServiceExtrasListResponse {
  success: boolean;
  data: ServiceCategory[] | ServiceItem[];
  count: number;
}

export interface ReservationExtrasResponse {
  success: boolean;
  data: ReservationExtra[];
  totalExtrasPrice: number;
  count: number;
}
