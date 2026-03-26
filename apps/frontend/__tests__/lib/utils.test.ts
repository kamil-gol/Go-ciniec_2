import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatDate,
  formatTime,
  formatCurrency,
  calculateTotalPrice,
  calculateDuration,
  getStatusColor,
  getStatusLabel,
  debounce,
  isPastDate,
  generateId,
} from '@/lib/utils'

// ════════════════════════════════════════════════════════════
// cn()
// ════════════════════════════════════════════════════════════
describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('deduplicates tailwind classes', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })
})

// ════════════════════════════════════════════════════════════
// formatDate()
// ════════════════════════════════════════════════════════════
describe('formatDate()', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-03-15T10:00:00Z')
    expect(result).toMatch(/15\.03\.2026/)
  })

  it('formats simple date string (no T)', () => {
    const result = formatDate('2026-02-13')
    expect(result).toBe('13.02.2026')
  })

  it('formats Date object', () => {
    const result = formatDate(new Date(2026, 0, 5)) // Jan 5 2026
    expect(result).toBe('05.01.2026')
  })

  it('returns N/A for falsy input', () => {
    expect(formatDate('')).toBe('N/A')
    // @ts-expect-error testing null
    expect(formatDate(null)).toBe('N/A')
  })

  it('returns Invalid date for garbage', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date')
  })

  it('accepts custom format string', () => {
    const result = formatDate('2026-06-01', 'yyyy')
    expect(result).toBe('2026')
  })
})

// ════════════════════════════════════════════════════════════
// formatTime()
// ════════════════════════════════════════════════════════════
describe('formatTime()', () => {
  it('extracts HH:MM from HH:MM:SS', () => {
    expect(formatTime('14:30:00')).toBe('14:30')
  })

  it('returns N/A for empty string', () => {
    expect(formatTime('')).toBe('N/A')
  })

  it('handles already short time', () => {
    expect(formatTime('09:15')).toBe('09:15')
  })
})

// ════════════════════════════════════════════════════════════
// formatCurrency()
// ════════════════════════════════════════════════════════════
describe('formatCurrency()', () => {
  it('formats number to PLN', () => {
    const result = formatCurrency(1234.5)
    // Polish locale uses different formatting
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toMatch(/PLN|zł/)
  })

  it('handles string input', () => {
    const result = formatCurrency('99.99')
    expect(result).toContain('99')
    expect(result).toMatch(/PLN|zł/)
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

// ════════════════════════════════════════════════════════════
// calculateTotalPrice()
// ════════════════════════════════════════════════════════════
describe('calculateTotalPrice()', () => {
  it('multiplies guests by price', () => {
    expect(calculateTotalPrice(100, 150)).toBe(15000)
  })

  it('handles string price', () => {
    expect(calculateTotalPrice(50, '200.50')).toBe(10025)
  })

  it('returns 0 for 0 guests', () => {
    expect(calculateTotalPrice(0, 100)).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════
// calculateDuration()
// ════════════════════════════════════════════════════════════
describe('calculateDuration()', () => {
  it('calculates hours between two times', () => {
    expect(calculateDuration('10:00', '14:00')).toBe(4)
  })

  it('handles partial hours', () => {
    expect(calculateDuration('10:00', '11:30')).toBe(1.5)
  })

  it('returns 0 for same time', () => {
    expect(calculateDuration('12:00', '12:00')).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════
// getStatusColor()
// ════════════════════════════════════════════════════════════
describe('getStatusColor()', () => {
  it.each([
    ['PENDING', 'bg-yellow-100'],
    ['CONFIRMED', 'bg-green-100'],
    ['COMPLETED', 'bg-blue-100'],
    ['CANCELLED', 'bg-red-100'],
    ['ARCHIVED', 'bg-neutral-100'],
  ])('returns correct color for %s', (status, expected) => {
    expect(getStatusColor(status)).toContain(expected)
  })

  it('returns default gray for unknown status', () => {
    expect(getStatusColor('UNKNOWN')).toBe('bg-gray-100 text-gray-800')
  })
})

// ════════════════════════════════════════════════════════════
// getStatusLabel()
// ════════════════════════════════════════════════════════════
describe('getStatusLabel()', () => {
  it.each([
    ['PENDING', 'Oczekująca'],
    ['CONFIRMED', 'Potwierdzona'],
    ['COMPLETED', 'Zakończona'],
    ['CANCELLED', 'Anulowana'],
    ['ARCHIVED', 'Zarchiwizowana'],
  ])('returns Polish label for %s', (status, label) => {
    expect(getStatusLabel(status)).toBe(label)
  })

  it('returns raw status for unknown', () => {
    expect(getStatusLabel('CUSTOM')).toBe('CUSTOM')
  })
})

// ════════════════════════════════════════════════════════════
// debounce()
// ════════════════════════════════════════════════════════════
describe('debounce()', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('delays function execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced('a')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced('a')
    vi.advanceTimersByTime(200)
    debounced('b')
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
  })
})

// ════════════════════════════════════════════════════════════
// isPastDate()
// ════════════════════════════════════════════════════════════
describe('isPastDate()', () => {
  it('returns true for past date', () => {
    expect(isPastDate('2020-01-01')).toBe(true)
  })

  it('returns true for past ISO date', () => {
    expect(isPastDate('2020-01-01T12:00:00Z')).toBe(true)
  })

  it('returns false for future date', () => {
    expect(isPastDate('2099-12-31')).toBe(false)
  })

  it('returns true for past Date object', () => {
    expect(isPastDate(new Date(2020, 0, 1))).toBe(true)
  })

  it('returns false for invalid date', () => {
    expect(isPastDate('garbage')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// generateId()
// ════════════════════════════════════════════════════════════
describe('generateId()', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()))
    expect(ids.size).toBe(50)
  })

  it('returns non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })
})
