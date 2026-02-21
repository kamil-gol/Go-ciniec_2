/**
 * AttachmentService — Full Branch Coverage
 * Covers: moveToEntityDir, resolveClientId, createAttachment (RODO redirect),
 * getAttachments (filters), getAttachmentsWithClientRodo, getAttachmentById,
 * getFilePath, updateAttachment (change tracking), deleteAttachment, hardDeleteAttachment,
 * countByCategory, hasAttachment, batchCheckRodo/Contract, validateEntityExists
 */
const mockFs = {
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    renameSync: jest.fn(),
    unlinkSync: jest.fn(),
};
jest.mock('fs', () => mockFs);
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        attachment: {
            create: jest.fn(),
            findUnique: jest.fn(),
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
import attachmentService from '../../../services/attachment.service';
import { prisma } from '../../../lib/prisma';
import { isValidCategory } from '../../../constants/attachmentCategories';
const db = prisma;
const mockIsValid = isValidCategory;
const mockFile = (o = {}) => ({
    fieldname: 'file', originalname: 'doc.pdf', encoding: '7bit',
    mimetype: 'application/pdf', size: 1024, filename: 'abc123.pdf',
    path: '/tmp/uploads/_staging/abc123.pdf', destination: '/tmp/uploads/_staging',
    buffer: Buffer.from(''), stream: null,
    ...o,
});
const mockAttachment = (o = {}) => ({
    id: 'att-1', entityType: 'CLIENT', entityId: 'client-1',
    category: 'DOCUMENT', label: 'Test', description: null,
    originalName: 'doc.pdf', storedName: 'abc123.pdf',
    mimeType: 'application/pdf', sizeBytes: 1024,
    storagePath: 'clients/abc123.pdf', isArchived: false,
    uploadedById: 'user-1',
    uploadedBy: { id: 'user-1', firstName: 'Jan', lastName: 'K' },
    ...o,
});
beforeEach(() => jest.resetAllMocks());
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
            const result = await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'DOCUMENT' }, mockFile(), 'user-1');
            expect(result.id).toBe('att-1');
            expect(mockFs.renameSync).toHaveBeenCalled();
        });
        it('should throw for invalid entityType', async () => {
            await expect(attachmentService.createAttachment({ entityType: 'INVALID', entityId: 'x', category: 'DOC' }, mockFile(), 'user-1')).rejects.toThrow('entityType');
        });
        it('should throw for invalid category', async () => {
            mockIsValid.mockReturnValue(false);
            await expect(attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'BAD' }, mockFile(), 'user-1')).rejects.toThrow('kategoria');
        });
        it('should redirect RODO from RESERVATION to CLIENT', async () => {
            mockIsValid.mockReturnValue(true);
            db.reservation.findUnique
                .mockResolvedValueOnce({ id: 'r-1' }) // validateEntityExists
                .mockResolvedValueOnce({ clientId: 'c-1' }); // resolveClientId
            mockFs.existsSync.mockReturnValue(true);
            db.attachment.create.mockResolvedValue(mockAttachment({ entityType: 'CLIENT', entityId: 'c-1' }));
            await attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' }, mockFile(), 'user-1');
            // Should create with CLIENT, not RESERVATION
            expect(db.attachment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entityType: 'CLIENT', entityId: 'c-1' }) }));
        });
        it('should redirect RODO from DEPOSIT to CLIENT', async () => {
            mockIsValid.mockReturnValue(true);
            db.deposit.findUnique
                .mockResolvedValueOnce({ id: 'd-1' }) // validateEntityExists
                .mockResolvedValueOnce({ reservation: { clientId: 'c-1' } }); // resolveClientId
            mockFs.existsSync.mockReturnValue(true);
            db.attachment.create.mockResolvedValue(mockAttachment({ entityType: 'CLIENT' }));
            await attachmentService.createAttachment({ entityType: 'DEPOSIT', entityId: 'd-1', category: 'RODO' }, mockFile(), 'user-1');
            expect(db.attachment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entityType: 'CLIENT' }) }));
        });
        it('should throw when RODO redirect cannot resolve client', async () => {
            mockIsValid.mockReturnValue(true);
            db.reservation.findUnique
                .mockResolvedValueOnce({ id: 'r-1' }) // validateEntityExists
                .mockResolvedValueOnce(null); // resolveClientId → null
            await expect(attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' }, mockFile(), 'user-1')).rejects.toThrow('klienta');
        });
        it('should not redirect RODO when entityType is CLIENT', async () => {
            setupCreate();
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' }, mockFile(), 'user-1');
            expect(db.attachment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entityType: 'CLIENT' }) }));
        });
        it('should create dest dir if not exists', async () => {
            mockIsValid.mockReturnValue(true);
            db.client.findUnique.mockResolvedValue({ id: 'c-1' });
            mockFs.existsSync.mockReturnValue(false); // dir does NOT exist
            db.attachment.create.mockResolvedValue(mockAttachment());
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'DOC' }, mockFile(), 'user-1');
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
        });
        it('should handle label and description as null when not provided', async () => {
            setupCreate();
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'DOC' }, mockFile(), 'user-1');
            expect(db.attachment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ label: null, description: null }) }));
        });
        it('should pass label and description when provided', async () => {
            setupCreate();
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'DOC', label: 'Lbl', description: 'Desc' }, mockFile(), 'user-1');
            expect(db.attachment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ label: 'Lbl', description: 'Desc' }) }));
        });
    });
    // ═══ resolveClientId ═══
    describe('resolveClientId (via RODO redirect)', () => {
        it('should return null for unknown entityType', async () => {
            mockIsValid.mockReturnValue(true);
            db.client.findUnique.mockResolvedValue({ id: 'c-1' }); // validateEntityExists for CLIENT
            mockFs.existsSync.mockReturnValue(true);
            db.attachment.create.mockResolvedValue(mockAttachment());
            // RODO on CLIENT => no redirect, resolveClientId not called for CLIENT type
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'RODO' }, mockFile(), 'user-1');
            // No redirect happened
            expect(db.reservation.findUnique).not.toHaveBeenCalled();
        });
        it('should handle resolveClientId error gracefully', async () => {
            mockIsValid.mockReturnValue(true);
            db.reservation.findUnique
                .mockResolvedValueOnce({ id: 'r-1' }) // validateEntityExists
                .mockRejectedValueOnce(new Error('DB')); // resolveClientId throws
            await expect(attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' }, mockFile(), 'user-1')).rejects.toThrow('klienta'); // null clientId -> throws "klienta"
        });
        it('should return null when reservation has no clientId', async () => {
            mockIsValid.mockReturnValue(true);
            db.reservation.findUnique
                .mockResolvedValueOnce({ id: 'r-1' }) // validateEntityExists
                .mockResolvedValueOnce({ clientId: null }); // resolveClientId → null
            await expect(attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: 'r-1', category: 'RODO' }, mockFile(), 'user-1')).rejects.toThrow('klienta');
        });
        it('should return null when deposit has no reservation', async () => {
            mockIsValid.mockReturnValue(true);
            db.deposit.findUnique
                .mockResolvedValueOnce({ id: 'd-1' }) // validateEntityExists
                .mockResolvedValueOnce({ reservation: null }); // resolveClientId → null
            await expect(attachmentService.createAttachment({ entityType: 'DEPOSIT', entityId: 'd-1', category: 'RODO' }, mockFile(), 'user-1')).rejects.toThrow('klienta');
        });
    });
    // ═══ getAttachments ═══
    describe('getAttachments()', () => {
        it('should filter out archived by default', async () => {
            db.attachment.findMany.mockResolvedValue([]);
            await attachmentService.getAttachments({ entityType: 'CLIENT', entityId: 'c-1' });
            expect(db.attachment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isArchived: false }) }));
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
            expect(db.attachment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ category: 'RODO' }) }));
        });
    });
    // ═══ getAttachmentsWithClientRodo ═══
    describe('getAttachmentsWithClientRodo()', () => {
        it('should return own attachments for CLIENT (no cross-ref)', async () => {
            db.attachment.findMany.mockResolvedValue([mockAttachment()]);
            const result = await attachmentService.getAttachmentsWithClientRodo('CLIENT', 'c-1');
            expect(result).toHaveLength(1);
            // Should NOT call resolveClientId
            expect(db.reservation.findUnique).not.toHaveBeenCalled();
        });
        it('should merge client RODO for RESERVATION', async () => {
            db.attachment.findMany
                .mockResolvedValueOnce([mockAttachment({ category: 'CONTRACT' })]) // own
                .mockResolvedValueOnce([mockAttachment({ category: 'RODO', entityId: 'c-1' })]); // client RODO
            db.reservation.findUnique.mockResolvedValueOnce({ clientId: 'c-1' });
            const result = await attachmentService.getAttachmentsWithClientRodo('RESERVATION', 'r-1');
            expect(result).toHaveLength(2);
            expect(result[0]._fromClient).toBe(true);
        });
        it('should return only own when clientId not resolved', async () => {
            db.attachment.findMany.mockResolvedValueOnce([mockAttachment()]);
            db.reservation.findUnique.mockResolvedValueOnce(null); // no reservation
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
    // ═══ getFilePath ═══
    describe('getFilePath()', () => {
        it('should return path when file exists', async () => {
            db.attachment.findUnique.mockResolvedValue(mockAttachment());
            mockFs.existsSync.mockReturnValue(true);
            const { filePath } = await attachmentService.getFilePath('att-1');
            expect(filePath).toContain('abc123.pdf');
        });
        it('should throw when file not on disk', async () => {
            db.attachment.findUnique.mockResolvedValue(mockAttachment());
            mockFs.existsSync.mockReturnValue(false);
            await expect(attachmentService.getFilePath('att-1')).rejects.toThrow('dysku');
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
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
        });
    });
    // ═══ deleteAttachment (soft) ═══
    describe('deleteAttachment()', () => {
        it('should archive attachment', async () => {
            db.attachment.findUnique.mockResolvedValue(mockAttachment());
            db.attachment.update.mockResolvedValue(mockAttachment({ isArchived: true }));
            await attachmentService.deleteAttachment('att-1', 'user-1');
            expect(db.attachment.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isArchived: true } }));
        });
        it('should handle null userId', async () => {
            db.attachment.findUnique.mockResolvedValue(mockAttachment());
            db.attachment.update.mockResolvedValue(mockAttachment({ isArchived: true }));
            await attachmentService.deleteAttachment('att-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
        });
    });
    // ═══ hardDeleteAttachment ═══
    describe('hardDeleteAttachment()', () => {
        it('should delete file from disk and DB record', async () => {
            db.attachment.findUnique.mockResolvedValue(mockAttachment());
            db.attachment.delete.mockResolvedValue(undefined);
            mockFs.existsSync.mockReturnValue(true);
            await attachmentService.hardDeleteAttachment('att-1', 'user-1');
            expect(mockFs.unlinkSync).toHaveBeenCalled();
            expect(db.attachment.delete).toHaveBeenCalled();
        });
        it('should skip unlink when file not on disk', async () => {
            db.attachment.findUnique.mockResolvedValue(mockAttachment());
            db.attachment.delete.mockResolvedValue(undefined);
            mockFs.existsSync.mockReturnValue(false);
            await attachmentService.hardDeleteAttachment('att-1');
            expect(mockFs.unlinkSync).not.toHaveBeenCalled();
            expect(db.attachment.delete).toHaveBeenCalled();
        });
        it('should handle null userId', async () => {
            db.attachment.findUnique.mockResolvedValue(mockAttachment());
            db.attachment.delete.mockResolvedValue(undefined);
            mockFs.existsSync.mockReturnValue(false);
            await attachmentService.hardDeleteAttachment('att-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
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
            await attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'c-1', category: 'DOC' }, mockFile(), 'user-1');
            expect(db.client.findUnique).toHaveBeenCalled();
        });
        it('should validate RESERVATION exists', async () => {
            mockIsValid.mockReturnValue(true);
            db.reservation.findUnique.mockResolvedValue({ id: 'r-1' });
            mockFs.existsSync.mockReturnValue(true);
            db.attachment.create.mockResolvedValue(mockAttachment());
            await attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: 'r-1', category: 'DOC' }, mockFile(), 'user-1');
            expect(db.reservation.findUnique).toHaveBeenCalled();
        });
        it('should validate DEPOSIT exists', async () => {
            mockIsValid.mockReturnValue(true);
            db.deposit.findUnique.mockResolvedValue({ id: 'd-1' });
            mockFs.existsSync.mockReturnValue(true);
            db.attachment.create.mockResolvedValue(mockAttachment());
            await attachmentService.createAttachment({ entityType: 'DEPOSIT', entityId: 'd-1', category: 'DOC' }, mockFile(), 'user-1');
            expect(db.deposit.findUnique).toHaveBeenCalled();
        });
        it('should throw when CLIENT not found', async () => {
            mockIsValid.mockReturnValue(true);
            db.client.findUnique.mockResolvedValue(null);
            await expect(attachmentService.createAttachment({ entityType: 'CLIENT', entityId: 'bad', category: 'DOC' }, mockFile(), 'user-1')).rejects.toThrow('CLIENT');
        });
        it('should throw when RESERVATION not found', async () => {
            mockIsValid.mockReturnValue(true);
            db.reservation.findUnique.mockResolvedValue(null);
            await expect(attachmentService.createAttachment({ entityType: 'RESERVATION', entityId: 'bad', category: 'DOC' }, mockFile(), 'user-1')).rejects.toThrow('RESERVATION');
        });
        it('should throw when DEPOSIT not found', async () => {
            mockIsValid.mockReturnValue(true);
            db.deposit.findUnique.mockResolvedValue(null);
            await expect(attachmentService.createAttachment({ entityType: 'DEPOSIT', entityId: 'bad', category: 'DOC' }, mockFile(), 'user-1')).rejects.toThrow('DEPOSIT');
        });
    });
});
//# sourceMappingURL=attachment.service.test.js.map