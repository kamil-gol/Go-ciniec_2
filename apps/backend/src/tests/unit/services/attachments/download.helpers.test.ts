/**
 * Unit tests for attachments/download.helpers.ts
 * Covers: getFileStream, getDownloadUrl, getPresignedTtl
 */

jest.mock('../../../../services/storage', () => ({
  storageService: {
    exists: jest.fn(),
    getStream: jest.fn(),
    getPresignedUrl: jest.fn(),
  },
}));

jest.mock('../../../../config/storage.config', () => ({
  storageConfig: {
    driver: 'minio',
    buckets: { attachments: 'att-bucket' },
    minio: { publicEndpoint: 'https://storage.example.com' },
    presignedTtl: { sensitive: 300, standard: 900 },
  },
}));

jest.mock('../../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

import { getFileStream, getDownloadUrl, getPresignedTtl } from '../../../../services/attachments/download.helpers';
import { storageService } from '../../../../services/storage';
import { storageConfig } from '../../../../config/storage.config';

const mockStorage = storageService as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// getFileStream
// ===============================================================

describe('getFileStream', () => {
  const attachment = { id: 'att-1', storagePath: 'clients/file.pdf' };

  it('returns stream when file exists', async () => {
    const fakeStream = { pipe: jest.fn() };
    mockStorage.exists.mockResolvedValue(true);
    mockStorage.getStream.mockResolvedValue(fakeStream);

    const result = await getFileStream(attachment);

    expect(result).toBe(fakeStream);
    expect(mockStorage.exists).toHaveBeenCalledWith('att-bucket', 'clients/file.pdf');
    expect(mockStorage.getStream).toHaveBeenCalledWith('att-bucket', 'clients/file.pdf');
  });

  it('throws NotFound when file does not exist in storage', async () => {
    mockStorage.exists.mockResolvedValue(false);

    await expect(getFileStream(attachment)).rejects.toThrow('Plik nie istnieje w storage');
  });
});

// ===============================================================
// getDownloadUrl
// ===============================================================

describe('getDownloadUrl', () => {
  const attachment = {
    id: 'att-2',
    storagePath: 'reservations/contract.pdf',
    originalName: 'Umowa.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 5000,
  };

  it('returns presigned URL when minio with public endpoint', async () => {
    mockStorage.exists.mockResolvedValue(true);
    mockStorage.getPresignedUrl.mockResolvedValue('https://storage.example.com/signed-url');

    const result = await getDownloadUrl(attachment);

    expect(result.direct).toBe(true);
    expect(result.url).toBe('https://storage.example.com/signed-url');
    expect(result.filename).toBe('Umowa.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBe(5000);
    expect(result.expiresIn).toBe(300);
  });

  it('returns fallback stream URL when minio without public endpoint', async () => {
    mockStorage.exists.mockResolvedValue(true);
    // Temporarily change config
    const original = storageConfig.minio.publicEndpoint;
    (storageConfig as any).minio.publicEndpoint = '';

    const result = await getDownloadUrl(attachment);

    expect(result.direct).toBe(false);
    expect(result.url).toBe('/api/attachments/att-2/download');
    expect(result.expiresIn).toBe(0);

    (storageConfig as any).minio.publicEndpoint = original;
  });

  it('uses custom baseApiUrl for fallback', async () => {
    mockStorage.exists.mockResolvedValue(true);
    const original = storageConfig.minio.publicEndpoint;
    (storageConfig as any).minio.publicEndpoint = '';

    const result = await getDownloadUrl(attachment, '/v2/api');

    expect(result.url).toBe('/v2/api/attachments/att-2/download');

    (storageConfig as any).minio.publicEndpoint = original;
  });

  it('throws NotFound when file does not exist', async () => {
    mockStorage.exists.mockResolvedValue(false);

    await expect(getDownloadUrl(attachment)).rejects.toThrow('Plik nie istnieje w storage');
  });
});

// ===============================================================
// getPresignedTtl
// ===============================================================

describe('getPresignedTtl', () => {
  it('returns sensitive TTL for attachments bucket', () => {
    expect(getPresignedTtl('att-bucket')).toBe(300);
  });

  it('returns standard TTL for other buckets', () => {
    expect(getPresignedTtl('other-bucket')).toBe(900);
  });
});
