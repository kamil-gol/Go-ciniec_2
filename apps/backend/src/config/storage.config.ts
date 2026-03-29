/**
 * Storage Configuration
 * Reads STORAGE_DRIVER and MinIO credentials from env vars.
 * Defaults to 'local' driver for backward compatibility.
 *
 * MINIO_ACCESS_KEY / MINIO_SECRET_KEY — dedykowane credentials dla backendu.
 * Fallback: MINIO_ROOT_USER / MINIO_ROOT_PASSWORD (legacy/dev).
 *
 * MINIO_PUBLIC_ENDPOINT — publiczny URL MinIO (np. https://storage.gosciniec.online)
 * dla presigned URLs dostępnych z przeglądarki. Jeśli nie ustawiony,
 * presigned URLs fallbackują do /api/attachments/:id/download.
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
    publicEndpoint: string | null;
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
    sensitive: number;
    standard: number;
  };
}

const isProduction = process.env.NODE_ENV === 'production';

function requireEnvInProd(name: string, fallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(`FATAL: ${name} environment variable is required in production`);
  }
  return fallback;
}

export const storageConfig: StorageConfig = {
  driver: (process.env.STORAGE_DRIVER as 'local' | 'minio') || 'local',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    publicEndpoint: process.env.MINIO_PUBLIC_ENDPOINT || null,
    accessKey: process.env.MINIO_ACCESS_KEY || requireEnvInProd('MINIO_ROOT_USER', 'minioadmin'),
    secretKey: process.env.MINIO_SECRET_KEY || requireEnvInProd('MINIO_ROOT_PASSWORD', 'minioadmin123'),
    rootUser: requireEnvInProd('MINIO_ROOT_USER', 'minioadmin'),
    rootPassword: requireEnvInProd('MINIO_ROOT_PASSWORD', 'minioadmin123'),
  },
  buckets: {
    attachments: process.env.MINIO_BUCKET_ATTACHMENTS || 'attachments',
    pdfs: process.env.MINIO_BUCKET_PDFS || 'pdfs',
    exports: process.env.MINIO_BUCKET_EXPORTS || 'exports',
  },
  presignedTtl: {
    sensitive: parseInt(process.env.PRESIGNED_TTL_SENSITIVE || '3600', 10),
    standard: parseInt(process.env.PRESIGNED_TTL_STANDARD || '900', 10),
  },
};
