/**
 * Storage Bucket Initialization
 * Wywoływany przy starcie backendu — tworzy brakujące buckety.
 * Działa zarówno z MinIO (makeBucket) jak i local (mkdirSync).
 */

import { storageConfig } from '../../config/storage.config';
import { IStorageService } from './storage.interface';
import logger from '../../utils/logger';

export async function initStorageBuckets(storage: IStorageService): Promise<void> {
  const buckets = [
    storageConfig.buckets.attachments,
    storageConfig.buckets.pdfs,
    storageConfig.buckets.exports,
  ];

  for (const bucket of buckets) {
    try {
      await storage.ensureBucket(bucket);
    } catch (error) {
      logger.error(`[Storage] Nie udało się utworzyć bucketu "${bucket}":`, error);
      throw error;
    }
  }

  logger.info(
    `[Storage] Buckety gotowe (${buckets.join(', ')}) — driver: ${storageConfig.driver}`
  );
}
