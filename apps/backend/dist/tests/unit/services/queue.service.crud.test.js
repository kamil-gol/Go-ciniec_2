/**
 * QueueService — Unit Tests: CRUD + Queries
 * Część 1/2 testów modułu Kolejka
 */
jest.mock('../../../lib/prisma', () => {
    const mock = {
        client: { findUnique: jest.fn() },
        hall: { findUnique: jest.fn() },
        eventType: { findUnique: jest.fn() },
        reservation: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            count: jest.fn(),
            aggregate: jest.fn(),
        },
        $executeRaw: jest.fn(),
        $queryRaw: jest.fn(),
        $transaction: jest.fn((fn) => fn(mock)),
    };
    return { prisma: mock, __esModule: true, default: mock };
});
jest.mock('../../../utils/audit-logger', () => ({
    logChange: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma;
const TEST_USER_ID = 'user-uuid-001';
const TEST_CLIENT = {
    id: 'client-uuid-001',
    firstName: 'Jan',
    lastName: 'Kowalski',
    phone: '+48123456789',
    email: 'jan@test.pl',
};
const FUTURE_DATE = '2026-09-15';
const CREATED_RESERVATION = {
    id: 'res-queue-001',
    clientId: TEST_CLIENT.id,
    status: 'RESERVED',
    reservationQueueDate: new Date('2026-09-15'),
    reservationQueuePosition: 1,
    queueOrderManual: false,
    guests: 50,
    adults: 50,
    children: 0,
    toddlers: 0,
    notes: null,
    createdAt: new Date(),
    client: TEST_CLIENT,
    createdBy: { id: TEST_USER_ID, firstName: 'Admin', lastName: 'Test' },
};
let service;
beforeEach(() => {
    jest.clearAllMocks();
    service = new QueueService();
    mockPrisma.client.findUnique.mockResolvedValue(TEST_CLIENT);
    mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
    mockPrisma.reservation.create.mockResolvedValue(CREATED_RESERVATION);
    mockPrisma.reservation.findUnique.mockResolvedValue(CREATED_RESERVATION);
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    mockPrisma.reservation.update.mockResolvedValue(CREATED_RESERVATION);
    mockPrisma.reservation.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.reservation.count.mockResolvedValue(0);
});
describe('QueueService', () => {
    // ══════════════════════════════════════════════════════════════
    // addToQueue
    // ══════════════════════════════════════════════════════════════
    describe('addToQueue()', () => {
        it('should create RESERVED reservation with correct position', async () => {
            mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 3 } });
            const result = await service.addToQueue({
                clientId: TEST_CLIENT.id,
                reservationQueueDate: FUTURE_DATE,
                guests: 50,
            }, TEST_USER_ID);
            expect(result).toBeDefined();
            expect(result.id).toBe('res-queue-001');
            expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(1);
            const createData = mockPrisma.reservation.create.mock.calls[0][0].data;
            expect(createData.status).toBe('RESERVED');
            expect(createData.reservationQueuePosition).toBe(4); // 3 + 1
            expect(createData.guests).toBe(50);
        });
        it('should throw when clientId is missing', async () => {
            await expect(service.addToQueue({
                reservationQueueDate: FUTURE_DATE,
                guests: 50,
            }, TEST_USER_ID)).rejects.toThrow('Client, queue date, and guests are required');
        });
        it('should throw when guests is 0 (falsy — caught by required check)', async () => {
            await expect(service.addToQueue({
                clientId: TEST_CLIENT.id,
                reservationQueueDate: FUTURE_DATE,
                guests: 0,
            }, TEST_USER_ID)).rejects.toThrow('Client, queue date, and guests are required');
        });
        it('should throw when guests < 1 (negative)', async () => {
            await expect(service.addToQueue({
                clientId: TEST_CLIENT.id,
                reservationQueueDate: FUTURE_DATE,
                guests: -1,
            }, TEST_USER_ID)).rejects.toThrow('Number of guests must be at least 1');
        });
        it('should throw when date is in the past', async () => {
            await expect(service.addToQueue({
                clientId: TEST_CLIENT.id,
                reservationQueueDate: '2020-01-01',
                guests: 50,
            }, TEST_USER_ID)).rejects.toThrow('Queue date cannot be in the past');
        });
        it('should throw when client not found', async () => {
            mockPrisma.client.findUnique.mockResolvedValue(null);
            await expect(service.addToQueue({
                clientId: 'nonexistent',
                reservationQueueDate: FUTURE_DATE,
                guests: 50,
            }, TEST_USER_ID)).rejects.toThrow('Client not found');
        });
        it('should throw on invalid date format', async () => {
            await expect(service.addToQueue({
                clientId: TEST_CLIENT.id,
                reservationQueueDate: 'not-a-date',
                guests: 50,
            }, TEST_USER_ID)).rejects.toThrow('Invalid queue date format');
        });
        it('should handle P2002 unique constraint error', async () => {
            const prismaError = new Error('Unique constraint failed');
            prismaError.code = 'P2002';
            Object.setPrototypeOf(prismaError, Error.prototype);
            mockPrisma.reservation.create.mockRejectedValue(prismaError);
            await expect(service.addToQueue({
                clientId: TEST_CLIENT.id,
                reservationQueueDate: FUTURE_DATE,
                guests: 50,
            }, TEST_USER_ID)).rejects.toThrow();
        });
    });
    // ══════════════════════════════════════════════════════════════
    // updateQueueReservation
    // ══════════════════════════════════════════════════════════════
    describe('updateQueueReservation()', () => {
        it('should update guests count', async () => {
            const result = await service.updateQueueReservation('res-queue-001', {
                guests: 60,
            }, TEST_USER_ID);
            expect(result).toBeDefined();
            expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(1);
            const updateData = mockPrisma.reservation.update.mock.calls[0][0].data;
            expect(updateData.guests).toBe(60);
        });
        it('should throw when reservation not found', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue(null);
            await expect(service.updateQueueReservation('nonexistent', {}, TEST_USER_ID))
                .rejects.toThrow('Reservation not found');
        });
        it('should throw when reservation is not RESERVED', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue({
                ...CREATED_RESERVATION,
                status: 'PENDING',
            });
            await expect(service.updateQueueReservation('res-queue-001', {}, TEST_USER_ID))
                .rejects.toThrow('Can only update RESERVED reservations');
        });
        it('should recalculate position when date changes', async () => {
            mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 5 } });
            await service.updateQueueReservation('res-queue-001', {
                reservationQueueDate: '2026-10-20', // different date
            }, TEST_USER_ID);
            const updateData = mockPrisma.reservation.update.mock.calls[0][0].data;
            expect(updateData.reservationQueuePosition).toBe(6); // 5 + 1 on new date
            expect(updateData.queueOrderManual).toBe(false);
            // Should also decrement positions on old date
            expect(mockPrisma.reservation.updateMany).toHaveBeenCalledTimes(1);
        });
        it('should throw when new date is in the past', async () => {
            await expect(service.updateQueueReservation('res-queue-001', {
                reservationQueueDate: '2020-01-01',
            }, TEST_USER_ID)).rejects.toThrow('Queue date cannot be in the past');
        });
    });
    // ══════════════════════════════════════════════════════════════
    // getQueueForDate
    // ══════════════════════════════════════════════════════════════
    describe('getQueueForDate()', () => {
        it('should return formatted queue items for a date', async () => {
            mockPrisma.reservation.findMany.mockResolvedValue([CREATED_RESERVATION]);
            const result = await service.getQueueForDate('2026-09-15');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('res-queue-001');
            expect(result[0].client.firstName).toBe('Jan');
            expect(result[0].position).toBe(1);
        });
        it('should throw on invalid date', async () => {
            await expect(service.getQueueForDate('not-a-date')).rejects.toThrow('Invalid date format');
        });
    });
    // ══════════════════════════════════════════════════════════════
    // getAllQueues
    // ══════════════════════════════════════════════════════════════
    describe('getAllQueues()', () => {
        it('should return all RESERVED reservations ordered by date and position', async () => {
            mockPrisma.reservation.findMany.mockResolvedValue([CREATED_RESERVATION]);
            const result = await service.getAllQueues();
            expect(result).toHaveLength(1);
            const call = mockPrisma.reservation.findMany.mock.calls[0][0];
            expect(call.where.status).toBe('RESERVED');
            expect(call.orderBy).toEqual([
                { reservationQueueDate: 'asc' },
                { reservationQueuePosition: 'asc' },
            ]);
        });
    });
    // ══════════════════════════════════════════════════════════════
    // getQueueStats
    // ══════════════════════════════════════════════════════════════
    describe('getQueueStats()', () => {
        it('should aggregate stats by date', async () => {
            mockPrisma.reservation.findMany.mockResolvedValue([
                { reservationQueueDate: new Date('2026-09-15'), guests: 50, queueOrderManual: false },
                { reservationQueueDate: new Date('2026-09-15'), guests: 30, queueOrderManual: true },
                { reservationQueueDate: new Date('2026-09-20'), guests: 40, queueOrderManual: false },
            ]);
            const result = await service.getQueueStats();
            expect(result.totalQueued).toBe(3);
            expect(result.manualOrderCount).toBe(1);
            expect(result.queuesByDate).toHaveLength(2); // 2 unique dates
            const sept15 = result.queuesByDate.find((q) => q.date === '2026-09-15');
            expect(sept15?.count).toBe(2);
            expect(sept15?.totalGuests).toBe(80); // 50 + 30
        });
        it('should return empty stats when no queued reservations', async () => {
            mockPrisma.reservation.findMany.mockResolvedValue([]);
            const result = await service.getQueueStats();
            expect(result.totalQueued).toBe(0);
            expect(result.queuesByDate).toHaveLength(0);
            expect(result.oldestQueueDate).toBeNull();
        });
    });
});
//# sourceMappingURL=queue.service.crud.test.js.map