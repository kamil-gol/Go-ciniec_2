/**
 * initStorageBuckets — Unit Tests
 * Covers: bucket creation, error handling, logging
 */

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../config/storage.config', () => ({
  storageConfig: {
    driver: 'local',
    buckets: {
      attachments: 'attachments',
      pdfs: 'pdfs',
      exports: 'exports',
    },
  },
}));

import { initStorageBuckets } from '../../../services/storage/init-buckets';
import { IStorageService } from '../../../services/storage/storage.interface';
import logger from '../../../utils/logger';

const createMockStorage = (): jest.Mocked<IStorageService> => ({
  upload: jest.fn(),
  download: jest.fn(),
  getStream: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  getPresignedUrl: jest.fn(),
  getStats: jest.fn(),
  listObjects: jest.fn(),
  ensureBucket: jest.fn(),
});

beforeEach(() => jest.clearAllMocks());

describe('initStorageBuckets()', () => {
  it('powinno wywołać ensureBucket dla wszystkich trzech bucketów', async () => {
    const storage = createMockStorage();
    storage.ensureBucket.mockResolvedValue(undefined);

    await initStorageBuckets(storage);

    expect(storage.ensureBucket).toHaveBeenCalledTimes(3);
    expect(storage.ensureBucket).toHaveBeenCalledWith('attachments');
    expect(storage.ensureBucket).toHaveBeenCalledWith('pdfs');
    expect(storage.ensureBucket).toHaveBeenCalledWith('exports');
  });

  it('powinno zalogować sukces po utworzeniu bucketów', async () => {
    const storage = createMockStorage();
    storage.ensureBucket.mockResolvedValue(undefined);

    await initStorageBuckets(storage);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Buckety gotowe'),
    );
  });

  it('powinno rzucić błąd gdy ensureBucket się nie powiedzie', async () => {
    const storage = createMockStorage();
    storage.ensureBucket
      .mockResolvedValueOnce(undefined) // attachments OK
      .mockRejectedValueOnce(new Error('Permission denied')); // pdfs fails

    await expect(initStorageBuckets(storage)).rejects.toThrow('Permission denied');

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('pdfs'),
      expect.any(Error),
    );
  });

  it('powinno przerwać na pierwszym błędzie (nie kontynuować)', async () => {
    const storage = createMockStorage();
    storage.ensureBucket.mockRejectedValue(new Error('Bucket error'));

    await expect(initStorageBuckets(storage)).rejects.toThrow('Bucket error');

    // Only the first bucket was attempted before the error
    expect(storage.ensureBucket).toHaveBeenCalledTimes(1);
  });
});
