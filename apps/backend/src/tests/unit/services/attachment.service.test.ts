/**
 * AttachmentService — Full Branch Coverage
 * Updated for #146: storageService abstraction, no getFilePath, dedup, compression
 */

const mockFs = {
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from('fake-content')),
};
jest.mock('fs', () => mockFs);

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    attachment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    reservation: { findUnique: jest.fn() },
    deposit: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
  },
}));

jest.mock('../../../constants/attachmentCategories', () => ({
  ENTITY_TYPES: ['CLIENT', 'RESERVATION', 'DEPOSIT'],
  isValidCategory: jest.fn(),
  STORAGE_DIRS: { CLIENT: 'clients', RESERVATION: 'reservations', DEPOSIT: 'deposits' },
}));

jest.mock('../../../middlewares/upload', () => ({
  UPLOAD_BASE: '/tmp/uploads',
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

const mockStorageService = {
  upload: jest.fn().mockResolvedValue(undefined),
  getStream: jest.fn().mockResolvedValue({ pipe: jest.fn() }),
  getPresignedUrl: jest.fn().mockResolvedValue('https://minio.local/presigned'),
  delete: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true),
};

jest.mock('../../../services/storage', () => ({
  storageService: mockStorageService,
}));

jest.mock('../../../config/storage.config', () => ({
  storageConfig: {
    driver: 'minio',
    buckets: { attachments: 'attachments', pdfs: 'pdfs', exports: 'exports' },
    minio: { publicEndpoint: 'https://minio.local' },
    presignedTtl: { sensitive: 300, standard: 900 },
  },
}));

jest.mock('../../../utils/image-compression', () => ({
  compressIfImage: jest.fn().mockImplementation(async (buffer: Buffer) => ({
    buffer,
    originalSize: buffer.length,
    compressedSize: buffer.length,
    wasCompressed: false,
  })),
}));

jest.mock('../../../utils/file-hash', () => ({
  computeFileHash: jest.fn(() => 'a'.repeat(64)),
}));

import attachmentService from '../../../services/attachment.service';
import { prisma } from '../../../lib/prisma';
import { isValidCategory } from '../../../constants/attachmentCategories';

const db = prisma as any;
const mockIsValid = isValidCategory as jest.Mock;

const mockFile = (o: any = {}): Express.Multer.File => ({
  fieldname: 'file', originalname: 'doc.pdf', encoding: '7bit',
  mimetype: 'application/pdf', size: 1024, filename: 'abc123.pdf',
  path: '/tmp/uploads/_staging/abc123.pdf', destination: '/tmp/uploads/_staging',
  buffer: Buffer.from(''), stream: null as any,
  ...o,
});

const mockAttachment = (o: any = {}) => ({
  id: 'att-1', entityType: 'CLIENT', entityId: 'client-1',
  category: 'DOCUMENT', label: 'Test', description: null,
  originalName: 'doc.pdf', storedName: 'abc123.pdf',
  mimeType: 'application/pdf', sizeBytes: 1024,
  storagePath: 'clients/abc123.pdf', isArchived: false,
  fileHash: 'a'.repeat(64),
  uploadedById: 'user-1',
  uploadedBy: { id: 'user-1', firstName: 'Jan', lastName: 'K' },
  ...o,
});

beforeEach(() => {
  jest.resetAllMocks();
  mockFs.readFileSync.mockReturnValue(Buffer.from('fake-content'));
  mockFs.existsSync.mockReturnValue(true);
  db.attachment.findFirst.mockResolvedValue(null);
  mockStorageService.upload.mockResolvedValue(undefined);
  mockStorageService.delete.mockResolvedValue(undefined);
  mockStorageService.exists.mockResolvedValue(true);
  mockStorageService.getStream.mockResolvedValue({ pipe: jest.fn() });
  mockStorageService.getPresignedUrl.mockResolvedValue('https://minio.local/presigned');

  const { compressIfImage } = require('../../../utils/image-compression');
  compressIfImage.mockImplementation(async (buffer: Buffer) => ({
    buffer,
    originalSize: buffer.length,
    compressedSize: buffer.length,
    wasCompressed: false,
  }));

  const { computeFileHash } = require('../../../utils/file-hash');
  computeFileHash.mockReturnValue('a'.repeat(64));
});

describe('AttachmentService', () => {

  // ═══ createAttachment ═══
  describe('createAttachment()', () => {
    const setupCreate = () => {
      mockIsValid.mockReturnValue(true);
      db.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockFs.existsSync.mockReturnValue(true);
      db.attachment.create.mockResolvedValue(mockAttachment());
    };

    it('should create attachment for CLIENT (no redirect)', async () => {
      setupCreate();
      const result = await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'DOCUMENT' },
        mockFile(), 'user-1'
      );
      expect(result.id).toBe('att-1');
      expect(mockStorageService.upload).toHaveBeenCalled();
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });

    it('should throw for invalid entityType', async () => {
      await expect(attachmentService.createAttachment(
        { entityType: 'INVALID' as any, entityId: 'x', category: 'DOC' },
        mockFile(), 'user-1'
      )).rejects.toThrow('entityType');
    });

    it('should throw for invalid category', async () => {
      mockIsValid.mockReturnValue(false);
      await expect(attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'BAD' },
        mockFile(), 'user-1'
      )).rejects.toThrow('kategoria');
    });

    it('should redirect RODO from RESERVATION to CLIENT', async () => {
      mockIsValid.mockReturnValue(true);
      db.reservation.findUnique
        .mockResolvedValueOnce({ id: 'r-1' })
        .mockResolvedValueOnce({ clientId: 'c-1' });
      mockFs.existsSync.mockReturnValue(true);
      db.attachment.create.mockResolvedValue(mockAttachment({ entityType: 'CLIENT', entityId: 'c-1' }));

      await attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' },
        mockFile(), 'user-1'
      );
      expect(db.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ entityType: 'CLIENT', entityId: 'c-1' }) })
      );
    });

    it('should redirect RODO from DEPOSIT to CLIENT', async () => {
      mockIsValid.mockReturnValue(true);
      db.deposit.findUnique
        .mockResolvedValueOnce({ id: 'd-1' })
        .mockResolvedValueOnce({ reservation: { clientId: 'c-1' } });
      mockFs.existsSync.mockReturnValue(true);
      db.attachment.create.mockResolvedValue(mockAttachment({ entityType: 'CLIENT' }));

      await attachmentService.createAttachment(
        { entityType: 'DEPOSIT', entityId: 'd-1', category: 'RODO' },
        mockFile(), 'user-1'
      );
      expect(db.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ entityType: 'CLIENT' }) })
      );
    });

    it('should throw when RODO redirect cannot resolve client', async () => {
      mockIsValid.mockReturnValue(true);
      db.reservation.findUnique
        .mockResolvedValueOnce({ id: 'r-1' })
        .mockResolvedValueOnce(null);

      await expect(attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' },
        mockFile(), 'user-1'
      )).rejects.toThrow('klienta');
    });

    it('should not redirect RODO when entityType is CLIENT', async () => {
      setupCreate();
      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' },
        mockFile(), 'user-1'
      );
      expect(db.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ entityType: 'CLIENT' }) })
      );
    });

    it('should handle label and description as null when not provided', async () => {
      setupCreate();
      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'DOC' },
        mockFile(), 'user-1'
      );
      expect(db.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ label: null, description: null }) })
      );
    });

    it('should pass label and description when provided', async () => {
      setupCreate();
      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'DOC', label: 'Lbl', description: 'Desc' },
        mockFile(), 'user-1'
      );
      expect(db.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ label: 'Lbl', description: 'Desc' }) })
      );
    });

    it('should save fileHash in created record', async () => {
      setupCreate();
      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'DOC' },
        mockFile(), 'user-1'
      );
      expect(db.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ fileHash: 'a'.repeat(64) }) })
      );
    });

    it('should return existing on dedup hit without uploading', async () => {
      mockIsValid.mockReturnValue(true);
      db.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockFs.existsSync.mockReturnValue(true);
      const existing = mockAttachment({ id: 'att-dup' });
      db.attachment.findFirst.mockResolvedValue(existing);

      const result = await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'DOCUMENT' },
        mockFile(), 'user-1'
      );

      expect(result._deduplicated).toBe(true);
      expect(result.id).toBe('att-dup');
      expect(mockStorageService.upload).not.toHaveBeenCalled();
      expect(db.attachment.create).not.toHaveBeenCalled();
    });
  });

  // ═══ resolveClientId ═══
  describe('resolveClientId (via RODO redirect)', () => {
    it('should return null for unknown entityType', async () => {
      mockIsValid.mockReturnValue(true);
      db.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockFs.existsSync.mockReturnValue(true);
      db.attachment.create.mockResolvedValue(mockAttachment());

      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' },
        mockFile(), 'user-1'
      );
      expect(db.reservation.findUnique).not.toHaveBeenCalled();
    });

    it('should handle resolveClientId error gracefully', async () => {
      mockIsValid.mockReturnValue(true);
      db.reservation.findUnique
        .mockResolvedValueOnce({ id: 'r-1' })
        .mockRejectedValueOnce(new Error('DB'));

      await expect(attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' },
        mockFile(), 'user-1'
      )).rejects.toThrow('klienta');
    });

    it('should return null when reservation has no clientId', async () => {
      mockIsValid.mockReturnValue(true);
      db.reservation.findUnique
        .mockResolvedValueOnce({ id: 'r-1' })
        .mockResolvedValueOnce({ clientId: null });

      await expect(attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' },
        mockFile(), 'user-1'
      )).rejects.toThrow('klienta');
    });

    it('should return null when deposit has no reservation', async () => {
      mockIsValid.mockReturnValue(true);
      db.deposit.findUnique
        .mockResolvedValueOnce({ id: 'd-1' })
        .mockResolvedValueOnce({ reservation: null });

      await expect(attachmentService.createAttachment(
        { entityType: 'DEPOSIT', entityId: 'd-1', category: 'RODO' },
        mockFile(), 'user-1'
      )).rejects.toThrow('klienta');
    });
  });

  // ═══ getAttachments ═══
  describe('getAttachments()', () => {
    it('should filter out archived by default', async () => {
      db.attachment.findMany.mockResolvedValue([]);
      await attachmentService.getAttachments({ entityType: 'CLIENT', entityId: 'c-1' });
      expect(db.attachment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isArchived: false }) })
      );
    });

    it('should include archived when flag set', async () => {
      db.attachment.findMany.mockResolvedValue([]);
      await attachmentService.getAttachments({ entityType: 'CLIENT', entityId: 'c-1', includeArchived: true });
      const where = db.attachment.findMany.mock.calls[0][0].where;
      expect(where.isArchived).toBeUndefined();
    });

    it('should filter by category when provided', async () => {
      db.attachment.findMany.mockResolvedValue([]);
      await attachmentService.getAttachments({ entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' });
      expect(db.attachment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: 'RODO' }) })
      );
    });
  });

  // ═══ getAttachmentsWithClientRodo ═══
  describe('getAttachmentsWithClientRodo()', () => {
    it('should return own attachments for CLIENT (no cross-ref)', async () => {
      db.attachment.findMany.mockResolvedValue([mockAttachment()]);
      const result = await attachmentService.getAttachmentsWithClientRodo('CLIENT', 'c-1');
      expect(result).toHaveLength(1);
      expect(db.reservation.findUnique).not.toHaveBeenCalled();
    });

    it('should merge client RODO for RESERVATION', async () => {
      db.attachment.findMany
        .mockResolvedValueOnce([mockAttachment({ category: 'CONTRACT' })])
        .mockResolvedValueOnce([mockAttachment({ category: 'RODO', entityId: 'c-1' })]);
      db.reservation.findUnique.mockResolvedValueOnce({ clientId: 'c-1' });

      const result = await attachmentService.getAttachmentsWithClientRodo('RESERVATION', 'r-1');
      expect(result).toHaveLength(2);
      expect((result[0] as any)._fromClient).toBe(true);
    });

    it('should return only own when clientId not resolved', async () => {
      db.attachment.findMany.mockResolvedValueOnce([mockAttachment()]);
      db.reservation.findUnique.mockResolvedValueOnce(null);

      const result = await attachmentService.getAttachmentsWithClientRodo('RESERVATION', 'r-1');
      expect(result).toHaveLength(1);
    });

    it('should respect includeArchived flag', async () => {
      db.attachment.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      db.reservation.findUnique.mockResolvedValueOnce({ clientId: 'c-1' });

      await attachmentService.getAttachmentsWithClientRodo('RESERVATION', 'r-1', true);
      const secondCall = db.attachment.findMany.mock.calls[1][0].where;
      expect(secondCall.isArchived).toBeUndefined();
    });
  });

  // ═══ getAttachmentById ═══
  describe('getAttachmentById()', () => {
    it('should return attachment when found', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      const result = await attachmentService.getAttachmentById('att-1');
      expect(result.id).toBe('att-1');
    });

    it('should throw when not found', async () => {
      db.attachment.findUnique.mockResolvedValue(null);
      await expect(attachmentService.getAttachmentById('bad')).rejects.toThrow();
    });
  });

  // ═══ getFileStream ═══
  describe('getFileStream()', () => {
    it('should return stream when file exists in storage', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      mockStorageService.exists.mockResolvedValue(true);
      const fakeStream = { pipe: jest.fn() };
      mockStorageService.getStream.mockResolvedValue(fakeStream);

      const { stream, attachment } = await attachmentService.getFileStream('att-1');
      expect(stream).toBe(fakeStream);
      expect(attachment.id).toBe('att-1');
      expect(mockStorageService.getStream).toHaveBeenCalledWith('attachments', 'clients/abc123.pdf');
    });

    it('should throw when file not in storage', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      mockStorageService.exists.mockResolvedValue(false);

      await expect(attachmentService.getFileStream('att-1')).rejects.toThrow('storage');
    });
  });

  // ═══ getDownloadUrl ═══
  describe('getDownloadUrl()', () => {
    it('should return presigned URL when configured', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      mockStorageService.exists.mockResolvedValue(true);

      const result = await attachmentService.getDownloadUrl('att-1');
      expect(result.direct).toBe(true);
      expect(result.url).toContain('presigned');
      expect(result.expiresIn).toBe(300);
    });

    it('should throw when file not in storage', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      mockStorageService.exists.mockResolvedValue(false);

      await expect(attachmentService.getDownloadUrl('att-1')).rejects.toThrow('storage');
    });
  });

  // ═══ updateAttachment ═══
  describe('updateAttachment()', () => {
    it('should track label change', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment({ label: 'Old' }));
      db.attachment.update.mockResolvedValue(mockAttachment({ label: 'New' }));

      await attachmentService.updateAttachment('att-1', { label: 'New' }, 'user-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalled();
    });

    it('should track description change', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment({ description: 'Old' }));
      db.attachment.update.mockResolvedValue(mockAttachment({ description: 'New' }));

      await attachmentService.updateAttachment('att-1', { description: 'New' }, 'user-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalled();
    });

    it('should track category change', async () => {
      mockIsValid.mockReturnValue(true);
      db.attachment.findUnique.mockResolvedValue(mockAttachment({ category: 'DOCUMENT' }));
      db.attachment.update.mockResolvedValue(mockAttachment({ category: 'CONTRACT' }));

      await attachmentService.updateAttachment('att-1', { category: 'CONTRACT' }, 'user-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalled();
    });

    it('should NOT audit when no actual changes', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment({ label: 'Same' }));
      db.attachment.update.mockResolvedValue(mockAttachment({ label: 'Same' }));

      await attachmentService.updateAttachment('att-1', { label: 'Same' });
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should throw for invalid category on update', async () => {
      mockIsValid.mockReturnValue(false);
      db.attachment.findUnique.mockResolvedValue(mockAttachment());

      await expect(attachmentService.updateAttachment('att-1', { category: 'BAD' }))
        .rejects.toThrow('kategoria');
    });

    it('should handle userId as null when not provided', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment({ label: 'Old' }));
      db.attachment.update.mockResolvedValue(mockAttachment({ label: 'New' }));

      await attachmentService.updateAttachment('att-1', { label: 'New' });
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null })
      );
    });
  });

  // ═══ deleteAttachment (soft) ═══
  describe('deleteAttachment()', () => {
    it('should archive attachment', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      db.attachment.update.mockResolvedValue(mockAttachment({ isArchived: true }));

      await attachmentService.deleteAttachment('att-1', 'user-1');
      expect(db.attachment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isArchived: true } })
      );
    });

    it('should handle null userId', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      db.attachment.update.mockResolvedValue(mockAttachment({ isArchived: true }));

      await attachmentService.deleteAttachment('att-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null })
      );
    });
  });

  // ═══ hardDeleteAttachment ═══
  describe('hardDeleteAttachment()', () => {
    it('should delete from storage and DB', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      db.attachment.delete.mockResolvedValue(undefined);

      await attachmentService.hardDeleteAttachment('att-1', 'user-1');
      expect(mockStorageService.delete).toHaveBeenCalledWith('attachments', 'clients/abc123.pdf');
      expect(db.attachment.delete).toHaveBeenCalled();
    });

    it('should still delete DB record if storage delete fails', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      db.attachment.delete.mockResolvedValue(undefined);
      mockStorageService.delete.mockRejectedValueOnce(new Error('Not found'));

      await attachmentService.hardDeleteAttachment('att-1');
      expect(db.attachment.delete).toHaveBeenCalled();
    });

    it('should handle null userId', async () => {
      db.attachment.findUnique.mockResolvedValue(mockAttachment());
      db.attachment.delete.mockResolvedValue(undefined);

      await attachmentService.hardDeleteAttachment('att-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null })
      );
    });
  });

  // ═══ countByCategory ═══
  describe('countByCategory()', () => {
    it('should return category counts', async () => {
      db.attachment.groupBy.mockResolvedValue([
        { category: 'DOCUMENT', _count: { id: 3 } },
        { category: 'RODO', _count: { id: 1 } },
      ]);
      const result = await attachmentService.countByCategory('CLIENT', 'c-1');
      expect(result).toEqual({ DOCUMENT: 3, RODO: 1 });
    });
  });

  // ═══ hasAttachment ═══
  describe('hasAttachment()', () => {
    it('should return true when count > 0', async () => {
      db.attachment.count.mockResolvedValue(2);
      const result = await attachmentService.hasAttachment('CLIENT', 'c-1', 'RODO');
      expect(result).toBe(true);
    });

    it('should return false when count = 0', async () => {
      db.attachment.count.mockResolvedValue(0);
      const result = await attachmentService.hasAttachment('CLIENT', 'c-1', 'RODO');
      expect(result).toBe(false);
    });
  });

  // ═══ batchCheckRodo ═══
  describe('batchCheckRodo()', () => {
    it('should return map of clientIds to rodo status', async () => {
      db.attachment.findMany.mockResolvedValue([{ entityId: 'c-1' }]);
      const result = await attachmentService.batchCheckRodo(['c-1', 'c-2']);
      expect(result).toEqual({ 'c-1': true, 'c-2': false });
    });
  });

  // ═══ batchCheckContract ═══
  describe('batchCheckContract()', () => {
    it('should return map of reservationIds to contract status', async () => {
      db.attachment.findMany.mockResolvedValue([{ entityId: 'r-1' }]);
      const result = await attachmentService.batchCheckContract(['r-1', 'r-2']);
      expect(result).toEqual({ 'r-1': true, 'r-2': false });
    });
  });

  // ═══ validateEntityExists ═══
  describe('validateEntityExists (via createAttachment)', () => {
    it('should validate CLIENT exists', async () => {
      mockIsValid.mockReturnValue(true);
      db.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockFs.existsSync.mockReturnValue(true);
      db.attachment.create.mockResolvedValue(mockAttachment());

      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'c-1', category: 'DOC' },
        mockFile(), 'user-1'
      );
      expect(db.client.findUnique).toHaveBeenCalled();
    });

    it('should validate RESERVATION exists', async () => {
      mockIsValid.mockReturnValue(true);
      db.reservation.findUnique.mockResolvedValue({ id: 'r-1' });
      mockFs.existsSync.mockReturnValue(true);
      db.attachment.create.mockResolvedValue(mockAttachment());

      await attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: 'r-1', category: 'DOC' },
        mockFile(), 'user-1'
      );
      expect(db.reservation.findUnique).toHaveBeenCalled();
    });

    it('should validate DEPOSIT exists', async () => {
      mockIsValid.mockReturnValue(true);
      db.deposit.findUnique.mockResolvedValue({ id: 'd-1' });
      mockFs.existsSync.mockReturnValue(true);
      db.attachment.create.mockResolvedValue(mockAttachment());

      await attachmentService.createAttachment(
        { entityType: 'DEPOSIT', entityId: 'd-1', category: 'DOC' },
        mockFile(), 'user-1'
      );
      expect(db.deposit.findUnique).toHaveBeenCalled();
    });

    it('should throw when CLIENT not found', async () => {
      mockIsValid.mockReturnValue(true);
      db.client.findUnique.mockResolvedValue(null);

      await expect(attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: 'bad', category: 'DOC' },
        mockFile(), 'user-1'
      )).rejects.toThrow('CLIENT');
    });

    it('should throw when RESERVATION not found', async () => {
      mockIsValid.mockReturnValue(true);
      db.reservation.findUnique.mockResolvedValue(null);

      await expect(attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: 'bad', category: 'DOC' },
        mockFile(), 'user-1'
      )).rejects.toThrow('RESERVATION');
    });

    it('should throw when DEPOSIT not found', async () => {
      mockIsValid.mockReturnValue(true);
      db.deposit.findUnique.mockResolvedValue(null);

      await expect(attachmentService.createAttachment(
        { entityType: 'DEPOSIT', entityId: 'bad', category: 'DOC' },
        mockFile(), 'user-1'
      )).rejects.toThrow('DEPOSIT');
    });
  });
});
