/**
 * Storage Configuration
 * Reads STORAGE_DRIVER and MinIO credentials from env vars.
 * Defaults to 'local' driver for backward compatibility.
 */

export interface StorageConfig {
  driver: 'local' | 'minio';
  minio: {
    endpoint: string;
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
    rootUser: process.env.MINIO_ROOT_USER || 'minioadmin',
    rootPassword: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
  },
  buckets: {
    attachments: process.env.MINIO_BUCKET_ATTACHMENTS || 'attachments',
    pdfs: process.env.MINIO_BUCKET_PDFS || 'pdfs',
    exports: process.env.MINIO_BUCKET_EXPORTS || 'exports',
  },
};
