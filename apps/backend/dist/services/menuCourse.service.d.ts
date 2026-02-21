/**
 * Menu Course Service
 * Handles all business logic for menu course operations
 */
export interface CreateMenuCourseInput {
    packageId: string;
    name: string;
    description?: string;
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    displayOrder?: number;
    icon?: string;
}
export interface UpdateMenuCourseInput {
    name?: string;
    description?: string;
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    displayOrder?: number;
    icon?: string;
}
export interface AssignDishInput {
    dishId: string;
    customPrice?: number;
    isDefault?: boolean;
    isRecommended?: boolean;
    displayOrder?: number;
}
export declare class MenuCourseService {
    listByPackage(packageId: string): Promise<({
        options: ({
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
            isRecommended: boolean;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
            dishId: string;
            courseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    })[]>;
    getById(id: string): Promise<{
        options: ({
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
            isRecommended: boolean;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
            dishId: string;
            courseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    }>;
    create(data: CreateMenuCourseInput): Promise<{
        options: ({
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
            isRecommended: boolean;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
            dishId: string;
            courseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    }>;
    update(id: string, data: UpdateMenuCourseInput): Promise<{
        options: ({
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
            isRecommended: boolean;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
            dishId: string;
            courseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    }>;
    assignDishes(courseId: string, dishes: AssignDishInput[]): Promise<{
        options: ({
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
            isRecommended: boolean;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
            dishId: string;
            courseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    }>;
    removeDish(courseId: string, dishId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        displayOrder: number;
        isRecommended: boolean;
        customPrice: import("@prisma/client/runtime/library").Decimal | null;
        isDefault: boolean;
        dishId: string;
        courseId: string;
    }>;
    getForSelection(courseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    }>;
    reorderDishes(courseId: string, orders: Array<{
        dishId: string;
        displayOrder: number;
    }>): Promise<{
        options: ({
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
            isRecommended: boolean;
            customPrice: import("@prisma/client/runtime/library").Decimal | null;
            isDefault: boolean;
            dishId: string;
            courseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        icon: string | null;
        displayOrder: number;
        packageId: string;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
    }>;
}
export declare const menuCourseService: MenuCourseService;
//# sourceMappingURL=menuCourse.service.d.ts.map