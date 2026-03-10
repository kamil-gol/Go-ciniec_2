/**
 * MinIO Storage Service
 * Implementacja IStorageService z MinIO (S3-compatible object storage).
 * Używa accessKey/secretKey z config (service account, nie root).
 *
 * Presigned URL:
 *   - getPresignedUrl() generuje URL z krótkim TTL
 *   - Jeśli MINIO_PUBLIC_ENDPOINT jest ustawiony, URL jest rewritowany
 *     na publiczny endpoint (do użycia z przeglądarki)
 *   - Bez public endpoint: URL wskazuje na wewnętrzny Docker endpoint
 */

import { Client as MinioClient } from 'minio';
import { Readable } from 'stream';
import { IStorageService, UploadResult, StorageStats, StorageObjectInfo } from './storage.interface';
import { storageConfig } from '../../config/storage.config';
import logger from '../../utils/logger';

export class MinioStorageService implements IStorageService {
  private client: MinioClient;

  constructor() {
    const url = new URL(storageConfig.minio.endpoint);
    this.client = new MinioClient({
      endPoint: url.hostname,
      port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 9000),
      useSSL: url.protocol === 'https:',
      accessKey: storageConfig.minio.accessKey,
      secretKey: storageConfig.minio.secretKey,
    });

    const usingServiceAccount = !!process.env.MINIO_ACCESS_KEY;
    logger.info(`[MinIO] Client initialized: ${storageConfig.minio.endpoint} (${usingServiceAccount ? 'service account' : 'root credentials'})`);
    if (storageConfig.minio.publicEndpoint) {
      logger.info(`[MinIO] Public endpoint: ${storageConfig.minio.publicEndpoint}`);
    }
  }

  async upload(bucket: string, key: string, data: Buffer | Readable, metadata?: Record<string, string>): Promise<UploadResult> {
    if (Buffer.isBuffer(data)) {
      await this.client.putObject(bucket, key, data, data.length, metadata || {});
      logger.info(`[MinIO] Uploaded: ${bucket}/${key} (${data.length} bytes)`);
      return { bucket, key, size: data.length };
    }

    await this.client.putObject(bucket, key, data, undefined, metadata || {});
    const stat = await this.client.statObject(bucket, key);
    logger.info(`[MinIO] Uploaded stream: ${bucket}/${key} (${stat.size} bytes)`);
    return { bucket, key, size: stat.size };
  }

  async download(bucket: string, key: string): Promise<Buffer> {
    const stream = await this.client.getObject(bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async getStream(bucket: string, key: string): Promise<Readable> {
    return this.client.getObject(bucket, key);
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
    logger.info(`[MinIO] Deleted: ${bucket}/${key}`);
  }

  async exists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Presigned URL z krótkim TTL.
   * Jeśli MINIO_PUBLIC_ENDPOINT jest ustawiony, rewrituje URL na publiczny.
   */
  async getPresignedUrl(bucket: string, key: string, expirySeconds?: number): Promise<string> {
    const ttl = expirySeconds ?? this.getDefaultTtl(bucket);
    const internalUrl = await this.client.presignedGetObject(bucket, key, ttl);

    if (storageConfig.minio.publicEndpoint) {
      return this.rewriteToPublicUrl(internalUrl);
    }

    return internalUrl;
  }

  /**
   * Czy presigned URLs są dostępne z przeglądarki?
   * True tylko gdy MINIO_PUBLIC_ENDPOINT jest ustawiony.
   */
  isPublicAccessible(): boolean {
    return !!storageConfig.minio.publicEndpoint;
  }

  async getStats(bucket: string): Promise<StorageStats> {
    let totalSize = 0;
    let fileCount = 0;

    const stream = this.client.listObjectsV2(bucket, '', true);
    for await (const obj of stream) {
      totalSize += obj.size;
      fileCount++;
    }

    return { totalSize, fileCount };
  }

  async listObjects(bucket: string, prefix?: string): Promise<StorageObjectInfo[]> {
    const objects: StorageObjectInfo[] = [];
    const stream = this.client.listObjectsV2(bucket, prefix || '', true);

    for await (const obj of stream) {
      objects.push({
        key: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
      });
    }

    return objects;
  }

  async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
      logger.info(`[MinIO] Created bucket: ${bucket}`);
    }
  }

  private getDefaultTtl(bucket: string): number {
    const sensitiveBuckets = [storageConfig.buckets.attachments];
    if (sensitiveBuckets.includes(bucket)) {
      return storageConfig.presignedTtl.sensitive;
    }
    return storageConfig.presignedTtl.standard;
  }

  /**
   * Rewrite internal MinIO URL to public endpoint.
   * http://minio:9000/bucket/key?... -> https://storage.example.com/bucket/key?...
   */
  private rewriteToPublicUrl(internalUrl: string): string {
    const url = new URL(internalUrl);
    const publicUrl = new URL(storageConfig.minio.publicEndpoint!);
    url.protocol = publicUrl.protocol;
    url.hostname = publicUrl.hostname;
    url.port = publicUrl.port;
    return url.toString();
  }
}
