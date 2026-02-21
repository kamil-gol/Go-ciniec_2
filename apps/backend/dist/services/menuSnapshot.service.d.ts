/**
 * Menu Snapshot Service
 * Creates and manages immutable menu snapshots for reservations.
 * FIX: dishSelections enriched with dish/category names from DB
 * FIX: menuTemplateId/packageId saved in DB columns (not just JSONB)
 */
import { Prisma } from '@prisma/client';
import { MenuSnapshotData, CreateMenuSnapshotInput, MenuPriceBreakdown } from '../types/menu.types';
export declare class MenuSnapshotService {
    createSnapshot(input: CreateMenuSnapshotInput): Promise<{
        snapshot: {
            id: string;
            updatedAt: Date;
            menuTemplateId: string | null;
            packageId: string | null;
            reservationId: string;
            menuData: Prisma.JsonValue;
            packagePrice: Prisma.Decimal;
            optionsPrice: Prisma.Decimal;
            totalMenuPrice: Prisma.Decimal;
            adultsCount: number;
            childrenCount: number;
            toddlersCount: number;
            selectedAt: Date;
        };
        priceBreakdown: MenuPriceBreakdown;
    }>;
    /**
     * Replace entire snapshot (delete old + create new).
     * Used when user changes package, options, or dishes via "Zmien" flow.
     */
    replaceSnapshot(input: CreateMenuSnapshotInput): Promise<{
        snapshot: {
            id: string;
            updatedAt: Date;
            menuTemplateId: string | null;
            packageId: string | null;
            reservationId: string;
            menuData: Prisma.JsonValue;
            packagePrice: Prisma.Decimal;
            optionsPrice: Prisma.Decimal;
            totalMenuPrice: Prisma.Decimal;
            adultsCount: number;
            childrenCount: number;
            toddlersCount: number;
            selectedAt: Date;
        };
        priceBreakdown: MenuPriceBreakdown;
    }>;
    calculatePriceBreakdown(menuData: MenuSnapshotData, adultsCount: number, childrenCount: number, toddlersCount: number): MenuPriceBreakdown;
    getSnapshotByReservationId(reservationId: string): Promise<{
        snapshot: {
            id: string;
            updatedAt: Date;
            menuTemplateId: string | null;
            packageId: string | null;
            reservationId: string;
            menuData: Prisma.JsonValue;
            packagePrice: Prisma.Decimal;
            optionsPrice: Prisma.Decimal;
            totalMenuPrice: Prisma.Decimal;
            adultsCount: number;
            childrenCount: number;
            toddlersCount: number;
            selectedAt: Date;
        };
        priceBreakdown: MenuPriceBreakdown;
    }>;
    updateSnapshot(reservationId: string, updates: {
        adultsCount?: number;
        childrenCount?: number;
        toddlersCount?: number;
    }): Promise<{
        snapshot: {
            id: string;
            updatedAt: Date;
            menuTemplateId: string | null;
            packageId: string | null;
            reservationId: string;
            menuData: Prisma.JsonValue;
            packagePrice: Prisma.Decimal;
            optionsPrice: Prisma.Decimal;
            totalMenuPrice: Prisma.Decimal;
            adultsCount: number;
            childrenCount: number;
            toddlersCount: number;
            selectedAt: Date;
        };
        priceBreakdown: MenuPriceBreakdown;
    }>;
    deleteSnapshot(reservationId: string): Promise<{
        id: string;
        updatedAt: Date;
        menuTemplateId: string | null;
        packageId: string | null;
        reservationId: string;
        menuData: Prisma.JsonValue;
        packagePrice: Prisma.Decimal;
        optionsPrice: Prisma.Decimal;
        totalMenuPrice: Prisma.Decimal;
        adultsCount: number;
        childrenCount: number;
        toddlersCount: number;
        selectedAt: Date;
    }>;
    hasSnapshot(reservationId: string): Promise<boolean>;
    getSnapshotStatistics(): Promise<{
        totalSnapshots: number;
        averageMenuPrice: number;
        averagePackagePrice: number;
        averageOptionsPrice: number;
    }>;
    getPopularOptions(limit?: number): Promise<{
        optionId: string;
        name: string;
        count: number;
    }[]>;
    getPopularPackages(limit?: number): Promise<{
        packageId: string;
        name: string;
        count: number;
    }[]>;
}
export declare const menuSnapshotService: MenuSnapshotService;
//# sourceMappingURL=menuSnapshot.service.d.ts.map