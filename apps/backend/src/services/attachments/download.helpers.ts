// apps/backend/src/services/attachments/download.helpers.ts

/**
 * File download and presigned URL helpers.
 * Extracted from attachment.service.ts.
 */

import { AppError } from '../../utils/AppError';
import { storageService } from '../storage';
import { storageConfig } from '../../config/storage.config';
import logger from '../../utils/logger';

export interface DownloadUrlResult {
  url: string;
  expiresIn: number;
  direct: boolean;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Get file stream for download (backend proxy).
 */
export async function getFileStream(
  attachment: { id: string; storagePath: string },
): Promise<NodeJS.ReadableStream> {
  const bucket = storageConfig.buckets.attachments;

  const fileExists = await storageService.exists(bucket, attachment.storagePath);
  if (!fileExists) {
    logger.error(`File not found in storage: ${bucket}/${attachment.storagePath} (attachment: ${attachment.id})`);
    throw AppError.notFound('Plik nie istnieje w storage');
  }

  return storageService.getStream(bucket, attachment.storagePath);
}

/**
 * Get presigned download URL with TTL.
 */
export async function getDownloadUrl(
  attachment: {
    id: string;
    storagePath: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  },
  baseApiUrl?: string,
): Promise<DownloadUrlResult> {
  const bucket = storageConfig.buckets.attachments;

  const fileExists = await storageService.exists(bucket, attachment.storagePath);
  if (!fileExists) {
    logger.error(`File not found in storage: ${bucket}/${attachment.storagePath} (attachment: ${attachment.id})`);
    throw AppError.notFound('Plik nie istnieje w storage');
  }

  const isMinio = storageConfig.driver === 'minio';
  const hasPublicEndpoint = !!storageConfig.minio.publicEndpoint;
  const canDirect = isMinio && hasPublicEndpoint;

  if (canDirect) {
    const presignedUrl = await storageService.getPresignedUrl(bucket, attachment.storagePath);
    const ttl = getPresignedTtl(bucket);

    logger.debug(`Presigned URL generated for attachment ${attachment.id} (TTL: ${ttl}s, direct: true)`);

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
  const fallbackUrl = `${apiBase}/attachments/${attachment.id}/download`;

  logger.debug(`Download URL for attachment ${attachment.id} (fallback to stream, direct: false)`);

  return {
    url: fallbackUrl,
    expiresIn: 0,
    direct: false,
    filename: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
  };
}

export function getPresignedTtl(bucket: string): number {
  const sensitiveBuckets = [storageConfig.buckets.attachments];
  if (sensitiveBuckets.includes(bucket)) {
    return storageConfig.presignedTtl.sensitive;
  }
  return storageConfig.presignedTtl.standard;
}
