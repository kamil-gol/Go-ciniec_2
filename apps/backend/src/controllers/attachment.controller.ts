/**
 * Attachment Controller
 * Handles HTTP requests for attachment CRUD operations
 * Updated: Phase 3 Audit — pass userId to mutating service methods
 * Updated: #146 — stream-based download (storageService)
 * Updated: #146 — presigned download URLs
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import attachmentService from '../services/attachment.service';
import { CreateAttachmentDTO, UpdateAttachmentDTO } from '../types/attachment.types';
import { EntityType } from '../constants/attachmentCategories';
import logger from '../utils/logger';

const createAttachmentSchema = z.object({
  entityType: z.enum(['RESERVATION', 'CLIENT', 'DEPOSIT']),
  entityId: z.string().uuid('entityId musi być poprawnym UUID'),
  category: z.string().min(1, 'Kategoria jest wymagana'),
  label: z.string().optional(),
  description: z.string().optional(),
});

class AttachmentController {
  /**
   * Upload a new attachment
   * POST /api/attachments
   */
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'Nie przesłano pliku' });
      }

      const parsed = createAttachmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
      }

      const dto: CreateAttachmentDTO = {
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        category: parsed.data.category,
        label: parsed.data.label || undefined,
        description: parsed.data.description || undefined,
      };

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Brak autoryzacji' });
      }

      const attachment = await attachmentService.createAttachment(dto, file, userId);

      return res.status(201).json({ data: attachment });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attachments for an entity
   * GET /api/attachments?entityType=X&entityId=Y&category=Z&withClientRodo=true
   */
  async getByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId, category, withClientRodo } = req.query;

      if (!entityType || !entityId) {
        return res.status(400).json({ error: 'entityType i entityId są wymagane' });
      }

      if (withClientRodo === 'true' && entityType !== 'CLIENT') {
        const attachments = await attachmentService.getAttachmentsWithClientRodo(
          entityType as EntityType,
          entityId as string,
        );
        return res.json({ data: attachments });
      }

      const attachments = await attachmentService.getAttachments({
        entityType: entityType as EntityType,
        entityId: entityId as string,
        category: category as string | undefined,
      });

      return res.json({ data: attachments });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download attachment file (backend stream proxy)
   * GET /api/attachments/:id/download
   */
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stream, attachment } = await attachmentService.getFileStream(id);

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
      if (attachment.sizeBytes) {
        res.setHeader('Content-Length', attachment.sizeBytes);
      }

      (stream as NodeJS.ReadableStream).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned download URL
   * GET /api/attachments/:id/download-url
   *
   * Returns:
   *   { url, expiresIn, direct, filename, mimeType, sizeBytes }
   *
   * direct=true  → URL points directly to MinIO (presigned, TTL-limited)
   * direct=false → URL points to /api/attachments/:id/download (backend proxy)
   */
  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const baseApiUrl = `${req.protocol}://${req.get('host')}/api`;

      const result = await attachmentService.getDownloadUrl(id, baseApiUrl);

      return res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update attachment metadata
   * PATCH /api/attachments/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateAttachmentDTO = req.body;
      const userId = (req as any).user?.id;

      const updated = await attachmentService.updateAttachment(id, dto, userId);

      return res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft-delete (archive) attachment
   * DELETE /api/attachments/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      await attachmentService.deleteAttachment(id, userId);

      return res.json({ message: 'Załącznik zarchiwizowany' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Archive attachment
   * PATCH /api/attachments/:id/archive
   */
  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const archived = await attachmentService.deleteAttachment(id, userId);

      return res.json({ data: archived });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if entity has specific category
   * GET /api/attachments/check?entityType=X&entityId=Y&category=Z
   */
  async check(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId, category } = req.query;

      if (!entityType || !entityId || !category) {
        return res.status(400).json({ error: 'entityType, entityId i category są wymagane' });
      }

      const has = await attachmentService.hasAttachment(
        entityType as EntityType,
        entityId as string,
        category as string,
      );

      return res.json({ data: { has } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch check RODO for multiple clients
   * POST /api/attachments/batch-check-rodo
   */
  async batchCheckRodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientIds } = req.body;

      if (!Array.isArray(clientIds) || clientIds.length === 0) {
        return res.status(400).json({ error: 'clientIds musi być niepustą tablicą' });
      }

      const result = await attachmentService.batchCheckRodo(clientIds);

      return res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch check contracts for multiple reservations
   * POST /api/attachments/batch-check-contract
   */
  async batchCheckContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { reservationIds } = req.body;

      if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
        return res.status(400).json({ error: 'reservationIds musi być niepustą tablicą' });
      }

      const result = await attachmentService.batchCheckContract(reservationIds);

      return res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AttachmentController();
