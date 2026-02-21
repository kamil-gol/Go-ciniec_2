/**
 * Addon Group Service
 * Business logic for managing addon groups and their dishes
 */
export interface CreateAddonGroupInput {
    name: string;
    description?: string | null;
    minSelect?: number;
    maxSelect?: number;
    priceType: string;
    basePrice?: number;
    icon?: string | null;
    displayOrder?: number;
    isActive?: boolean;
}
export interface UpdateAddonGroupInput {
    name?: string;
    description?: string | null;
    minSelect?: number;
    maxSelect?: number;
    priceType?: string;
    basePrice?: number;
    icon?: string | null;
    displayOrder?: number;
    isActive?: boolean;
}
export interface AssignDishesToGroupInput {
    dishes: Array<{
        dishId: string;
        customPrice?: number | null;
        displayOrder?: number;
    }>;
}
declare class AddonGroupService {
    list(filters?: {
        isActive?: boolean;
        search?: string;
    }): Promise<({
        addons: ({
            dish: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                displayOrder: number;
                categoryId: string;
                allergens: string[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            dishId: string;
            groupId: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        minSelect: number;
        maxSelect: number;
        priceType: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getById(id: string): Promise<{
        addons: ({
            dish: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                displayOrder: number;
                categoryId: string;
                allergens: string[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            dishId: string;
            groupId: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        minSelect: number;
        maxSelect: number;
        priceType: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(data: CreateAddonGroupInput): Promise<{
        addons: ({
            dish: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                displayOrder: number;
                categoryId: string;
                allergens: string[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            dishId: string;
            groupId: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        minSelect: number;
        maxSelect: number;
        priceType: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, data: UpdateAddonGroupInput): Promise<{
        addons: ({
            dish: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                displayOrder: number;
                categoryId: string;
                allergens: string[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            dishId: string;
            groupId: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        minSelect: number;
        maxSelect: number;
        priceType: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    assignDishes(groupId: string, input: AssignDishesToGroupInput): Promise<({
        dish: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            displayOrder: number;
            categoryId: string;
            allergens: string[];
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        displayOrder: number;
        customPrice: import("@prisma/client/runtime/library").Decimal | null;
        dishId: string;
        groupId: string;
    })[]>;
    removeDish(groupId: string, dishId: string): Promise<{
        success: boolean;
    }>;
}
export declare const addonGroupService: AddonGroupService;
export {};
//# sourceMappingURL=addonGroup.service.d.ts.map