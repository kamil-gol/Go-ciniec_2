/**
 * Menu Validation Schemas
 * 
 * Zod schemas for validating menu-related API requests
 */

import { z } from 'zod';

// ════════════════════════════════════════════════════════════════════════════
// MENU TEMPLATE VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const createMenuTemplateSchema = z.object({
  eventTypeId: z.string().uuid('Invalid event type ID'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  variant: z.string().max(50, 'Variant too long').optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0).optional().default(0),
  imageUrl: z.string().url('Invalid image URL').optional().nullable()
}).refine(
  (data) => {
    if (data.validTo && data.validFrom >= data.validTo) {
      return false;
    }
    return true;
  },
  {
    message: 'validFrom must be before validTo',
    path: ['validTo']
  }
);

export const updateMenuTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  variant: z.string().max(50).optional().nullable(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional().nullable()
});

export const duplicateMenuTemplateSchema = z.object({
  newName: z.string().min(3).max(100),
  newVariant: z.string().max(50).optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().optional().nullable()
});

// ════════════════════════════════════════════════════════════════════════════
// MENU PACKAGE VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const createMenuPackageSchema = z.object({
  menuTemplateId: z.string().uuid('Invalid menu template ID'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  shortDescription: z.string().max(200, 'Short description too long').optional().nullable(),
  
  pricePerAdult: z.number().min(0, 'Price cannot be negative'),
  pricePerChild: z.number().min(0, 'Price cannot be negative'),
  pricePerToddler: z.number().min(0, 'Price cannot be negative'),
  
  includedItems: z.array(z.string()).optional().default([]),
  minGuests: z.number().int().min(0).optional().nullable(),
  maxGuests: z.number().int().min(0).optional().nullable(),
  
  // Color can be null or empty string - transform to null
  color: z.string()
    .transform(val => val === '' ? null : val)
    .pipe(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').nullable())
    .optional()
    .nullable(),
  
  icon: z.string().max(50).optional().nullable(),
  badgeText: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  
  displayOrder: z.number().int().min(0).optional().default(0),
  isPopular: z.boolean().optional().default(false),
  isRecommended: z.boolean().optional().default(false)
}).refine(
  (data) => {
    if (data.minGuests && data.maxGuests && data.minGuests > data.maxGuests) {
      return false;
    }
    return true;
  },
  {
    message: 'minGuests must be less than or equal to maxGuests',
    path: ['maxGuests']
  }
);

export const updateMenuPackageSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  shortDescription: z.string().max(200).optional().nullable(),
  
  pricePerAdult: z.number().min(0).optional(),
  pricePerChild: z.number().min(0).optional(),
  pricePerToddler: z.number().min(0).optional(),
  
  includedItems: z.array(z.string()).optional(),
  minGuests: z.number().int().min(0).optional().nullable(),
  maxGuests: z.number().int().min(0).optional().nullable(),
  
  // Color can be null or empty string - transform to null
  color: z.string()
    .transform(val => val === '' ? null : val)
    .pipe(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').nullable())
    .optional()
    .nullable(),
  
  icon: z.string().max(50).optional().nullable(),
  badgeText: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  
  displayOrder: z.number().int().min(0).optional(),
  isPopular: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  
  changeReason: z.string().max(200, 'Change reason too long').optional()
});

export const reorderPackagesSchema = z.object({
  packageOrders: z.array(
    z.object({
      packageId: z.string().uuid(),
      displayOrder: z.number().int().min(0)
    })
  ).min(1, 'At least one package required')
});

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY SETTINGS VALIDATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Category Setting Schema
 * 
 * SUPPORTS FLOAT VALUES (0.5, 1.5, 2.5, etc) for partial servings
 * Example: 1.5 portions of salad
 */
export const categorySettingSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  minSelect: z.number().min(0, 'Min selection cannot be negative'),  // ✅ Float allowed
  maxSelect: z.number().min(0, 'Max selection must be at least 0'),  // ✅ Float allowed
  isRequired: z.boolean().optional().default(true),
  isEnabled: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0).optional().default(0),
  customLabel: z.string().max(100).optional().nullable()
}).refine(
  (data) => data.minSelect <= data.maxSelect,
  {
    message: 'Minimalna wartość nie może być większa niż maksymalna',
    path: ['minSelect']
  }
);

export const bulkUpdateCategorySettingsSchema = z.object({
  settings: z.array(categorySettingSchema).min(1, 'At least one category setting required')
});

// ════════════════════════════════════════════════════════════════════════════
// MENU OPTION VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const createMenuOptionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  shortDescription: z.string().max(200, 'Short description too long').optional(),
  
  category: z.string().min(2).max(50),
  priceType: z.enum(['PER_PERSON', 'FLAT', 'FREE']),
  priceAmount: z.number().min(0, 'Price cannot be negative'),
  
  allowMultiple: z.boolean().optional().default(false),
  maxQuantity: z.number().int().min(1).optional().nullable(),
  
  icon: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export const updateMenuOptionSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  shortDescription: z.string().max(200).optional().nullable(),
  
  category: z.string().min(2).max(50).optional(),
  priceType: z.enum(['PER_PERSON', 'FLAT', 'FREE']).optional(),
  priceAmount: z.number().min(0).optional(),
  
  allowMultiple: z.boolean().optional(),
  maxQuantity: z.number().int().min(1).optional().nullable(),
  
  icon: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  
  changeReason: z.string().max(200, 'Change reason too long').optional()
});

// ════════════════════════════════════════════════════════════════════════════
// PACKAGE-OPTION ASSIGNMENT VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const assignOptionsToPackageSchema = z.object({
  options: z.array(
    z.object({
      optionId: z.string().uuid('Invalid option ID'),
      customPrice: z.number().min(0).optional().nullable(),
      isRequired: z.boolean().optional().default(false),
      isDefault: z.boolean().optional().default(false),
      displayOrder: z.number().int().min(0).optional()
    })
  ).min(1, 'At least one option required')
});

// ════════════════════════════════════════════════════════════════════════════
// MENU SELECTION (SNAPSHOT) VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const selectMenuSchema = z.object({
  packageId: z.string().uuid('Invalid package ID'),
  selectedOptions: z.array(
    z.object({
      optionId: z.string().uuid('Invalid option ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1)
    })
  ).optional().default([])
});

export const updateMenuSelectionSchema = z.object({
  adultsCount: z.number().int().min(0, 'Adults count cannot be negative').optional(),
  childrenCount: z.number().int().min(0, 'Children count cannot be negative').optional(),
  toddlersCount: z.number().int().min(0, 'Toddlers count cannot be negative').optional()
});

// ════════════════════════════════════════════════════════════════════════════
// QUERY PARAMS VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const menuTemplateQuerySchema = z.object({
  eventTypeId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  date: z.coerce.date().optional()
});

export const menuOptionQuerySchema = z.object({
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional()
});
