/**
 * useCountUp Hook Tests
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCountUp } from '@/hooks/use-count-up'

beforeEach(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }))
  // Mock matchMedia — no reduced motion
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useCountUp', () => {
  it('returns formatted display value and a ref', () => {
    const { result } = renderHook(() => useCountUp({ end: 100, startOnView: false }))
    const [displayValue, ref] = result.current
    expect(typeof displayValue).toBe('string')
    expect(ref).toBeDefined()
  })

  it('returns "0" for end=0', () => {
    const { result } = renderHook(() => useCountUp({ end: 0, startOnView: false }))
    expect(result.current[0]).toBe('0')
  })

  it('respects decimals parameter for zero', () => {
    const { result } = renderHook(() => useCountUp({ end: 0, decimals: 2, startOnView: false }))
    expect(result.current[0]).toBe('0.00')
  })

  it('skips animation when prefers-reduced-motion is set', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    // With startOnView: false and reduced motion, value should be set to end immediately
    const { result } = renderHook(() => useCountUp({ end: 100, startOnView: false }))
    // After effect runs, value should be 100
    expect(result.current[0]).toBe('100')
  })

  it('creates IntersectionObserver when startOnView is true', () => {
    renderHook(() => useCountUp({ end: 42, startOnView: true }))
    expect(global.IntersectionObserver).toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    const mockCancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const { unmount } = renderHook(() => useCountUp({ end: 100, startOnView: false }))
    unmount()
    // cancelAnimationFrame should be called during cleanup
    expect(mockCancelAnimationFrame).toHaveBeenCalled()
  })

  it('formats large numbers with locale', () => {
    // Reduced motion to get instant value
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useCountUp({ end: 1234, startOnView: false }))
    // Polish locale uses space as thousands separator
    expect(result.current[0]).toMatch(/1\s?234/)
  })

  it('formats with decimals for non-zero values', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useCountUp({ end: 99.5, decimals: 1, startOnView: false }))
    expect(result.current[0]).toBe('99.5')
  })
})
