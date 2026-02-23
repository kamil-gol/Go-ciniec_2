/**
 * Service Extras Types
 * Types and interfaces for service extras management
 * (venue decoration, music, cake, photography, etc.)
 */

// ═════════════════════════════════════════════════════════════════
// Price Types
// ═════════════════════════════════════════════════════════════════

/**
 * Pricing model for service extras.
 *
 * Each type determines how `totalPrice` is calculated in `calculateTotalPrice()`:
 *
 * | Type         | Formula                                    | Example                              |
 * |--------------|--------------------------------------------|--------------------------------------|
 * | `FLAT`       | `unitPrice × quantity`                      | DJ: 2000 zł × 1 = 2000 zł            |
 * | `PER_PERSON` | `unitPrice × (adults + children) × quantity`| Kelner: 30 zł × 50 os. × 1 = 1500 zł|
 * | `PER_UNIT`   | `unitPrice × quantity`                      | Krzesło: 15 zł × 80 szt. = 1200 zł   |
 * | `FREE`       | `0` (always)                               | Parking: 0 zł                        |
 *
 * Key differences between `FLAT` and `PER_UNIT`:
 * - `FLAT`: quantity is rarely > 1 (e.g. 2× DJ sets). UI hides quantity input.
 * - `PER_UNIT`: quantity is the core input (e.g. 80 chairs). UI shows quantity input.
 *   Backend enforces `quantity >= 1` for PER_UNIT in `assignExtra()` and `updateReservationExtra()`.
 */
export type ServicePriceType = 'FLAT' | 'PER_PERSON' | 'PER_UNIT' | 'FREE';

export type ExtraStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

// ═════════════════════════════════════════════════════════════════
// Category DTOs
// ═════════════════════════════════════════════════════════════════

export interface CreateServiceCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
  isExclusive?: boolean;
}

export interface UpdateServiceCategoryDTO {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  isExclusive?: boolean;
}

// ═════════════════════════════════════════════════════════════════
// Item DTOs
// ═════════════════════════════════════════════════════════════════

export interface CreateServiceItemDTO {
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

export interface UpdateServiceItemDTO {
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

// ═════════════════════════════════════════════════════════════════
// Reservation Extra DTOs
// ═════════════════════════════════════════════════════════════════

/**
 * DTO for assigning a service extra to a reservation.
 *
 * `quantity` behavior depends on the item's `priceType`:
 * - `PER_UNIT`: **required**, must be >= 1 (e.g. 80 chairs)
 * - `FLAT`: optional, defaults to 1 (rarely > 1)
 * - `PER_PERSON`: optional, defaults to 1 (multiplied by guest count internally)
 * - `FREE`: optional, defaults to 1 (no price impact)
 */
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

// ═════════════════════════════════════════════════════════════════
// Response Types
// ═════════════════════════════════════════════════════════════════

export interface ServiceCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
  isExclusive: boolean;
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
  /** @see ServicePriceType for pricing formulas */
  priceType: string;
  basePrice: any; // Decimal
  icon: string | null;
  displayOrder: number;
  requiresNote: boolean;
  noteLabel: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: ServiceCategoryResponse;
}

/**
 * A service extra assigned to a specific reservation.
 *
 * `totalPrice` is pre-calculated by `calculateTotalPrice()` at assignment time
 * and stored in DB. Always use `totalPrice` for display — do NOT recalculate
 * from `unitPrice × quantity` (this is wrong for PER_PERSON which includes
 * guest count multiplier).
 */
export interface ReservationExtraResponse {
  id: string;
  reservationId: string;
  serviceItemId: string;
  quantity: number;
  unitPrice: any; // Decimal
  /** @see ServicePriceType */
  priceType: string;
  /**
   * Pre-calculated total. Formula depends on `priceType`:
   * - FLAT: unitPrice × quantity
   * - PER_PERSON: unitPrice × (adults + children) × quantity
   * - PER_UNIT: unitPrice × quantity
   * - FREE: 0
   */
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
