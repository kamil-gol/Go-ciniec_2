/**
 * MinioStorageService — Unit Tests
 * Tests: uploadFile, downloadFile, deleteFile operations
 */

jest.mock('../../../config/storage.config', () => ({
  storageConfig: {
    minio: {
      endpoint: 'http://localhost:9000',
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      useSSL: false,
    },
    bucket: 'test-bucket',
    buckets: {
      attachments: 'attachments',
      documents: 'documents',
    },
    presignedTtl: {
      sensitive: 3600,
      default: 7200,
    },
  },
}));

jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      bucketExists: jest.fn().mockResolvedValue(true),
      makeBucket: jest.fn().mockResolvedValue(undefined),
      putObject: jest.fn().mockResolvedValue({ etag: 'test-etag' }),
      getObject: jest.fn(),
      removeObject: jest.fn().mockResolvedValue(undefined),
      presignedGetObject: jest.fn().mockResolvedValue('http://presigned-url'),
    })),
  };
});

import { MinioStorageService } from '../../../services/storage/minio.storage';
import { Readable } from 'stream';

const service = new MinioStorageService();
const client = (service as any).client;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MinioStorageService', () => {
  describe('uploadFile', () => {
    it('should upload file to bucket', async () => {
      const buffer = Buffer.from('test content');
      
      await service.upload('test.txt', buffer, 'text/plain');

      expect(client.putObject).toHaveBeenCalledWith(
        'test-bucket',
        expect.any(String),
        buffer,
        buffer.length,
        expect.objectContaining({ 'Content-Type': 'text/plain' })
      );
    });

    it('should handle upload errors', async () => {
      client.putObject.mockRejectedValue(new Error('Upload failed'));
      const buffer = Buffer.from('test');

      await expect(service.upload('test.txt', buffer, 'text/plain'))
        .rejects.toThrow('Upload failed');
    });
  });

  describe('downloadFile', () => {
    it('should download file as buffer', async () => {
      const mockStream = new Readable();
      mockStream.push('test content');
      mockStream.push(null);
      
      client.getObject.mockResolvedValue(mockStream);

      const result = await service.download('test.txt');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle download errors', async () => {
      client.getObject.mockRejectedValue(new Error('Download failed'));

      await expect(service.download('test.txt'))
        .rejects.toThrow('Download failed');
    });
  });

  describe('deleteFile', () => {
    it('should delete file from bucket', async () => {
      await service.delete('test.txt');

      expect(client.removeObject).toHaveBeenCalledWith('test-bucket', 'test.txt');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL', async () => {
      const url = await service.getPresignedUrl('test.txt');

      expect(url).toBe('http://presigned-url');
      expect(client.presignedGetObject).toHaveBeenCalledWith('test-bucket', 'test.txt', 7200);
    });
  });
});
