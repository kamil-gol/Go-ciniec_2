// apps/backend/src/services/attachments/upload.helpers.ts

/**
 * Upload, deduplication, and entity resolution helpers.
 * Extracted from attachment.service.ts.
 */

import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { EntityType, STORAGE_DIRS } from '../../constants/attachmentCategories';
import { storageService } from '../storage';
import { storageConfig } from '../../config/storage.config';
import { compressIfImage } from '../../utils/image-compression';
import { computeFileHash } from '../../utils/file-hash';
import logger from '../../utils/logger';
import fs from 'fs';

/**
 * Upload file from staging to storage backend.
 * Compresses images before upload (sharp: max 2000px, quality 80%).
 */
export async function uploadToStorage(
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
export async function findDuplicate(
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
export async function resolveClientId(entityType: EntityType, entityId: string): Promise<string | null> {
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
 * Validate that the referenced entity exists.
 */
export async function validateEntityExists(entityType: EntityType, entityId: string): Promise<void> {
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
      throw AppError.badRequest(`Nieobs\u0142ugiwany entityType: ${entityType}`);
  }

  if (!exists) {
    throw AppError.notFound(`${entityType} o id ${entityId}`);
  }
}
