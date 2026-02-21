/**
 * Attachment Service — Unit Tests
 * 37 test cases covering all service methods
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
}));
jest.mock('../constants/attachmentCategories', () => ({
    ENTITY_TYPES: ['CLIENT', 'RESERVATION', 'DEPOSIT'],
    STORAGE_DIRS: {
        CLIENT: 'clients',
        RESERVATION: 'reservations',
        DEPOSIT: 'deposits',
    },
    isValidCategory: jest.fn((entityType, category) => {
        const valid = {
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
const mockFile = (overrides = {}) => ({
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
const mockRecord = (overrides = {}) => ({
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
    // Reset fs.existsSync to default (file exists)
    fs.existsSync.mockReturnValue(true);
    // Default: all entities exist
    mockPrisma.client.findUnique.mockResolvedValue({ id: MOCK_CLIENT_ID });
    mockPrisma.reservation.findUnique.mockResolvedValue({
        id: MOCK_RESERVATION_ID,
        clientId: MOCK_CLIENT_ID,
    });
    mockPrisma.deposit.findUnique.mockResolvedValue({
        id: MOCK_DEPOSIT_ID,
        reservation: { clientId: MOCK_CLIENT_ID },
    });
});
/* ═══════════════════════════════════════════════════════════════
 *  TESTS
 * ═══════════════════════════════════════════════════════════════ */
describe('AttachmentService', () => {
    /* ─── createAttachment ────────────────────────────────────── */
    describe('createAttachment()', () => {
        it('should create attachment for CLIENT entity', async () => {
            mockPrisma.attachment.create.mockResolvedValue(mockRecord());
            const result = await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' }, mockFile(), MOCK_USER_ID);
            expect(result.entityType).toBe('CLIENT');
            expect(result.entityId).toBe(MOCK_CLIENT_ID);
            expect(mockPrisma.attachment.create).toHaveBeenCalledTimes(1);
            expect(fs.renameSync).toHaveBeenCalled();
        });
        it('should store file in correct entity subdirectory', async () => {
            mockPrisma.attachment.create.mockResolvedValue(mockRecord());
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' }, mockFile(), MOCK_USER_ID);
            const createCall = mockPrisma.attachment.create.mock.calls[0][0];
            expect(createCall.data.storagePath).toMatch(/^clients\//);
        });
        it('should reject invalid entityType', async () => {
            await expect(attachmentService.createAttachment({ entityType: 'INVALID', entityId: 'x', category: 'OTHER' }, mockFile(), MOCK_USER_ID)).rejects.toThrow(/entityType/i);
        });
        it('should reject invalid category for entity type', async () => {
            await expect(attachmentService.createAttachment({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'PAYMENT_CONFIRMATION' }, mockFile(), MOCK_USER_ID)).rejects.toThrow(/kategori/i);
        });
        it('should reject when entity does not exist', async () => {
            mockPrisma.client.findUnique.mockResolvedValue(null);
            await expect(attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'nonexistent', category: 'RODO' }, mockFile(), MOCK_USER_ID)).rejects.toThrow();
        });
        it('should redirect RODO from RESERVATION to CLIENT', async () => {
            mockPrisma.attachment.create.mockResolvedValue(mockRecord({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID }));
            const result = await attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'RODO' }, mockFile(), MOCK_USER_ID);
            expect(result.entityType).toBe('CLIENT');
            expect(result.entityId).toBe(MOCK_CLIENT_ID);
            const createCall = mockPrisma.attachment.create.mock.calls[0][0];
            expect(createCall.data.entityType).toBe('CLIENT');
            expect(createCall.data.entityId).toBe(MOCK_CLIENT_ID);
        });
        it('should redirect RODO from DEPOSIT to CLIENT', async () => {
            mockPrisma.attachment.create.mockResolvedValue(mockRecord({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID }));
            await attachmentService.createAttachment({ entityType: 'DEPOSIT', entityId: MOCK_DEPOSIT_ID, category: 'RODO' }, mockFile(), MOCK_USER_ID);
            const createCall = mockPrisma.attachment.create.mock.calls[0][0];
            expect(createCall.data.entityType).toBe('CLIENT');
            expect(createCall.data.entityId).toBe(MOCK_CLIENT_ID);
        });
        it('should NOT redirect non-RODO categories', async () => {
            mockPrisma.attachment.create.mockResolvedValue(mockRecord({ entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'CONTRACT' }));
            await attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'CONTRACT' }, mockFile(), MOCK_USER_ID);
            const createCall = mockPrisma.attachment.create.mock.calls[0][0];
            expect(createCall.data.entityType).toBe('RESERVATION');
            expect(createCall.data.entityId).toBe(MOCK_RESERVATION_ID);
        });
        it('should throw when RODO redirect cannot resolve clientId', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue({
                id: MOCK_RESERVATION_ID,
                clientId: null,
            });
            await expect(attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: MOCK_RESERVATION_ID, category: 'RODO' }, mockFile(), MOCK_USER_ID)).rejects.toThrow(/klient/i);
        });
        it('should create destination directory if it does not exist', async () => {
            fs.existsSync.mockReturnValueOnce(false);
            mockPrisma.attachment.create.mockResolvedValue(mockRecord());
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: MOCK_CLIENT_ID, category: 'RODO' }, mockFile(), MOCK_USER_ID);
            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('clients'), { recursive: true });
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
            expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    entityType: 'CLIENT',
                    entityId: MOCK_CLIENT_ID,
                    isArchived: false,
                }),
            }));
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
                .mockResolvedValueOnce([ownAtt]) // getAttachments()
                .mockResolvedValueOnce([clientRodo]); // client RODO query
            const result = await attachmentService.getAttachmentsWithClientRodo('RESERVATION', MOCK_RESERVATION_ID);
            expect(result).toHaveLength(2);
            // Client RODO comes first and has _fromClient flag
            expect(result[0]).toHaveProperty('_fromClient', true);
            expect(result[0].category).toBe('RODO');
            // Own attachment second
            expect(result[1].category).toBe('CONTRACT');
        });
        it('should NOT cross-reference for CLIENT entityType', async () => {
            mockPrisma.attachment.findMany.mockResolvedValue([mockRecord()]);
            const result = await attachmentService.getAttachmentsWithClientRodo('CLIENT', MOCK_CLIENT_ID);
            expect(result).toHaveLength(1);
            // Only one findMany call (no client RODO cross-reference)
            expect(mockPrisma.attachment.findMany).toHaveBeenCalledTimes(1);
        });
        it('should return only own if clientId cannot be resolved', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue(null);
            mockPrisma.attachment.findMany.mockResolvedValueOnce([]);
            const result = await attachmentService.getAttachmentsWithClientRodo('RESERVATION', 'orphan-res');
            expect(result).toEqual([]);
            // Should not attempt second findMany for client RODO
            expect(mockPrisma.attachment.findMany).toHaveBeenCalledTimes(1);
        });
    });
    /* ─── updateAttachment ────────────────────────────────────── */
    describe('updateAttachment()', () => {
        it('should update label and description', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
            mockPrisma.attachment.update.mockResolvedValue(mockRecord({ label: 'Nowa etykieta', description: 'Opis' }));
            const result = await attachmentService.updateAttachment(MOCK_ATTACHMENT_ID, {
                label: 'Nowa etykieta',
                description: 'Opis',
            });
            expect(result.label).toBe('Nowa etykieta');
            expect(result.description).toBe('Opis');
            expect(mockPrisma.attachment.update).toHaveBeenCalledTimes(1);
        });
        it('should reject invalid category change', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord({ entityType: 'CLIENT' }));
            await expect(attachmentService.updateAttachment(MOCK_ATTACHMENT_ID, {
                category: 'PAYMENT_CONFIRMATION',
            })).rejects.toThrow(/kategori/i);
        });
        it('should throw when attachment not found', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(null);
            await expect(attachmentService.updateAttachment('nonexistent', { label: 'x' })).rejects.toThrow();
        });
    });
    /* ─── deleteAttachment (soft) ─────────────────────────────── */
    describe('deleteAttachment()', () => {
        it('should soft-delete by setting isArchived=true', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
            mockPrisma.attachment.update.mockResolvedValue(mockRecord({ isArchived: true }));
            const result = await attachmentService.deleteAttachment(MOCK_ATTACHMENT_ID);
            expect(result.isArchived).toBe(true);
            expect(mockPrisma.attachment.update).toHaveBeenCalledWith({
                where: { id: MOCK_ATTACHMENT_ID },
                data: { isArchived: true },
            });
        });
        it('should throw when attachment not found', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(null);
            await expect(attachmentService.deleteAttachment('nonexistent')).rejects.toThrow();
        });
    });
    /* ─── hardDeleteAttachment ────────────────────────────────── */
    describe('hardDeleteAttachment()', () => {
        it('should delete file from disk and DB record', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
            mockPrisma.attachment.delete.mockResolvedValue(mockRecord());
            await attachmentService.hardDeleteAttachment(MOCK_ATTACHMENT_ID);
            expect(fs.unlinkSync).toHaveBeenCalled();
            expect(mockPrisma.attachment.delete).toHaveBeenCalledWith({
                where: { id: MOCK_ATTACHMENT_ID },
            });
        });
        it('should skip file deletion if file not on disk', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
            mockPrisma.attachment.delete.mockResolvedValue(mockRecord());
            fs.existsSync.mockReturnValue(false);
            await attachmentService.hardDeleteAttachment(MOCK_ATTACHMENT_ID);
            expect(fs.unlinkSync).not.toHaveBeenCalled();
            expect(mockPrisma.attachment.delete).toHaveBeenCalled();
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
            expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    entityType: 'RESERVATION',
                    category: 'CONTRACT',
                    isArchived: false,
                }),
            }));
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
    /* ─── getFilePath ─────────────────────────────────────────── */
    describe('getFilePath()', () => {
        it('should return file path when file exists on disk', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
            fs.existsSync.mockReturnValue(true);
            const { filePath, attachment } = await attachmentService.getFilePath(MOCK_ATTACHMENT_ID);
            expect(filePath).toContain('clients/abc123-test.pdf');
            expect(attachment.id).toBe(MOCK_ATTACHMENT_ID);
        });
        it('should throw when file not found on disk', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockRecord());
            fs.existsSync.mockReturnValue(false);
            await expect(attachmentService.getFilePath(MOCK_ATTACHMENT_ID)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=attachment.service.test.js.map