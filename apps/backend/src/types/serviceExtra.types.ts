/**
 * Service Extras Types
 * Types and interfaces for service extras management
 * (venue decoration, music, cake, photography, etc.)
 */

// ═══════════════════════════════════════════════════════════════
// Price Types
// ═══════════════════════════════════════════════════════════════

export type ServicePriceType = 'FLAT' | 'PER_PERSON' | 'FREE';

export type ExtraStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

// ═══════════════════════════════════════════════════════════════
// Category DTOs
// ═══════════════════════════════════════════════════════════════

export interface CreateServiceCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateServiceCategoryDTO {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Item DTOs
// ═══════════════════════════════════════════════════════════════

export interface CreateServiceItemDTO {
  categoryId: string;
  name: string;
  description?: string;
  priceType: ServicePriceType;
  basePrice?: number;
  icon?: string;
  displayOrder?: number;
  isExclusive?: boolean;
  requiresNote?: boolean;
  noteLabel?: string;
  isActive?: boolean;
}

export interface UpdateServiceItemDTO {
  name?: string;
  description?: string | null;
  priceType?: ServicePriceType;
  basePrice?: number;
  icon?: string | null;
  displayOrder?: number;
  isExclusive?: boolean;
  requiresNote?: boolean;
  noteLabel?: string | null;
  isActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Reservation Extra DTOs
// ═══════════════════════════════════════════════════════════════

export interface AssignExtraDTO {
  serviceItemId: string;
  quantity?: number;
  note?: string;
  customPrice?: number;
}

export interface BulkAssignExtrasDTO {
  extras: AssignExtraDTO[];
}

export interface UpdateReservationExtraDTO {
  quantity?: number;
  note?: string | null;
  customPrice?: number | null;
  status?: ExtraStatus;
}

// ═══════════════════════════════════════════════════════════════
// Response Types
// ═══════════════════════════════════════════════════════════════

export interface ServiceCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  items?: ServiceItemResponse[];
  _count?: { items: number };
}

export interface ServiceItemResponse {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceType: string;
  basePrice: any; // Decimal
  icon: string | null;
  displayOrder: number;
  isExclusive: boolean;
  requiresNote: boolean;
  noteLabel: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: ServiceCategoryResponse;
}

export interface ReservationExtraResponse {
  id: string;
  reservationId: string;
  serviceItemId: string;
  quantity: number;
  unitPrice: any; // Decimal
  priceType: string;
  totalPrice: any; // Decimal
  note: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  serviceItem?: ServiceItemResponse;
}

export interface ReservationExtrasWithTotal {
  extras: ReservationExtraResponse[];
  totalExtrasPrice: number;
  count: number;
}

export interface ReorderDTO {
  orderedIds: string[];
}
