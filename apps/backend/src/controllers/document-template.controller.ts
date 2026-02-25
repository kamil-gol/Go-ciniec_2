/**
 * Document Template Controller
 * HTTP handlers for document template management.
 */

import { Request, Response, NextFunction } from 'express';
import documentTemplateService from '../services/document-template.service';
import { AppError } from '../utils/AppError';

class DocumentTemplateController {
  /**
   * GET /api/document-templates
   * List all templates. Optional query: ?category=RESERVATION_PDF
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const templates = await documentTemplateService.list({ category });

      res.json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document-templates/:slug
   * Get single template by slug.
   */
  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await documentTemplateService.getBySlug(req.params.slug);
      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document-templates
   * Create a new document template.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const { slug, name, description, category, content, availableVars, isActive } = req.body;

      if (!slug || typeof slug !== 'string') {
        throw AppError.badRequest('Slug szablonu jest wymagany');
      }

      if (!name || typeof name !== 'string') {
        throw AppError.badRequest('Nazwa szablonu jest wymagana');
      }

      if (!category || typeof category !== 'string') {
        throw AppError.badRequest('Kategoria szablonu jest wymagana');
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw AppError.badRequest('Treść szablonu (content) jest wymagana');
      }

      const template = await documentTemplateService.create(
        { slug, name, description, category, content, availableVars, isActive },
        userId
      );

      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/document-templates/:slug
   * Update template content. Auto-versions and saves history.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const { content, name, description, availableVars, changeReason } = req.body;

      if (!content || typeof content !== 'string') {
        throw AppError.badRequest('Treść szablonu (content) jest wymagana');
      }

      if (content.trim().length === 0) {
        throw AppError.badRequest('Treść szablonu nie może być pusta');
      }

      const template = await documentTemplateService.update(
        req.params.slug,
        { content, name, description, availableVars, changeReason },
        userId
      );

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/document-templates/:slug
   * Delete a template. Blocked for isRequired templates.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const result = await documentTemplateService.delete(req.params.slug, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document-templates/:slug/restore/:version
   * Restore a historical version of a template.
   */
  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw AppError.unauthorized();
      }

      const version = parseInt(req.params.version, 10);
      if (isNaN(version) || version < 1) {
        throw AppError.badRequest('Numer wersji musi być liczbą dodatnią');
      }

      const template = await documentTemplateService.restore(
        req.params.slug,
        version,
        userId
      );

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document-templates/:slug/preview
   * Preview template with variable substitution.
   * Body: { variables: { hallName: "Sala Złota", eventDate: "2026-06-15", ... } }
   */
  async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variables = req.body.variables || {};

      if (typeof variables !== 'object' || Array.isArray(variables)) {
        throw AppError.badRequest('Parametr "variables" musi być obiektem klucz-wartość');
      }

      const result = await documentTemplateService.preview(
        req.params.slug,
        variables
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document-templates/:slug/history
   * Get paginated change history. Query: ?page=1&limit=20
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

      const result = await documentTemplateService.getHistory(
        req.params.slug,
        page,
        limit
      );

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentTemplateController();
