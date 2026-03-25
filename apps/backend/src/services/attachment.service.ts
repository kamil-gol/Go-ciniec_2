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
 * Updated: #146 — presigned download URLs with TTL
 * Updated: #146 — image compression (sharp) on upload
 * Updated: #146 — SHA-256 file deduplication
 * 🇵🇱 Spolonizowany — komunikaty błędów z i18n/pl.ts
 *
 * Refactored: helpers extracted to attachments/ subdirectory
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { logChange } from '../utils/audit-logger';
import { ATTACHMENT } from '../i18n/pl';
import { CreateAttachmentDTO, UpdateAttachmentDTO, AttachmentFilters } from '../types/attachment.types';
import { ENTITY_TYPES, EntityType, isValidCategory, STORAGE_DIRS } from '../constants/attachmentCategories';
import { storageService } from './storage';
import { storageConfig } from '../config/storage.config';
import { compressIfImage } from '../utils/image-compression';
import logger from '../utils/logger';
import fs from 'fs';

// Extracted helpers
import { findDuplicate, resolveClientId, validateEntityExists } from './attachments/upload.helpers';
import { getFileStream as getFileStreamHelper, getDownloadUrl as getDownloadUrlHelper, DownloadUrlResult } from './attachments/download.helpers';
import {
  countByCategory as countByCategoryFn,
  hasAttachment as hasAttachmentFn,
  batchCheckRodo as batchCheckRodoFn,
  batchCheckContract as batchCheckContractFn,
} from './attachments/batch-queries';

export type { DownloadUrlResult };

class AttachmentService {
  /**
   * Create attachment record after file upload.
   *
   * Deduplication: If a file with the same SHA-256 hash already exists
   * for the same entity+category (and is not archived), the existing
   * attachment is returned instead of creating a duplicate.
   */
  async createAttachment(
    dto: CreateAttachmentDTO,
    file: Express.Multer.File,
    uploadedById: string,
  ) {
    if (!ENTITY_TYPES.includes(dto.entityType)) {
      throw AppError.badRequest(`Nieprawidłowy entityType: ${dto.entityType}. Dozwolone: ${ENTITY_TYPES.join(', ')}`);
    }

    if (!isValidCategory(dto.entityType, dto.category)) {
      throw AppError.badRequest(`Nieprawidłowa kategoria "${dto.category}" dla typu "${dto.entityType}"`);
    }

    await validateEntityExists(dto.entityType, dto.entityId);

    // RODO redirect
    let finalEntityType: EntityType = dto.entityType;
    let finalEntityId: string = dto.entityId;

    if (dto.category === 'RODO' && dto.entityType !== 'CLIENT') {
      const clientId = await resolveClientId(dto.entityType, dto.entityId);

      if (!clientId) {
        throw AppError.badRequest(
          `Nie udało się znaleźć klienta powiązanego z ${dto.entityType} ${dto.entityId}. ` +
          `RODO musi być przypisane do klienta.`
        );
      }

      logger.info(`RODO redirect: ${dto.entityType}/${dto.entityId} -> CLIENT/${clientId}`);
      finalEntityType = 'CLIENT';
      finalEntityId = clientId;
    }

    // ═══ DEDUPLICATION CHECK ═══
    const rawBuffer = fs.readFileSync(file.path);
    const compression = await compressIfImage(rawBuffer, file.mimetype, file.originalname);
    const processedBuffer = compression.buffer;

    const { hash: fileHash, existing: duplicate } = await findDuplicate(
      processedBuffer,
      finalEntityType,
      finalEntityId,
      dto.category,
    );

    if (duplicate) {
      // Cleanup staging file — no upload needed
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        logger.debug(`Staging file removed (dedup): ${file.path}`);
      }

      logger.info(
        `Dedup hit: ${file.originalname} (hash: ${fileHash.substring(0, 12)}...) ` +
        `matches existing attachment ${duplicate.id}`
      );

      await logChange({
        userId: uploadedById,
        action: 'ATTACHMENT_DEDUP',
        entityType: finalEntityType,
        entityId: finalEntityId,
        details: {
          description: `Duplikat wykryty: ${file.originalname} → istniejący załącznik ${duplicate.id}`,
          existingAttachmentId: duplicate.id,
          originalName: file.originalname,
          fileHash,
          category: dto.category,
        },
      });

      return { ...duplicate, _deduplicated: true };
    }

    // ═══ UPLOAD (no duplicate found) ═══
    const subDir = STORAGE_DIRS[finalEntityType] || 'other';
    const storageKey = `${subDir}/${file.filename}`;
    const bucket = storageConfig.buckets.attachments;
    const finalSize = compression.compressedSize;

    await storageService.upload(bucket, storageKey, processedBuffer, {
      'Content-Type': file.mimetype,
      'X-Original-Name': encodeURIComponent(file.originalname),
      ...(compression.wasCompressed ? {
        'X-Original-Size': String(compression.originalSize),
        'X-Compressed': 'true',
      } : {}),
    });

    // Cleanup staging file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      logger.debug(`Staging file removed: ${file.path}`);
    }

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
        sizeBytes: finalSize,
        storagePath: storageKey,
        fileHash,
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
      `category: ${dto.category}, hash: ${fileHash.substring(0, 12)}...) by user ${uploadedById}` +
      (finalEntityType !== dto.entityType ? ` [redirected from ${dto.entityType}/${dto.entityId}]` : '')
    );

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
        sizeBytes: finalSize,
        originalSizeBytes: file.size,
        fileHash,
        category: dto.category,
        label: dto.label || null,
        compressed: finalSize !== file.size,
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
   */
  async getAttachmentsWithClientRodo(
    entityType: EntityType,
    entityId: string,
    includeArchived: boolean = false,
  ) {
    const ownAttachments = await this.getAttachments({
      entityType,
      entityId,
      includeArchived,
    });

    if (entityType === 'CLIENT') {
      return ownAttachments;
    }

    const clientId = await resolveClientId(entityType, entityId);
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
   * Get file stream for download (backend proxy).
   */
  async getFileStream(id: string): Promise<{ stream: NodeJS.ReadableStream; attachment: any }> {
    const attachment = await this.getAttachmentById(id);
    const stream = await getFileStreamHelper(attachment);
    return { stream, attachment };
  }

  /**
   * Get presigned download URL with TTL.
   */
  async getDownloadUrl(id: string, baseApiUrl?: string): Promise<DownloadUrlResult> {
    const attachment = await this.getAttachmentById(id);
    return getDownloadUrlHelper(attachment, baseApiUrl);
  }

  /**
   * Update attachment metadata
   */
  async updateAttachment(id: string, dto: UpdateAttachmentDTO, userId?: string) {
    const existing = await this.getAttachmentById(id);

    if (dto.category && !isValidCategory(existing.entityType as EntityType, dto.category)) {
      throw AppError.badRequest(`Nieprawidłowa kategoria "${dto.category}" dla typu "${existing.entityType}"`);
    }

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
   * Soft-delete attachment
   */
  async deleteAttachment(id: string, userId?: string) {
    const existing = await this.getAttachmentById(id);

    const archived = await prisma.attachment.update({
      where: { id },
      data: { isArchived: true },
    });

    logger.info(`Attachment archived: ${id}`);

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
   * Hard-delete attachment
   */
  async hardDeleteAttachment(id: string, userId?: string) {
    const attachment = await this.getAttachmentById(id);
    const bucket = storageConfig.buckets.attachments;

    const auditData = {
      originalName: attachment.originalName,
      category: attachment.category,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      sizeBytes: attachment.sizeBytes,
      storagePath: attachment.storagePath,
    };

    try {
      await storageService.delete(bucket, attachment.storagePath);
      logger.info(`File deleted from storage: ${bucket}/${attachment.storagePath}`);
    } catch (error) {
      logger.warn(`File not found in storage during hard delete: ${bucket}/${attachment.storagePath}`);
    }

    await prisma.attachment.delete({ where: { id } });

    logger.info(`Attachment hard-deleted: ${id}`);

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

  // Delegated batch queries
  countByCategory = countByCategoryFn;
  hasAttachment = hasAttachmentFn;
  batchCheckRodo = batchCheckRodoFn;
  batchCheckContract = batchCheckContractFn;
}

export default new AttachmentService();
