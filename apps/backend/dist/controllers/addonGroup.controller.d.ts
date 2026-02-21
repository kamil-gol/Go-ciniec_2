/**
 * Addon Group Controller
 *
 * HTTP handlers for addon group operations
 */
import { Request, Response, NextFunction } from 'express';
export declare class AddonGroupController {
    /**
     * GET /api/addon-groups
     * List all addon groups (with optional filters)
     */
    list(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/addon-groups/:id
     * Get single addon group by ID
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/addon-groups
     * Create new addon group
     */
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/addon-groups/:id
     * Update addon group
     */
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/addon-groups/:id
     * Delete addon group
     */
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/addon-groups/:id/dishes
     * Assign dishes to addon group
     */
    assignDishes(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/addon-groups/:groupId/dishes/:dishId
     * Remove dish from addon group
     */
    removeDish(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const addonGroupController: AddonGroupController;
//# sourceMappingURL=addonGroup.controller.d.ts.map