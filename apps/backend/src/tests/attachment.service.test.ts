/**
 * Attachment Service — Unit Tests
 * Covers all service methods including #146 storageService abstraction
 *
 * Run: cd apps/backend && npm test
 */

/* ═══════════════════════════════════════════════════════════════
 *  MOCKS — declared before imports (Jest hoists them)
 * ═══════════════════════════════════════════════════════════════ */

const mockPrisma = {
  attachment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  client: { findUnique: jest.fn() },
  reservation: { findUnique: jest.fn() },
  deposit: { findUnique: jest.fn() },
};

jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../middlewares/upload', () => ({
  UPLOAD_BASE: '/tmp/test-uploads',
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from('fake-file-content')),
}));

const mockStorageService = {
  upload: jest.fn().mockResolvedValue(undefined),
  getStream: jest.fn().mockResolvedValue({ pipe: jest.fn() }),
  getPresignedUrl: jest.fn().mockResolvedValue('https://minio.local/presigned-url'),
  delete: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true),
};

jest.mock('../services/storage', () => ({
  storageService: mockStorageService,
}));

jest.mock('../config/storage.config', () => ({
  storageConfig: {
    driver: 'minio',
    buckets: { attachments: 'attachments', pdfs: 'pdfs', exports: 'exports' },
    minio: { publicEndpoint: 'https://minio.local' },
    presignedTtl: { sensitive: 300, standard: 900 },
  },
}));

jest.mock('../utils/image-compression', () => ({
  compressIfImage: jest.fn().mockImplementation(async (buffer: Buffer) => ({
    buffer,
    originalSize: buffer.length,
    compressedSize: buffer.length,
    wasCompressed: false,
  })),
}));

jest.mock('../utils/file-hash', () => ({
  computeFileHash: jest.fn(() => 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
}));

jest.mock('../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../constants/attachmentCategories', () => ({
  ENTITY_TYPES: ['CLIENT', 'RESERVATION', 'DEPOSIT'],
  STORAGE_DIRS: {
    CLIENT: 'clients',
    RESERVATION: 'reservations',
    DEPOSIT: 'deposits',
  },
  isValidCategory: jest.fn((entityType: string, category: string) => {
    const valid: Record<string, string[]> = {
      CLIENT: ['RODO', 'CONTRACT', 'ID_DOCUMENT', 'OTHER'],
      RESERVATION: ['CONTRACT', 'RODO', 'INVOICE', 'PHOTO', 'OTHER'],
      DEPOSIT: ['PAYMENT_CONFIRMATION', 'RODO', 'INVOICE', 'OTHER'],
    };
    return valid[entityType]?.includes(category) ?? false;
  }),
}));

/* ═══════════════════════════════════════════════════════════════
 *  IMPORTS (after mocks)
 * ═══════════════════════════════════════════════════════════════ */

import attachmentService from '../services/attachment.service';
import fs from 'fs';

/* ═══════════════════════════════════════════════════════════════
 *  HELPERS
 * ═══════════════════════════════════════════════════════════════ */

const MOCK_USER_ID = 'user-001';
const MOCK_CLIENT_ID = 'client-001';
const MOCK_RESERVATION_ID = 'res-001';
const MOCK_DEPOSIT_ID = 'dep-001';
const MOCK_ATTACHMENT_ID = 'att-001';

const mockFile = (overrides: any = {}): any => ({
  fieldname: 'file',
  originalname: 'test-document.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 12345,
  destination: '/tmp/test-uploads/_staging',
  filename: 'abc123-test-document.pdf',
  path: '/tmp/test-uploads/_staging/abc123-test-document.pdf',
  buffer: Buffer.from(''),
  stream: null,
  ...overrides,
});

const mockRecord = (overrides: any = {}) => ({
  id: MOCK_ATTACHMENT_ID,
  entityType: 'CLIENT',
  entityId: MOCK_CLIENT_ID,
  category: 'RODO',
  label: null,
  description: null,
  originalName: 'test.pdf',
  storedName: 'abc123-test.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 12345,
  storagePath: 'clients/abc123-test.pdf',
  fileHash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  isArchived: false,
  uploadedById: MOCK_USER_ID,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
  uploadedBy: { id: MOCK_USER_ID, firstName: 'Jan', lastName: 'Kowalski' },
  ...overrides,
});

/* ═══════════════════════════════════════════════════════════════
 *  SETUP / TEARDOWN
 * ═══════════════════════════════════════════════════════════════ */

beforeEach(() => {
  jest.clearAllMocks();

  (fs.existsSync as jest.Mock).mockReturnValue(true);
  (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('fake-file-content'));

  mockPrisma.client.findUnique.mockResolvedValue({ id: MOCK_CLIENT_ID });
  mockPrisma.reservation.findUnique.mockResolvedValue({
    id: MOCK_RESERVATION_ID,
    clientId: MOCK_CLIENT_ID,
  });
  mockPrisma.deposit.findUnique.mockResolvedValue({
    id: MOCK_DEPOSIT_ID,
    reservation: { clientId: MOCK_CLIENT_ID },
  });
  mockPrisma.attachment.findFirst.mockResolvedValue(null);
  mockStorageService.exists.mockResolvedValue(true);
});

/* ═══════════════════════════════════════════════════════════════
 *  TESTS
 * ═══════════════════════════════════════════════════════════════ */

describe('AttachmentService', () => {
  /* ─── createAttachment ────────────────────────────────────── */

  describe('createAttachment()', () => {
    it('should create attachment for CLIENT entity', async () => {
      mockPrisma.attachment.create.mockResolvedValue(mockRecord());

      const result = await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' },
        mockFile(),
        MOCK_USER_ID,
      );

      expect(result.entityType).toBe('CLIENT');
      expect(result.entityId).toBe(MOCK_CLIENT_ID);
      expect(mockPrisma.attachment.create).toHaveBeenCalledTimes(1);
      expect(mockStorageService.upload).toHaveBeenCalled();
    });

    it('should upload file to correct storage path', async () => {
      mockPrisma.attachment.create.mockResolvedValue(mockRecord());

      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' },
        mockFile(),
        MOCK_USER_ID,
      );

      const createCall = mockPrisma.attachment.create.mock.calls[0][0];
      expect(createCall.data.storagePath).toMatch(/^clients\//);
    });

    it('should cleanup staging file after upload', async () => {
      mockPrisma.attachment.create.mockResolvedValue(mockRecord());

      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' },
        mockFile(),
        MOCK_USER_ID,
      );

      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should reject invalid entityType', async () => {
      await expect(
        attachmentService.createAttachment(
          { entityType: 'INVALID' as any, entityId: 'x', category: 'OTHER' },
          mockFile(),
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(/entityType/i);
    });

    it('should reject invalid category for entity type', async () => {
      await expect(
        attachmentService.createAttachment(
          { entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'PAYMENT_CONFIRMATION' },
          mockFile(),
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(/kategori/i);
    });

    it('should reject when entity does not exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(
        attachmentService.createAttachment(
          { entityType: 'CLIENT', entityId: 'nonexistent', category: 'RODO' },
          mockFile(),
          MOCK_USER_ID,
        ),
      ).rejects.toThrow();
    });

    it('should redirect RODO from RESERVATION to CLIENT', async () => {
      mockPrisma.attachment.create.mockResolvedValue(
        mockRecord({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID }),
      );

      const result = await attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'RODO' },
        mockFile(),
        MOCK_USER_ID,
      );

      expect(result.entityType).toBe('CLIENT');
      expect(result.entityId).toBe(MOCK_CLIENT_ID);

      const createCall = mockPrisma.attachment.create.mock.calls[0][0];
      expect(createCall.data.entityType).toBe('CLIENT');
      expect(createCall.data.entityId).toBe(MOCK_CLIENT_ID);
    });

    it('should redirect RODO from DEPOSIT to CLIENT', async () => {
      mockPrisma.attachment.create.mockResolvedValue(
        mockRecord({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID }),
      );

      await attachmentService.createAttachment(
        { entityType: 'DEPOSIT', entityId: MOCK_DEPOSIT_ID, category: 'RODO' },
        mockFile(),
        MOCK_USER_ID,
      );

      const createCall = mockPrisma.attachment.create.mock.calls[0][0];
      expect(createCall.data.entityType).toBe('CLIENT');
      expect(createCall.data.entityId).toBe(MOCK_CLIENT_ID);
    });

    it('should NOT redirect non-RODO categories', async () => {
      mockPrisma.attachment.create.mockResolvedValue(
        mockRecord({ entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'CONTRACT' }),
      );

      await attachmentService.createAttachment(
        { entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'CONTRACT' },
        mockFile(),
        MOCK_USER_ID,
      );

      const createCall = mockPrisma.attachment.create.mock.calls[0][0];
      expect(createCall.data.entityType).toBe('RESERVATION');
      expect(createCall.data.entityId).toBe(MOCK_RESERVATION_ID);
    });

    it('should throw when RODO redirect cannot resolve clientId', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: MOCK_RESERVATION_ID,
        clientId: null,
      });

      await expect(
        attachmentService.createAttachment(
          { entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'RODO' },
          mockFile(),
          MOCK_USER_ID,
        ),
      ).rejects.toThrow(/klient/i);
    });

    it('should save fileHash in created record', async () => {
      mockPrisma.attachment.create.mockResolvedValue(mockRecord());

      await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' },
        mockFile(),
        MOCK_USER_ID,
      );

      const createCall = mockPrisma.attachment.create.mock.calls[0][0];
      expect(createCall.data.fileHash).toBeDefined();
      expect(createCall.data.fileHash).toHaveLength(64);
    });

    it('should return existing attachment on dedup hit', async () => {
      const existingRecord = mockRecord({ id: 'att-existing' });
      mockPrisma.attachment.findFirst.mockResolvedValue(existingRecord);

      const result = await attachmentService.createAttachment(
        { entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' },
        mockFile(),
        MOCK_USER_ID,
      );

      expect(result._deduplicated).toBe(true);
      expect(result.id).toBe('att-existing');
      expect(mockPrisma.attachment.create).not.toHaveBeenCalled();
      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });
  });

  /* ─── getAttachments ──────────────────────────────────────── */

  describe('getAttachments()', () => {
    it('should return attachments filtered by entity', async () => {
      const records = [mockRecord(), mockRecord({ id: 'att-002' })];
      mockPrisma.attachment.findMany.mockResolvedValue(records);

      const result = await attachmentService.getAttachments({
        entityType: 'CLIENT',
        entityId: MOCK_CLIENT_ID,
      });

      expect(result).toHaveLength(2);
      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'CLIENT',
            entityId: MOCK_CLIENT_ID,
            isArchived: false,
          }),
        }),
      );
    });

    it('should include archived when requested', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      await attachmentService.getAttachments({
        entityType: 'CLIENT',
        entityId: MOCK_CLIENT_ID,
        includeArchived: true,
      });

      const where = mockPrisma.attachment.findMany.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('isArchived');
    });

    it('should filter by category when provided', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      await attachmentService.getAttachments({
        entityType: 'CLIENT',
        entityId: MOCK_CLIENT_ID,
        category: 'RODO',
      });

      const where = mockPrisma.attachment.findMany.mock.calls[0][0].where;
      expect(where.category).toBe('RODO');
    });

    it('should return empty array when no attachments', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      const result = await attachmentService.getAttachments({
        entityType: 'CLIENT',
        entityId: 'no-attachments',
      });

      expect(result).toEqual([]);
    });
  });

  /* ─── getAttachmentsWithClientRodo ────────────────────────── */

  describe('getAttachmentsWithClientRodo()', () => {
    it('should merge own attachments with client RODO for RESERVATION', async () => {
      const ownAtt = mockRecord({
        entityType: 'RESERVATION',
        entityId: MOCK_RESERVATION_ID,
        category: 'CONTRACT',
      });
      const clientRodo = mockRecord({
        id: 'att-rodo',
        entityType: 'CLIENT',
        entityId: MOCK_CLIENT_ID,
        category: 'RODO',
      });

      mockPrisma.attachment.findMany
        .mockResolvedValueOnce([ownAtt])
        .mockResolvedValueOnce([clientRodo]);

      const result = await attachmentService.getAttachmentsWithClientRodo(
        'RESERVATION',
        MOCK_RESERVATION_ID,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('_fromClient', true);
      expect(result[0].category).toBe('RODO');
      expect(result[1].category).toBe('CONTRACT');
    });

    it('should NOT cross-reference for CLIENT entityType', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([mockRecord()]);

      const result = await attachmentService.getAttachmentsWithClientRodo(
        'CLIENT',
        MOCK_CLIENT_ID,
      );

      expect(result).toHaveLength(1);
      expect(mockPrisma.attachment.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return only own if clientId cannot be resolved', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      mockPrisma.attachment.findMany.mockResolvedValueOnce([]);

      const result = await attachmentService.getAttachmentsWithClientRodo(
        'RESERVATION',
        'orphan-res',
      );

      expect(result).toEqual([]);
      expect(mockPrisma.attachment.findMany).toHaveBeenCalledTimes(1);
    });
  });

  /* ─── updateAttachment ────────────────────────────────────── */

  describe('updateAttachment()', () => {
    it('should update label and description', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockPrisma.attachment.update.mockResolvedValue(
        mockRecord({ label: 'Nowa etykieta', description: 'Opis' }),
      );

      const result = await attachmentService.updateAttachment(MOCK_ATTACHMENT_ID, {
        label: 'Nowa etykieta',
        description: 'Opis',
      });

      expect(result.label).toBe('Nowa etykieta');
      expect(result.description).toBe('Opis');
      expect(mockPrisma.attachment.update).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid category change', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(
        mockRecord({ entityType: 'CLIENT' }),
      );

      await expect(
        attachmentService.updateAttachment(MOCK_ATTACHMENT_ID, {
          category: 'PAYMENT_CONFIRMATION',
        }),
      ).rejects.toThrow(/kategori/i);
    });

    it('should throw when attachment not found', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(
        attachmentService.updateAttachment('nonexistent', { label: 'x' }),
      ).rejects.toThrow();
    });
  });

  /* ─── deleteAttachment (soft) ─────────────────────────────── */

  describe('deleteAttachment()', () => {
    it('should soft-delete by setting isArchived=true', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockPrisma.attachment.update.mockResolvedValue(
        mockRecord({ isArchived: true }),
      );

      const result = await attachmentService.deleteAttachment(MOCK_ATTACHMENT_ID);

      expect(result.isArchived).toBe(true);
      expect(mockPrisma.attachment.update).toHaveBeenCalledWith({
        where: { id: MOCK_ATTACHMENT_ID },
        data: { isArchived: true },
      });
    });

    it('should throw when attachment not found', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(
        attachmentService.deleteAttachment('nonexistent'),
      ).rejects.toThrow();
    });
  });

  /* ─── hardDeleteAttachment ────────────────────────────────── */

  describe('hardDeleteAttachment()', () => {
    it('should delete file from storage and DB record', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockPrisma.attachment.delete.mockResolvedValue(mockRecord());

      await attachmentService.hardDeleteAttachment(MOCK_ATTACHMENT_ID);

      expect(mockStorageService.delete).toHaveBeenCalledWith('attachments', 'clients/abc123-test.pdf');
      expect(mockPrisma.attachment.delete).toHaveBeenCalledWith({
        where: { id: MOCK_ATTACHMENT_ID },
      });
    });

    it('should still delete DB record if storage file not found', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockPrisma.attachment.delete.mockResolvedValue(mockRecord());
      mockStorageService.delete.mockRejectedValueOnce(new Error('Not found'));

      await attachmentService.hardDeleteAttachment(MOCK_ATTACHMENT_ID);

      expect(mockPrisma.attachment.delete).toHaveBeenCalled();
    });
  });

  /* ─── getFileStream ───────────────────────────────────────── */

  describe('getFileStream()', () => {
    it('should return stream and attachment when file exists', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockStorageService.exists.mockResolvedValue(true);
      const mockStream = { pipe: jest.fn() };
      mockStorageService.getStream.mockResolvedValue(mockStream);

      const { stream, attachment } = await attachmentService.getFileStream(MOCK_ATTACHMENT_ID);

      expect(stream).toBe(mockStream);
      expect(attachment.id).toBe(MOCK_ATTACHMENT_ID);
      expect(mockStorageService.getStream).toHaveBeenCalledWith('attachments', 'clients/abc123-test.pdf');
    });

    it('should throw when file not in storage', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockStorageService.exists.mockResolvedValue(false);

      await expect(
        attachmentService.getFileStream(MOCK_ATTACHMENT_ID),
      ).rejects.toThrow(/storage/i);
    });

    it('should throw when attachment not found', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(
        attachmentService.getFileStream(MOCK_ATTACHMENT_ID),
      ).rejects.toThrow();
    });
  });

  /* ─── getDownloadUrl ──────────────────────────────────────── */

  describe('getDownloadUrl()', () => {
    it('should return presigned URL when MinIO + publicEndpoint configured', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockStorageService.exists.mockResolvedValue(true);

      const result = await attachmentService.getDownloadUrl(MOCK_ATTACHMENT_ID);

      expect(result.url).toContain('presigned');
      expect(result.direct).toBe(true);
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(result.filename).toBe('test.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should throw when file not in storage', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
      mockStorageService.exists.mockResolvedValue(false);

      await expect(
        attachmentService.getDownloadUrl(MOCK_ATTACHMENT_ID),
      ).rejects.toThrow(/storage/i);
    });
  });

  /* ─── batchCheckRodo ──────────────────────────────────────── */

  describe('batchCheckRodo()', () => {
    it('should return map with true for clients with RODO', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([
        { entityId: 'c1' },
        { entityId: 'c3' },
      ]);

      const result = await attachmentService.batchCheckRodo(['c1', 'c2', 'c3']);

      expect(result).toEqual({ c1: true, c2: false, c3: true });
    });

    it('should return all false when no RODO exists', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      const result = await attachmentService.batchCheckRodo(['c1', 'c2']);

      expect(result).toEqual({ c1: false, c2: false });
    });

    it('should handle empty input', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      const result = await attachmentService.batchCheckRodo([]);

      expect(result).toEqual({});
    });

    it('should query with correct filters', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      await attachmentService.batchCheckRodo(['c1']);

      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'CLIENT',
          entityId: { in: ['c1'] },
          category: 'RODO',
          isArchived: false,
        },
        select: { entityId: true },
        distinct: ['entityId'],
      });
    });
  });

  /* ─── batchCheckContract ──────────────────────────────────── */

  describe('batchCheckContract()', () => {
    it('should return map with true for reservations with CONTRACT', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([
        { entityId: 'r1' },
      ]);

      const result = await attachmentService.batchCheckContract(['r1', 'r2']);

      expect(result).toEqual({ r1: true, r2: false });
    });

    it('should handle empty input', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      const result = await attachmentService.batchCheckContract([]);

      expect(result).toEqual({});
    });

    it('should query RESERVATION + CONTRACT category', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([]);

      await attachmentService.batchCheckContract(['r1']);

      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'RESERVATION',
            category: 'CONTRACT',
            isArchived: false,
          }),
        }),
      );
    });
  });

  /* ─── hasAttachment ───────────────────────────────────────── */

  describe('hasAttachment()', () => {
    it('should return true when attachment exists', async () => {
      mockPrisma.attachment.count.mockResolvedValue(1);

      const result = await attachmentService.hasAttachment('CLIENT', MOCK_CLIENT_ID, 'RODO');

      expect(result).toBe(true);
    });

    it('should return false when no attachment', async () => {
      mockPrisma.attachment.count.mockResolvedValue(0);

      const result = await attachmentService.hasAttachment('CLIENT', MOCK_CLIENT_ID, 'RODO');

      expect(result).toBe(false);
    });

    it('should exclude archived attachments', async () => {
      mockPrisma.attachment.count.mockResolvedValue(0);

      await attachmentService.hasAttachment('CLIENT', MOCK_CLIENT_ID, 'RODO');

      expect(mockPrisma.attachment.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ isArchived: false }),
      });
    });
  });

  /* ─── countByCategory ─────────────────────────────────────── */

  describe('countByCategory()', () => {
    it('should return counts grouped by category', async () => {
      mockPrisma.attachment.groupBy.mockResolvedValue([
        { category: 'RODO', _count: { id: 2 } },
        { category: 'CONTRACT', _count: { id: 1 } },
      ]);

      const result = await attachmentService.countByCategory('CLIENT', MOCK_CLIENT_ID);

      expect(result).toEqual({ RODO: 2, CONTRACT: 1 });
    });

    it('should return empty object when no attachments', async () => {
      mockPrisma.attachment.groupBy.mockResolvedValue([]);

      const result = await attachmentService.countByCategory('CLIENT', MOCK_CLIENT_ID);

      expect(result).toEqual({});
    });
  });
});
