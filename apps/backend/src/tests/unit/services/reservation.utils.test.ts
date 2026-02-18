/**
 * Reservation Utils — Unit Tests
 * Czyste funkcje bez zależności od bazy danych
 */

import {
  calculateTotalGuests,
  calculateTotalPrice,
  calculateDuration,
  generateExtraHoursNote,
  validateConfirmationDeadline,
  validateCustomEventFields,
  detectReservationChanges,
  formatChangesSummary,
} from '../../../utils/reservation.utils';

// ════════════════════════════════════════════════════════════════
// calculateTotalGuests
// ════════════════════════════════════════════════════════════════
describe('calculateTotalGuests', () => {
  it('should sum adults + children + toddlers', () => {
    expect(calculateTotalGuests(10, 5, 3)).toBe(18);
  });

  it('should default toddlers to 0 if not provided', () => {
    expect(calculateTotalGuests(10, 5)).toBe(15);
  });

  it('should handle all zeros', () => {
    expect(calculateTotalGuests(0, 0, 0)).toBe(0);
  });

  it('should handle only adults', () => {
    expect(calculateTotalGuests(50, 0, 0)).toBe(50);
  });

  it('should handle only children and toddlers', () => {
    expect(calculateTotalGuests(0, 10, 5)).toBe(15);
  });
});

// ════════════════════════════════════════════════════════════════
// calculateTotalPrice
// ════════════════════════════════════════════════════════════════
describe('calculateTotalPrice', () => {
  it('should calculate price for adults and children', () => {
    // 10 adults * 200 + 5 children * 100 = 2500
    expect(calculateTotalPrice(10, 5, 200, 100)).toBe(2500);
  });

  it('should include toddler pricing', () => {
    // 10 * 200 + 5 * 100 + 3 * 50 = 2000 + 500 + 150 = 2650
    expect(calculateTotalPrice(10, 5, 200, 100, 3, 50)).toBe(2650);
  });

  it('should default toddlers to 0 price', () => {
    expect(calculateTotalPrice(10, 0, 150, 80)).toBe(1500);
    expect(calculateTotalPrice(10, 0, 150, 80, 0, 0)).toBe(1500);
  });

  it('should handle zero guests', () => {
    expect(calculateTotalPrice(0, 0, 200, 100, 0, 50)).toBe(0);
  });

  it('should handle zero prices', () => {
    expect(calculateTotalPrice(10, 5, 0, 0, 3, 0)).toBe(0);
  });

  it('should handle decimal prices', () => {
    // 2 * 199.99 + 1 * 99.99 = 399.98 + 99.99 = 499.97
    expect(calculateTotalPrice(2, 1, 199.99, 99.99)).toBeCloseTo(499.97);
  });
});

// ════════════════════════════════════════════════════════════════
// calculateDuration
// ════════════════════════════════════════════════════════════════
describe('calculateDuration', () => {
  it('should return duration in hours', () => {
    const start = new Date('2026-06-15T14:00:00');
    const end = new Date('2026-06-15T20:00:00');
    expect(calculateDuration(start, end)).toBe(6);
  });

  it('should handle fractional hours', () => {
    const start = new Date('2026-06-15T14:00:00');
    const end = new Date('2026-06-15T15:30:00');
    expect(calculateDuration(start, end)).toBe(1.5);
  });

  it('should handle overnight events', () => {
    const start = new Date('2026-06-15T20:00:00');
    const end = new Date('2026-06-16T04:00:00');
    expect(calculateDuration(start, end)).toBe(8);
  });
});

// ════════════════════════════════════════════════════════════════
// generateExtraHoursNote
// ════════════════════════════════════════════════════════════════
describe('generateExtraHoursNote', () => {
  it('should return null for events within default hours (6h)', () => {
    const start = new Date('2026-06-15T14:00:00');
    const end = new Date('2026-06-15T20:00:00');
    expect(generateExtraHoursNote(start, end)).toBeNull();
  });

  it('should return note for events exceeding default hours', () => {
    const start = new Date('2026-06-15T14:00:00');
    const end = new Date('2026-06-15T22:00:00'); // 8h
    const note = generateExtraHoursNote(start, end);
    expect(note).toContain('2h dłużej');
    expect(note).toContain('2 dodatkowych godzin');
  });

  it('should use custom default hours', () => {
    const start = new Date('2026-06-15T14:00:00');
    const end = new Date('2026-06-15T19:00:00'); // 5h
    // With default 4h, this is 1h extra
    const note = generateExtraHoursNote(start, end, 4);
    expect(note).toContain('1h dłużej');
  });

  it('should return null for events exactly at default hours', () => {
    const start = new Date('2026-06-15T14:00:00');
    const end = new Date('2026-06-15T20:00:00'); // exactly 6h
    expect(generateExtraHoursNote(start, end, 6)).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// validateConfirmationDeadline
// ════════════════════════════════════════════════════════════════
describe('validateConfirmationDeadline', () => {
  it('should return true when deadline is > 1 day before event', () => {
    const deadline = new Date('2026-06-13T12:00:00');
    const eventStart = new Date('2026-06-15T14:00:00');
    expect(validateConfirmationDeadline(deadline, eventStart)).toBe(true);
  });

  it('should return true when deadline is exactly 1 day before event', () => {
    const eventStart = new Date('2026-06-15T14:00:00');
    const deadline = new Date('2026-06-14T14:00:00'); // exactly 1 day before
    expect(validateConfirmationDeadline(deadline, eventStart)).toBe(true);
  });

  it('should return false when deadline is < 1 day before event', () => {
    const deadline = new Date('2026-06-14T15:00:00'); // less than 1 day before
    const eventStart = new Date('2026-06-15T14:00:00');
    expect(validateConfirmationDeadline(deadline, eventStart)).toBe(false);
  });

  it('should return false when deadline is after event start', () => {
    const deadline = new Date('2026-06-16T00:00:00');
    const eventStart = new Date('2026-06-15T14:00:00');
    expect(validateConfirmationDeadline(deadline, eventStart)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// validateCustomEventFields
// ════════════════════════════════════════════════════════════════
describe('validateCustomEventFields', () => {
  it('should pass for regular event types (e.g. Wesele)', () => {
    const result = validateCustomEventFields('Wesele', { adults: 50, children: 10, toddlers: 0 } as any);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should require anniversaryYear for "Rocznica"', () => {
    const result = validateCustomEventFields('Rocznica', {
      adults: 20, children: 0, toddlers: 0,
      anniversaryOccasion: 'Ślubu'
    } as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Która rocznica');
  });

  it('should require anniversaryOccasion for "Rocznica"', () => {
    const result = validateCustomEventFields('Rocznica', {
      adults: 20, children: 0, toddlers: 0,
      anniversaryYear: 25
    } as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Jaka okazja');
  });

  it('should pass for valid "Rocznica" data', () => {
    const result = validateCustomEventFields('Rocznica', {
      adults: 20, children: 0, toddlers: 0,
      anniversaryYear: 25,
      anniversaryOccasion: 'Ślubu'
    } as any);
    expect(result.valid).toBe(true);
  });

  it('should require customEventType for "Inne"', () => {
    const result = validateCustomEventFields('Inne', {
      adults: 10, children: 0, toddlers: 0
    } as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Typ wydarzenia');
  });

  it('should pass for valid "Inne" data', () => {
    const result = validateCustomEventFields('Inne', {
      adults: 10, children: 0, toddlers: 0,
      customEventType: 'Konferencja firmowa'
    } as any);
    expect(result.valid).toBe(true);
  });

  it('should pass for "Urodziny" without extra validation', () => {
    const result = validateCustomEventFields('Urodziny', {
      adults: 15, children: 5, toddlers: 2
    } as any);
    expect(result.valid).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// detectReservationChanges
// ════════════════════════════════════════════════════════════════
describe('detectReservationChanges', () => {
  const baseReservation = {
    startDateTime: new Date('2026-06-15T14:00:00.000Z'),
    endDateTime: new Date('2026-06-15T20:00:00.000Z'),
    adults: 50,
    children: 10,
    toddlers: 5,
    pricePerAdult: '200',
    pricePerChild: '100',
    pricePerToddler: '50',
    confirmationDeadline: new Date('2026-06-10T12:00:00.000Z'),
    customEventType: null,
    anniversaryYear: null,
    anniversaryOccasion: null,
    notes: 'Original notes',
  };

  it('should detect no changes when data is identical', () => {
    const changes = detectReservationChanges(baseReservation, {});
    expect(changes).toHaveLength(0);
  });

  it('should detect guest count changes', () => {
    const changes = detectReservationChanges(baseReservation, {
      adults: 60,
      children: 15,
    });
    expect(changes).toHaveLength(2);
    expect(changes.find(c => c.field === 'adults')).toBeDefined();
    expect(changes.find(c => c.field === 'children')).toBeDefined();
  });

  it('should detect price changes', () => {
    const changes = detectReservationChanges(baseReservation, {
      pricePerAdult: 250,
    });
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('pricePerAdult');
    expect(changes[0].newValue).toBe(250);
  });

  it('should detect datetime changes', () => {
    const changes = detectReservationChanges(baseReservation, {
      startDateTime: '2026-06-16T14:00:00.000Z',
    });
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('startDateTime');
    expect(changes[0].label).toContain('rozpoczęcia');
  });

  it('should detect notes change', () => {
    const changes = detectReservationChanges(baseReservation, {
      notes: 'Updated notes with more details',
    });
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('notes');
  });

  it('should detect multiple changes at once', () => {
    const changes = detectReservationChanges(baseReservation, {
      adults: 60,
      startDateTime: '2026-07-01T14:00:00.000Z',
      endDateTime: '2026-07-01T22:00:00.000Z',
      notes: 'Completely new notes',
      pricePerAdult: 300,
    });
    expect(changes).toHaveLength(5);
  });
});

// ════════════════════════════════════════════════════════════════
// formatChangesSummary
// ════════════════════════════════════════════════════════════════
describe('formatChangesSummary', () => {
  it('should return "Brak zmian" for empty changes', () => {
    expect(formatChangesSummary([])).toBe('Brak zmian');
  });

  it('should format single change with arrow notation', () => {
    const result = formatChangesSummary([
      { field: 'adults', oldValue: 50, newValue: 60, label: 'Liczba dorosłych' },
    ]);
    expect(result).toBe('• Liczba dorosłych: 50 → 60');
  });

  it('should format multiple changes separated by newlines', () => {
    const result = formatChangesSummary([
      { field: 'adults', oldValue: 50, newValue: 60, label: 'Liczba dorosłych' },
      { field: 'notes', oldValue: null, newValue: 'New note', label: 'Notatki' },
    ]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Liczba dorosłych');
    expect(lines[1]).toContain('Notatki');
    expect(lines[1]).toContain('brak → New note');
  });
});
