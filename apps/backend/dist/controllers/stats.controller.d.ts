/**
 * Stats Controller
 * Dashboard statistics endpoints
 */
import { Request, Response } from 'express';
export declare class StatsController {
    /**
     * GET /api/stats/overview
     * Main dashboard statistics (11 metrics)
     */
    getOverview(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/stats/upcoming
     * Upcoming reservations for dashboard
     * @query limit — max results (default 10, max 20)
     */
    getUpcoming(req: Request, res: Response): Promise<void>;
}
declare const _default: StatsController;
export default _default;
//# sourceMappingURL=stats.controller.d.ts.map