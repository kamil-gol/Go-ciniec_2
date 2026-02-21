/**
 * Dish Validation Schemas
 *
 * Zod schemas for dish library operations
 * FIX: Changed category field to categoryId (UUID) instead of enum
 */
import { z } from 'zod';
export declare const createDishSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    allergens: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    priceModifier: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    thumbnailUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    displayOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    categoryId: string;
    allergens: string[];
    isActive?: boolean | undefined;
    description?: string | undefined;
    displayOrder?: number | undefined;
    imageUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    priceModifier?: number | undefined;
}, {
    name: string;
    categoryId: string;
    isActive?: boolean | undefined;
    description?: string | undefined;
    displayOrder?: number | undefined;
    imageUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    allergens?: string[] | undefined;
    priceModifier?: number | undefined;
}>;
export type CreateDishInput = z.infer<typeof createDishSchema>;
export declare const updateDishSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodString>;
    allergens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priceModifier: z.ZodOptional<z.ZodNumber>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    thumbnailUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    displayOrder?: number | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    allergens?: string[] | undefined;
    priceModifier?: number | undefined;
}, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    displayOrder?: number | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    allergens?: string[] | undefined;
    priceModifier?: number | undefined;
}>;
export type UpdateDishInput = z.infer<typeof updateDishSchema>;
export declare const dishQuerySchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    isActive?: boolean | undefined;
    categoryId?: string | undefined;
}, {
    search?: string | undefined;
    isActive?: string | undefined;
    categoryId?: string | undefined;
}>;
export type DishQueryInput = z.infer<typeof dishQuerySchema>;
//# sourceMappingURL=dish.validation.d.ts.map