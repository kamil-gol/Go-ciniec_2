/**
 * Dish Validation Schemas
 * 
 * Zod schemas for dish library operations
 */

import { z } from 'zod';
import { DishCategory } from '@prisma/client';

// ════════════════════════════════════════════════════════════════════════════
// DISH CATEGORY VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const dishCategorySchema = z.nativeEnum(DishCategory, {
  errorMap: () => ({ message: 'Invalid dish category' })
});

// ════════════════════════════════════════════════════════════════════════════
// CREATE DISH SCHEMA
// ════════════════════════════════════════════════════════════════════════════

export const createDishSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name cannot exceed 255 characters'),
  
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  
  category: dishCategorySchema,
  
  allergens: z.array(z.string())
    .default([]),
  
  priceModifier: z.number()
    .min(-1000, 'Price modifier too low')
    .max(10000, 'Price modifier too high')
    .default(0),
  
  imageUrl: z.string()
    .url('Invalid image URL')
    .optional(),
  
  thumbnailUrl: z.string()
    .url('Invalid thumbnail URL')
    .optional(),
  
  isActive: z.boolean()
    .default(true),
  
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative')
    .default(0)
});

export type CreateDishInput = z.infer<typeof createDishSchema>;

// ════════════════════════════════════════════════════════════════════════════
// UPDATE DISH SCHEMA
// ════════════════════════════════════════════════════════════════════════════

export const updateDishSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name cannot exceed 255 characters')
    .optional(),
  
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  
  category: dishCategorySchema
    .optional(),
  
  allergens: z.array(z.string())
    .optional(),
  
  priceModifier: z.number()
    .min(-1000, 'Price modifier too low')
    .max(10000, 'Price modifier too high')
    .optional(),
  
  imageUrl: z.string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
  
  thumbnailUrl: z.string()
    .url('Invalid thumbnail URL')
    .optional()
    .nullable(),
  
  isActive: z.boolean()
    .optional(),
  
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative')
    .optional()
});

export type UpdateDishInput = z.infer<typeof updateDishSchema>;

// ════════════════════════════════════════════════════════════════════════════
// QUERY FILTERS SCHEMA
// ════════════════════════════════════════════════════════════════════════════

export const dishQuerySchema = z.object({
  category: dishCategorySchema
    .optional(),
  
  isActive: z.string()
    .transform(val => val === 'true')
    .optional(),
  
  search: z.string()
    .min(1, 'Search query must not be empty')
    .optional()
});

export type DishQueryInput = z.infer<typeof dishQuerySchema>;
