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
import { computeFileHash } from '../utils/file-hash';
import logger from '../utils/logger';
import fs from 'fs';

export interface DownloadUrlResult {
  url: string;
  expiresIn: number;
  direct: boolean;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

class AttachmentService {
  /**
   * Upload file from staging to storage backend.
   * Compresses images before upload (sharp: max 2000px, quality 80%).
   */
  private async uploadToStorage(
    file: Express.Multer.File,
    entityType: EntityType,
  ): Promise<{ storageKey: string; finalSize: number; fileHash: string }> {
    const subDir = STORAGE_DIRS[entityType] || 'other';
    const storageKey = `${subDir}/${file.filename}`;
    const bucket = storageConfig.buckets.attachments;

    const rawBuffer = fs.readFileSync(file.path);

    const compression = await compressIfImage(rawBuffer, file.mimetype, file.originalname);
    const fileBuffer = compression.buffer;
    const finalSize = compression.compressedSize;

    const fileHash = computeFileHash(fileBuffer);

    await storageService.upload(bucket, storageKey, fileBuffer, {
      'Content-Type': file.mimetype,
      'X-Original-Name': encodeURIComponent(file.originalname),
      ...(compression.wasCompressed ? {
        'X-Original-Size': String(compression.originalSize),
        'X-Compressed': 'true',
      } : {}),
    });

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      logger.debug(`Staging file removed: ${file.path}`);
    }

    logger.info(`File uploaded to storage: ${bucket}/${storageKey} (${finalSize} bytes, hash: ${fileHash.substring(0, 12)}...)`);
    return { storageKey, finalSize, fileHash };
  }

  /**
   * Check if an identical file (by SHA-256) already exists for the same entity.
   * Returns the existing attachment if found (deduplication).
   */
  private async findDuplicate(
    fileBuffer: Buffer,
    entityType: EntityType,
    entityId: string,
    category: string,
  ): Promise<{ hash: string; existing: any | null }> {
    const fileHash = computeFileHash(fileBuffer);

    const existing = await prisma.attachment.findFirst({
      where: {
        entityType,
        entityId,
        category,
        fileHash,
        isArchived: false,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return { hash: fileHash, existing };
  }

  /**
   * Resolve the clientId from a RESERVATION or DEPOSIT entity.
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

      if (entityType === 'CATERING_ORDER') {
        const order = await prisma.cateringOrder.findUnique({
          where: { id: entityId },
          select: { clientId: true },
        });
        return order?.clientId || null;
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

    await this.validateEntityExists(dto.entityType, dto.entityId);

    // RODO redirect
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

      logger.info(`RODO redirect: ${dto.entityType}/${dto.entityId} -> CLIENT/${clientId}`);
      finalEntityType = 'CLIENT';
      finalEntityId = clientId;
    }

    // ═══ DEDUPLICATION CHECK ═══
    const rawBuffer = fs.readFileSync(file.path);
    const compression = await compressIfImage(rawBuffer, file.mimetype, file.originalname);
    const processedBuffer = compression.buffer;

    const { hash: fileHash, existing: duplicate } = await this.findDuplicate(
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
   * Get presigned download URL with TTL.
   */
  async getDownloadUrl(id: string, baseApiUrl?: string): Promise<DownloadUrlResult> {
    const attachment = await this.getAttachmentById(id);
    const bucket = storageConfig.buckets.attachments;

    const fileExists = await storageService.exists(bucket, attachment.storagePath);
    if (!fileExists) {
      logger.error(`File not found in storage: ${bucket}/${attachment.storagePath} (attachment: ${id})`);
      throw AppError.notFound('Plik nie istnieje w storage');
    }

    const isMinio = storageConfig.driver === 'minio';
    const hasPublicEndpoint = !!storageConfig.minio.publicEndpoint;
    const canDirect = isMinio && hasPublicEndpoint;

    if (canDirect) {
      const presignedUrl = await storageService.getPresignedUrl(bucket, attachment.storagePath);
      const ttl = this.getPresignedTtl(bucket);

      logger.debug(`Presigned URL generated for attachment ${id} (TTL: ${ttl}s, direct: true)`);

      return {
        url: presignedUrl,
        expiresIn: ttl,
        direct: true,
        filename: attachment.originalName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      };
    }

    const apiBase = baseApiUrl || '/api';
    const fallbackUrl = `${apiBase}/attachments/${id}/download`;

    logger.debug(`Download URL for attachment ${id} (fallback to stream, direct: false)`);

    return {
      url: fallbackUrl,
      expiresIn: 0,
      direct: false,
      filename: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    };
  }

  private getPresignedTtl(bucket: string): number {
    const sensitiveBuckets = [storageConfig.buckets.attachments];
    if (sensitiveBuckets.includes(bucket)) {
      return storageConfig.presignedTtl.sensitive;
    }
    return storageConfig.presignedTtl.standard;
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
      case 'CATERING_ORDER':
        exists = !!(await prisma.cateringOrder.findUnique({ where: { id: entityId }, select: { id: true } }));
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
