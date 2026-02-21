/**
 * Stats Service
 * Dashboard statistics — real-time queries from database
 */
export interface DashboardOverview {
    reservationsToday: number;
    reservationsThisWeek: number;
    reservationsThisMonth: number;
    queueCount: number;
    confirmedThisMonth: number;
    revenueThisMonth: number;
    revenuePrevMonth: number;
    revenueChangePercent: number;
    totalClients: number;
    newClientsThisMonth: number;
    pendingDepositsCount: number;
    pendingDepositsAmount: number;
    activeHalls: number;
}
declare class StatsService {
    /**
     * Get dashboard overview statistics
     * Uses Promise.all for parallel queries (performance)
     */
    getOverview(): Promise<DashboardOverview>;
    /**
     * Get upcoming reservations (from today onwards)
     * Includes relations: Hall, Client, EventType, pending Deposits
     */
    getUpcoming(limit?: number): Promise<({
        client: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
        };
        hall: {
            id: string;
            name: string;
        } | null;
        eventType: {
            id: string;
            name: string;
            color: string | null;
        } | null;
        deposits: {
            id: string;
            status: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            remainingAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
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
    })[]>;
}
declare const _default: StatsService;
export default _default;
//# sourceMappingURL=stats.service.d.ts.map