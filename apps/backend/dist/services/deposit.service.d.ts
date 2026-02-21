/**
 * Deposit Service - with Audit Logging
 * Full CRUD + business logic for deposit/advance payment management
 * Phase 4.2: Auto-confirm reservation when all deposits are paid
 * Phase 4.3: Block cancellation of reservations with paid deposits
 */
import { Prisma } from '@prisma/client';
export type DepositStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'BLIK' | 'CARD';
export interface CreateDepositInput {
    reservationId: string;
    amount: number;
    dueDate: string;
    notes?: string;
    paymentMethod?: PaymentMethod;
}
export interface UpdateDepositInput {
    amount?: number;
    dueDate?: string;
    notes?: string;
}
export interface MarkPaidInput {
    paymentMethod: PaymentMethod;
    paidAt: string;
    amountPaid?: number;
    notes?: string;
}
export interface DepositFilters {
    reservationId?: string;
    status?: DepositStatus;
    overdue?: boolean;
    dateFrom?: string;
    dateTo?: string;
    paid?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'dueDate' | 'amount' | 'createdAt' | 'status';
    sortOrder?: 'asc' | 'desc';
}
declare const depositService: {
    create(input: CreateDepositInput, userId: string): Promise<({
        reservation: {
            client: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                notes: string | null;
            };
            hall: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                capacity: number;
                amenities: string[];
                images: string[];
                isWholeVenue: boolean;
            } | null;
            eventType: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                color: string | null;
            } | null;
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
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            discountAmount: Prisma.Decimal | null;
            discountReason: string | null;
            priceBeforeDiscount: Prisma.Decimal | null;
            status: import(".prisma/client").$Enums.ReservationStatus;
            confirmationDeadline: Date | null;
            customEventType: string | null;
            birthdayAge: number | null;
            anniversaryYear: number | null;
            anniversaryOccasion: string | null;
            attachments: string[];
            archivedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        reservationId: string;
        amount: Prisma.Decimal;
        dueDate: string;
        remainingAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        paid: boolean;
        paidAt: Date | null;
        paymentMethod: string | null;
        title: string | null;
        internalNotes: string | null;
        receiptNumber: string | null;
        confirmationPdfUrl: string | null;
        reminderSentAt: Date | null;
    }) | null>;
    getById(id: string): Promise<{
        reservation: {
            client: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                notes: string | null;
            };
            hall: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                capacity: number;
                amenities: string[];
                images: string[];
                isWholeVenue: boolean;
            } | null;
            eventType: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                color: string | null;
            } | null;
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
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            discountAmount: Prisma.Decimal | null;
            discountReason: string | null;
            priceBeforeDiscount: Prisma.Decimal | null;
            status: import(".prisma/client").$Enums.ReservationStatus;
            confirmationDeadline: Date | null;
            customEventType: string | null;
            birthdayAge: number | null;
            anniversaryYear: number | null;
            anniversaryOccasion: string | null;
            attachments: string[];
            archivedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        reservationId: string;
        amount: Prisma.Decimal;
        dueDate: string;
        remainingAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        paid: boolean;
        paidAt: Date | null;
        paymentMethod: string | null;
        title: string | null;
        internalNotes: string | null;
        receiptNumber: string | null;
        confirmationPdfUrl: string | null;
        reminderSentAt: Date | null;
    }>;
    getByReservation(reservationId: string): Promise<{
        deposits: ({
            reservation: {
                client: {
                    id: string;
                    email: string | null;
                    firstName: string;
                    lastName: string;
                    createdAt: Date;
                    updatedAt: Date;
                    phone: string;
                    notes: string | null;
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
                pricePerAdult: Prisma.Decimal;
                pricePerChild: Prisma.Decimal;
                pricePerToddler: Prisma.Decimal;
                totalPrice: Prisma.Decimal;
                discountType: string | null;
                discountValue: Prisma.Decimal | null;
                discountAmount: Prisma.Decimal | null;
                discountReason: string | null;
                priceBeforeDiscount: Prisma.Decimal | null;
                status: import(".prisma/client").$Enums.ReservationStatus;
                confirmationDeadline: Date | null;
                customEventType: string | null;
                birthdayAge: number | null;
                anniversaryYear: number | null;
                anniversaryOccasion: string | null;
                attachments: string[];
                archivedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            status: string;
            reservationId: string;
            amount: Prisma.Decimal;
            dueDate: string;
            remainingAmount: Prisma.Decimal;
            paidAmount: Prisma.Decimal;
            paid: boolean;
            paidAt: Date | null;
            paymentMethod: string | null;
            title: string | null;
            internalNotes: string | null;
            receiptNumber: string | null;
            confirmationPdfUrl: string | null;
            reminderSentAt: Date | null;
        })[];
        summary: {
            totalDeposits: number;
            activeDeposits: number;
            totalAmount: number;
            paidAmount: number;
            pendingAmount: number;
            reservationTotal: number;
            remainingToDeposit: number;
            percentPaid: number;
        };
    }>;
    list(filters: DepositFilters): Promise<{
        deposits: ({
            reservation: {
                client: {
                    id: string;
                    email: string | null;
                    firstName: string;
                    lastName: string;
                    createdAt: Date;
                    updatedAt: Date;
                    phone: string;
                    notes: string | null;
                };
                hall: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    capacity: number;
                    amenities: string[];
                    images: string[];
                    isWholeVenue: boolean;
                } | null;
                eventType: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    color: string | null;
                } | null;
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
                pricePerAdult: Prisma.Decimal;
                pricePerChild: Prisma.Decimal;
                pricePerToddler: Prisma.Decimal;
                totalPrice: Prisma.Decimal;
                discountType: string | null;
                discountValue: Prisma.Decimal | null;
                discountAmount: Prisma.Decimal | null;
                discountReason: string | null;
                priceBeforeDiscount: Prisma.Decimal | null;
                status: import(".prisma/client").$Enums.ReservationStatus;
                confirmationDeadline: Date | null;
                customEventType: string | null;
                birthdayAge: number | null;
                anniversaryYear: number | null;
                anniversaryOccasion: string | null;
                attachments: string[];
                archivedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            status: string;
            reservationId: string;
            amount: Prisma.Decimal;
            dueDate: string;
            remainingAmount: Prisma.Decimal;
            paidAmount: Prisma.Decimal;
            paid: boolean;
            paidAt: Date | null;
            paymentMethod: string | null;
            title: string | null;
            internalNotes: string | null;
            receiptNumber: string | null;
            confirmationPdfUrl: string | null;
            reminderSentAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
            hasMore: boolean;
        };
    }>;
    update(id: string, input: UpdateDepositInput, userId: string): Promise<({
        reservation: {
            client: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                notes: string | null;
            };
            hall: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                capacity: number;
                amenities: string[];
                images: string[];
                isWholeVenue: boolean;
            } | null;
            eventType: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                color: string | null;
            } | null;
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
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            discountAmount: Prisma.Decimal | null;
            discountReason: string | null;
            priceBeforeDiscount: Prisma.Decimal | null;
            status: import(".prisma/client").$Enums.ReservationStatus;
            confirmationDeadline: Date | null;
            customEventType: string | null;
            birthdayAge: number | null;
            anniversaryYear: number | null;
            anniversaryOccasion: string | null;
            attachments: string[];
            archivedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        reservationId: string;
        amount: Prisma.Decimal;
        dueDate: string;
        remainingAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        paid: boolean;
        paidAt: Date | null;
        paymentMethod: string | null;
        title: string | null;
        internalNotes: string | null;
        receiptNumber: string | null;
        confirmationPdfUrl: string | null;
        reminderSentAt: Date | null;
    }) | null>;
    delete(id: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markAsPaid(id: string, input: MarkPaidInput, userId: string): Promise<({
        reservation: {
            client: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                notes: string | null;
            };
            hall: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                capacity: number;
                amenities: string[];
                images: string[];
                isWholeVenue: boolean;
            } | null;
            eventType: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                color: string | null;
            } | null;
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
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            discountAmount: Prisma.Decimal | null;
            discountReason: string | null;
            priceBeforeDiscount: Prisma.Decimal | null;
            status: import(".prisma/client").$Enums.ReservationStatus;
            confirmationDeadline: Date | null;
            customEventType: string | null;
            birthdayAge: number | null;
            anniversaryYear: number | null;
            anniversaryOccasion: string | null;
            attachments: string[];
            archivedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        reservationId: string;
        amount: Prisma.Decimal;
        dueDate: string;
        remainingAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        paid: boolean;
        paidAt: Date | null;
        paymentMethod: string | null;
        title: string | null;
        internalNotes: string | null;
        receiptNumber: string | null;
        confirmationPdfUrl: string | null;
        reminderSentAt: Date | null;
    }) | null>;
    /**
     * Phase 4.2: Check if all active deposits for a reservation are paid.
     * If yes and reservation is PENDING → auto-confirm it.
     */
    checkAndAutoConfirmReservation(reservationId: string, userId: string): Promise<void>;
    /**
     * Phase 4.3: Check if a reservation has paid deposits (used before cancel/delete).
     * Returns info about paid deposits for the guard check.
     */
    checkPaidDepositsBeforeCancel(reservationId: string): Promise<{
        hasPaidDeposits: boolean;
        paidCount: number;
        paidTotal: number;
    }>;
    sendConfirmationEmail(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markAsUnpaid(id: string, userId: string): Promise<({
        reservation: {
            client: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                notes: string | null;
            };
            hall: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                capacity: number;
                amenities: string[];
                images: string[];
                isWholeVenue: boolean;
            } | null;
            eventType: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                color: string | null;
            } | null;
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
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            discountAmount: Prisma.Decimal | null;
            discountReason: string | null;
            priceBeforeDiscount: Prisma.Decimal | null;
            status: import(".prisma/client").$Enums.ReservationStatus;
            confirmationDeadline: Date | null;
            customEventType: string | null;
            birthdayAge: number | null;
            anniversaryYear: number | null;
            anniversaryOccasion: string | null;
            attachments: string[];
            archivedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        reservationId: string;
        amount: Prisma.Decimal;
        dueDate: string;
        remainingAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        paid: boolean;
        paidAt: Date | null;
        paymentMethod: string | null;
        title: string | null;
        internalNotes: string | null;
        receiptNumber: string | null;
        confirmationPdfUrl: string | null;
        reminderSentAt: Date | null;
    }) | null>;
    cancel(id: string, userId: string): Promise<({
        reservation: {
            client: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                notes: string | null;
            };
            hall: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                capacity: number;
                amenities: string[];
                images: string[];
                isWholeVenue: boolean;
            } | null;
            eventType: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                color: string | null;
            } | null;
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
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            discountAmount: Prisma.Decimal | null;
            discountReason: string | null;
            priceBeforeDiscount: Prisma.Decimal | null;
            status: import(".prisma/client").$Enums.ReservationStatus;
            confirmationDeadline: Date | null;
            customEventType: string | null;
            birthdayAge: number | null;
            anniversaryYear: number | null;
            anniversaryOccasion: string | null;
            attachments: string[];
            archivedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        reservationId: string;
        amount: Prisma.Decimal;
        dueDate: string;
        remainingAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        paid: boolean;
        paidAt: Date | null;
        paymentMethod: string | null;
        title: string | null;
        internalNotes: string | null;
        receiptNumber: string | null;
        confirmationPdfUrl: string | null;
        reminderSentAt: Date | null;
    }) | null>;
    getStats(): Promise<{
        counts: {
            total: number;
            pending: number;
            paid: number;
            overdue: number;
            partiallyPaid: number;
            cancelled: number;
            upcomingIn7Days: number;
        };
        amounts: {
            total: number;
            paid: number;
            pending: number;
            overdue: number;
        };
    }>;
    getOverdue(): Promise<({
        reservation: {
            client: {
                id: string;
                email: string | null;
                firstName: string;
                lastName: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                notes: string | null;
            };
            hall: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                capacity: number;
                amenities: string[];
                images: string[];
                isWholeVenue: boolean;
            } | null;
            eventType: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                color: string | null;
            } | null;
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
            pricePerAdult: Prisma.Decimal;
            pricePerChild: Prisma.Decimal;
            pricePerToddler: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            discountAmount: Prisma.Decimal | null;
            discountReason: string | null;
            priceBeforeDiscount: Prisma.Decimal | null;
            status: import(".prisma/client").$Enums.ReservationStatus;
            confirmationDeadline: Date | null;
            customEventType: string | null;
            birthdayAge: number | null;
            anniversaryYear: number | null;
            anniversaryOccasion: string | null;
            attachments: string[];
            archivedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: string;
        reservationId: string;
        amount: Prisma.Decimal;
        dueDate: string;
        remainingAmount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        paid: boolean;
        paidAt: Date | null;
        paymentMethod: string | null;
        title: string | null;
        internalNotes: string | null;
        receiptNumber: string | null;
        confirmationPdfUrl: string | null;
        reminderSentAt: Date | null;
    })[]>;
    autoMarkOverdue(): Promise<{
        markedOverdueCount: number;
    }>;
};
export default depositService;
//# sourceMappingURL=deposit.service.d.ts.map