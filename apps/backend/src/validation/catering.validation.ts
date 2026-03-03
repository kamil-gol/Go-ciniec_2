import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════════════════════════

const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug może zawierać tylko małe litery, cyfry i myślniki');

const displayOrder = z.number().int().min(0).max(32767).default(0);

const CateringPriceType = z.enum(['PER_PERSON', 'FLAT', 'TIERED']);

// ═══════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const createCateringTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  slug,
  imageUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().default(true),
  displayOrder,
});

export const updateCateringTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  slug: slug.optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(32767).optional(),
});

// ═══════════════════════════════════════════════════════════════
// PACKAGES
// ═══════════════════════════════════════════════════════════════

export const createCateringPackageSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  priceType: CateringPriceType.default('PER_PERSON'),
  basePrice: z.number().min(0).max(999999.99),
  tieredPricing: z.record(z.any()).optional(),
  badgeText: z.string().max(50).optional(),
  isPopular: z.boolean().default(false),
  displayOrder,
  isActive: z.boolean().default(true),
  minGuests: z.number().int().min(1).max(32767).optional(),
  maxGuests: z.number().int().min(1).max(32767).optional(),
}).refine(
  (d) => d.minGuests == null || d.maxGuests == null || d.minGuests <= d.maxGuests,
  { message: 'minGuests nie może być większe niż maxGuests', path: ['minGuests'] },
).refine(
  (d) => d.priceType !== 'TIERED' || d.tieredPricing != null,
  { message: 'tieredPricing jest wymagane gdy priceType = TIERED', path: ['tieredPricing'] },
);

export const updateCateringPackageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  priceType: CateringPriceType.optional(),
  basePrice: z.number().min(0).max(999999.99).optional(),
  tieredPricing: z.record(z.any()).nullable().optional(),
  badgeText: z.string().max(50).nullable().optional(),
  isPopular: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(32767).optional(),
  isActive: z.boolean().optional(),
  minGuests: z.number().int().min(1).max(32767).nullable().optional(),
  maxGuests: z.number().int().min(1).max(32767).nullable().optional(),
});

// ═══════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════

export const createCateringSectionSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  minSelect: z.number().int().min(0).max(32767).default(1),
  maxSelect: z.number().int().min(1).max(32767).default(1),
  isRequired: z.boolean().default(true),
  displayOrder,
}).refine(
  (d) => d.minSelect <= d.maxSelect,
  { message: 'minSelect nie może być większe niż maxSelect', path: ['minSelect'] },
);

export const updateCateringSectionSchema = z.object({
  name: z.string().min(1).max(255).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  minSelect: z.number().int().min(0).max(32767).optional(),
  maxSelect: z.number().int().min(1).max(32767).optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(32767).optional(),
});

// ═══════════════════════════════════════════════════════════════
// OPTIONS
// ═══════════════════════════════════════════════════════════════

export const createCateringSectionOptionSchema = z.object({
  dishId: z.string().uuid(),
  customPrice: z.number().min(0).max(999999.99).nullable().optional(),
  isDefault: z.boolean().default(false),
  displayOrder,
});

export const updateCateringSectionOptionSchema = z.object({
  customPrice: z.number().min(0).max(999999.99).nullable().optional(),
  isDefault: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(32767).optional(),
});

// ═══════════════════════════════════════════════════════════════
// INFERRED TYPES
// ═══════════════════════════════════════════════════════════════

export type CreateCateringTemplateInput = z.infer<typeof createCateringTemplateSchema>;
export type UpdateCateringTemplateInput = z.infer<typeof updateCateringTemplateSchema>;
export type CreateCateringPackageInput  = z.infer<typeof createCateringPackageSchema>;
export type UpdateCateringPackageInput  = z.infer<typeof updateCateringPackageSchema>;
export type CreateCateringSectionInput  = z.infer<typeof createCateringSectionSchema>;
export type UpdateCateringSectionInput  = z.infer<typeof updateCateringSectionSchema>;
export type CreateCateringSectionOptionInput = z.infer<typeof createCateringSectionOptionSchema>;
export type UpdateCateringSectionOptionInput = z.infer<typeof updateCateringSectionOptionSchema>;
