/**
 * Service Extra Validation Schemas (Zod)
 * Validation for service extras management endpoints
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════

const ServicePriceTypeEnum = z.enum(['FLAT', 'PER_PERSON', 'PER_UNIT', 'FREE']);
const ExtraStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ═══════════════════════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════════════════════

export const createServiceCategorySchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(255, 'Nazwa max 255 znaków'),
  slug: z
    .string()
    .min(1, 'Slug jest wymagany')
    .max(100, 'Slug max 100 znaków')
    .regex(slugPattern, 'Slug może zawierać tylko małe litery, cyfry i myślniki'),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  displayOrder: z.number().int().min(0).max(32767).default(0).optional(),
  isActive: z.boolean().default(true).optional(),
  isExclusive: z.boolean().default(false).optional(),
});

export const updateServiceCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(slugPattern, 'Slug może zawierać tylko małe litery, cyfry i myślniki')
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  displayOrder: z.number().int().min(0).max(32767).optional(),
  isActive: z.boolean().optional(),
  isExclusive: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════
// Reorder Categories
// ═══════════════════════════════════════════════════════════════

export const reorderCategoriesSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Każdy ID musi być UUID'))
    .min(1, 'Lista ID nie może być pusta'),
});

// ═══════════════════════════════════════════════════════════════
// Items
// ═══════════════════════════════════════════════════════════════

export const createServiceItemSchema = z.object({
  categoryId: z.string().uuid('categoryId musi być UUID'),
  name: z.string().min(1, 'Nazwa jest wymagana').max(255, 'Nazwa max 255 znaków'),
  description: z.string().max(2000).optional().nullable(),
  priceType: ServicePriceTypeEnum,
  basePrice: z.number().min(0, 'Cena nie może być ujemna').max(999999.99).default(0).optional(),
  icon: z.string().max(100).optional().nullable(),
  displayOrder: z.number().int().min(0).max(32767).default(0).optional(),
  requiresNote: z.boolean().default(false).optional(),
  noteLabel: z.string().max(255).optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateServiceItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  priceType: ServicePriceTypeEnum.optional(),
  basePrice: z.number().min(0).max(999999.99).optional(),
  icon: z.string().max(100).optional().nullable(),
  displayOrder: z.number().int().min(0).max(32767).optional(),
  requiresNote: z.boolean().optional(),
  noteLabel: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════
// Reservation Extras
// ═══════════════════════════════════════════════════════════════

export const assignExtraSchema = z.object({
  serviceItemId: z.string().uuid('serviceItemId musi być UUID'),
  quantity: z.number().int().min(1, 'Ilość min. 1').optional(),
  note: z.string().max(1000).optional().nullable(),
  customPrice: z.number().min(0).max(999999.99).optional().nullable(),
});

export const bulkAssignExtrasSchema = z.object({
  extras: z
    .array(
      z.object({
        serviceItemId: z.string().uuid('serviceItemId musi być UUID'),
        quantity: z.number().int().min(1).optional(),
        note: z.string().max(1000).optional().nullable(),
        customPrice: z.number().min(0).max(999999.99).optional().nullable(),
      })
    )
    .min(0),
});

export const updateReservationExtraSchema = z.object({
  quantity: z.number().int().min(1, 'Ilość min. 1').optional(),
  note: z.string().max(1000).optional().nullable(),
  customPrice: z.number().min(0).max(999999.99).optional().nullable(),
  status: ExtraStatusEnum.optional(),
});

// ═══════════════════════════════════════════════════════════════
// Inferred Types
// ═══════════════════════════════════════════════════════════════

export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;
export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>;
export type CreateServiceItemInput = z.infer<typeof createServiceItemSchema>;
export type UpdateServiceItemInput = z.infer<typeof updateServiceItemSchema>;
export type AssignExtraInput = z.infer<typeof assignExtraSchema>;
export type BulkAssignExtrasInput = z.infer<typeof bulkAssignExtrasSchema>;
export type UpdateReservationExtraInput = z.infer<typeof updateReservationExtraSchema>;
