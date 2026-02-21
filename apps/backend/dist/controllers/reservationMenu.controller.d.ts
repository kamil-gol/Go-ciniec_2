/**
 * Reservation Menu Controller
 * MIGRATED: Prisma singleton + AppError + no try/catch
 * CRITICAL FIX: updateMenu now replaces entire snapshot (package + options + dishes)
 * instead of only updating guest counts.
 * SYNC: selectMenu/updateMenu now sync pricePerAdult/Child/Toddler + totalPrice
 * back to the Reservation model for consistency across the system.
 * UPDATED: deleteMenu no longer references hall pricing (removed from Hall model)
 */
import { Request, Response } from 'express';
export declare class ReservationMenuController {
    /**
     * Sync reservation pricing fields from menu snapshot priceBreakdown.
     * Updates pricePerAdult, pricePerChild, pricePerToddler and totalPrice
     * so that all parts of the system (lists, API, reports) show correct values.
     */
    private syncReservationPricing;
    selectMenu(req: Request, res: Response): Promise<void>;
    getMenu(req: Request, res: Response): Promise<void>;
    /**
     * Update menu selection for reservation.
     * FIXED: Now replaces the entire snapshot (package, options, dishes)
     * instead of only updating guest counts.
     * Guest counts are always read from reservation (single source of truth).
     */
    updateMenu(req: Request, res: Response): Promise<void>;
    /**
     * Delete menu selection for reservation.
     * Keeps existing per-person prices from the reservation,
     * then recalculates totalPrice without menu options.
     */
    deleteMenu(req: Request, res: Response): Promise<void>;
}
export declare const reservationMenuController: ReservationMenuController;
//# sourceMappingURL=reservationMenu.controller.d.ts.map