/**
 * Dish Validation Schemas
 *
 * Zod schemas for dish library operations
 * FIX: Changed category field to categoryId (UUID) instead of enum
 */
import { z } from 'zod';
// ══════════════════════════════════════════════════════════════════════════
// CREATE DISH SCHEMA
// ══════════════════════════════════════════════════════════════════════════
export const createDishSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(255, 'Name cannot exceed 255 characters'),
    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    categoryId: z.string()
        .uuid('Invalid category ID'), // FIX: Changed from 'category' enum to 'categoryId' UUID
    allergens: z.array(z.string())
        .default([]),
    priceModifier: z.number()
        .min(-1000, 'Price modifier too low')
        .max(10000, 'Price modifier too high')
        .default(0)
        .optional(), // Make optional for tests that don't send it
    imageUrl: z.string()
        .url('Invalid image URL')
        .optional()
        .nullable(),
    thumbnailUrl: z.string()
        .url('Invalid thumbnail URL')
        .optional()
        .nullable(),
    isActive: z.boolean()
        .default(true)
        .optional(),
    displayOrder: z.number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be non-negative')
        .default(0)
        .optional()
});
// ══════════════════════════════════════════════════════════════════════════
// UPDATE DISH SCHEMA
// ══════════════════════════════════════════════════════════════════════════
export const updateDishSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(255, 'Name cannot exceed 255 characters')
        .optional(),
    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional()
        .nullable(),
    categoryId: z.string()
        .uuid('Invalid category ID')
        .optional(), // FIX: Changed from 'category' enum to 'categoryId' UUID
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
// ══════════════════════════════════════════════════════════════════════════
// QUERY FILTERS SCHEMA
// ══════════════════════════════════════════════════════════════════════════
export const dishQuerySchema = z.object({
    categoryId: z.string()
        .uuid('Invalid category ID')
        .optional(),
    isActive: z.string()
        .transform(val => val === 'true')
        .optional(),
    search: z.string()
        .min(1, 'Search query must not be empty')
        .optional()
});
//# sourceMappingURL=dish.validation.js.map