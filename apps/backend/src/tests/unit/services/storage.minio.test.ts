/**
 * MinIO Storage — Unit Tests
 */

jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      getObject: jest.fn(),
      removeObject: jest.fn(),
      statObject: jest.fn(),
    })),
  };
});

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
  }
  return { AppError: MockAppError };
});

import { MinIOStorage } from '../../../services/storage.minio';
import { Client } from 'minio';

const mockClient = new Client({} as any);
let storage: MinIOStorage;

beforeEach(() => {
  jest.clearAllMocks();
  storage = new MinIOStorage();
  (storage as any).client = mockClient;
});

describe('MinIOStorage', () => {

  it('should upload file', async () => {
    (mockClient.putObject as jest.Mock).mockResolvedValue(undefined);
    const buffer = Buffer.from('test');
    await storage.uploadFile('test.pdf', buffer, 'application/pdf');
    expect(mockClient.putObject).toHaveBeenCalled();
  });

  it('should download file', async () => {
    const mockStream = { on: jest.fn(), pipe: jest.fn() };
    (mockClient.getObject as jest.Mock).mockResolvedValue(mockStream);
    (mockClient.statObject as jest.Mock).mockResolvedValue({ size: 100, metaData: { 'content-type': 'application/pdf' } });
    
    mockStream.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') callback(Buffer.from('test'));
      if (event === 'end') callback();
      return mockStream;
    });

    const result = await storage.downloadFile('test.pdf');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('should delete file', async () => {
    (mockClient.removeObject as jest.Mock).mockResolvedValue(undefined);
    await storage.deleteFile('test.pdf');
    expect(mockClient.removeObject).toHaveBeenCalled();
  });

  it('should check if file exists', async () => {
    (mockClient.statObject as jest.Mock).mockResolvedValue({ size: 100 });
    const exists = await storage.fileExists('test.pdf');
    expect(exists).toBe(true);
  });

  it('should return false when file does not exist', async () => {
    (mockClient.statObject as jest.Mock).mockRejectedValue(new Error('Not found'));
    const exists = await storage.fileExists('missing.pdf');
    expect(exists).toBe(false);
  });

  it('should get file metadata', async () => {
    (mockClient.statObject as jest.Mock).mockResolvedValue({
      size: 200,
      metaData: { 'content-type': 'image/png' },
      lastModified: new Date(),
    });
    const metadata = await storage.getFileMetadata('image.png');
    expect(metadata.size).toBe(200);
  });

  it('should throw error when upload fails', async () => {
    (mockClient.putObject as jest.Mock).mockRejectedValue(new Error('Upload failed'));
    await expect(storage.uploadFile('bad.pdf', Buffer.from('x'), 'application/pdf'))
      .rejects.toThrow('Upload failed');
  });

  it('should throw error when download fails', async () => {
    (mockClient.getObject as jest.Mock).mockRejectedValue(new Error('Download failed'));
    await expect(storage.downloadFile('bad.pdf')).rejects.toThrow('Download failed');
  });

  it('should throw error when delete fails', async () => {
    (mockClient.removeObject as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    await expect(storage.deleteFile('bad.pdf')).rejects.toThrow(/Delete failed/);
  });

  it('should initialize bucket if not exists', async () => {
    (mockClient.bucketExists as jest.Mock).mockResolvedValue(false);
    (mockClient.makeBucket as jest.Mock).mockResolvedValue(undefined);
    await storage.ensureBucket();
    expect(mockClient.makeBucket).toHaveBeenCalled();
  });

  it('should not create bucket if already exists', async () => {
    (mockClient.bucketExists as jest.Mock).mockResolvedValue(true);
    await storage.ensureBucket();
    expect(mockClient.makeBucket).not.toHaveBeenCalled();
  });

  it('should handle stream errors during download', async () => {
    const mockStream = { on: jest.fn(), pipe: jest.fn() };
    (mockClient.getObject as jest.Mock).mockResolvedValue(mockStream);
    (mockClient.statObject as jest.Mock).mockResolvedValue({ size: 100, metaData: {} });

    mockStream.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'error') callback(new Error('Stream error'));
      return mockStream;
    });

    await expect(storage.downloadFile('bad.pdf')).rejects.toThrow('Stream error');
  });

  it('should handle missing metadata', async () => {
    (mockClient.statObject as jest.Mock).mockResolvedValue({ size: 50 });
    const metadata = await storage.getFileMetadata('file.txt');
    expect(metadata.contentType).toBeUndefined();
  });
});
