import { describe, it, expect } from 'vitest'
import {
  reservationStatusColors,
  depositStatusColors,
  queueStatusColors,
  getStatusBadgeClass,
  semanticColors,
  type StatusColorConfig,
} from '@/lib/status-colors'

// ════════════════════════════════════════════════════════════
// reservationStatusColors
// ════════════════════════════════════════════════════════════
describe('reservationStatusColors', () => {
  const expectedStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']

  it.each(expectedStatuses)('has config for %s', (status) => {
    const config = reservationStatusColors[status]
    expect(config).toBeDefined()
    expect(config.label).toBeTruthy()
    expect(config.bg).toBeTruthy()
    expect(config.text).toBeTruthy()
    expect(config.border).toBeTruthy()
    expect(config.dot).toBeTruthy()
  })

  it('has Polish labels', () => {
    expect(reservationStatusColors.PENDING.label).toBe('Oczekująca')
    expect(reservationStatusColors.CONFIRMED.label).toBe('Potwierdzona')
    expect(reservationStatusColors.CANCELLED.label).toBe('Anulowana')
    expect(reservationStatusColors.COMPLETED.label).toBe('Zakończona')
  })
})

// ════════════════════════════════════════════════════════════
// depositStatusColors
// ════════════════════════════════════════════════════════════
describe('depositStatusColors', () => {
  const expectedStatuses = ['PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'CANCELLED']

  it.each(expectedStatuses)('has config for %s', (status) => {
    const config = depositStatusColors[status]
    expect(config).toBeDefined()
    expect(config.label).toBeTruthy()
  })

  it('has correct Polish labels', () => {
    expect(depositStatusColors.PAID.label).toBe('Opłacona')
    expect(depositStatusColors.OVERDUE.label).toBe('Przeterminowana')
    expect(depositStatusColors.PARTIALLY_PAID.label).toBe('Częściowa')
  })
})

// ════════════════════════════════════════════════════════════
// queueStatusColors
// ════════════════════════════════════════════════════════════
describe('queueStatusColors', () => {
  const expectedStatuses = ['WAITING', 'PROMOTED', 'EXPIRED', 'CANCELLED']

  it.each(expectedStatuses)('has config for %s', (status) => {
    const config = queueStatusColors[status]
    expect(config).toBeDefined()
    expect(config.label).toBeTruthy()
  })

  it('has correct Polish labels', () => {
    expect(queueStatusColors.WAITING.label).toBe('Oczekuje')
    expect(queueStatusColors.PROMOTED.label).toBe('Promowana')
    expect(queueStatusColors.EXPIRED.label).toBe('Wygasła')
  })
})

// ════════════════════════════════════════════════════════════
// getStatusBadgeClass()
// ════════════════════════════════════════════════════════════
describe('getStatusBadgeClass()', () => {
  it('concatenates bg, text, and border', () => {
    const config: StatusColorConfig = {
      label: 'Test',
      bg: 'bg-test',
      text: 'text-test',
      border: 'border-test',
      dot: 'bg-dot',
    }
    expect(getStatusBadgeClass(config)).toBe('bg-test text-test border-test')
  })

  it('works with real reservation config', () => {
    const cls = getStatusBadgeClass(reservationStatusColors.CONFIRMED)
    expect(cls).toContain('bg-green')
    expect(cls).toContain('text-green')
    expect(cls).toContain('border-green')
  })
})

// ════════════════════════════════════════════════════════════
// semanticColors
// ════════════════════════════════════════════════════════════
describe('semanticColors', () => {
  it.each(['success', 'warning', 'error', 'info', 'neutral'] as const)(
    'has bg, text, border for %s',
    (intent) => {
      const c = semanticColors[intent]
      expect(c.bg).toBeTruthy()
      expect(c.text).toBeTruthy()
      expect(c.border).toBeTruthy()
    }
  )
})
