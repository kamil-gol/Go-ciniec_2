/**
 * Unit Tests — LocalStorageService
 * Testuje wszystkie metody IStorageService na lokalnym fs (tmpdir).
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';

// Set UPLOAD_BASE BEFORE importing the module
const TEST_DIR = path.join(os.tmpdir(), `storage-test-${Date.now()}`);
process.env.UPLOAD_BASE = TEST_DIR;

// Mock logger
jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { LocalStorageService } from '../../../services/storage/local.storage';

describe('LocalStorageService', () => {
  let storage: LocalStorageService;
  const BUCKET = 'test-bucket';

  beforeAll(() => {
    storage = new LocalStorageService();
  });

  afterAll(() => {
    // Cleanup temp directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    delete process.env.UPLOAD_BASE;
  });

  describe('ensureBucket', () => {
    it('should create directory for bucket', async () => {
      await storage.ensureBucket(BUCKET);
      const dir = path.join(TEST_DIR, BUCKET);
      expect(fs.existsSync(dir)).toBe(true);
    });

    it('should not throw if bucket already exists', async () => {
      await expect(storage.ensureBucket(BUCKET)).resolves.not.toThrow();
    });
  });

  describe('upload (Buffer)', () => {
    const KEY = 'test-file.txt';
    const CONTENT = Buffer.from('Hello MinIO test');

    it('should write file and return correct result', async () => {
      const result = await storage.upload(BUCKET, KEY, CONTENT);

      expect(result.bucket).toBe(BUCKET);
      expect(result.key).toBe(KEY);
      expect(result.size).toBe(CONTENT.length);
    });

    it('should create file on disk', async () => {
      const filePath = path.join(TEST_DIR, BUCKET, KEY);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath).toString()).toBe('Hello MinIO test');
    });
  });

  describe('upload (Stream)', () => {
    const KEY = 'stream-file.txt';
    const CONTENT = 'Stream content test';

    it('should upload from Readable stream', async () => {
      const stream = Readable.from([Buffer.from(CONTENT)]);
      const result = await storage.upload(BUCKET, KEY, stream);

      expect(result.bucket).toBe(BUCKET);
      expect(result.key).toBe(KEY);
      expect(result.size).toBe(CONTENT.length);
    });
  });

  describe('upload with nested key', () => {
    it('should handle keys with slashes (subdirectories)', async () => {
      const key = 'clients/abc/document.pdf';
      const content = Buffer.from('pdf content');

      const result = await storage.upload(BUCKET, key, content);
      expect(result.key).toBe(key);

      const filePath = path.join(TEST_DIR, BUCKET, 'clients', 'abc', 'document.pdf');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('download', () => {
    it('should return file content as Buffer', async () => {
      const buffer = await storage.download(BUCKET, 'test-file.txt');
      expect(buffer.toString()).toBe('Hello MinIO test');
    });

    it('should throw for non-existent file', async () => {
      await expect(storage.download(BUCKET, 'nonexistent.txt'))
        .rejects.toThrow('Plik nie istnieje');
    });
  });

  describe('getStream', () => {
    it('should return readable stream', async () => {
      const stream = await storage.getStream(BUCKET, 'test-file.txt');
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toBe('Hello MinIO test');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      expect(await storage.exists(BUCKET, 'test-file.txt')).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      expect(await storage.exists(BUCKET, 'ghost.txt')).toBe(false);
    });
  });

  describe('getPresignedUrl', () => {
    it('should return API-style path for local storage', async () => {
      const url = await storage.getPresignedUrl(BUCKET, 'test-file.txt');
      expect(url).toContain('/api/attachments/');
      expect(url).toContain('test-file.txt');
    });
  });

  describe('listObjects', () => {
    it('should list all files in bucket', async () => {
      const objects = await storage.listObjects(BUCKET);
      expect(objects.length).toBeGreaterThanOrEqual(3);
      for (const o of objects) {
        expect(o.key).toBeTruthy();
        expect(typeof o.size).toBe('number');
        expect(new Date(o.lastModified).getTime()).not.toBeNaN();
      }
    });

    it('should filter by prefix', async () => {
      const objects = await storage.listObjects(BUCKET, 'clients/');
      expect(objects.every(o => o.key.startsWith('clients/'))).toBe(true);
    });

    it('should return empty for non-existent bucket', async () => {
      const objects = await storage.listObjects('nonexistent-bucket');
      expect(objects).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return correct file count and total size', async () => {
      const stats = await storage.getStats(BUCKET);
      expect(stats.fileCount).toBeGreaterThanOrEqual(3);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should return zeros for empty bucket', async () => {
      const stats = await storage.getStats('nonexistent-bucket');
      expect(stats).toEqual({ totalSize: 0, fileCount: 0 });
    });
  });

  describe('delete', () => {
    it('should remove file from disk', async () => {
      await storage.delete(BUCKET, 'test-file.txt');
      expect(await storage.exists(BUCKET, 'test-file.txt')).toBe(false);
    });

    it('should not throw for already deleted file', async () => {
      await expect(storage.delete(BUCKET, 'test-file.txt')).resolves.not.toThrow();
    });
  });
});
