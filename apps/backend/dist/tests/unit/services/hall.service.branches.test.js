/**
 * HallService — Branch Coverage
 * createHall: isWholeVenue check, description/amenities/images/isActive/isWholeVenue fallbacks
 * updateHall: isWholeVenue protections (deactivate, rename), conditional fields, audit skip
 * toggleActive: isWholeVenue protection, Aktywowano/Dezaktywowano ternary
 * deleteHall: isWholeVenue protection
 * getHalls: filters (isActive, search, both, none)
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        hall: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));
jest.mock('../../../utils/audit-logger', () => ({
    logChange: jest.fn().mockResolvedValue(undefined),
    diffObjects: jest.fn(),
}));
import { HallService } from '../../../services/hall.service';
import { prisma } from '../../../lib/prisma';
import { diffObjects } from '../../../utils/audit-logger';
const db = prisma;
const mockDiff = diffObjects;
const hallService = new HallService();
const makeHall = (o = {}) => ({
    id: 'h-1', name: 'Sala A', capacity: 100,
    description: 'Opis', amenities: ['WiFi'], images: ['img.jpg'],
    isActive: true, isWholeVenue: false,
    createdAt: new Date(), updatedAt: new Date(),
    ...o,
});
beforeEach(() => jest.resetAllMocks());
describe('HallService — branches', () => {
    // ═══ getHalls ═══
    describe('getHalls()', () => {
        it('no filters', async () => {
            db.hall.findMany.mockResolvedValue([]);
            await hallService.getHalls();
            expect(db.hall.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
        });
        it('isActive filter', async () => {
            db.hall.findMany.mockResolvedValue([]);
            await hallService.getHalls({ isActive: false });
            const w = db.hall.findMany.mock.calls[0][0].where;
            expect(w.isActive).toBe(false);
        });
        it('search filter', async () => {
            db.hall.findMany.mockResolvedValue([]);
            await hallService.getHalls({ search: 'Sala' });
            const w = db.hall.findMany.mock.calls[0][0].where;
            expect(w.OR).toHaveLength(2);
        });
        it('isActive=true (not undefined)', async () => {
            db.hall.findMany.mockResolvedValue([]);
            await hallService.getHalls({ isActive: true });
            const w = db.hall.findMany.mock.calls[0][0].where;
            expect(w.isActive).toBe(true);
        });
    });
    // ═══ createHall ═══
    describe('createHall()', () => {
        it('should throw when isWholeVenue already exists', async () => {
            db.hall.findFirst.mockResolvedValue({ id: 'existing' });
            await expect(hallService.createHall({ name: 'X', capacity: 10, isWholeVenue: true }, 'u-1'))
                .rejects.toThrow('Ca\u0142y Obiekt');
        });
        it('should allow isWholeVenue when none exists', async () => {
            db.hall.findFirst.mockResolvedValue(null);
            db.hall.create.mockResolvedValue(makeHall({ isWholeVenue: true }));
            await hallService.createHall({ name: 'CO', capacity: 200, isWholeVenue: true }, 'u-1');
            expect(db.hall.create).toHaveBeenCalled();
        });
        it('should skip isWholeVenue check when false', async () => {
            db.hall.create.mockResolvedValue(makeHall());
            await hallService.createHall({ name: 'Sala B', capacity: 50 }, 'u-1');
            expect(db.hall.findFirst).not.toHaveBeenCalled();
        });
        it('should default description to null', async () => {
            db.hall.create.mockResolvedValue(makeHall());
            await hallService.createHall({ name: 'X', capacity: 10 }, 'u-1');
            expect(db.hall.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description: null }) }));
        });
        it('should default amenities to []', async () => {
            db.hall.create.mockResolvedValue(makeHall());
            await hallService.createHall({ name: 'X', capacity: 10 }, 'u-1');
            expect(db.hall.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amenities: [] }) }));
        });
        it('should default images to []', async () => {
            db.hall.create.mockResolvedValue(makeHall());
            await hallService.createHall({ name: 'X', capacity: 10 }, 'u-1');
            expect(db.hall.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ images: [] }) }));
        });
        it('should default isActive to true when undefined', async () => {
            db.hall.create.mockResolvedValue(makeHall());
            await hallService.createHall({ name: 'X', capacity: 10 }, 'u-1');
            expect(db.hall.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: true }) }));
        });
        it('should use explicit isActive=false', async () => {
            db.hall.create.mockResolvedValue(makeHall({ isActive: false }));
            await hallService.createHall({ name: 'X', capacity: 10, isActive: false }, 'u-1');
            expect(db.hall.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }));
        });
        it('should default isWholeVenue to false', async () => {
            db.hall.create.mockResolvedValue(makeHall());
            await hallService.createHall({ name: 'X', capacity: 10 }, 'u-1');
            expect(db.hall.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isWholeVenue: false }) }));
        });
        it('should use provided description/amenities/images', async () => {
            db.hall.create.mockResolvedValue(makeHall());
            await hallService.createHall({
                name: 'X', capacity: 10,
                description: 'Desc', amenities: ['WiFi'], images: ['img.jpg'],
            }, 'u-1');
            expect(db.hall.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ description: 'Desc', amenities: ['WiFi'], images: ['img.jpg'] }),
            }));
        });
    });
    // ═══ updateHall ═══
    describe('updateHall()', () => {
        it('should throw when not found', async () => {
            db.hall.findUnique.mockResolvedValue(null);
            await expect(hallService.updateHall('bad', { name: 'X' }, 'u-1')).rejects.toThrow('not found');
        });
        it('should throw when deactivating isWholeVenue', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isWholeVenue: true }));
            await expect(hallService.updateHall('h-1', { isActive: false }, 'u-1'))
                .rejects.toThrow('dezaktywowa\u0107');
        });
        it('should throw when renaming isWholeVenue', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isWholeVenue: true, name: 'Ca\u0142y Obiekt' }));
            await expect(hallService.updateHall('h-1', { name: 'New Name' }, 'u-1'))
                .rejects.toThrow('zmieni\u0107 nazwy');
        });
        it('should allow same name for isWholeVenue', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isWholeVenue: true, name: 'Ca\u0142y Obiekt' }));
            db.hall.update.mockResolvedValue(makeHall({ isWholeVenue: true }));
            mockDiff.mockReturnValue({});
            await hallService.updateHall('h-1', { name: 'Ca\u0142y Obiekt' }, 'u-1');
        });
        it('should allow isActive=true for isWholeVenue', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isWholeVenue: true }));
            db.hall.update.mockResolvedValue(makeHall({ isWholeVenue: true }));
            mockDiff.mockReturnValue({});
            await hallService.updateHall('h-1', { isActive: true }, 'u-1');
        });
        it('should update only name', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall({ name: 'New' }));
            mockDiff.mockReturnValue({ name: { old: 'Sala A', new: 'New' } });
            await hallService.updateHall('h-1', { name: 'New' }, 'u-1');
            expect(db.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'New' } }));
        });
        it('should update only capacity', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall());
            mockDiff.mockReturnValue({});
            await hallService.updateHall('h-1', { capacity: 200 }, 'u-1');
            expect(db.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { capacity: 200 } }));
        });
        it('should update only description', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall());
            mockDiff.mockReturnValue({});
            await hallService.updateHall('h-1', { description: 'Nowy' }, 'u-1');
            expect(db.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { description: 'Nowy' } }));
        });
        it('should update only amenities', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall());
            mockDiff.mockReturnValue({});
            await hallService.updateHall('h-1', { amenities: ['AC'] }, 'u-1');
            expect(db.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { amenities: ['AC'] } }));
        });
        it('should update only images', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall());
            mockDiff.mockReturnValue({});
            await hallService.updateHall('h-1', { images: ['new.jpg'] }, 'u-1');
            expect(db.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { images: ['new.jpg'] } }));
        });
        it('should update only isActive', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall({ isActive: false }));
            mockDiff.mockReturnValue({ isActive: { old: true, new: false } });
            await hallService.updateHall('h-1', { isActive: false }, 'u-1');
            expect(db.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
        });
        it('should skip audit when no changes', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall());
            mockDiff.mockReturnValue({});
            await hallService.updateHall('h-1', { name: 'Sala A' }, 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).not.toHaveBeenCalled();
        });
    });
    // ═══ toggleActive ═══
    describe('toggleActive()', () => {
        it('should throw when not found', async () => {
            db.hall.findUnique.mockResolvedValue(null);
            await expect(hallService.toggleActive('bad', 'u-1')).rejects.toThrow('not found');
        });
        it('should throw when isWholeVenue', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isWholeVenue: true }));
            await expect(hallService.toggleActive('h-1', 'u-1')).rejects.toThrow('dezaktywowa\u0107');
        });
        it('should deactivate (Dezaktywowano)', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isActive: true }));
            db.hall.update.mockResolvedValue(makeHall({ isActive: false }));
            await hallService.toggleActive('h-1', 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({ description: expect.stringContaining('Dezaktywowano') }),
            }));
        });
        it('should activate (Aktywowano)', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isActive: false }));
            db.hall.update.mockResolvedValue(makeHall({ isActive: true }));
            await hallService.toggleActive('h-1', 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({ description: expect.stringContaining('Aktywowano') }),
            }));
        });
    });
    // ═══ deleteHall ═══
    describe('deleteHall()', () => {
        it('should throw when not found', async () => {
            db.hall.findUnique.mockResolvedValue(null);
            await expect(hallService.deleteHall('bad', 'u-1')).rejects.toThrow('not found');
        });
        it('should throw when isWholeVenue', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall({ isWholeVenue: true }));
            await expect(hallService.deleteHall('h-1', 'u-1')).rejects.toThrow('usun\u0105\u0107');
        });
        it('should soft-delete normally', async () => {
            db.hall.findUnique.mockResolvedValue(makeHall());
            db.hall.update.mockResolvedValue(makeHall({ isActive: false }));
            await hallService.deleteHall('h-1', 'u-1');
            expect(db.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
        });
    });
    // ═══ getHallById, getWholeVenueHall ═══
    describe('getHallById()', () => {
        it('should throw when not found', async () => {
            db.hall.findUnique.mockResolvedValue(null);
            await expect(hallService.getHallById('bad')).rejects.toThrow('not found');
        });
    });
    describe('getWholeVenueHall()', () => {
        it('should return null when not found', async () => {
            db.hall.findFirst.mockResolvedValue(null);
            const result = await hallService.getWholeVenueHall();
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=hall.service.branches.test.js.map