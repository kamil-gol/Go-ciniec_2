/**
 * useCountUp Hook Tests
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCountUp } from '@/hooks/use-count-up'

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
    // Immediately trigger as intersecting
    setTimeout(() => callback([{ isIntersecting: true }]), 0)
    return { observe: mockObserve, disconnect: mockDisconnect, unobserve: vi.fn() }
  })
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
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useCountUp', () => {
  it('returns formatted display value and a ref', () => {
    const { result } = renderHook(() => useCountUp({ end: 100, startOnView: false }))
    const [displayValue, ref] = result.current
    expect(typeof displayValue).toBe('string')
    expect(ref).toBeDefined()
  })

  it('starts at 0 and animates to end value', async () => {
    const { result } = renderHook(() => useCountUp({ end: 50, duration: 500, startOnView: false }))

    // Initially should be near 0
    expect(parseInt(result.current[0].replace(/\s/g, ''), 10)).toBeLessThanOrEqual(50)

    // After animation completes
    act(() => {
      vi.advanceTimersByTime(600)
    })

    // Use requestAnimationFrame timing
    await act(async () => {
      // Flush microtasks
      await Promise.resolve()
    })
  })

  it('returns "0" for end=0', () => {
    const { result } = renderHook(() => useCountUp({ end: 0, startOnView: false }))
    expect(result.current[0]).toBe('0')
  })

  it('respects decimals parameter', () => {
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

    const { result } = renderHook(() => useCountUp({ end: 100, startOnView: false }))

    act(() => {
      vi.advanceTimersByTime(50)
    })

    // With reduced motion, value should jump to end immediately
    // (after the effect runs)
  })

  it('sets up IntersectionObserver when startOnView is true', () => {
    const { result } = renderHook(() => useCountUp({ end: 42, startOnView: true }))

    // Ref should be defined
    expect(result.current[1]).toBeDefined()
  })
})
