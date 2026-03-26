import { describe, it, expect } from 'vitest'
import {
  isCategoryInactive,
  getInactiveReason,
  getGuestCountForTarget,
} from '@/components/menu/dish-selector/helpers'

// ════════════════════════════════════════════════════════════
// isCategoryInactive()
// ════════════════════════════════════════════════════════════
describe('isCategoryInactive()', () => {
  it('returns true for ADULTS_ONLY when adults=0', () => {
    expect(isCategoryInactive('ADULTS_ONLY', 0, 10)).toBe(true)
  })

  it('returns false for ADULTS_ONLY when adults>0', () => {
    expect(isCategoryInactive('ADULTS_ONLY', 5, 10)).toBe(false)
  })

  it('returns true for CHILDREN_ONLY when children=0', () => {
    expect(isCategoryInactive('CHILDREN_ONLY', 10, 0)).toBe(true)
  })

  it('returns false for CHILDREN_ONLY when children>0', () => {
    expect(isCategoryInactive('CHILDREN_ONLY', 10, 5)).toBe(false)
  })

  it('returns false for ALL target', () => {
    expect(isCategoryInactive('ALL', 0, 0)).toBe(false)
  })

  it('returns false for undefined target', () => {
    expect(isCategoryInactive(undefined, 0, 0)).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// getInactiveReason()
// ════════════════════════════════════════════════════════════
describe('getInactiveReason()', () => {
  it('returns adults reason for ADULTS_ONLY', () => {
    expect(getInactiveReason('ADULTS_ONLY')).toContain('dorosłych')
  })

  it('returns children reason for CHILDREN_ONLY', () => {
    expect(getInactiveReason('CHILDREN_ONLY')).toContain('dzieci')
  })

  it('returns empty string for ALL', () => {
    expect(getInactiveReason('ALL')).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(getInactiveReason(undefined)).toBe('')
  })
})

// ════════════════════════════════════════════════════════════
// getGuestCountForTarget()
// ════════════════════════════════════════════════════════════
describe('getGuestCountForTarget()', () => {
  const adults = 50
  const children = 20
  const toddlers = 5

  it('returns adults only for ADULTS_ONLY', () => {
    expect(getGuestCountForTarget('ADULTS_ONLY', adults, children, toddlers)).toBe(50)
  })

  it('returns children only for CHILDREN_ONLY', () => {
    expect(getGuestCountForTarget('CHILDREN_ONLY', adults, children, toddlers)).toBe(20)
  })

  it('returns all for ALL', () => {
    expect(getGuestCountForTarget('ALL', adults, children, toddlers)).toBe(75)
  })

  it('returns all for undefined target (default)', () => {
    expect(getGuestCountForTarget(undefined, adults, children, toddlers)).toBe(75)
  })

  it('returns all for unknown target (default case)', () => {
    expect(getGuestCountForTarget('UNKNOWN', adults, children, toddlers)).toBe(75)
  })
})
