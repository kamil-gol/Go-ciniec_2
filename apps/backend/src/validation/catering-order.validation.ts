/**
 * Catering Order Validation Schemas (Zod)
 * Issue #150 — Faza 2: Zamówienia
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════

export const CateringOrderStatusEnum = z.enum([
  'DRAFT',
  'INQUIRY',
  'QUOTED',
  'CONFIRMED',
  'IN_PREPARATION',
  'READY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]);

export const CateringDeliveryTypeEnum = z.enum([
  'PICKUP',
  'DELIVERY',
  'ON_SITE',
]);

export const CateringDiscountTypeEnum = z.enum([
  'PERCENTAGE',
  'AMOUNT',
]);

// ═══════════════════════════════════════════════════════════════
// Shared sub-schemas
// ═══════════════════════════════════════════════════════════════

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

const orderItemSchema = z.object({
  dishId: z.string().uuid('dishId musi być UUID'),
  quantity: z.number().int().min(1, 'Ilość min. 1'),
  unitPrice: z.number().min(0, 'Cena nie może być ujemna'),
  note: z.string().max(500).optional().nullable(),
});

const orderExtraSchema = z.object({
  name: z.string().min(1).max(255, 'Nazwa max 255 znaków'),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().int().min(1, 'Ilość min. 1'),
  unitPrice: z.number().min(0, 'Cena nie może być ujemna'),
});

// Pola wspólne dla create i update
const sharedOrderFields = {
  templateId: z.string().uuid().optional().nullable(),
  packageId: z.string().uuid().optional().nullable(),
  deliveryType: CateringDeliveryTypeEnum.optional(),
  eventName: z.string().max(255).optional().nullable(),
  eventDate: z
    .string()
    .regex(datePattern, 'Format daty: YYYY-MM-DD')
    .optional()
    .nullable(),
  eventTime: z
    .string()
    .regex(timePattern, 'Format czasu: HH:MM')
    .optional()
    .nullable(),
  eventLocation: z.string().max(255).optional().nullable(),
  guestsCount: z.number().int().min(0).optional(),
  deliveryAddress: z.string().max(1000).optional().nullable(),
  deliveryNotes: z.string().max(1000).optional().nullable(),
  deliveryDate: z
    .string()
    .regex(datePattern, 'Format daty: YYYY-MM-DD')
    .optional()
    .nullable(),
  deliveryTime: z
    .string()
    .regex(timePattern, 'Format czasu: HH:MM')
    .optional()
    .nullable(),
  discountType: CateringDiscountTypeEnum.optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
  discountReason: z.string().max(500).optional().nullable(),
  contactName: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  contactEmail: z.string().email('Nieprawidłowy e-mail').max(255).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  internalNotes: z.string().max(5000).optional().nullable(),
  specialRequirements: z.string().max(5000).optional().nullable(),
  quoteExpiresAt: z
    .string()
    .datetime({ message: 'Nieprawidłowy format ISO 8601' })
    .optional()
    .nullable(),
  items: z.array(orderItemSchema).optional(),
  extras: z.array(orderExtraSchema).optional(),
};

// ═══════════════════════════════════════════════════════════════
// Create Order
// ═══════════════════════════════════════════════════════════════

export const createOrderSchema = z.object({
  clientId: z.string().uuid('clientId musi być UUID'),
  ...sharedOrderFields,
});

// ═══════════════════════════════════════════════════════════════
// Update Order (partial — wszystkie pola opcjonalne)
// ═══════════════════════════════════════════════════════════════

export const updateOrderSchema = z.object({
  ...sharedOrderFields,
  changeReason: z.string().max(500).optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════
// Change Status
// ═══════════════════════════════════════════════════════════════

export const changeStatusSchema = z.object({
  status: CateringOrderStatusEnum,
  reason: z.string().max(500).optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════
// Create Deposit
// ═══════════════════════════════════════════════════════════════

export const createDepositSchema = z.object({
  amount: z
    .number({ required_error: 'Kwota jest wymagana' })
    .positive('Kwota musi być większa od 0')
    .max(999999.99, 'Kwota nie może przekraczać 999 999,99 PLN'),
  dueDate: z
    .string({ required_error: 'Termin płatności jest wymagany' })
    .regex(datePattern, 'Format daty: YYYY-MM-DD'),
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════
// Mark Deposit Paid (opcjonalny paymentMethod)
// ═══════════════════════════════════════════════════════════════

export const markDepositPaidSchema = z.object({
  paymentMethod: z
    .enum(['CASH', 'TRANSFER', 'BLIK', 'CARD'])
    .optional(),
});
