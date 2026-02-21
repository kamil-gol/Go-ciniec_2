/**
 * Reservation Types
 * Types and interfaces for reservation management
 * UPDATED: Menu integration support
 */
export interface MenuOptionSelection {
    optionId: string;
    quantity?: number;
}
export interface UpdateReservationMenuDTO {
    menuPackageId?: string | null;
    selectedOptions?: MenuOptionSelection[];
    adultsCount?: number;
    childrenCount?: number;
    toddlersCount?: number;
}
export interface CreateReservationDTO {
    hallId: string;
    clientId: string;
    eventTypeId: string;
    startDateTime?: string;
    endDateTime?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    adults: number;
    children: number;
    toddlers: number;
    guests?: number;
    menuPackageId?: string;
    selectedOptions?: MenuOptionSelection[];
    pricePerAdult?: number;
    pricePerChild?: number;
    pricePerToddler?: number;
    confirmationDeadline?: string;
    customEventType?: string;
    birthdayAge?: number;
    anniversaryYear?: number;
    anniversaryOccasion?: string;
    notes?: string;
    deposit?: {
        amount: number;
        dueDate: string;
        paid?: boolean;
        paymentMethod?: 'CASH' | 'TRANSFER' | 'BLIK';
        paidAt?: string;
    };
    depositAmount?: number;
    depositDueDate?: string;
    discountType?: 'PERCENTAGE' | 'FIXED';
    discountValue?: number;
    discountReason?: string;
}
export interface UpdateReservationDTO {
    startDateTime?: string;
    endDateTime?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    adults?: number;
    children?: number;
    toddlers?: number;
    guests?: number;
    pricePerAdult?: number;
    pricePerChild?: number;
    pricePerToddler?: number;
    confirmationDeadline?: string;
    customEventType?: string;
    birthdayAge?: number;
    anniversaryYear?: number;
    anniversaryOccasion?: string;
    notes?: string;
    depositAmount?: number;
    depositDueDate?: string;
    depositPaid?: boolean;
    reason?: string;
}
export interface UpdateStatusDTO {
    status: ReservationStatus;
    reason?: string;
}
export declare enum ReservationStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export interface ReservationFilters {
    status?: ReservationStatus;
    hallId?: string;
    clientId?: string;
    eventTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
    archived?: boolean;
}
export interface ReservationResponse {
    id: string;
    hallId: string;
    clientId: string;
    eventTypeId: string;
    createdBy: string;
    startDateTime: Date | null;
    endDateTime: Date | null;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    adults: number;
    children: number;
    toddlers: number;
    guests: number;
    pricePerAdult: string;
    pricePerChild: string;
    pricePerToddler: string;
    totalPrice: string;
    status: string;
    confirmationDeadline: Date | null;
    customEventType: string | null;
    birthdayAge: number | null;
    anniversaryYear: number | null;
    anniversaryOccasion: string | null;
    notes: string | null;
    depositAmount: string | null;
    depositDueDate: Date | null;
    depositPaid: boolean;
    attachments: string[];
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    hall?: {
        id: string;
        name: string;
        capacity: number;
        pricePerPerson: string;
        pricePerChild: string | null;
    };
    client?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    };
    eventType?: {
        id: string;
        name: string;
    };
    createdByUser?: {
        id: string;
        email: string;
    };
}
//# sourceMappingURL=reservation.types.d.ts.map