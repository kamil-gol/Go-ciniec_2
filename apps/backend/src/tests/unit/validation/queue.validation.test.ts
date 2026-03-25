/**
 * queue.validation — Unit Tests
 */

import {
  addToQueueSchema,
  updateQueueReservationSchema,
  swapPositionsSchema,
  moveToPositionSchema,
  batchUpdatePositionsSchema,
  promoteReservationSchema,
} from '../../../validation/queue.validation';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('queue.validation', () => {
  // ─── addToQueueSchema ──────────────────────────────────────────

  describe('addToQueueSchema', () => {
    const validData = {
      clientId: validUUID,
      reservationQueueDate: '2026-06-15',
      guests: 50,
    };

    it('should accept valid input', () => {
      const result = addToQueueSchema.parse(validData);
      expect(result.clientId).toBe(validUUID);
      expect(result.guests).toBe(50);
    });

    it('should reject missing clientId', () => {
      expect(() => addToQueueSchema.parse({ reservationQueueDate: '2026-06-15', guests: 50 })).toThrow();
    });

    it('should reject invalid clientId', () => {
      expect(() => addToQueueSchema.parse({ ...validData, clientId: 'bad' })).toThrow();
    });

    it('should reject missing reservationQueueDate', () => {
      expect(() => addToQueueSchema.parse({ clientId: validUUID, guests: 50 })).toThrow();
    });

    it('should reject invalid date format', () => {
      expect(() => addToQueueSchema.parse({ ...validData, reservationQueueDate: 'not-a-date' })).toThrow();
    });

    it('should reject missing guests', () => {
      expect(() => addToQueueSchema.parse({ clientId: validUUID, reservationQueueDate: '2026-06-15' })).toThrow();
    });

    it('should reject guests < 1', () => {
      expect(() => addToQueueSchema.parse({ ...validData, guests: 0 })).toThrow();
    });

    it('should accept optional adults/children/toddlers', () => {
      const result = addToQueueSchema.parse({ ...validData, adults: 30, children: 15, toddlers: 5 });
      expect(result.adults).toBe(30);
      expect(result.children).toBe(15);
      expect(result.toddlers).toBe(5);
    });

    it('should reject negative adults', () => {
      expect(() => addToQueueSchema.parse({ ...validData, adults: -1 })).toThrow();
    });

    it('should accept optional notes', () => {
      const result = addToQueueSchema.parse({ ...validData, notes: 'Uwagi' });
      expect(result.notes).toBe('Uwagi');
    });

    it('should accept notes = null', () => {
      const result = addToQueueSchema.parse({ ...validData, notes: null });
      expect(result.notes).toBeNull();
    });

    it('should reject notes > 5000 chars', () => {
      expect(() => addToQueueSchema.parse({ ...validData, notes: 'X'.repeat(5001) })).toThrow();
    });
  });

  // ─── updateQueueReservationSchema ──────────────────────────────

  describe('updateQueueReservationSchema', () => {
    it('should accept partial update', () => {
      const result = updateQueueReservationSchema.parse({ guests: 80 });
      expect(result.guests).toBe(80);
    });

    it('should accept empty update', () => {
      const result = updateQueueReservationSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject guests < 1', () => {
      expect(() => updateQueueReservationSchema.parse({ guests: 0 })).toThrow();
    });

    it('should accept optional reservationQueueDate', () => {
      const result = updateQueueReservationSchema.parse({ reservationQueueDate: '2026-07-01' });
      expect(result.reservationQueueDate).toBe('2026-07-01');
    });

    it('should reject invalid reservationQueueDate', () => {
      expect(() => updateQueueReservationSchema.parse({ reservationQueueDate: 'bad' })).toThrow();
    });

    it('should accept nullable notes', () => {
      const result = updateQueueReservationSchema.parse({ notes: null });
      expect(result.notes).toBeNull();
    });
  });

  // ─── swapPositionsSchema ───────────────────────────────────────

  describe('swapPositionsSchema', () => {
    it('should accept valid swap', () => {
      const result = swapPositionsSchema.parse({
        reservationId1: validUUID,
        reservationId2: validUUID,
      });
      expect(result.reservationId1).toBe(validUUID);
    });

    it('should reject missing reservationId1', () => {
      expect(() => swapPositionsSchema.parse({ reservationId2: validUUID })).toThrow();
    });

    it('should reject missing reservationId2', () => {
      expect(() => swapPositionsSchema.parse({ reservationId1: validUUID })).toThrow();
    });

    it('should reject invalid UUID', () => {
      expect(() => swapPositionsSchema.parse({ reservationId1: 'bad', reservationId2: validUUID })).toThrow();
    });
  });

  // ─── moveToPositionSchema ──────────────────────────────────────

  describe('moveToPositionSchema', () => {
    it('should accept valid position', () => {
      const result = moveToPositionSchema.parse({ newPosition: 5 });
      expect(result.newPosition).toBe(5);
    });

    it('should reject position < 1', () => {
      expect(() => moveToPositionSchema.parse({ newPosition: 0 })).toThrow();
    });

    it('should reject missing newPosition', () => {
      expect(() => moveToPositionSchema.parse({})).toThrow();
    });

    it('should reject non-integer position', () => {
      expect(() => moveToPositionSchema.parse({ newPosition: 1.5 })).toThrow();
    });
  });

  // ─── batchUpdatePositionsSchema ────────────────────────────────

  describe('batchUpdatePositionsSchema', () => {
    it('should accept valid batch update', () => {
      const result = batchUpdatePositionsSchema.parse({
        updates: [
          { id: validUUID, position: 1 },
          { id: validUUID, position: 2 },
        ],
      });
      expect(result.updates).toHaveLength(2);
    });

    it('should reject empty updates array', () => {
      expect(() => batchUpdatePositionsSchema.parse({ updates: [] })).toThrow();
    });

    it('should reject missing updates', () => {
      expect(() => batchUpdatePositionsSchema.parse({})).toThrow();
    });

    it('should reject invalid id in update', () => {
      expect(() => batchUpdatePositionsSchema.parse({
        updates: [{ id: 'bad', position: 1 }],
      })).toThrow();
    });

    it('should reject position < 1', () => {
      expect(() => batchUpdatePositionsSchema.parse({
        updates: [{ id: validUUID, position: 0 }],
      })).toThrow();
    });
  });

  // ─── promoteReservationSchema ──────────────────────────────────

  describe('promoteReservationSchema', () => {
    const validData = {
      hallId: validUUID,
      eventTypeId: validUUID,
      startDateTime: '2026-06-15T14:00:00.000Z',
      endDateTime: '2026-06-16T02:00:00.000Z',
      adults: 50,
      pricePerAdult: 150,
      status: 'CONFIRMED' as const,
    };

    it('should accept valid promote data', () => {
      const result = promoteReservationSchema.parse(validData);
      expect(result.hallId).toBe(validUUID);
      expect(result.adults).toBe(50);
      expect(result.status).toBe('CONFIRMED');
    });

    it('should reject missing hallId', () => {
      const { hallId, ...rest } = validData;
      expect(() => promoteReservationSchema.parse(rest)).toThrow();
    });

    it('should reject invalid hallId', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, hallId: 'bad' })).toThrow();
    });

    it('should reject missing startDateTime', () => {
      const { startDateTime, ...rest } = validData;
      expect(() => promoteReservationSchema.parse(rest)).toThrow();
    });

    it('should reject invalid startDateTime format', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, startDateTime: 'not-iso' })).toThrow();
    });

    it('should reject adults < 1', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, adults: 0 })).toThrow();
    });

    it('should reject pricePerAdult <= 0', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, pricePerAdult: 0 })).toThrow();
      expect(() => promoteReservationSchema.parse({ ...validData, pricePerAdult: -10 })).toThrow();
    });

    it('should accept all valid statuses', () => {
      ['PENDING', 'CONFIRMED'].forEach((s) => {
        const result = promoteReservationSchema.parse({ ...validData, status: s });
        expect(result.status).toBe(s);
      });
    });

    it('should reject invalid status', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, status: 'CANCELLED' })).toThrow();
    });

    it('should accept optional children/toddlers', () => {
      const result = promoteReservationSchema.parse({ ...validData, children: 10, toddlers: 5 });
      expect(result.children).toBe(10);
      expect(result.toddlers).toBe(5);
    });

    it('should reject negative children', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, children: -1 })).toThrow();
    });

    it('should accept optional pricePerChild and pricePerToddler', () => {
      const result = promoteReservationSchema.parse({ ...validData, pricePerChild: 80, pricePerToddler: 0 });
      expect(result.pricePerChild).toBe(80);
      expect(result.pricePerToddler).toBe(0);
    });

    it('should reject negative pricePerChild', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, pricePerChild: -10 })).toThrow();
    });

    it('should accept optional notes', () => {
      const result = promoteReservationSchema.parse({ ...validData, notes: 'VIP event' });
      expect(result.notes).toBe('VIP event');
    });

    it('should reject notes > 5000 chars', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, notes: 'X'.repeat(5001) })).toThrow();
    });

    it('should accept optional birthdayAge', () => {
      const result = promoteReservationSchema.parse({ ...validData, birthdayAge: 30 });
      expect(result.birthdayAge).toBe(30);
    });

    it('should reject birthdayAge > 150', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, birthdayAge: 151 })).toThrow();
    });

    it('should accept optional customEventType', () => {
      const result = promoteReservationSchema.parse({ ...validData, customEventType: 'Bal' });
      expect(result.customEventType).toBe('Bal');
    });

    it('should reject customEventType > 255 chars', () => {
      expect(() => promoteReservationSchema.parse({ ...validData, customEventType: 'X'.repeat(256) })).toThrow();
    });
  });
});
