/**
 * Attachment Controller
 * Handles HTTP requests for file attachments
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import attachmentService from '../services/attachment.service';
import { AppError } from '../utils/AppError';
import { CreateAttachmentDTO, UpdateAttachmentDTO } from '../types/attachment.types';
import { ENTITY_TYPES, EntityType } from '../constants/attachmentCategories';
import logger from '../utils/logger';

export class AttachmentController {
  /**
   * POST /api/attachments
   * Upload a file attachment
   */
  async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.file) {
      throw AppError.badRequest('Nie przesłano pliku');
    }

    const { entityType, entityId, category, label, description } = req.body;

    if (!entityType || !entityId || !category) {
      throw AppError.badRequest('Wymagane pola: entityType, entityId, category');
    }

    const dto: CreateAttachmentDTO = {
      entityType: entityType as EntityType,
      entityId,
      category,
      label,
      description,
    };

    const attachment = await attachmentService.createAttachment(dto, req.file, req.user!.id);

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'Plik wgrany pomyślnie',
    });
  }

  /**
   * GET /api/attachments?entityType=X&entityId=Y&category=Z
   * List attachments for an entity
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { entityType, entityId, category, includeArchived } = req.query;

    if (!entityType || !entityId) {
      throw AppError.badRequest('Wymagane parametry: entityType, entityId');
    }

    if (!ENTITY_TYPES.includes(entityType as EntityType)) {
      throw AppError.badRequest(`Nieprawidłowy entityType: ${entityType}`);
    }

    const attachments = await attachmentService.getAttachments({
      entityType: entityType as EntityType,
      entityId: entityId as string,
      category: category as string | undefined,
      includeArchived: includeArchived === 'true',
    });

    res.status(200).json({
      success: true,
      data: attachments,
      count: attachments.length,
    });
  }

  /**
   * GET /api/attachments/:id/download
   * Download a file
   */
  async download(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const { filePath, attachment } = await attachmentService.getFilePath(id);

    logger.info(`File download: ${attachment.id} by user ${req.user!.id}`);

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
    res.setHeader('Content-Length', attachment.sizeBytes.toString());

    res.sendFile(filePath);
  }

  /**
   * PATCH /api/attachments/:id
   * Update attachment metadata
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const dto: UpdateAttachmentDTO = req.body;

    const attachment = await attachmentService.updateAttachment(id, dto);

    res.status(200).json({
      success: true,
      data: attachment,
      message: 'Załącznik zaktualizowany',
    });
  }

  /**
   * DELETE /api/attachments/:id
   * Soft-delete (archive) an attachment
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    await attachmentService.deleteAttachment(id);

    res.status(200).json({
      success: true,
      message: 'Załącznik usunięty',
    });
  }

  /**
   * GET /api/attachments/check?entityType=X&entityId=Y&category=Z
   * Check if entity has specific attachment category
   */
  async check(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { entityType, entityId, category } = req.query;

    if (!entityType || !entityId || !category) {
      throw AppError.badRequest('Wymagane parametry: entityType, entityId, category');
    }

    const has = await attachmentService.hasAttachment(
      entityType as EntityType,
      entityId as string,
      category as string,
    );

    res.status(200).json({
      success: true,
      data: { hasAttachment: has },
    });
  }

  /**
   * POST /api/attachments/batch-check-rodo
   * Batch check RODO status for multiple clients
   */
  async batchCheckRodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { clientIds } = req.body;

    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      throw AppError.badRequest('Wymagana tablica clientIds');
    }

    const result = await attachmentService.batchCheckRodo(clientIds);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /api/attachments/batch-check-contract
   * Batch check contract status for multiple reservations
   */
  async batchCheckContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { reservationIds } = req.body;

    if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
      throw AppError.badRequest('Wymagana tablica reservationIds');
    }

    const result = await attachmentService.batchCheckContract(reservationIds);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

export default new AttachmentController();
