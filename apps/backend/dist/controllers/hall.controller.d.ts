/**
 * Hall Controller
 * Handles HTTP requests for hall management
 * UPDATED: Removed pricePerPerson validation (pricing removed from halls)
 */
import { Request, Response, NextFunction } from 'express';
declare class HallController {
    /**
     * Get all halls
     */
    getHalls(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get hall by ID
     */
    getHallById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create new hall
     */
    createHall(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update hall
     */
    updateHall(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete hall (soft delete)
     */
    deleteHall(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: HallController;
export default _default;
//# sourceMappingURL=hall.controller.d.ts.map