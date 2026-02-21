/**
 * Package Category Settings Service
 * Business logic for managing category settings for menu packages
 */
import { DishCategory } from '@prisma/client';
export interface CreateCategorySettingInput {
    packageId: string;
    category: DishCategory;
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    isEnabled?: boolean;
    displayOrder?: number;
    customLabel?: string | null;
}
export interface UpdateCategorySettingInput {
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    isEnabled?: boolean;
    displayOrder?: number;
    customLabel?: string | null;
}
export interface BulkUpdateCategorySettingsInput {
    settings: Array<{
        category: DishCategory;
        minSelect?: number;
        maxSelect?: number;
        isRequired?: boolean;
        isEnabled?: boolean;
        displayOrder?: number;
        customLabel?: string | null;
    }>;
}
declare class PackageCategoryService {
    getByPackageId(packageId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        displayOrder: number;
        isEnabled: boolean;
        packageId: string;
        categoryId: string;
        minSelect: import("@prisma/client/runtime/library").Decimal;
        maxSelect: import("@prisma/client/runtime/library").Decimal;
        isRequired: boolean;
        customLabel: string | null;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        displayOrder: number;
        isEnabled: boolean;
        packageId: string;
        categoryId: string;
        minSelect: import("@prisma/client/runtime/library").Decimal;
        maxSelect: import("@prisma/client/runtime/library").Decimal;
        isRequired: boolean;
        customLabel: string | null;
    }>;
    create(data: CreateCategorySettingInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        displayOrder: number;
        isEnabled: boolean;
        packageId: string;
        categoryId: string;
        minSelect: import("@prisma/client/runtime/library").Decimal;
        maxSelect: import("@prisma/client/runtime/library").Decimal;
        isRequired: boolean;
        customLabel: string | null;
    }>;
    update(id: string, data: UpdateCategorySettingInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        displayOrder: number;
        isEnabled: boolean;
        packageId: string;
        categoryId: string;
        minSelect: import("@prisma/client/runtime/library").Decimal;
        maxSelect: import("@prisma/client/runtime/library").Decimal;
        isRequired: boolean;
        customLabel: string | null;
    }>;
    bulkUpdate(packageId: string, input: BulkUpdateCategorySettingsInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        displayOrder: number;
        isEnabled: boolean;
        packageId: string;
        categoryId: string;
        minSelect: import("@prisma/client/runtime/library").Decimal;
        maxSelect: import("@prisma/client/runtime/library").Decimal;
        isRequired: boolean;
        customLabel: string | null;
    }[]>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
export declare const packageCategoryService: PackageCategoryService;
export {};
//# sourceMappingURL=packageCategory.service.d.ts.map