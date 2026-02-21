import { calculateTotalGuests, calculateTotalPrice, calculateDuration, generateExtraHoursNote, validateConfirmationDeadline, validateCustomEventFields, detectReservationChanges, formatChangesSummary, } from '../../../utils/reservation.utils';
describe('reservation.utils', () => {
    // ─── calculateTotalGuests ───
    describe('calculateTotalGuests', () => {
        it('should sum adults + children + toddlers', () => {
            expect(calculateTotalGuests(10, 5, 3)).toBe(18);
        });
        it('should default toddlers to 0', () => {
            expect(calculateTotalGuests(10, 5)).toBe(15);
        });
        it('should handle all zeros', () => {
            expect(calculateTotalGuests(0, 0, 0)).toBe(0);
        });
    });
    // ─── calculateTotalPrice ───
    describe('calculateTotalPrice', () => {
        it('should calculate price correctly', () => {
            // 10 adults × 150 + 5 children × 80 + 2 toddlers × 30
            expect(calculateTotalPrice(10, 5, 150, 80, 2, 30)).toBe(1960);
        });
        it('should default toddler params to 0', () => {
            expect(calculateTotalPrice(10, 5, 150, 80)).toBe(1900);
        });
        it('should return 0 for no guests', () => {
            expect(calculateTotalPrice(0, 0, 150, 80, 0, 30)).toBe(0);
        });
        it('should handle free children pricing', () => {
            expect(calculateTotalPrice(10, 5, 100, 0)).toBe(1000);
        });
    });
    // ─── calculateDuration ───
    describe('calculateDuration', () => {
        it('should return duration in hours', () => {
            const start = new Date('2025-06-15T14:00:00');
            const end = new Date('2025-06-15T20:00:00');
            expect(calculateDuration(start, end)).toBe(6);
        });
        it('should handle fractional hours', () => {
            const start = new Date('2025-06-15T14:00:00');
            const end = new Date('2025-06-15T15:30:00');
            expect(calculateDuration(start, end)).toBe(1.5);
        });
        it('should return 0 for same start/end', () => {
            const date = new Date('2025-06-15T14:00:00');
            expect(calculateDuration(date, date)).toBe(0);
        });
        it('should return negative for end before start', () => {
            const start = new Date('2025-06-15T20:00:00');
            const end = new Date('2025-06-15T14:00:00');
            expect(calculateDuration(start, end)).toBeLessThan(0);
        });
    });
    // ─── generateExtraHoursNote ───
    describe('generateExtraHoursNote', () => {
        it('should return null when within default hours', () => {
            const start = new Date('2025-06-15T14:00:00');
            const end = new Date('2025-06-15T20:00:00'); // 6h = default
            expect(generateExtraHoursNote(start, end)).toBeNull();
        });
        it('should return note when exceeding default hours', () => {
            const start = new Date('2025-06-15T14:00:00');
            const end = new Date('2025-06-15T22:00:00'); // 8h > 6h
            const note = generateExtraHoursNote(start, end);
            expect(note).not.toBeNull();
            expect(note).toContain('2h dłużej');
            expect(note).toContain('2 dodatkowych godzin');
        });
        it('should respect custom defaultHours', () => {
            const start = new Date('2025-06-15T14:00:00');
            const end = new Date('2025-06-15T19:00:00'); // 5h
            expect(generateExtraHoursNote(start, end, 4)).not.toBeNull(); // 5 > 4
            expect(generateExtraHoursNote(start, end, 5)).toBeNull(); // 5 = 5
        });
        it('should ceil extra hours', () => {
            const start = new Date('2025-06-15T14:00:00');
            const end = new Date('2025-06-15T20:30:00'); // 6.5h, extra = 0.5 → ceil = 1
            const note = generateExtraHoursNote(start, end);
            expect(note).toContain('1h dłużej');
        });
    });
    // ─── validateConfirmationDeadline ───
    describe('validateConfirmationDeadline', () => {
        it('should return true when deadline is 1+ day before event', () => {
            const deadline = new Date('2025-06-13T12:00:00');
            const eventStart = new Date('2025-06-15T14:00:00');
            expect(validateConfirmationDeadline(deadline, eventStart)).toBe(true);
        });
        it('should return true when deadline is exactly 1 day before', () => {
            const eventStart = new Date('2025-06-15T14:00:00');
            const deadline = new Date('2025-06-14T14:00:00');
            expect(validateConfirmationDeadline(deadline, eventStart)).toBe(true);
        });
        it('should return false when deadline is same day as event', () => {
            const deadline = new Date('2025-06-15T10:00:00');
            const eventStart = new Date('2025-06-15T14:00:00');
            expect(validateConfirmationDeadline(deadline, eventStart)).toBe(false);
        });
        it('should return false when deadline is after event start', () => {
            const deadline = new Date('2025-06-16T12:00:00');
            const eventStart = new Date('2025-06-15T14:00:00');
            expect(validateConfirmationDeadline(deadline, eventStart)).toBe(false);
        });
    });
    // ─── validateCustomEventFields ───
    describe('validateCustomEventFields', () => {
        it('should return valid for non-special event types', () => {
            const result = validateCustomEventFields('Wesele', { adults: 50, children: 10 });
            expect(result.valid).toBe(true);
        });
        it('should require anniversaryYear for "Rocznica"', () => {
            const result = validateCustomEventFields('Rocznica', { anniversaryOccasion: 'Ślubu' });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Która rocznica');
        });
        it('should require anniversaryOccasion for "Rocznica"', () => {
            const result = validateCustomEventFields('Rocznica', { anniversaryYear: 25 });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Jaka okazja');
        });
        it('should accept valid "Rocznica" with both fields', () => {
            const result = validateCustomEventFields('Rocznica', {
                anniversaryYear: 25,
                anniversaryOccasion: 'Ślubu',
            });
            expect(result.valid).toBe(true);
        });
        it('should require customEventType for "Inne"', () => {
            const result = validateCustomEventFields('Inne', {});
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Typ wydarzenia');
        });
        it('should accept valid "Inne" with customEventType', () => {
            const result = validateCustomEventFields('Inne', { customEventType: 'Konferencja' });
            expect(result.valid).toBe(true);
        });
    });
    // ─── detectReservationChanges ───
    describe('detectReservationChanges', () => {
        const oldData = {
            adults: 50,
            children: 10,
            toddlers: 3,
            pricePerAdult: 150,
            pricePerChild: 80,
            pricePerToddler: 30,
            notes: 'Original note',
            startDateTime: new Date('2025-06-15T14:00:00Z'),
            endDateTime: new Date('2025-06-15T20:00:00Z'),
            confirmationDeadline: new Date('2025-06-13T12:00:00Z'),
            customEventType: null,
            anniversaryYear: null,
            anniversaryOccasion: null,
        };
        it('should return empty array when nothing changed', () => {
            const result = detectReservationChanges(oldData, {});
            expect(result).toEqual([]);
        });
        it('should detect adults change', () => {
            const result = detectReservationChanges(oldData, { adults: 60 });
            expect(result).toHaveLength(1);
            expect(result[0].field).toBe('adults');
            expect(result[0].label).toBe('Liczba dorosłych');
        });
        it('should detect multiple changes at once', () => {
            const result = detectReservationChanges(oldData, {
                adults: 60,
                children: 15,
                notes: 'Updated',
            });
            expect(result).toHaveLength(3);
            const fields = result.map((c) => c.field);
            expect(fields).toContain('adults');
            expect(fields).toContain('children');
            expect(fields).toContain('notes');
        });
        it('should detect price changes (comparing with Number())', () => {
            const result = detectReservationChanges(oldData, { pricePerAdult: 200 });
            expect(result).toHaveLength(1);
            expect(result[0].field).toBe('pricePerAdult');
        });
        it('should detect date changes via ISO comparison', () => {
            const result = detectReservationChanges(oldData, {
                startDateTime: '2025-07-01T14:00:00Z',
            });
            expect(result.length).toBeGreaterThanOrEqual(1);
            expect(result[0].field).toBe('startDateTime');
        });
        it('should detect anniversary fields', () => {
            const result = detectReservationChanges(oldData, {
                anniversaryYear: 25,
                anniversaryOccasion: 'Ślubu',
            });
            expect(result).toHaveLength(2);
        });
    });
    // ─── formatChangesSummary ───
    describe('formatChangesSummary', () => {
        it('should return "Brak zmian" for empty array', () => {
            expect(formatChangesSummary([])).toBe('Brak zmian');
        });
        it('should format single change with bullet', () => {
            const changes = [{ field: 'adults', oldValue: 50, newValue: 60, label: 'Liczba dorosłych' }];
            const result = formatChangesSummary(changes);
            expect(result).toContain('• Liczba dorosłych');
            expect(result).toContain('50');
            expect(result).toContain('60');
        });
        it('should format multiple changes with newlines', () => {
            const changes = [
                { field: 'adults', oldValue: 50, newValue: 60, label: 'Liczba dorosłych' },
                { field: 'children', oldValue: 10, newValue: 15, label: 'Liczba dzieci (4-12)' },
            ];
            const result = formatChangesSummary(changes);
            const lines = result.split('\n');
            expect(lines).toHaveLength(2);
        });
        it('should format null/undefined as "brak"', () => {
            const changes = [{ field: 'notes', oldValue: null, newValue: 'New note', label: 'Notatki' }];
            const result = formatChangesSummary(changes);
            expect(result).toContain('brak');
        });
        it('should format Date values using Polish locale', () => {
            const changes = [{
                    field: 'startDateTime',
                    oldValue: new Date('2025-06-15T14:00:00'),
                    newValue: '2025-07-01T14:00:00',
                    label: 'Data rozpoczęcia',
                }];
            const result = formatChangesSummary(changes);
            expect(result).toContain('→');
        });
        it('should truncate long strings to 50 chars', () => {
            const longString = 'A'.repeat(100);
            const changes = [{ field: 'notes', oldValue: 'Short', newValue: longString, label: 'Notatki' }];
            const result = formatChangesSummary(changes);
            expect(result).toContain('...');
        });
    });
});
//# sourceMappingURL=reservation.utils.test.js.map