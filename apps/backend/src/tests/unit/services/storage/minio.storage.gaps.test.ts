/**
 * MinioStorageService — coverage gaps
 * Covers: getStream(), download(), getStats(), listObjects(), ensureBucket(), exists(), upload stream, presigned URL rewrite
 * Issue: #257
 */

import { Readable } from 'stream';

// ─── Mock minio Client ──────────────────────────────────────────────────────

const mockClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
  removeObject: jest.fn(),
  presignedGetObject: jest.fn(),
  statObject: jest.fn(),
  getObject: jest.fn(),
  listObjectsV2: jest.fn(),
};

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => mockClient),
}));

jest.mock('../../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// ─── Mock storage config ─────────────────────────────────────────────────────

const mockStorageConfig = {
  minio: {
    endpoint: 'http://minio:9000',
    publicEndpoint: null as string | null,
    accessKey: 'testkey',
    secretKey: 'testsecret',
    rootUser: 'minioadmin',
    rootPassword: 'minioadmin123',
  },
  buckets: {
    attachments: 'attachments',
    pdfs: 'pdfs',
    exports: 'exports',
  },
  presignedTtl: {
    sensitive: 3600,
    standard: 900,
  },
};

jest.mock('../../../../config/storage.config', () => ({
  storageConfig: mockStorageConfig,
}));

import { MinioStorageService } from '../../../../services/storage/minio.storage';

// ─── Helper to create async iterable from array ──────────────────────────────

function createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      let index = 0;
      return {
        async next() {
          if (index < items.length) {
            return { value: items[index++], done: false };
          }
          return { value: undefined as any, done: true };
        },
      };
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MinioStorageService — coverage gaps', () => {
  let service: MinioStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MinioStorageService();
  });

  // ═══════════════ download ═══════════════

  describe('download', () => {
    it('powinno pobrać plik jako Buffer z chunków', async () => {
      const chunk1 = Buffer.from('hello ');
      const chunk2 = Buffer.from('world');
      const stream = createAsyncIterable([chunk1, chunk2]);
      mockClient.getObject.mockResolvedValue(stream);

      const result = await service.download('test-bucket', 'file.txt');

      expect(mockClient.getObject).toHaveBeenCalledWith('test-bucket', 'file.txt');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('hello world');
    });

    it('powinno obsłużyć chunki nie będące Buffer (konwersja)', async () => {
      // Simulate chunks that are Uint8Array (not Buffer)
      const chunk = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
      const stream = createAsyncIterable([chunk]);
      mockClient.getObject.mockResolvedValue(stream);

      const result = await service.download('test-bucket', 'file.txt');

      expect(result.toString()).toBe('hello');
    });

    it('powinno zwrócić pusty Buffer gdy brak chunków', async () => {
      const stream = createAsyncIterable<Buffer>([]);
      mockClient.getObject.mockResolvedValue(stream);

      const result = await service.download('test-bucket', 'empty.txt');

      expect(result.length).toBe(0);
    });
  });

  // ═══════════════ getStream ═══════════════

  describe('getStream', () => {
    it('powinno zwrócić Readable stream z MinIO', async () => {
      const mockStream = new Readable({ read() { this.push(null); } });
      mockClient.getObject.mockResolvedValue(mockStream);

      const result = await service.getStream('test-bucket', 'file.txt');

      expect(mockClient.getObject).toHaveBeenCalledWith('test-bucket', 'file.txt');
      expect(result).toBe(mockStream);
    });
  });

  // ═══════════════ getStats ═══════════════

  describe('getStats', () => {
    it('powinno obliczyć łączny rozmiar i liczbę plików', async () => {
      const objects = [
        { name: 'file1.txt', size: 100, lastModified: new Date() },
        { name: 'file2.txt', size: 250, lastModified: new Date() },
        { name: 'file3.txt', size: 50, lastModified: new Date() },
      ];
      mockClient.listObjectsV2.mockReturnValue(createAsyncIterable(objects));

      const stats = await service.getStats('test-bucket');

      expect(mockClient.listObjectsV2).toHaveBeenCalledWith('test-bucket', '', true);
      expect(stats.totalSize).toBe(400);
      expect(stats.fileCount).toBe(3);
    });

    it('powinno zwrócić 0 dla pustego bucketa', async () => {
      mockClient.listObjectsV2.mockReturnValue(createAsyncIterable([]));

      const stats = await service.getStats('empty-bucket');

      expect(stats.totalSize).toBe(0);
      expect(stats.fileCount).toBe(0);
    });
  });

  // ═══════════════ listObjects ═══════════════

  describe('listObjects', () => {
    it('powinno zwrócić listę obiektów z metadanymi', async () => {
      const now = new Date();
      const objects = [
        { name: 'docs/file1.pdf', size: 1024, lastModified: now },
        { name: 'docs/file2.pdf', size: 2048, lastModified: now },
      ];
      mockClient.listObjectsV2.mockReturnValue(createAsyncIterable(objects));

      const result = await service.listObjects('test-bucket', 'docs/');

      expect(mockClient.listObjectsV2).toHaveBeenCalledWith('test-bucket', 'docs/', true);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ key: 'docs/file1.pdf', size: 1024, lastModified: now });
    });

    it('powinno użyć pustego prefixu domyślnie', async () => {
      mockClient.listObjectsV2.mockReturnValue(createAsyncIterable([]));

      await service.listObjects('test-bucket');

      expect(mockClient.listObjectsV2).toHaveBeenCalledWith('test-bucket', '', true);
    });

    it('powinno zwrócić pustą tablicę dla pustego bucketa', async () => {
      mockClient.listObjectsV2.mockReturnValue(createAsyncIterable([]));

      const result = await service.listObjects('empty-bucket');

      expect(result).toEqual([]);
    });
  });

  // ═══════════════ ensureBucket ═══════════════

  describe('ensureBucket', () => {
    it('powinno utworzyć bucket gdy nie istnieje', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);

      await service.ensureBucket('new-bucket');

      expect(mockClient.bucketExists).toHaveBeenCalledWith('new-bucket');
      expect(mockClient.makeBucket).toHaveBeenCalledWith('new-bucket');
    });

    it('powinno nie tworzyć bucketa gdy już istnieje', async () => {
      mockClient.bucketExists.mockResolvedValue(true);

      await service.ensureBucket('existing-bucket');

      expect(mockClient.bucketExists).toHaveBeenCalledWith('existing-bucket');
      expect(mockClient.makeBucket).not.toHaveBeenCalled();
    });
  });

  // ═══════════════ exists ═══════════════

  describe('exists', () => {
    it('powinno zwrócić true gdy plik istnieje', async () => {
      mockClient.statObject.mockResolvedValue({ size: 100 });

      const result = await service.exists('test-bucket', 'file.txt');

      expect(result).toBe(true);
    });

    it('powinno zwrócić false gdy plik nie istnieje', async () => {
      mockClient.statObject.mockRejectedValue(new Error('Not found'));

      const result = await service.exists('test-bucket', 'missing.txt');

      expect(result).toBe(false);
    });
  });

  // ═══════════════ upload (stream) ═══════════════

  describe('upload (stream)', () => {
    it('powinno uploadować stream i zwrócić rozmiar z statObject', async () => {
      const stream = new Readable({ read() { this.push('data'); this.push(null); } });
      mockClient.putObject.mockResolvedValue(undefined);
      mockClient.statObject.mockResolvedValue({ size: 4 });

      const result = await service.upload('test-bucket', 'stream.txt', stream);

      expect(mockClient.putObject).toHaveBeenCalledWith('test-bucket', 'stream.txt', stream, undefined, {});
      expect(result).toEqual({ bucket: 'test-bucket', key: 'stream.txt', size: 4 });
    });

    it('powinno uploadować Buffer z metadanymi', async () => {
      const data = Buffer.from('test data');
      mockClient.putObject.mockResolvedValue(undefined);

      const result = await service.upload('test-bucket', 'buf.txt', data, { 'Content-Type': 'text/plain' });

      expect(mockClient.putObject).toHaveBeenCalledWith(
        'test-bucket', 'buf.txt', data, data.length, { 'Content-Type': 'text/plain' },
      );
      expect(result.size).toBe(data.length);
    });
  });

  // ═══════════════ getPresignedUrl (rewrite) ═══════════════

  describe('getPresignedUrl — public endpoint rewrite', () => {
    it('powinno rewritować URL gdy publicEndpoint jest ustawiony', async () => {
      mockStorageConfig.minio.publicEndpoint = 'https://storage.example.com';
      mockClient.presignedGetObject.mockResolvedValue(
        'http://minio:9000/test-bucket/file.txt?X-Amz-Signature=abc',
      );

      // Create new service instance after config change
      const svc = new MinioStorageService();

      const url = await svc.getPresignedUrl('test-bucket', 'file.txt', 600);

      expect(url).toContain('https://storage.example.com');
      expect(url).toContain('file.txt');

      // Cleanup
      mockStorageConfig.minio.publicEndpoint = null;
    });

    it('powinno użyć custom expiry', async () => {
      mockClient.presignedGetObject.mockResolvedValue('http://internal/bucket/key');

      await service.getPresignedUrl('test-bucket', 'file.txt', 1200);

      expect(mockClient.presignedGetObject).toHaveBeenCalledWith('test-bucket', 'file.txt', 1200);
    });

    it('powinno użyć standard TTL dla nie-sensitive bucketa', async () => {
      mockClient.presignedGetObject.mockResolvedValue('http://internal/bucket/key');

      await service.getPresignedUrl('pdfs', 'doc.pdf');

      expect(mockClient.presignedGetObject).toHaveBeenCalledWith('pdfs', 'doc.pdf', 900);
    });

    it('powinno użyć sensitive TTL dla bucketa attachments', async () => {
      mockClient.presignedGetObject.mockResolvedValue('http://internal/bucket/key');

      await service.getPresignedUrl('attachments', 'secret.pdf');

      expect(mockClient.presignedGetObject).toHaveBeenCalledWith('attachments', 'secret.pdf', 3600);
    });
  });

  // ═══════════════ isPublicAccessible ═══════════════

  describe('isPublicAccessible', () => {
    it('powinno zwrócić false gdy brak publicEndpoint', () => {
      mockStorageConfig.minio.publicEndpoint = null;
      const svc = new MinioStorageService();

      expect(svc.isPublicAccessible()).toBe(false);
    });

    it('powinno zwrócić true gdy publicEndpoint jest ustawiony', () => {
      mockStorageConfig.minio.publicEndpoint = 'https://storage.example.com';
      const svc = new MinioStorageService();

      expect(svc.isPublicAccessible()).toBe(true);

      // Cleanup
      mockStorageConfig.minio.publicEndpoint = null;
    });
  });
});
