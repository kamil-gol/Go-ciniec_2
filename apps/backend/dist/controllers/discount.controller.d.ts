/**
 * Discount Controller
 * Handle HTTP requests for reservation discount management
 * Sprint 7: System Rabatów
 */
import { Request, Response } from 'express';
export declare class DiscountController {
    /**
     * Apply or update discount
     * PATCH /api/reservations/:id/discount
     */
    applyDiscount(req: Request, res: Response): Promise<void>;
    /**
     * Remove discount
     * DELETE /api/reservations/:id/discount
     */
    removeDiscount(req: Request, res: Response): Promise<void>;
}
export declare const discountController: DiscountController;
//# sourceMappingURL=discount.controller.d.ts.map