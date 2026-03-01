/**
 * Storage Configuration
 * Reads STORAGE_DRIVER and MinIO credentials from env vars.
 * Defaults to 'local' driver for backward compatibility.
 *
 * MINIO_ACCESS_KEY / MINIO_SECRET_KEY — dedykowane credentials dla backendu.
 * Fallback: MINIO_ROOT_USER / MINIO_ROOT_PASSWORD (legacy/dev).
 *
 * Presigned URL TTL (H6):
 *   - RODO/sensitive: 300s (5 min)
 *   - Standard files: 900s (15 min)
 *   - Configurable via PRESIGNED_TTL_* env vars
 */

export interface StorageConfig {
  driver: 'local' | 'minio';
  minio: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    rootUser: string;
    rootPassword: string;
  };
  buckets: {
    attachments: string;
    pdfs: string;
    exports: string;
  };
  presignedTtl: {
    /** TTL for RODO-sensitive files (client attachments). Default: 300s (5 min) */
    sensitive: number;
    /** TTL for standard files (exports, pdfs). Default: 900s (15 min) */
    standard: number;
  };
}

export const storageConfig: StorageConfig = {
  driver: (process.env.STORAGE_DRIVER as 'local' | 'minio') || 'local',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
    rootUser: process.env.MINIO_ROOT_USER || 'minioadmin',
    rootPassword: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
  },
  buckets: {
    attachments: process.env.MINIO_BUCKET_ATTACHMENTS || 'attachments',
    pdfs: process.env.MINIO_BUCKET_PDFS || 'pdfs',
    exports: process.env.MINIO_BUCKET_EXPORTS || 'exports',
  },
  presignedTtl: {
    sensitive: parseInt(process.env.PRESIGNED_TTL_SENSITIVE || '300', 10),
    standard: parseInt(process.env.PRESIGNED_TTL_STANDARD || '900', 10),
  },
};
