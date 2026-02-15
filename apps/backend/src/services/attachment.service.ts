/**
 * Attachment Service
 * CRUD operations for polymorphic file attachments
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { CreateAttachmentDTO, UpdateAttachmentDTO, AttachmentFilters } from '../types/attachment.types';
import { ENTITY_TYPES, EntityType, isValidCategory, STORAGE_DIRS } from '../constants/attachmentCategories';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

class AttachmentService {
  /**
   * Create attachment record after file upload
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

    // Determine storage path (relative)
    const subDir = STORAGE_DIRS[dto.entityType];
    const storagePath = `${subDir}/${file.filename}`;

    const attachment = await prisma.attachment.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
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

    logger.info(`Attachment created: ${attachment.id} (${dto.entityType}/${dto.entityId}) by user ${uploadedById}`);

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
      throw AppError.notFound('Attachment');
    }

    return attachment;
  }

  /**
   * Get full file path for download
   */
  async getFilePath(id: string): Promise<{ filePath: string; attachment: any }> {
    const attachment = await this.getAttachmentById(id);

    const filePath = path.join(UPLOAD_BASE, attachment.storagePath);

    if (!fs.existsSync(filePath)) {
      logger.error(`File not found on disk: ${filePath} (attachment: ${id})`);
      throw AppError.notFound('Plik nie istnieje na dysku');
    }

    return { filePath, attachment };
  }

  /**
   * Update attachment metadata
   */
  async updateAttachment(id: string, dto: UpdateAttachmentDTO) {
    const existing = await this.getAttachmentById(id);

    // If changing category, validate it
    if (dto.category && !isValidCategory(existing.entityType as EntityType, dto.category)) {
      throw AppError.badRequest(`Nieprawidłowa kategoria "${dto.category}" dla typu "${existing.entityType}"`);
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

    return updated;
  }

  /**
   * Soft-delete attachment (set isArchived=true)
   */
  async deleteAttachment(id: string) {
    await this.getAttachmentById(id); // Verify exists

    const archived = await prisma.attachment.update({
      where: { id },
      data: { isArchived: true },
    });

    logger.info(`Attachment archived: ${id}`);

    return archived;
  }

  /**
   * Hard-delete attachment (remove file + DB record)
   * Only for admin cleanup
   */
  async hardDeleteAttachment(id: string) {
    const attachment = await this.getAttachmentById(id);

    // Delete file from disk
    const filePath = path.join(UPLOAD_BASE, attachment.storagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted from disk: ${filePath}`);
    }

    // Delete DB record
    await prisma.attachment.delete({ where: { id } });

    logger.info(`Attachment hard-deleted: ${id}`);
  }

  /**
   * Count attachments by category for an entity
   * Useful for badges ("brak RODO", "brak umowy")
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
   * e.g., hasAttachment('CLIENT', clientId, 'RODO')
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
   * Returns map: clientId -> hasRodo
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
   * Returns map: reservationId -> hasContract
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
