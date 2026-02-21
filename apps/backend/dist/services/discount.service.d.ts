/**
 * Discount Service
 * Business logic for reservation discount management
 * Sprint 7: System Rabatów
 * Updated: Phase 1 Audit — logChange() for ActivityLog
 */
export declare class DiscountService {
    /**
     * Apply or update discount on reservation
     */
    applyDiscount(id: string, data: {
        type: 'PERCENTAGE' | 'FIXED';
        value: number;
        reason: string;
    }, userId: string): Promise<{
        client: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            phone: string;
        };
        hall: {
            id: string;
            name: string;
            capacity: number;
            isWholeVenue: boolean;
        } | null;
        eventType: {
            id: string;
            name: string;
        } | null;
        createdBy: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        startDateTime: Date | null;
        clientId: string;
        createdById: string;
        reservationQueuePosition: number | null;
        reservationQueueDate: Date | null;
        queueOrderManual: boolean;
        hallId: string | null;
        eventTypeId: string | null;
        date: string | null;
        startTime: string | null;
        endTime: string | null;
        endDateTime: Date | null;
        adults: number;
        children: number;
        toddlers: number;
        guests: number;
        pricePerAdult: import("@prisma/client/runtime/library").Decimal;
        pricePerChild: import("@prisma/client/runtime/library").Decimal;
        pricePerToddler: import("@prisma/client/runtime/library").Decimal;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        discountType: string | null;
        discountValue: import("@prisma/client/runtime/library").Decimal | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        discountReason: string | null;
        priceBeforeDiscount: import("@prisma/client/runtime/library").Decimal | null;
        status: import(".prisma/client").$Enums.ReservationStatus;
        confirmationDeadline: Date | null;
        customEventType: string | null;
        birthdayAge: number | null;
        anniversaryYear: number | null;
        anniversaryOccasion: string | null;
        attachments: string[];
        archivedAt: Date | null;
    }>;
    /**
     * Remove discount from reservation
     */
    removeDiscount(id: string, userId: string): Promise<{
        client: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            phone: string;
        };
        hall: {
            id: string;
            name: string;
            capacity: number;
            isWholeVenue: boolean;
        } | null;
        eventType: {
            id: string;
            name: string;
        } | null;
        createdBy: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        startDateTime: Date | null;
        clientId: string;
        createdById: string;
        reservationQueuePosition: number | null;
        reservationQueueDate: Date | null;
        queueOrderManual: boolean;
        hallId: string | null;
        eventTypeId: string | null;
        date: string | null;
        startTime: string | null;
        endTime: string | null;
        endDateTime: Date | null;
        adults: number;
        children: number;
        toddlers: number;
        guests: number;
        pricePerAdult: import("@prisma/client/runtime/library").Decimal;
        pricePerChild: import("@prisma/client/runtime/library").Decimal;
        pricePerToddler: import("@prisma/client/runtime/library").Decimal;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        discountType: string | null;
        discountValue: import("@prisma/client/runtime/library").Decimal | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        discountReason: string | null;
        priceBeforeDiscount: import("@prisma/client/runtime/library").Decimal | null;
        status: import(".prisma/client").$Enums.ReservationStatus;
        confirmationDeadline: Date | null;
        customEventType: string | null;
        birthdayAge: number | null;
        anniversaryYear: number | null;
        anniversaryOccasion: string | null;
        attachments: string[];
        archivedAt: Date | null;
    }>;
}
declare const _default: DiscountService;
export default _default;
//# sourceMappingURL=discount.service.d.ts.map