/**
 * Unit tests for reports-export/export.helpers.ts
 * Covers: formatCurrency, translateDayOfWeek, portionTargetLabel, applySectionHeader
 */

import { formatCurrency, translateDayOfWeek, portionTargetLabel, applySectionHeader } from '../../../../services/reports-export/export.helpers';

// ===============================================================
// formatCurrency
// ===============================================================

describe('formatCurrency', () => {
  it('formats number as PLN currency', () => {
    const result = formatCurrency(1500);
    // Should contain PLN indicator and formatted number
    expect(result).toContain('1');
    expect(result).toContain('500');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formats decimal values', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });
});

// ===============================================================
// translateDayOfWeek
// ===============================================================

describe('translateDayOfWeek', () => {
  it('translates Monday', () => {
    expect(translateDayOfWeek('Monday')).toBe('Poniedzialek');
  });

  it('translates Saturday', () => {
    expect(translateDayOfWeek('Saturday')).toBe('Sobota');
  });

  it('translates Sunday', () => {
    expect(translateDayOfWeek('Sunday')).toBe('Niedziela');
  });

  it('returns original for unknown day', () => {
    expect(translateDayOfWeek('UnknownDay')).toBe('UnknownDay');
  });

  it('translates all days', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      expect(translateDayOfWeek(day)).not.toBe(day);
    }
  });
});

// ===============================================================
// portionTargetLabel
// ===============================================================

describe('portionTargetLabel', () => {
  it('returns adults label', () => {
    expect(portionTargetLabel('ADULTS_ONLY')).toContain('dorosli');
  });

  it('returns children label', () => {
    expect(portionTargetLabel('CHILDREN_ONLY')).toContain('dzieci');
  });

  it('returns empty for undefined', () => {
    expect(portionTargetLabel(undefined)).toBe('');
  });

  it('returns empty for other values', () => {
    expect(portionTargetLabel('ALL')).toBe('');
  });
});

// ===============================================================
// applySectionHeader
// ===============================================================

describe('applySectionHeader', () => {
  it('applies bold styling and fill pattern', () => {
    const row = { font: {} as any, fill: {} as any } as any;

    applySectionHeader(row);

    expect(row.font.bold).toBe(true);
    expect(row.font.size).toBe(12);
    expect(row.fill.type).toBe('pattern');
    expect(row.fill.pattern).toBe('solid');
  });

  it('applies custom color', () => {
    const row = { font: {} as any, fill: {} as any } as any;

    applySectionHeader(row, 'FF0000');

    expect(row.font.color).toEqual({ argb: 'FF0000' });
  });

  it('omits color when not specified', () => {
    const row = { font: {} as any, fill: {} as any } as any;

    applySectionHeader(row);

    expect(row.font.color).toBeUndefined();
  });
});
