/**
 * Menu Service - with Audit Logging
 * Simplified: only added userId params + audit logChange() for key operations.
 * Full original logic preserved.
 */
import { Prisma } from '@prisma/client';
import { CreateMenuTemplateInput, UpdateMenuTemplateInput, CreateMenuPackageInput, UpdateMenuPackageInput, CreateMenuOptionInput, UpdateMenuOptionInput, AssignOptionsToPackageInput } from '../types/menu.types';
export declare class MenuService {
    getMenuTemplates(filters?: {
        eventTypeId?: string;
        isActive?: boolean;
        date?: Date;
    }): Promise<({
        eventType: {
            id: string;
            name: string;
            color: string | null;
        };
        packages: {
            id: string;
            name: string;
            color: string | null;
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            icon: string | null;
            isPopular: boolean;
            isRecommended: boolean;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        eventTypeId: string;
        displayOrder: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        variant: string | null;
        validFrom: Date | null;
        validTo: Date | null;
    })[]>;
    getMenuTemplateById(id: string): Promise<{
        eventType: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        };
        packages: ({
            packageOptions: ({
                option: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    shortDescription: string | null;
                    icon: string | null;
                    displayOrder: number;
                    category: string;
                    priceType: string;
                    priceAmount: Prisma.Decimal;
                    allowMultiple: boolean;
                    maxQuantity: number;
                    imageUrl: string | null;
                    thumbnailUrl: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                displayOrder: number;
                packageId: string;
                isRequired: boolean;
                optionId: string;
                customPrice: Prisma.Decimal | null;
                isDefault: boolean;
                isExclusive: boolean;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            menuTemplateId: string;
            shortDescription: string | null;
            icon: string | null;
            badgeText: string | null;
            displayOrder: number;
            isPopular: boolean;
            isRecommended: boolean;
            includedItems: string[];
            minGuests: number | null;
            maxGuests: number | null;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        eventTypeId: string;
        displayOrder: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        variant: string | null;
        validFrom: Date | null;
        validTo: Date | null;
    }>;
    getActiveMenuForEventType(eventTypeId: string, date?: Date): Promise<{
        eventType: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        };
        packages: ({
            packageOptions: ({
                option: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    shortDescription: string | null;
                    icon: string | null;
                    displayOrder: number;
                    category: string;
                    priceType: string;
                    priceAmount: Prisma.Decimal;
                    allowMultiple: boolean;
                    maxQuantity: number;
                    imageUrl: string | null;
                    thumbnailUrl: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                displayOrder: number;
                packageId: string;
                isRequired: boolean;
                optionId: string;
                customPrice: Prisma.Decimal | null;
                isDefault: boolean;
                isExclusive: boolean;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            menuTemplateId: string;
            shortDescription: string | null;
            icon: string | null;
            badgeText: string | null;
            displayOrder: number;
            isPopular: boolean;
            isRecommended: boolean;
            includedItems: string[];
            minGuests: number | null;
            maxGuests: number | null;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        eventTypeId: string;
        displayOrder: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        variant: string | null;
        validFrom: Date | null;
        validTo: Date | null;
    }>;
    createMenuTemplate(data: CreateMenuTemplateInput, userId: string): Promise<{
        eventType: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        eventTypeId: string;
        displayOrder: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        variant: string | null;
        validFrom: Date | null;
        validTo: Date | null;
    }>;
    updateMenuTemplate(id: string, data: UpdateMenuTemplateInput, userId: string): Promise<{
        eventType: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        };
        packages: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            menuTemplateId: string;
            shortDescription: string | null;
            icon: string | null;
            badgeText: string | null;
            displayOrder: number;
            isPopular: boolean;
            isRecommended: boolean;
            includedItems: string[];
            minGuests: number | null;
            maxGuests: number | null;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        eventTypeId: string;
        displayOrder: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        variant: string | null;
        validFrom: Date | null;
        validTo: Date | null;
    }>;
    deleteMenuTemplate(id: string, userId: string): Promise<void>;
    duplicateMenuTemplate(id: string, newData: {
        name: string;
        variant?: string;
        validFrom: Date;
        validTo?: Date;
    }, userId: string): Promise<{
        eventType: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        };
        packages: ({
            packageOptions: ({
                option: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    shortDescription: string | null;
                    icon: string | null;
                    displayOrder: number;
                    category: string;
                    priceType: string;
                    priceAmount: Prisma.Decimal;
                    allowMultiple: boolean;
                    maxQuantity: number;
                    imageUrl: string | null;
                    thumbnailUrl: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                displayOrder: number;
                packageId: string;
                isRequired: boolean;
                optionId: string;
                customPrice: Prisma.Decimal | null;
                isDefault: boolean;
                isExclusive: boolean;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            menuTemplateId: string;
            shortDescription: string | null;
            icon: string | null;
            badgeText: string | null;
            displayOrder: number;
            isPopular: boolean;
            isRecommended: boolean;
            includedItems: string[];
            minGuests: number | null;
            maxGuests: number | null;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        eventTypeId: string;
        displayOrder: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        variant: string | null;
        validFrom: Date | null;
        validTo: Date | null;
    }>;
    getAllPackages(): Promise<({
        menuTemplate: {
            eventType: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
        };
        packageOptions: ({
            option: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                shortDescription: string | null;
                icon: string | null;
                displayOrder: number;
                category: string;
                priceType: string;
                priceAmount: Prisma.Decimal;
                allowMultiple: boolean;
                maxQuantity: number;
                imageUrl: string | null;
                thumbnailUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            packageId: string;
            isRequired: boolean;
            optionId: string;
            customPrice: Prisma.Decimal | null;
            isDefault: boolean;
            isExclusive: boolean;
        })[];
        categorySettings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            isEnabled: boolean;
            packageId: string;
            categoryId: string;
            minSelect: Prisma.Decimal;
            maxSelect: Prisma.Decimal;
            isRequired: boolean;
            customLabel: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
        pricePerAdult: Prisma.Decimal;
        pricePerChild: Prisma.Decimal;
        pricePerToddler: Prisma.Decimal;
        menuTemplateId: string;
        shortDescription: string | null;
        icon: string | null;
        badgeText: string | null;
        displayOrder: number;
        isPopular: boolean;
        isRecommended: boolean;
        includedItems: string[];
        minGuests: number | null;
        maxGuests: number | null;
    })[]>;
    getPackagesByTemplateId(templateId: string): Promise<({
        packageOptions: ({
            option: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                shortDescription: string | null;
                icon: string | null;
                displayOrder: number;
                category: string;
                priceType: string;
                priceAmount: Prisma.Decimal;
                allowMultiple: boolean;
                maxQuantity: number;
                imageUrl: string | null;
                thumbnailUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            packageId: string;
            isRequired: boolean;
            optionId: string;
            customPrice: Prisma.Decimal | null;
            isDefault: boolean;
            isExclusive: boolean;
        })[];
        categorySettings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            isEnabled: boolean;
            packageId: string;
            categoryId: string;
            minSelect: Prisma.Decimal;
            maxSelect: Prisma.Decimal;
            isRequired: boolean;
            customLabel: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
        pricePerAdult: Prisma.Decimal;
        pricePerChild: Prisma.Decimal;
        pricePerToddler: Prisma.Decimal;
        menuTemplateId: string;
        shortDescription: string | null;
        icon: string | null;
        badgeText: string | null;
        displayOrder: number;
        isPopular: boolean;
        isRecommended: boolean;
        includedItems: string[];
        minGuests: number | null;
        maxGuests: number | null;
    })[]>;
    getPackagesByEventType(eventTypeId: string): Promise<({
        menuTemplate: {
            eventType: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
        };
        packageOptions: ({
            option: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                shortDescription: string | null;
                icon: string | null;
                displayOrder: number;
                category: string;
                priceType: string;
                priceAmount: Prisma.Decimal;
                allowMultiple: boolean;
                maxQuantity: number;
                imageUrl: string | null;
                thumbnailUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            packageId: string;
            isRequired: boolean;
            optionId: string;
            customPrice: Prisma.Decimal | null;
            isDefault: boolean;
            isExclusive: boolean;
        })[];
        categorySettings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            isEnabled: boolean;
            packageId: string;
            categoryId: string;
            minSelect: Prisma.Decimal;
            maxSelect: Prisma.Decimal;
            isRequired: boolean;
            customLabel: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
        pricePerAdult: Prisma.Decimal;
        pricePerChild: Prisma.Decimal;
        pricePerToddler: Prisma.Decimal;
        menuTemplateId: string;
        shortDescription: string | null;
        icon: string | null;
        badgeText: string | null;
        displayOrder: number;
        isPopular: boolean;
        isRecommended: boolean;
        includedItems: string[];
        minGuests: number | null;
        maxGuests: number | null;
    })[]>;
    getPackageById(id: string): Promise<{
        menuTemplate: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            eventTypeId: string;
            displayOrder: number;
            imageUrl: string | null;
            thumbnailUrl: string | null;
            variant: string | null;
            validFrom: Date | null;
            validTo: Date | null;
        };
        packageOptions: ({
            option: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                shortDescription: string | null;
                icon: string | null;
                displayOrder: number;
                category: string;
                priceType: string;
                priceAmount: Prisma.Decimal;
                allowMultiple: boolean;
                maxQuantity: number;
                imageUrl: string | null;
                thumbnailUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            packageId: string;
            isRequired: boolean;
            optionId: string;
            customPrice: Prisma.Decimal | null;
            isDefault: boolean;
            isExclusive: boolean;
        })[];
        categorySettings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            isEnabled: boolean;
            packageId: string;
            categoryId: string;
            minSelect: Prisma.Decimal;
            maxSelect: Prisma.Decimal;
            isRequired: boolean;
            customLabel: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
        pricePerAdult: Prisma.Decimal;
        pricePerChild: Prisma.Decimal;
        pricePerToddler: Prisma.Decimal;
        menuTemplateId: string;
        shortDescription: string | null;
        icon: string | null;
        badgeText: string | null;
        displayOrder: number;
        isPopular: boolean;
        isRecommended: boolean;
        includedItems: string[];
        minGuests: number | null;
        maxGuests: number | null;
    }>;
    createPackage(data: CreateMenuPackageInput, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
        pricePerAdult: Prisma.Decimal;
        pricePerChild: Prisma.Decimal;
        pricePerToddler: Prisma.Decimal;
        menuTemplateId: string;
        shortDescription: string | null;
        icon: string | null;
        badgeText: string | null;
        displayOrder: number;
        isPopular: boolean;
        isRecommended: boolean;
        includedItems: string[];
        minGuests: number | null;
        maxGuests: number | null;
    }>;
    updatePackage(id: string, data: UpdateMenuPackageInput, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
        pricePerAdult: Prisma.Decimal;
        pricePerChild: Prisma.Decimal;
        pricePerToddler: Prisma.Decimal;
        menuTemplateId: string;
        shortDescription: string | null;
        icon: string | null;
        badgeText: string | null;
        displayOrder: number;
        isPopular: boolean;
        isRecommended: boolean;
        includedItems: string[];
        minGuests: number | null;
        maxGuests: number | null;
    }>;
    deletePackage(id: string, userId: string): Promise<void>;
    reorderPackages(orders: Array<{
        packageId: string;
        displayOrder: number;
    }>): Promise<{
        success: boolean;
        updated: number;
    }>;
    getOptions(filters?: {
        category?: string;
        isActive?: boolean;
        search?: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        shortDescription: string | null;
        icon: string | null;
        displayOrder: number;
        category: string;
        priceType: string;
        priceAmount: Prisma.Decimal;
        allowMultiple: boolean;
        maxQuantity: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
    }[]>;
    getOptionById(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        shortDescription: string | null;
        icon: string | null;
        displayOrder: number;
        category: string;
        priceType: string;
        priceAmount: Prisma.Decimal;
        allowMultiple: boolean;
        maxQuantity: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
    }>;
    createOption(data: CreateMenuOptionInput, userId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        shortDescription: string | null;
        icon: string | null;
        displayOrder: number;
        category: string;
        priceType: string;
        priceAmount: Prisma.Decimal;
        allowMultiple: boolean;
        maxQuantity: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
    }>;
    updateOption(id: string, data: UpdateMenuOptionInput, userId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        shortDescription: string | null;
        icon: string | null;
        displayOrder: number;
        category: string;
        priceType: string;
        priceAmount: Prisma.Decimal;
        allowMultiple: boolean;
        maxQuantity: number;
        imageUrl: string | null;
        thumbnailUrl: string | null;
    }>;
    deleteOption(id: string, userId: string): Promise<void>;
    assignOptionsToPackage(packageId: string, data: AssignOptionsToPackageInput): Promise<{
        menuTemplate: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            eventTypeId: string;
            displayOrder: number;
            imageUrl: string | null;
            thumbnailUrl: string | null;
            variant: string | null;
            validFrom: Date | null;
            validTo: Date | null;
        };
        packageOptions: ({
            option: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                shortDescription: string | null;
                icon: string | null;
                displayOrder: number;
                category: string;
                priceType: string;
                priceAmount: Prisma.Decimal;
                allowMultiple: boolean;
                maxQuantity: number;
                imageUrl: string | null;
                thumbnailUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            packageId: string;
            isRequired: boolean;
            optionId: string;
            customPrice: Prisma.Decimal | null;
            isDefault: boolean;
            isExclusive: boolean;
        })[];
        categorySettings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            isEnabled: boolean;
            packageId: string;
            categoryId: string;
            minSelect: Prisma.Decimal;
            maxSelect: Prisma.Decimal;
            isRequired: boolean;
            customLabel: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
        pricePerAdult: Prisma.Decimal;
        pricePerChild: Prisma.Decimal;
        pricePerToddler: Prisma.Decimal;
        menuTemplateId: string;
        shortDescription: string | null;
        icon: string | null;
        badgeText: string | null;
        displayOrder: number;
        isPopular: boolean;
        isRecommended: boolean;
        includedItems: string[];
        minGuests: number | null;
        maxGuests: number | null;
    }>;
    getPriceHistory(entityType: 'PACKAGE' | 'OPTION', entityId: string): Promise<{
        id: string;
        createdAt: Date;
        fieldName: string;
        oldValue: Prisma.Decimal;
        newValue: Prisma.Decimal;
        entityType: string;
        entityId: string;
        menuTemplateId: string | null;
        packageId: string | null;
        optionId: string | null;
        changeReason: string | null;
        effectiveFrom: Date;
    }[]>;
}
export declare const menuService: MenuService;
//# sourceMappingURL=menu.service.d.ts.map