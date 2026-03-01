/**
 * Unit Tests — MinioStorageService
 * Mockuje SDK minio — testuje logikę serwisu bez prawdziwego MinIO.
 * Używa { virtual: true } żeby nie wymagać fizycznego modułu minio w node_modules.
 */

import { Readable } from 'stream';

const mockPutObject = jest.fn();
const mockGetObject = jest.fn();
const mockRemoveObject = jest.fn();
const mockStatObject = jest.fn();
const mockBucketExists = jest.fn();
const mockMakeBucket = jest.fn();
const mockPresignedGetObject = jest.fn();
const mockListObjectsV2 = jest.fn();

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    putObject: mockPutObject,
    getObject: mockGetObject,
    removeObject: mockRemoveObject,
    statObject: mockStatObject,
    bucketExists: mockBucketExists,
    makeBucket: mockMakeBucket,
    presignedGetObject: mockPresignedGetObject,
    listObjectsV2: mockListObjectsV2,
  })),
}), { virtual: true });

jest.mock('../../../config/storage.config', () => ({
  storageConfig: {
    driver: 'minio',
    minio: {
      endpoint: 'http://minio:9000',
      rootUser: 'testuser',
      rootPassword: 'testpass',
    },
    buckets: {
      attachments: 'attachments',
      pdfs: 'pdfs',
      exports: 'exports',
    },
  },
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { MinioStorageService } = require('../../../services/storage/minio.storage');

describe('MinioStorageService', () => {
  let storage: any;

  beforeAll(() => {
    storage = new MinioStorageService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upload (Buffer)', () => {
    it('should call putObject with correct params', async () => {
      mockPutObject.mockResolvedValue(undefined);
      const buf = Buffer.from('test content');

      const result = await storage.upload('attachments', 'clients/test.pdf', buf, { 'Content-Type': 'application/pdf' });

      expect(mockPutObject).toHaveBeenCalledWith(
        'attachments', 'clients/test.pdf', buf, buf.length, { 'Content-Type': 'application/pdf' }
      );
      expect(result).toEqual({ bucket: 'attachments', key: 'clients/test.pdf', size: buf.length });
    });
  });

  describe('upload (Stream)', () => {
    it('should call putObject and statObject for size', async () => {
      mockPutObject.mockResolvedValue(undefined);
      mockStatObject.mockResolvedValue({ size: 1234 });
      const stream = Readable.from([Buffer.from('stream data')]);

      const result = await storage.upload('attachments', 'key.pdf', stream);

      expect(mockPutObject).toHaveBeenCalled();
      expect(mockStatObject).toHaveBeenCalledWith('attachments', 'key.pdf');
      expect(result.size).toBe(1234);
    });
  });

  describe('download', () => {
    it('should return Buffer from stream', async () => {
      const mockStream = Readable.from([Buffer.from('file'), Buffer.from(' content')]);
      mockGetObject.mockResolvedValue(mockStream);

      const result = await storage.download('attachments', 'test.pdf');

      expect(result.toString()).toBe('file content');
      expect(mockGetObject).toHaveBeenCalledWith('attachments', 'test.pdf');
    });
  });

  describe('getStream', () => {
    it('should return stream from minio', async () => {
      const mockStream = Readable.from([Buffer.from('data')]);
      mockGetObject.mockResolvedValue(mockStream);

      const stream = await storage.getStream('attachments', 'test.pdf');
      expect(stream).toBe(mockStream);
    });
  });

  describe('delete', () => {
    it('should call removeObject', async () => {
      mockRemoveObject.mockResolvedValue(undefined);
      await storage.delete('attachments', 'test.pdf');
      expect(mockRemoveObject).toHaveBeenCalledWith('attachments', 'test.pdf');
    });
  });

  describe('exists', () => {
    it('should return true when statObject succeeds', async () => {
      mockStatObject.mockResolvedValue({ size: 100 });
      expect(await storage.exists('attachments', 'test.pdf')).toBe(true);
    });

    it('should return false when statObject throws', async () => {
      mockStatObject.mockRejectedValue(new Error('Not found'));
      expect(await storage.exists('attachments', 'ghost.pdf')).toBe(false);
    });
  });

  describe('getPresignedUrl', () => {
    it('should call presignedGetObject with expiry', async () => {
      mockPresignedGetObject.mockResolvedValue('https://minio:9000/signed-url');

      const url = await storage.getPresignedUrl('attachments', 'test.pdf', 7200);

      expect(mockPresignedGetObject).toHaveBeenCalledWith('attachments', 'test.pdf', 7200);
      expect(url).toBe('https://minio:9000/signed-url');
    });

    it('should default to 3600s expiry', async () => {
      mockPresignedGetObject.mockResolvedValue('url');
      await storage.getPresignedUrl('attachments', 'test.pdf');
      expect(mockPresignedGetObject).toHaveBeenCalledWith('attachments', 'test.pdf', 3600);
    });
  });

  describe('ensureBucket', () => {
    it('should create bucket if not exists', async () => {
      mockBucketExists.mockResolvedValue(false);
      mockMakeBucket.mockResolvedValue(undefined);

      await storage.ensureBucket('new-bucket');

      expect(mockBucketExists).toHaveBeenCalledWith('new-bucket');
      expect(mockMakeBucket).toHaveBeenCalledWith('new-bucket');
    });

    it('should skip if bucket already exists', async () => {
      mockBucketExists.mockResolvedValue(true);

      await storage.ensureBucket('existing-bucket');

      expect(mockMakeBucket).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should aggregate size and count from listObjectsV2', async () => {
      const mockStream = Readable.from([
        { name: 'a.pdf', size: 100, lastModified: new Date() },
        { name: 'b.jpg', size: 200, lastModified: new Date() },
      ]);
      mockListObjectsV2.mockReturnValue(mockStream);

      const stats = await storage.getStats('attachments');

      expect(stats).toEqual({ totalSize: 300, fileCount: 2 });
    });
  });

  describe('listObjects', () => {
    it('should return mapped objects', async () => {
      const now = new Date();
      const mockStream = Readable.from([
        { name: 'clients/a.pdf', size: 100, lastModified: now },
        { name: 'clients/b.jpg', size: 200, lastModified: now },
      ]);
      mockListObjectsV2.mockReturnValue(mockStream);

      const objects = await storage.listObjects('attachments', 'clients/');

      expect(objects).toEqual([
        { key: 'clients/a.pdf', size: 100, lastModified: now },
        { key: 'clients/b.jpg', size: 200, lastModified: now },
      ]);
      expect(mockListObjectsV2).toHaveBeenCalledWith('attachments', 'clients/', true);
    });
  });
});
