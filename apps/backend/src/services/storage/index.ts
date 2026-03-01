/**
 * Storage Service — Factory + Singleton Export
 *
 * Użycie:
 *   import { storageService } from './storage';
 *   await storageService.upload('attachments', 'clients/abc.pdf', buffer);
 *
 * Driver wybierany przez env STORAGE_DRIVER=local|minio
 */

import { IStorageService } from './storage.interface';
import { LocalStorageService } from './local.storage';
import { MinioStorageService } from './minio.storage';
import { storageConfig } from '../../config/storage.config';
import logger from '../../utils/logger';

export { IStorageService } from './storage.interface';
export type { UploadResult, StorageStats, StorageObjectInfo } from './storage.interface';
export { initStorageBuckets } from './init-buckets';

function createStorageService(): IStorageService {
  if (storageConfig.driver === 'minio') {
    logger.info('[Storage] Driver: MinIO');
    return new MinioStorageService();
  }
  logger.info('[Storage] Driver: local filesystem');
  return new LocalStorageService();
}

export const storageService: IStorageService = createStorageService();
