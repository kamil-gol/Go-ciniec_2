/**
 * Hall Controller
 * Handle HTTP requests for hall management
 */
import { Request, Response } from 'express';
export declare class HallController {
    /**
     * Create a new hall
     * POST /api/halls
     */
    createHall(req: Request, res: Response): Promise<void>;
    /**
     * Get all halls with optional filters
     * GET /api/halls
     */
    getHalls(req: Request, res: Response): Promise<void>;
    /**
     * Get hall by ID
     * GET /api/halls/:id
     */
    getHallById(req: Request, res: Response): Promise<void>;
    /**
     * Update hall
     * PUT /api/halls/:id
     */
    updateHall(req: Request, res: Response): Promise<void>;
    /**
     * Delete hall (soft delete)
     * DELETE /api/halls/:id
     */
    deleteHall(req: Request, res: Response): Promise<void>;
}
declare const _default: HallController;
export default _default;
//# sourceMappingURL=hall.controller.d.ts.map