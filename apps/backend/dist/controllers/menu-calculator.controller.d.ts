/**
 * Menu Calculator Controller (Express)
 *
 * Handles menu price calculation requests
 */
import { Request, Response } from 'express';
/**
 * POST /api/menu-calculator/calculate
 * Calculate menu price
 */
export declare function calculatePrice(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/menu-calculator/packages/available
 * Get available packages for event type and date
 */
export declare function getAvailablePackages(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/menu-calculator/option/:optionId/calculate
 * Calculate price for a single option
 */
export declare function calculateOptionPrice(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=menu-calculator.controller.d.ts.map