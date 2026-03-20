/**
 * Search Controller
 * Issue #128: Szukaj globalnie
 */

import { Request, Response } from 'express';
import searchService from '../services/search.service';
import { AppError } from '../utils/AppError';

export class SearchController {
  async globalSearch(req: Request, res: Response): Promise<void> {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      throw AppError.badRequest('Zapytanie musi mieć minimum 2 znaki');
    }

    const limit = Math.min(
      parseInt(req.query.limit as string) || 5,
      20
    );

    const results = await searchService.globalSearch(query, limit);

    res.json({
      success: true,
      data: results,
    });
  }
}

export default new SearchController();
