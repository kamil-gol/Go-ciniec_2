/**
 * Menu Validation Schemas
 *
 * Zod schemas for validating menu-related API requests
 * FIX: selectMenuSchema now includes dishSelections
 * FIX: updateMenuSelectionSchema removed (updateMenu now uses selectMenuSchema)
 * FIX: validFrom made optional for template creation
 */
import { z } from 'zod';
export declare const createMenuTemplateSchema: z.ZodEffects<z.ZodObject<{
    eventTypeId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    variant: z.ZodOptional<z.ZodString>;
    validFrom: z.ZodOptional<z.ZodDate>;
    validTo: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    name: string;
    eventTypeId: string;
    displayOrder: number;
    description?: string | undefined;
    imageUrl?: string | null | undefined;
    variant?: string | undefined;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
}, {
    name: string;
    eventTypeId: string;
    isActive?: boolean | undefined;
    description?: string | undefined;
    displayOrder?: number | undefined;
    imageUrl?: string | null | undefined;
    variant?: string | undefined;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
}>, {
    isActive: boolean;
    name: string;
    eventTypeId: string;
    displayOrder: number;
    description?: string | undefined;
    imageUrl?: string | null | undefined;
    variant?: string | undefined;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
}, {
    name: string;
    eventTypeId: string;
    isActive?: boolean | undefined;
    description?: string | undefined;
    displayOrder?: number | undefined;
    imageUrl?: string | null | undefined;
    variant?: string | undefined;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
}>;
export declare const updateMenuTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    variant: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    validFrom: z.ZodOptional<z.ZodDate>;
    validTo: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    displayOrder?: number | undefined;
    imageUrl?: string | null | undefined;
    variant?: string | null | undefined;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
}, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    displayOrder?: number | undefined;
    imageUrl?: string | null | undefined;
    variant?: string | null | undefined;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
}>;
export declare const duplicateMenuTemplateSchema: z.ZodObject<{
    newName: z.ZodString;
    newVariant: z.ZodOptional<z.ZodString>;
    validFrom: z.ZodOptional<z.ZodDate>;
    validTo: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    newName: string;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
    newVariant?: string | undefined;
}, {
    newName: string;
    validFrom?: Date | undefined;
    validTo?: Date | null | undefined;
    newVariant?: string | undefined;
}>;
export declare const createMenuPackageSchema: z.ZodEffects<z.ZodObject<{
    menuTemplateId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    shortDescription: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pricePerAdult: z.ZodNumber;
    pricePerChild: z.ZodNumber;
    pricePerToddler: z.ZodNumber;
    includedItems: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    minGuests: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    maxGuests: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, string | null, string>, z.ZodNullable<z.ZodString>>>>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    badgeText: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    isPopular: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isRecommended: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    menuTemplateId: string;
    displayOrder: number;
    isPopular: boolean;
    isRecommended: boolean;
    includedItems: string[];
    description?: string | null | undefined;
    color?: string | null | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    badgeText?: string | null | undefined;
    minGuests?: number | null | undefined;
    maxGuests?: number | null | undefined;
    imageUrl?: string | null | undefined;
}, {
    name: string;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    menuTemplateId: string;
    description?: string | null | undefined;
    color?: string | null | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    badgeText?: string | null | undefined;
    displayOrder?: number | undefined;
    isPopular?: boolean | undefined;
    isRecommended?: boolean | undefined;
    includedItems?: string[] | undefined;
    minGuests?: number | null | undefined;
    maxGuests?: number | null | undefined;
    imageUrl?: string | null | undefined;
}>, {
    name: string;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    menuTemplateId: string;
    displayOrder: number;
    isPopular: boolean;
    isRecommended: boolean;
    includedItems: string[];
    description?: string | null | undefined;
    color?: string | null | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    badgeText?: string | null | undefined;
    minGuests?: number | null | undefined;
    maxGuests?: number | null | undefined;
    imageUrl?: string | null | undefined;
}, {
    name: string;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    menuTemplateId: string;
    description?: string | null | undefined;
    color?: string | null | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    badgeText?: string | null | undefined;
    displayOrder?: number | undefined;
    isPopular?: boolean | undefined;
    isRecommended?: boolean | undefined;
    includedItems?: string[] | undefined;
    minGuests?: number | null | undefined;
    maxGuests?: number | null | undefined;
    imageUrl?: string | null | undefined;
}>;
export declare const updateMenuPackageSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    shortDescription: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pricePerAdult: z.ZodOptional<z.ZodNumber>;
    pricePerChild: z.ZodOptional<z.ZodNumber>;
    pricePerToddler: z.ZodOptional<z.ZodNumber>;
    includedItems: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minGuests: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    maxGuests: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodNullable<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, string | null, string>, z.ZodNullable<z.ZodString>>>>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    badgeText: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isPopular: z.ZodOptional<z.ZodBoolean>;
    isRecommended: z.ZodOptional<z.ZodBoolean>;
    changeReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    color?: string | null | undefined;
    pricePerAdult?: number | undefined;
    pricePerChild?: number | undefined;
    pricePerToddler?: number | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    badgeText?: string | null | undefined;
    displayOrder?: number | undefined;
    isPopular?: boolean | undefined;
    isRecommended?: boolean | undefined;
    includedItems?: string[] | undefined;
    minGuests?: number | null | undefined;
    maxGuests?: number | null | undefined;
    imageUrl?: string | null | undefined;
    changeReason?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    color?: string | null | undefined;
    pricePerAdult?: number | undefined;
    pricePerChild?: number | undefined;
    pricePerToddler?: number | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    badgeText?: string | null | undefined;
    displayOrder?: number | undefined;
    isPopular?: boolean | undefined;
    isRecommended?: boolean | undefined;
    includedItems?: string[] | undefined;
    minGuests?: number | null | undefined;
    maxGuests?: number | null | undefined;
    imageUrl?: string | null | undefined;
    changeReason?: string | undefined;
}>;
export declare const reorderPackagesSchema: z.ZodObject<{
    packageOrders: z.ZodArray<z.ZodObject<{
        packageId: z.ZodString;
        displayOrder: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        displayOrder: number;
        packageId: string;
    }, {
        displayOrder: number;
        packageId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    packageOrders: {
        displayOrder: number;
        packageId: string;
    }[];
}, {
    packageOrders: {
        displayOrder: number;
        packageId: string;
    }[];
}>;
export declare const categorySettingSchema: z.ZodEffects<z.ZodObject<{
    categoryId: z.ZodString;
    minSelect: z.ZodNumber;
    maxSelect: z.ZodNumber;
    isRequired: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isEnabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    customLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    displayOrder: number;
    isEnabled: boolean;
    categoryId: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    customLabel?: string | null | undefined;
}, {
    categoryId: string;
    minSelect: number;
    maxSelect: number;
    displayOrder?: number | undefined;
    isEnabled?: boolean | undefined;
    isRequired?: boolean | undefined;
    customLabel?: string | null | undefined;
}>, {
    displayOrder: number;
    isEnabled: boolean;
    categoryId: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    customLabel?: string | null | undefined;
}, {
    categoryId: string;
    minSelect: number;
    maxSelect: number;
    displayOrder?: number | undefined;
    isEnabled?: boolean | undefined;
    isRequired?: boolean | undefined;
    customLabel?: string | null | undefined;
}>;
export declare const bulkUpdateCategorySettingsSchema: z.ZodObject<{
    settings: z.ZodArray<z.ZodEffects<z.ZodObject<{
        categoryId: z.ZodString;
        minSelect: z.ZodNumber;
        maxSelect: z.ZodNumber;
        isRequired: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        isEnabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        customLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        displayOrder: number;
        isEnabled: boolean;
        categoryId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
        customLabel?: string | null | undefined;
    }, {
        categoryId: string;
        minSelect: number;
        maxSelect: number;
        displayOrder?: number | undefined;
        isEnabled?: boolean | undefined;
        isRequired?: boolean | undefined;
        customLabel?: string | null | undefined;
    }>, {
        displayOrder: number;
        isEnabled: boolean;
        categoryId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
        customLabel?: string | null | undefined;
    }, {
        categoryId: string;
        minSelect: number;
        maxSelect: number;
        displayOrder?: number | undefined;
        isEnabled?: boolean | undefined;
        isRequired?: boolean | undefined;
        customLabel?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    settings: {
        displayOrder: number;
        isEnabled: boolean;
        categoryId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
        customLabel?: string | null | undefined;
    }[];
}, {
    settings: {
        categoryId: string;
        minSelect: number;
        maxSelect: number;
        displayOrder?: number | undefined;
        isEnabled?: boolean | undefined;
        isRequired?: boolean | undefined;
        customLabel?: string | null | undefined;
    }[];
}>;
export declare const createMenuOptionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    priceType: z.ZodEnum<["PER_PERSON", "FLAT", "FREE"]>;
    priceAmount: z.ZodNumber;
    allowMultiple: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maxQuantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    name: string;
    displayOrder: number;
    category: string;
    priceType: "PER_PERSON" | "FLAT" | "FREE";
    priceAmount: number;
    allowMultiple: boolean;
    description?: string | undefined;
    shortDescription?: string | undefined;
    icon?: string | null | undefined;
    maxQuantity?: number | null | undefined;
    imageUrl?: string | null | undefined;
}, {
    name: string;
    category: string;
    priceType: "PER_PERSON" | "FLAT" | "FREE";
    priceAmount: number;
    isActive?: boolean | undefined;
    description?: string | undefined;
    shortDescription?: string | undefined;
    icon?: string | null | undefined;
    displayOrder?: number | undefined;
    allowMultiple?: boolean | undefined;
    maxQuantity?: number | null | undefined;
    imageUrl?: string | null | undefined;
}>;
export declare const updateMenuOptionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    shortDescription: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    priceType: z.ZodOptional<z.ZodEnum<["PER_PERSON", "FLAT", "FREE"]>>;
    priceAmount: z.ZodOptional<z.ZodNumber>;
    allowMultiple: z.ZodOptional<z.ZodBoolean>;
    maxQuantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    changeReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    displayOrder?: number | undefined;
    category?: string | undefined;
    priceType?: "PER_PERSON" | "FLAT" | "FREE" | undefined;
    priceAmount?: number | undefined;
    allowMultiple?: boolean | undefined;
    maxQuantity?: number | null | undefined;
    imageUrl?: string | null | undefined;
    changeReason?: string | undefined;
}, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    shortDescription?: string | null | undefined;
    icon?: string | null | undefined;
    displayOrder?: number | undefined;
    category?: string | undefined;
    priceType?: "PER_PERSON" | "FLAT" | "FREE" | undefined;
    priceAmount?: number | undefined;
    allowMultiple?: boolean | undefined;
    maxQuantity?: number | null | undefined;
    imageUrl?: string | null | undefined;
    changeReason?: string | undefined;
}>;
export declare const assignOptionsToPackageSchema: z.ZodObject<{
    options: z.ZodArray<z.ZodObject<{
        optionId: z.ZodString;
        customPrice: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        isRequired: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        isDefault: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        displayOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        isRequired: boolean;
        optionId: string;
        isDefault: boolean;
        displayOrder?: number | undefined;
        customPrice?: number | null | undefined;
    }, {
        optionId: string;
        displayOrder?: number | undefined;
        isRequired?: boolean | undefined;
        customPrice?: number | null | undefined;
        isDefault?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    options: {
        isRequired: boolean;
        optionId: string;
        isDefault: boolean;
        displayOrder?: number | undefined;
        customPrice?: number | null | undefined;
    }[];
}, {
    options: {
        optionId: string;
        displayOrder?: number | undefined;
        isRequired?: boolean | undefined;
        customPrice?: number | null | undefined;
        isDefault?: boolean | undefined;
    }[];
}>;
/**
 * Full menu selection schema - used for both POST and PUT
 * Includes packageId, selectedOptions, AND dishSelections
 */
export declare const selectMenuSchema: z.ZodObject<{
    packageId: z.ZodString;
    selectedOptions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        optionId: z.ZodString;
        quantity: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        optionId: string;
        quantity: number;
    }, {
        optionId: string;
        quantity?: number | undefined;
    }>, "many">>>;
    dishSelections: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        categoryId: z.ZodString;
        dishes: z.ZodDefault<z.ZodArray<z.ZodObject<{
            dishId: z.ZodString;
            quantity: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            dishId: string;
            quantity: number;
        }, {
            dishId: string;
            quantity?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        categoryId: string;
        dishes: {
            dishId: string;
            quantity: number;
        }[];
    }, {
        categoryId: string;
        dishes?: {
            dishId: string;
            quantity?: number | undefined;
        }[] | undefined;
    }>, "many">>>;
    templateId: z.ZodOptional<z.ZodString>;
    adults: z.ZodOptional<z.ZodNumber>;
    children: z.ZodOptional<z.ZodNumber>;
    toddlers: z.ZodOptional<z.ZodNumber>;
    adultsCount: z.ZodOptional<z.ZodNumber>;
    childrenCount: z.ZodOptional<z.ZodNumber>;
    toddlersCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    packageId: string;
    dishSelections: {
        categoryId: string;
        dishes: {
            dishId: string;
            quantity: number;
        }[];
    }[];
    selectedOptions: {
        optionId: string;
        quantity: number;
    }[];
    adults?: number | undefined;
    children?: number | undefined;
    toddlers?: number | undefined;
    adultsCount?: number | undefined;
    childrenCount?: number | undefined;
    toddlersCount?: number | undefined;
    templateId?: string | undefined;
}, {
    packageId: string;
    adults?: number | undefined;
    children?: number | undefined;
    toddlers?: number | undefined;
    adultsCount?: number | undefined;
    childrenCount?: number | undefined;
    toddlersCount?: number | undefined;
    dishSelections?: {
        categoryId: string;
        dishes?: {
            dishId: string;
            quantity?: number | undefined;
        }[] | undefined;
    }[] | undefined;
    selectedOptions?: {
        optionId: string;
        quantity?: number | undefined;
    }[] | undefined;
    templateId?: string | undefined;
}>;
/**
 * Guest counts update schema - for updating only counts (e.g. from reservation edit)
 */
export declare const updateMenuSelectionSchema: z.ZodObject<{
    adultsCount: z.ZodOptional<z.ZodNumber>;
    childrenCount: z.ZodOptional<z.ZodNumber>;
    toddlersCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    adultsCount?: number | undefined;
    childrenCount?: number | undefined;
    toddlersCount?: number | undefined;
}, {
    adultsCount?: number | undefined;
    childrenCount?: number | undefined;
    toddlersCount?: number | undefined;
}>;
export declare const menuTemplateQuerySchema: z.ZodObject<{
    eventTypeId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    date: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    eventTypeId?: string | undefined;
    date?: Date | undefined;
}, {
    isActive?: boolean | undefined;
    eventTypeId?: string | undefined;
    date?: Date | undefined;
}>;
export declare const menuOptionQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    isActive?: boolean | undefined;
    category?: string | undefined;
}, {
    search?: string | undefined;
    isActive?: boolean | undefined;
    category?: string | undefined;
}>;
//# sourceMappingURL=menu.validation.d.ts.map