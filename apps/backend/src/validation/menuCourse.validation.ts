/**
 * Menu Course Validation Schemas
 * 
 * Zod schemas for menu course operations
 */

import { z } from 'zod';

// ════════════════════════════════════════════════════════════════════════════
// CREATE MENU COURSE SCHEMA
// ════════════════════════════════════════════════════════════════════════════

export const createMenuCourseSchema = z.object({
  packageId: z.string()
    .uuid('Invalid package ID'),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name cannot exceed 255 characters'),
  
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  
  minSelect: z.number()
    .int('Min select must be an integer')
    .min(0, 'Min select must be non-negative')
    .default(1),
  
  maxSelect: z.number()
    .int('Max select must be an integer')
    .min(1, 'Max select must be at least 1')
    .default(1),
  
  isRequired: z.boolean()
    .default(true),
  
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative')
    .default(0),
  
  icon: z.string()
    .max(50, 'Icon name cannot exceed 50 characters')
    .optional()
}).refine(
  (data) => data.maxSelect >= data.minSelect,
  {
    message: 'Max select must be greater than or equal to min select',
    path: ['maxSelect']
  }
);

export type CreateMenuCourseInput = z.infer<typeof createMenuCourseSchema>;

// ════════════════════════════════════════════════════════════════════════════
// UPDATE MENU COURSE SCHEMA
// ════════════════════════════════════════════════════════════════════════════

export const updateMenuCourseSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name cannot exceed 255 characters')
    .optional(),
  
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  
  minSelect: z.number()
    .int('Min select must be an integer')
    .min(0, 'Min select must be non-negative')
    .optional(),
  
  maxSelect: z.number()
    .int('Max select must be an integer')
    .min(1, 'Max select must be at least 1')
    .optional(),
  
  isRequired: z.boolean()
    .optional(),
  
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative')
    .optional(),
  
  icon: z.string()
    .max(50, 'Icon name cannot exceed 50 characters')
    .optional()
    .nullable()
}).refine(
  (data) => {
    if (data.minSelect !== undefined && data.maxSelect !== undefined) {
      return data.maxSelect >= data.minSelect;
    }
    return true;
  },
  {
    message: 'Max select must be greater than or equal to min select',
    path: ['maxSelect']
  }
);

export type UpdateMenuCourseInput = z.infer<typeof updateMenuCourseSchema>;

// ════════════════════════════════════════════════════════════════════════════
// ASSIGN DISHES TO COURSE SCHEMA
// ════════════════════════════════════════════════════════════════════════════

export const assignDishToCourseSchema = z.object({
  dishId: z.string()
    .uuid('Invalid dish ID'),
  
  customPrice: z.number()
    .min(-1000, 'Custom price too low')
    .max(10000, 'Custom price too high')
    .optional(),
  
  isDefault: z.boolean()
    .default(false),
  
  isRecommended: z.boolean()
    .default(false),
  
  displayOrder: z.number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be non-negative')
    .optional()
});

export const assignDishesToCourseSchema = z.object({
  dishes: z.array(assignDishToCourseSchema)
    .min(1, 'At least one dish must be provided')
    .max(50, 'Cannot assign more than 50 dishes at once')
});

export type AssignDishInput = z.infer<typeof assignDishToCourseSchema>;
export type AssignDishesToCourseInput = z.infer<typeof assignDishesToCourseSchema>;

// ════════════════════════════════════════════════════════════════════════════
// REORDER DISHES SCHEMA
// ════════════════════════════════════════════════════════════════════════════

export const reorderDishesSchema = z.object({
  orders: z.array(
    z.object({
      dishId: z.string().uuid('Invalid dish ID'),
      displayOrder: z.number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be non-negative')
    })
  )
  .min(1, 'At least one item must be provided')
});

export type ReorderDishesInput = z.infer<typeof reorderDishesSchema>;
