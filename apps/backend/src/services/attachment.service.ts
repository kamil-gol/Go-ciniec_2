/**
 * Attachment Service
 * CRUD operations for polymorphic file attachments
 * 
 * RODO redirect: When RODO is uploaded via RESERVATION or DEPOSIT,
 * the attachment is automatically stored under the CLIENT entity.
 * This ensures all RODO documents are in one place per client.
 * 
 * Updated: Phase 3 Audit — logChange() for all CRUD operations
 * Updated: #146 — storageService abstraction (local/MinIO)
 * 🇵🇱 Spolonizowany — komunikaty błędów z i18n/pl.ts
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { logChange } from '../utils/audit-logger';
import { ATTACHMENT } from '../i18n/pl';
import { CreateAttachmentDTO, UpdateAttachmentDTO, AttachmentFilters } from '../types/attachment.types';
import { ENTITY_TYPES, EntityType, isValidCategory, STORAGE_DIRS } from '../constants/attachmentCategories';
import { storageService } from './storage';
import { storageConfig } from '../config/storage.config';
import logger from '../utils/logger';
import fs from 'fs';

class AttachmentService {
  /**
   * Upload file from staging to storage backend.
   * Returns the storage key (relative path within the bucket).
   * Removes the staging file after successful upload.
   */
  private async uploadToStorage(file: Express.Multer.File, entityType: EntityType): Promise<string> {
    const subDir = STORAGE_DIRS[entityType] || 'other';
    const storageKey = `${subDir}/${file.filename}`;
    const bucket = storageConfig.buckets.attachments;

    const fileBuffer = fs.readFileSync(file.path);

    await storageService.upload(bucket, storageKey, fileBuffer, {
      'Content-Type': file.mimetype,
      'X-Original-Name': encodeURIComponent(file.originalname),
    });

    // Cleanup staging file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      logger.debug(`Staging file removed: ${file.path}`);
    }

    logger.info(`File uploaded to storage: ${bucket}/${storageKey}`);
    return storageKey;
  }

  /**
   * Resolve the clientId from a RESERVATION or DEPOSIT entity.
   * Used for RODO redirect — always store RODO under CLIENT.
   */
  private async resolveClientId(entityType: EntityType, entityId: string): Promise<string | null> {
    try {
      if (entityType === 'RESERVATION') {
        const reservation = await prisma.reservation.findUnique({
          where: { id: entityId },
          select: { clientId: true },
        });
        return reservation?.clientId || null;
      }

      if (entityType === 'DEPOSIT') {
        const deposit = await prisma.deposit.findUnique({
          where: { id: entityId },
          include: {
            reservation: {
              select: { clientId: true },
            },
          },
        });
        return deposit?.reservation?.clientId || null;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to resolve clientId for ${entityType}/${entityId}:`, error);
      return null;
    }
  }

  /**
   * Create attachment record after file upload.
   * 
   * RODO REDIRECT: If category is RODO and entityType is RESERVATION or DEPOSIT,
   * the attachment is automatically redirected to entityType=CLIENT with the
   * resolved clientId. This ensures RODO is always stored at the client level.
   */
  async createAttachment(
    dto: CreateAttachmentDTO,
    file: Express.Multer.File,
    uploadedById: string,
  ) {
    // Validate entityType
    if (!ENTITY_TYPES.includes(dto.entityType)) {
      throw AppError.badRequest(`Nieprawidłowy entityType: ${dto.entityType}. Dozwolone: ${ENTITY_TYPES.join(', ')}`);
    }

    // Validate category
    if (!isValidCategory(dto.entityType, dto.category)) {
      throw AppError.badRequest(`Nieprawidłowa kategoria "${dto.category}" dla typu "${dto.entityType}"`);
    }

    // Validate entity exists
    await this.validateEntityExists(dto.entityType, dto.entityId);

    // ═══════════════════════════════════════════════════════════
    // RODO REDIRECT: Always store RODO under CLIENT
    // ═══════════════════════════════════════════════════════════
    let finalEntityType: EntityType = dto.entityType;
    let finalEntityId: string = dto.entityId;

    if (dto.category === 'RODO' && dto.entityType !== 'CLIENT') {
      const clientId = await this.resolveClientId(dto.entityType, dto.entityId);

      if (!clientId) {
        throw AppError.badRequest(
          `Nie udało się znaleźć klienta powiązanego z ${dto.entityType} ${dto.entityId}. ` +
          `RODO musi być przypisane do klienta.`
        );
      }

      logger.info(
        `RODO redirect: ${dto.entityType}/${dto.entityId} -> CLIENT/${clientId}`
      );

      finalEntityType = 'CLIENT';
      finalEntityId = clientId;
    }

    // Upload file to storage backend (uses FINAL entityType for key)
    const storagePath = await this.uploadToStorage(file, finalEntityType);

    const attachment = await prisma.attachment.create({
      data: {
        entityType: finalEntityType,
        entityId: finalEntityId,
        category: dto.category,
        label: dto.label || null,
        description: dto.description || null,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info(
      `Attachment created: ${attachment.id} (${finalEntityType}/${finalEntityId}, ` +
      `category: ${dto.category}) by user ${uploadedById}` +
      (finalEntityType !== dto.entityType ? ` [redirected from ${dto.entityType}/${dto.entityId}]` : '')
    );

    // Audit log — ATTACHMENT_UPLOAD
    await logChange({
      userId: uploadedById,
      action: 'ATTACHMENT_UPLOAD',
      entityType: finalEntityType,
      entityId: finalEntityId,
      details: {
        description: `Załącznik dodany: ${file.originalname} | ${dto.category} | ${finalEntityType}/${finalEntityId}`,
        attachmentId: attachment.id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        category: dto.category,
        label: dto.label || null,
        redirected: finalEntityType !== dto.entityType
          ? { from: `${dto.entityType}/${dto.entityId}`, to: `${finalEntityType}/${finalEntityId}` }
          : null,
      },
    });

    return attachment;
  }

  /**
   * Get attachments for an entity
   */
  async getAttachments(filters: AttachmentFilters) {
    const where: any = {
      entityType: filters.entityType,
      entityId: filters.entityId,
    };

    if (!filters.includeArchived) {
      where.isArchived = false;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    return prisma.attachment.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get attachments for an entity + cross-referenced RODO from client.
   * Used by RESERVATION and DEPOSIT views to show RODO stored at client level.
   */
  async getAttachmentsWithClientRodo(
    entityType: EntityType,
    entityId: string,
    includeArchived: boolean = false,
  ) {
    // Get own attachments
    const ownAttachments = await this.getAttachments({
      entityType,
      entityId,
      includeArchived,
    });

    // If already CLIENT, no cross-reference needed
    if (entityType === 'CLIENT') {
      return ownAttachments;
    }

    // Resolve clientId and fetch client's RODO
    const clientId = await this.resolveClientId(entityType, entityId);
    if (!clientId) return ownAttachments;

    const clientRodoAttachments = await prisma.attachment.findMany({
      where: {
        entityType: 'CLIENT',
        entityId: clientId,
        category: 'RODO',
        isArchived: includeArchived ? undefined : false,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Merge: own attachments + client RODO (marked with _fromClient flag)
    const mergedRodo = clientRodoAttachments.map(att => ({
      ...att,
      _fromClient: true,
    }));

    return [...mergedRodo, ...ownAttachments];
  }

  /**
   * Get single attachment by ID
   */
  async getAttachmentById(id: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!attachment) {
      throw AppError.notFound(ATTACHMENT.NOT_FOUND);
    }

    return attachment;
  }

  /**
   * Get file stream for download.
   * Returns a readable stream + attachment metadata.
   */
  async getFileStream(id: string): Promise<{ stream: NodeJS.ReadableStream; attachment: any }> {
    const attachment = await this.getAttachmentById(id);
    const bucket = storageConfig.buckets.attachments;

    const fileExists = await storageService.exists(bucket, attachment.storagePath);
    if (!fileExists) {
      logger.error(`File not found in storage: ${bucket}/${attachment.storagePath} (attachment: ${id})`);
      throw AppError.notFound('Plik nie istnieje w storage');
    }

    const stream = await storageService.getStream(bucket, attachment.storagePath);
    return { stream, attachment };
  }

  /**
   * Update attachment metadata
   */
  async updateAttachment(id: string, dto: UpdateAttachmentDTO, userId?: string) {
    const existing = await this.getAttachmentById(id);

    // If changing category, validate it
    if (dto.category && !isValidCategory(existing.entityType as EntityType, dto.category)) {
      throw AppError.badRequest(`Nieprawidłowa kategoria "${dto.category}" dla typu "${existing.entityType}"`);
    }

    // Track changes for audit
    const changes: Record<string, { old: any; new: any }> = {};
    if (dto.label !== undefined && dto.label !== existing.label) {
      changes.label = { old: existing.label, new: dto.label };
    }
    if (dto.description !== undefined && dto.description !== existing.description) {
      changes.description = { old: existing.description, new: dto.description };
    }
    if (dto.category !== undefined && dto.category !== existing.category) {
      changes.category = { old: existing.category, new: dto.category };
    }

    const updated = await prisma.attachment.update({
      where: { id },
      data: {
        label: dto.label !== undefined ? dto.label : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        category: dto.category !== undefined ? dto.category : undefined,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    logger.info(`Attachment updated: ${id}`);

    // Audit log — ATTACHMENT_UPDATE
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId: userId || null,
        action: 'ATTACHMENT_UPDATE',
        entityType: existing.entityType,
        entityId: existing.entityId,
        details: {
          description: `Załącznik zaktualizowany: ${existing.originalName} | ${Object.keys(changes).join(', ')}`,
          attachmentId: id,
          originalName: existing.originalName,
          changes,
        },
      });
    }

    return updated;
  }

  /**
   * Soft-delete attachment (set isArchived=true)
   */
  async deleteAttachment(id: string, userId?: string) {
    const existing = await this.getAttachmentById(id); // Verify exists

    const archived = await prisma.attachment.update({
      where: { id },
      data: { isArchived: true },
    });

    logger.info(`Attachment archived: ${id}`);

    // Audit log — ATTACHMENT_ARCHIVE
    await logChange({
      userId: userId || null,
      action: 'ATTACHMENT_ARCHIVE',
      entityType: existing.entityType,
      entityId: existing.entityId,
      details: {
        description: `Załącznik zarchiwizowany: ${existing.originalName} | ${existing.category} | ${existing.entityType}/${existing.entityId}`,
        attachmentId: id,
        originalName: existing.originalName,
        category: existing.category,
      },
    });

    return archived;
  }

  /**
   * Hard-delete attachment (remove from storage + DB record)
   * Only for admin cleanup
   */
  async hardDeleteAttachment(id: string, userId?: string) {
    const attachment = await this.getAttachmentById(id);
    const bucket = storageConfig.buckets.attachments;

    // Save info for audit before deletion
    const auditData = {
      originalName: attachment.originalName,
      category: attachment.category,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      sizeBytes: attachment.sizeBytes,
      storagePath: attachment.storagePath,
    };

    // Delete file from storage
    try {
      await storageService.delete(bucket, attachment.storagePath);
      logger.info(`File deleted from storage: ${bucket}/${attachment.storagePath}`);
    } catch (error) {
      logger.warn(`File not found in storage during hard delete: ${bucket}/${attachment.storagePath}`);
    }

    // Delete DB record
    await prisma.attachment.delete({ where: { id } });

    logger.info(`Attachment hard-deleted: ${id}`);

    // Audit log — ATTACHMENT_DELETE (permanent)
    await logChange({
      userId: userId || null,
      action: 'ATTACHMENT_DELETE',
      entityType: auditData.entityType,
      entityId: auditData.entityId,
      details: {
        description: `Załącznik trwale usunięty: ${auditData.originalName} | ${auditData.category} | ${auditData.entityType}/${auditData.entityId}`,
        attachmentId: id,
        originalName: auditData.originalName,
        category: auditData.category,
        sizeBytes: auditData.sizeBytes,
        storagePath: auditData.storagePath,
      },
    });
  }

  /**
   * Count attachments by category for an entity
   */
  async countByCategory(entityType: EntityType, entityId: string) {
    const counts = await prisma.attachment.groupBy({
      by: ['category'],
      where: {
        entityType,
        entityId,
        isArchived: false,
      },
      _count: { id: true },
    });

    return counts.reduce((acc, item) => {
      acc[item.category] = item._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Check if entity has specific category attachment
   */
  async hasAttachment(entityType: EntityType, entityId: string, category: string): Promise<boolean> {
    const count = await prisma.attachment.count({
      where: {
        entityType,
        entityId,
        category,
        isArchived: false,
      },
    });
    return count > 0;
  }

  /**
   * Batch check RODO status for multiple clients
   */
  async batchCheckRodo(clientIds: string[]): Promise<Record<string, boolean>> {
    const rodoAttachments = await prisma.attachment.findMany({
      where: {
        entityType: 'CLIENT',
        entityId: { in: clientIds },
        category: 'RODO',
        isArchived: false,
      },
      select: { entityId: true },
      distinct: ['entityId'],
    });

    const rodoSet = new Set(rodoAttachments.map(a => a.entityId));

    return clientIds.reduce((acc, id) => {
      acc[id] = rodoSet.has(id);
      return acc;
    }, {} as Record<string, boolean>);
  }

  /**
   * Batch check contract status for multiple reservations
   */
  async batchCheckContract(reservationIds: string[]): Promise<Record<string, boolean>> {
    const contractAttachments = await prisma.attachment.findMany({
      where: {
        entityType: 'RESERVATION',
        entityId: { in: reservationIds },
        category: 'CONTRACT',
        isArchived: false,
      },
      select: { entityId: true },
      distinct: ['entityId'],
    });

    const contractSet = new Set(contractAttachments.map(a => a.entityId));

    return reservationIds.reduce((acc, id) => {
      acc[id] = contractSet.has(id);
      return acc;
    }, {} as Record<string, boolean>);
  }

  /**
   * Validate that the referenced entity exists
   */
  private async validateEntityExists(entityType: EntityType, entityId: string): Promise<void> {
    let exists = false;

    switch (entityType) {
      case 'CLIENT':
        exists = !!(await prisma.client.findUnique({ where: { id: entityId }, select: { id: true } }));
        break;
      case 'RESERVATION':
        exists = !!(await prisma.reservation.findUnique({ where: { id: entityId }, select: { id: true } }));
        break;
      case 'DEPOSIT':
        exists = !!(await prisma.deposit.findUnique({ where: { id: entityId }, select: { id: true } }));
        break;
      default:
        throw AppError.badRequest(`Nieobsługiwany entityType: ${entityType}`);
    }

    if (!exists) {
      throw AppError.notFound(`${entityType} o id ${entityId}`);
    }
  }
}

export default new AttachmentService();
