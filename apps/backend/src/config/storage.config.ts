/**
 * Storage Configuration
 * Reads STORAGE_DRIVER and MinIO credentials from env vars.
 * Defaults to 'local' driver for backward compatibility.
 *
 * MINIO_ACCESS_KEY / MINIO_SECRET_KEY — dedykowane credentials dla backendu.
 * Fallback: MINIO_ROOT_USER / MINIO_ROOT_PASSWORD (legacy/dev).
 */

export interface StorageConfig {
  driver: 'local' | 'minio';
  minio: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    /** Root credentials — only for admin tasks (bucket creation, migration). */
    rootUser: string;
    rootPassword: string;
  };
  buckets: {
    attachments: string;
    pdfs: string;
    exports: string;
  };
}

export const storageConfig: StorageConfig = {
  driver: (process.env.STORAGE_DRIVER as 'local' | 'minio') || 'local',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    // Dedykowane credentials dla backendu (service account)
    accessKey: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
    // Root — wymagane tylko do tworzenia bucketów / migracji
    rootUser: process.env.MINIO_ROOT_USER || 'minioadmin',
    rootPassword: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
  },
  buckets: {
    attachments: process.env.MINIO_BUCKET_ATTACHMENTS || 'attachments',
    pdfs: process.env.MINIO_BUCKET_PDFS || 'pdfs',
    exports: process.env.MINIO_BUCKET_EXPORTS || 'exports',
  },
};
