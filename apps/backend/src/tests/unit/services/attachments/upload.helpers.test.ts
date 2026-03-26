/**
 * Unit tests for attachments/upload.helpers.ts
 * Covers: uploadToStorage, findDuplicate, resolveClientId, validateEntityExists
 */

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    attachment: { findFirst: jest.fn() },
    reservation: { findUnique: jest.fn() },
    deposit: { findUnique: jest.fn() },
    cateringOrder: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
  },
}));

jest.mock('../../../../services/storage', () => ({
  storageService: {
    upload: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../../config/storage.config', () => ({
  storageConfig: {
    buckets: { attachments: 'test-bucket' },
  },
}));

jest.mock('../../../../utils/image-compression', () => ({
  compressIfImage: jest.fn().mockResolvedValue({
    buffer: Buffer.from('compressed'),
    compressedSize: 10,
    wasCompressed: false,
    originalSize: 10,
  }),
}));

jest.mock('../../../../utils/file-hash', () => ({
  computeFileHash: jest.fn().mockReturnValue('abc123def456'),
}));

jest.mock('../../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('raw')),
  existsSync: jest.fn().mockReturnValue(true),
  unlinkSync: jest.fn(),
}));

jest.mock('../../../../constants/attachmentCategories', () => ({
  EntityType: {},
  STORAGE_DIRS: {
    CLIENT: 'clients',
    RESERVATION: 'reservations',
    DEPOSIT: 'deposits',
    CATERING_ORDER: 'catering',
  },
}));

import { uploadToStorage, findDuplicate, resolveClientId, validateEntityExists } from '../../../../services/attachments/upload.helpers';
import { prisma } from '../../../../lib/prisma';
import { storageService } from '../../../../services/storage';
import fs from 'fs';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// uploadToStorage
// ===============================================================

describe('uploadToStorage', () => {
  const mockFile = {
    filename: 'test.jpg',
    path: '/tmp/test.jpg',
    mimetype: 'image/jpeg',
    originalname: 'photo.jpg',
  } as Express.Multer.File;

  it('uploads file to storage and cleans up staging', async () => {
    const result = await uploadToStorage(mockFile, 'CLIENT' as any);

    expect(result.storageKey).toBe('clients/test.jpg');
    expect(result.finalSize).toBe(10);
    expect(result.fileHash).toBe('abc123def456');
    expect(storageService.upload).toHaveBeenCalledWith(
      'test-bucket',
      'clients/test.jpg',
      expect.any(Buffer),
      expect.objectContaining({ 'Content-Type': 'image/jpeg' }),
    );
    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/test.jpg');
  });

  it('uses "other" subdir for unknown entity type', async () => {
    const result = await uploadToStorage(mockFile, 'UNKNOWN' as any);
    expect(result.storageKey).toBe('other/test.jpg');
  });

  it('does not unlink if staging file does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
    await uploadToStorage(mockFile, 'CLIENT' as any);
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('includes compression headers when image was compressed', async () => {
    const { compressIfImage } = require('../../../../utils/image-compression');
    compressIfImage.mockResolvedValueOnce({
      buffer: Buffer.from('small'),
      compressedSize: 5,
      wasCompressed: true,
      originalSize: 20,
    });

    await uploadToStorage(mockFile, 'CLIENT' as any);

    expect(storageService.upload).toHaveBeenCalledWith(
      'test-bucket',
      'clients/test.jpg',
      expect.any(Buffer),
      expect.objectContaining({
        'X-Original-Size': '20',
        'X-Compressed': 'true',
      }),
    );
  });
});

// ===============================================================
// findDuplicate
// ===============================================================

describe('findDuplicate', () => {
  it('returns existing attachment when duplicate found', async () => {
    const existing = { id: 'att-1', fileHash: 'abc123def456' };
    db.attachment.findFirst.mockResolvedValue(existing);

    const result = await findDuplicate(Buffer.from('data'), 'CLIENT' as any, 'c1', 'RODO');

    expect(result.hash).toBe('abc123def456');
    expect(result.existing).toEqual(existing);
  });

  it('returns null when no duplicate found', async () => {
    db.attachment.findFirst.mockResolvedValue(null);

    const result = await findDuplicate(Buffer.from('data'), 'CLIENT' as any, 'c1', 'RODO');

    expect(result.existing).toBeNull();
  });
});

// ===============================================================
// resolveClientId
// ===============================================================

describe('resolveClientId', () => {
  it('resolves clientId from RESERVATION', async () => {
    db.reservation.findUnique.mockResolvedValue({ clientId: 'cl-1' });

    const result = await resolveClientId('RESERVATION' as any, 'r1');
    expect(result).toBe('cl-1');
  });

  it('resolves clientId from DEPOSIT via reservation', async () => {
    db.deposit.findUnique.mockResolvedValue({ reservation: { clientId: 'cl-2' } });

    const result = await resolveClientId('DEPOSIT' as any, 'd1');
    expect(result).toBe('cl-2');
  });

  it('resolves clientId from CATERING_ORDER', async () => {
    db.cateringOrder.findUnique.mockResolvedValue({ clientId: 'cl-3' });

    const result = await resolveClientId('CATERING_ORDER' as any, 'co1');
    expect(result).toBe('cl-3');
  });

  it('returns null for unknown entity type', async () => {
    const result = await resolveClientId('OTHER' as any, 'x1');
    expect(result).toBeNull();
  });

  it('returns null when reservation not found', async () => {
    db.reservation.findUnique.mockResolvedValue(null);

    const result = await resolveClientId('RESERVATION' as any, 'r-missing');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    db.reservation.findUnique.mockRejectedValue(new Error('DB error'));

    const result = await resolveClientId('RESERVATION' as any, 'r1');
    expect(result).toBeNull();
  });
});

// ===============================================================
// validateEntityExists
// ===============================================================

describe('validateEntityExists', () => {
  it('does not throw when CLIENT exists', async () => {
    db.client.findUnique.mockResolvedValue({ id: 'c1' });
    await expect(validateEntityExists('CLIENT' as any, 'c1')).resolves.not.toThrow();
  });

  it('does not throw when RESERVATION exists', async () => {
    db.reservation.findUnique.mockResolvedValue({ id: 'r1' });
    await expect(validateEntityExists('RESERVATION' as any, 'r1')).resolves.not.toThrow();
  });

  it('does not throw when DEPOSIT exists', async () => {
    db.deposit.findUnique.mockResolvedValue({ id: 'd1' });
    await expect(validateEntityExists('DEPOSIT' as any, 'd1')).resolves.not.toThrow();
  });

  it('does not throw when CATERING_ORDER exists', async () => {
    db.cateringOrder.findUnique.mockResolvedValue({ id: 'co1' });
    await expect(validateEntityExists('CATERING_ORDER' as any, 'co1')).resolves.not.toThrow();
  });

  it('throws NotFound when entity does not exist', async () => {
    db.client.findUnique.mockResolvedValue(null);
    await expect(validateEntityExists('CLIENT' as any, 'c-missing')).rejects.toThrow();
  });

  it('throws BadRequest for unsupported entity type', async () => {
    await expect(validateEntityExists('INVOICE' as any, 'x1')).rejects.toThrow('Nieobsługiwany entityType');
  });
});
