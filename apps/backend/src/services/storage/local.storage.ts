/**
 * Local Filesystem Storage
 * Implementacja IStorageService na lokalnym systemie plików.
 * Bucket = subdirectory w UPLOAD_BASE (process.cwd()/uploads/).
 * Używany jako fallback gdy STORAGE_DRIVER=local.
 */

import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { IStorageService, UploadResult, StorageStats, StorageObjectInfo } from './storage.interface';
import logger from '../../utils/logger';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

export class LocalStorageService implements IStorageService {
  async upload(bucket: string, key: string, data: Buffer | Readable, _metadata?: Record<string, string>): Promise<UploadResult> {
    const filePath = this.resolvePath(bucket, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (Buffer.isBuffer(data)) {
      fs.writeFileSync(filePath, data);
      logger.debug(`[LocalStorage] Uploaded: ${bucket}/${key} (${data.length} bytes)`);
      return { bucket, key, size: data.length };
    }

    return new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(filePath);
      let size = 0;
      data.on('data', (chunk: Buffer) => { size += chunk.length; });
      data.pipe(ws);
      ws.on('finish', () => {
        logger.debug(`[LocalStorage] Uploaded stream: ${bucket}/${key} (${size} bytes)`);
        resolve({ bucket, key, size });
      });
      ws.on('error', reject);
    });
  }

  async download(bucket: string, key: string): Promise<Buffer> {
    const filePath = this.resolvePath(bucket, key);
    this.assertExists(filePath, bucket, key);
    return fs.readFileSync(filePath);
  }

  async getStream(bucket: string, key: string): Promise<Readable> {
    const filePath = this.resolvePath(bucket, key);
    this.assertExists(filePath, bucket, key);
    return fs.createReadStream(filePath);
  }

  async delete(bucket: string, key: string): Promise<void> {
    const filePath = this.resolvePath(bucket, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[LocalStorage] Deleted: ${bucket}/${key}`);
    }
  }

  async exists(bucket: string, key: string): Promise<boolean> {
    return fs.existsSync(this.resolvePath(bucket, key));
  }

  async getPresignedUrl(_bucket: string, key: string, _expirySeconds?: number): Promise<string> {
    return `/api/attachments/${key}/download`;
  }

  async getStats(bucket: string): Promise<StorageStats> {
    const dir = path.join(UPLOAD_BASE, bucket);
    if (!fs.existsSync(dir)) return { totalSize: 0, fileCount: 0 };

    const files = this.getAllFiles(dir);
    return {
      totalSize: files.reduce((sum, f) => sum + fs.statSync(f).size, 0),
      fileCount: files.length,
    };
  }

  async listObjects(bucket: string, prefix?: string): Promise<StorageObjectInfo[]> {
    const dir = path.join(UPLOAD_BASE, bucket);
    if (!fs.existsSync(dir)) return [];

    return this.getAllFiles(dir)
      .map(f => {
        const key = path.relative(dir, f).split(path.sep).join('/');
        return { key, ...fs.statSync(f) };
      })
      .filter(f => !prefix || f.key.startsWith(prefix))
      .map(f => ({
        key: f.key,
        size: f.size,
        lastModified: f.mtime,
      }));
  }

  async ensureBucket(bucket: string): Promise<void> {
    const dir = path.join(UPLOAD_BASE, bucket);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`[LocalStorage] Created directory: ${dir}`);
    }
  }

  private resolvePath(bucket: string, key: string): string {
    return path.join(UPLOAD_BASE, bucket, ...key.split('/'));
  }

  private assertExists(filePath: string, bucket: string, key: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Plik nie istnieje: ${bucket}/${key}`);
    }
  }

  private getAllFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(e =>
      e.isDirectory()
        ? this.getAllFiles(path.join(dir, e.name))
        : [path.join(dir, e.name)]
    );
  }
}
