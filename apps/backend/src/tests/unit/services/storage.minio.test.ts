/**
 * MinioStorageService Unit Tests
 * Covers: upload, download, delete, presigned URLs, bucket operations
 */

const mockMinioClient = {
  putObject: jest.fn(),
  getObject: jest.fn(),
  removeObject: jest.fn(),
  presignedGetObject: jest.fn(),
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
};

jest.mock('minio', () => ({
  Client: jest.fn(() => mockMinioClient),
}));

jest.mock('../../../config/storage.config', () => ({
  storageConfig: {
    buckets: {
      attachments: 'attachments',
      menuImages: 'menu-images',
      exports: 'exports',
    },
    presignedTtl: {
      sensitive: 3600,
      standard: 7200,
    },
  },
}));

import { MinioStorageService } from '../../../services/storage/minio.storage';
import { Readable } from 'stream';

let storageService: MinioStorageService;

beforeEach(() => {
  jest.clearAllMocks();
  storageService = new MinioStorageService();
  mockMinioClient.bucketExists.mockResolvedValue(true);
});

describe('MinioStorageService', () => {
  describe('uploadFile', () => {
    it('should upload file to bucket', async () => {
      const buffer = Buffer.from('test content');
      mockMinioClient.putObject.mockResolvedValue({ etag: 'abc123' });

      const result = await storageService.uploadFile('attachments', 'test.pdf', buffer, 'application/pdf');

      expect(result.success).toBe(true);
      expect(result.key).toBe('test.pdf');
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'attachments',
        'test.pdf',
        buffer,
        buffer.length,
        expect.objectContaining({ 'Content-Type': 'application/pdf' })
      );
    });

    it('should handle upload errors', async () => {
      mockMinioClient.putObject.mockRejectedValue(new Error('Upload failed'));

      const buffer = Buffer.from('test');
      const result = await storageService.uploadFile('attachments', 'test.pdf', buffer);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
    });
  });

  describe('downloadFile', () => {
    it('should download file as buffer', async () => {
      const mockStream = Readable.from(['test content']);
      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const result = await storageService.downloadFile('attachments', 'test.pdf');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockMinioClient.getObject).toHaveBeenCalledWith('attachments', 'test.pdf');
    });

    it('should handle download errors', async () => {
      mockMinioClient.getObject.mockRejectedValue(new Error('Not found'));

      await expect(storageService.downloadFile('attachments', 'missing.pdf')).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete file from bucket', async () => {
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      const result = await storageService.deleteFile('attachments', 'test.pdf');

      expect(result.success).toBe(true);
      expect(mockMinioClient.removeObject).toHaveBeenCalledWith('attachments', 'test.pdf');
    });

    it('should handle deletion errors', async () => {
      mockMinioClient.removeObject.mockRejectedValue(new Error('Delete failed'));

      const result = await storageService.deleteFile('attachments', 'test.pdf');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delete failed');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL', async () => {
      mockMinioClient.presignedGetObject.mockResolvedValue('https://minio.example.com/signed-url');

      const url = await storageService.getPresignedUrl('attachments', 'test.pdf');

      expect(url).toBe('https://minio.example.com/signed-url');
      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith('attachments', 'test.pdf', expect.any(Number));
    });

    it('should default to 3600s expiry', async () => {
      mockMinioClient.presignedGetObject.mockResolvedValue('https://url');

      await storageService.getPresignedUrl('attachments', 'test.pdf');

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        'attachments',
        'test.pdf',
        3600
      );
    });

    it('should use custom expiry', async () => {
      mockMinioClient.presignedGetObject.mockResolvedValue('https://url');

      await storageService.getPresignedUrl('exports', 'report.pdf', 1800);

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        'exports',
        'report.pdf',
        1800
      );
    });
  });

  describe('ensureBucketExists', () => {
    it('should skip creation if bucket exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await storageService.ensureBucketExists('attachments');

      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });

    it('should create bucket if not exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);

      await storageService.ensureBucketExists('new-bucket');

      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('new-bucket', 'us-east-1');
    });
  });
});
