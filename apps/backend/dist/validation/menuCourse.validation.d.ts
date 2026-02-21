/**
 * Menu Course Validation Schemas
 *
 * Zod schemas for menu course operations
 */
import { z } from 'zod';
export declare const createMenuCourseSchema: z.ZodEffects<z.ZodObject<{
    packageId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    minSelect: z.ZodDefault<z.ZodNumber>;
    maxSelect: z.ZodDefault<z.ZodNumber>;
    isRequired: z.ZodDefault<z.ZodBoolean>;
    displayOrder: z.ZodDefault<z.ZodNumber>;
    icon: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    displayOrder: number;
    packageId: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    description?: string | undefined;
    icon?: string | undefined;
}, {
    name: string;
    packageId: string;
    description?: string | undefined;
    icon?: string | undefined;
    displayOrder?: number | undefined;
    minSelect?: number | undefined;
    maxSelect?: number | undefined;
    isRequired?: boolean | undefined;
}>, {
    name: string;
    displayOrder: number;
    packageId: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    description?: string | undefined;
    icon?: string | undefined;
}, {
    name: string;
    packageId: string;
    description?: string | undefined;
    icon?: string | undefined;
    displayOrder?: number | undefined;
    minSelect?: number | undefined;
    maxSelect?: number | undefined;
    isRequired?: boolean | undefined;
}>;
export type CreateMenuCourseInput = z.infer<typeof createMenuCourseSchema>;
export declare const updateMenuCourseSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    minSelect: z.ZodOptional<z.ZodNumber>;
    maxSelect: z.ZodOptional<z.ZodNumber>;
    isRequired: z.ZodOptional<z.ZodBoolean>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | null | undefined;
    displayOrder?: number | undefined;
    minSelect?: number | undefined;
    maxSelect?: number | undefined;
    isRequired?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | null | undefined;
    displayOrder?: number | undefined;
    minSelect?: number | undefined;
    maxSelect?: number | undefined;
    isRequired?: boolean | undefined;
}>, {
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | null | undefined;
    displayOrder?: number | undefined;
    minSelect?: number | undefined;
    maxSelect?: number | undefined;
    isRequired?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | null | undefined;
    displayOrder?: number | undefined;
    minSelect?: number | undefined;
    maxSelect?: number | undefined;
    isRequired?: boolean | undefined;
}>;
export type UpdateMenuCourseInput = z.infer<typeof updateMenuCourseSchema>;
export declare const assignDishToCourseSchema: z.ZodObject<{
    dishId: z.ZodString;
    customPrice: z.ZodOptional<z.ZodNumber>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    isRecommended: z.ZodDefault<z.ZodBoolean>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    isRecommended: boolean;
    isDefault: boolean;
    dishId: string;
    displayOrder?: number | undefined;
    customPrice?: number | undefined;
}, {
    dishId: string;
    displayOrder?: number | undefined;
    isRecommended?: boolean | undefined;
    customPrice?: number | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const assignDishesToCourseSchema: z.ZodObject<{
    dishes: z.ZodArray<z.ZodObject<{
        dishId: z.ZodString;
        customPrice: z.ZodOptional<z.ZodNumber>;
        isDefault: z.ZodDefault<z.ZodBoolean>;
        isRecommended: z.ZodDefault<z.ZodBoolean>;
        displayOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        isRecommended: boolean;
        isDefault: boolean;
        dishId: string;
        displayOrder?: number | undefined;
        customPrice?: number | undefined;
    }, {
        dishId: string;
        displayOrder?: number | undefined;
        isRecommended?: boolean | undefined;
        customPrice?: number | undefined;
        isDefault?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    dishes: {
        isRecommended: boolean;
        isDefault: boolean;
        dishId: string;
        displayOrder?: number | undefined;
        customPrice?: number | undefined;
    }[];
}, {
    dishes: {
        dishId: string;
        displayOrder?: number | undefined;
        isRecommended?: boolean | undefined;
        customPrice?: number | undefined;
        isDefault?: boolean | undefined;
    }[];
}>;
export type AssignDishInput = z.infer<typeof assignDishToCourseSchema>;
export type AssignDishesToCourseInput = z.infer<typeof assignDishesToCourseSchema>;
export declare const reorderDishesSchema: z.ZodObject<{
    orders: z.ZodArray<z.ZodObject<{
        dishId: z.ZodString;
        displayOrder: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        displayOrder: number;
        dishId: string;
    }, {
        displayOrder: number;
        dishId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    orders: {
        displayOrder: number;
        dishId: string;
    }[];
}, {
    orders: {
        displayOrder: number;
        dishId: string;
    }[];
}>;
export type ReorderDishesInput = z.infer<typeof reorderDishesSchema>;
//# sourceMappingURL=menuCourse.validation.d.ts.map