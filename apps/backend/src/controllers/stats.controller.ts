/**
 * Stats Controller
 * Dashboard statistics endpoints
 */

import { Request, Response } from 'express';
import statsService from '../services/stats.service';

export class StatsController {
  /**
   * GET /api/stats/overview
   * Main dashboard statistics (11 metrics)
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    const overview = await statsService.getOverview();

    res.status(200).json({
      success: true,
      data: overview,
    });
  }

  /**
   * GET /api/stats/upcoming
   * Upcoming reservations for dashboard
   * @query limit — max results (default 10, max 20)
   */
  async getUpcoming(req: Request, res: Response): Promise<void> {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const upcoming = await statsService.getUpcoming(limit);

    res.status(200).json({
      success: true,
      data: upcoming,
      count: upcoming.length,
    });
  }
}

export default new StatsController();
