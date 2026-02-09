/**
 * Reservation Utilities
 * Helper functions for reservation business logic
 */
import { CreateReservationDTO, UpdateReservationDTO } from '../types/reservation.types';
/**
 * Calculate total number of guests (including toddlers)
 */
export declare function calculateTotalGuests(adults: number, children: number, toddlers?: number): number;
/**
 * Calculate total price based on guests and pricing (including toddlers)
 */
export declare function calculateTotalPrice(adults: number, children: number, pricePerAdult: number, pricePerChild: number, toddlers?: number, pricePerToddler?: number): number;
/**
 * Calculate event duration in hours
 */
export declare function calculateDuration(startDateTime: Date, endDateTime: Date): number;
/**
 * Check if event duration exceeds default hours and generate note
 */
export declare function generateExtraHoursNote(startDateTime: Date, endDateTime: Date, defaultHours?: number): string | null;
/**
 * Validate confirmation deadline (must be at least 1 day before event)
 */
export declare function validateConfirmationDeadline(confirmationDeadline: Date, eventStartDateTime: Date): boolean;
/**
 * Validate custom event type fields
 */
export declare function validateCustomEventFields(eventTypeName: string, data: CreateReservationDTO | UpdateReservationDTO): {
    valid: boolean;
    error?: string;
};
/**
 * Detect changes between old and new reservation data
 */
export declare function detectReservationChanges(oldData: any, newData: UpdateReservationDTO): Array<{
    field: string;
    oldValue: any;
    newValue: any;
    label: string;
}>;
/**
 * Format changes summary for display
 */
export declare function formatChangesSummary(changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    label: string;
}>): string;
//# sourceMappingURL=reservation.utils.d.ts.map