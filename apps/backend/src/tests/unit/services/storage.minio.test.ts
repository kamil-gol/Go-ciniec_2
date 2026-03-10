/**
 * MinioStorageService — Unit Tests
 */

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn(),
    makeBucket: jest.fn(),
    putObject: jest.fn(),
    removeObject: jest.fn(),
    presignedGetObject: jest.fn(),
    statObject: jest.fn(),
    listObjects: jest.fn(),
  })),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { MinioStorageService } from '../../../services/storage/minio.storage';
import { storageConfig } from '../../../config/storage.config';

describe('MinioStorageService', () => {
  let service: MinioStorageService;
  let client: any;

  beforeEach(() => {
    service = new MinioStorageService();
    client = (service as any).client;
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file to correct bucket', async () => {
      client.putObject.mockResolvedValue(undefined);

      await service.uploadFile(
        storageConfig.buckets.attachments,
        'test.txt',
        Buffer.from('hello'),
        'text/plain',
      );

      expect(client.putObject).toHaveBeenCalledWith(
        storageConfig.buckets.attachments,
        'test.txt',
        expect.any(Buffer),
        expect.any(Number),
        { 'Content-Type': 'text/plain' },
      );
    });
  });

  describe('deleteFile', () => {
    it('should call removeObject', async () => {
      client.removeObject.mockResolvedValue(undefined);

      await service.deleteFile(storageConfig.buckets.attachments, 'test.txt');

      expect(client.removeObject).toHaveBeenCalledWith(
        storageConfig.buckets.attachments,
        'test.txt',
      );
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL', async () => {
      client.presignedGetObject.mockResolvedValue('http://presigned-url');

      const url = await service.getPresignedUrl(
        storageConfig.buckets.attachments,
        'test.txt',
      );

      expect(url).toBe('http://presigned-url');
      // POPRAWKA: bucket 'attachments' używa TTL 'sensitive' = 3600s, nie 7200s
      expect(client.presignedGetObject).toHaveBeenCalledWith(
        storageConfig.buckets.attachments,
        'test.txt',
        3600,
      );
    });
  });
});
