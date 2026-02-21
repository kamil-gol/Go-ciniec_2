/**
 * Reservation Menu Service
 * Handles menu selection for reservations
 * UPDATED: Added recalculateForGuestChange for Phase C integration
 * FIX: formatMenuResponse now exposes menuTemplateId + packageId from DB columns
 * Updated: Phase 3 Audit — logChange() for menu selection, recalculation, removal
 */
import { MenuSelectionInput } from '../dto/menu-selection.dto';
declare class ReservationMenuService {
    selectMenu(reservationId: string, input: MenuSelectionInput, userId?: string): Promise<any>;
    /**
     * Recalculate menu prices when guest counts change.
     * Reuses existing snapshot (same package, dishes, options) but
     * recalculates all prices with new guest counts.
     *
     * Called automatically from reservation.service.ts when guests are updated.
     * Returns the new totalMenuPrice for the reservation to use.
     */
    recalculateForGuestChange(reservationId: string, newAdults: number, newChildren: number, newToddlers: number, userId?: string): Promise<{
        totalMenuPrice: number;
        packagePrice: number;
        optionsPrice: number;
    } | null>;
    getReservationMenu(reservationId: string): Promise<any>;
    updateMenu(reservationId: string, input: MenuSelectionInput, userId?: string): Promise<any>;
    removeMenu(reservationId: string, userId?: string): Promise<void>;
    private validateDishSelections;
    private buildMenuSnapshot;
    private calculatePackagePrice;
    private calculateOptionsPrice;
    private formatMenuResponse;
}
declare const _default: ReservationMenuService;
export default _default;
//# sourceMappingURL=reservation-menu.service.d.ts.map