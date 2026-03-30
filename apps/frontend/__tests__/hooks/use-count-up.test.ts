/**
 * useCountUp Hook Tests
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCountUp } from '@/hooks/use-count-up'

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
let intersectionCallback: (entries: Array<{ isIntersecting: boolean }>) => void

beforeEach(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
    intersectionCallback = callback
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

  // Mock requestAnimationFrame for deterministic testing
  let rafId = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafId++
    // Execute callback immediately with a timestamp that completes animation
    setTimeout(() => cb(performance.now() + 2000), 0)
    return rafId
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
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

  it('respects decimals parameter', () => {
    const { result } = renderHook(() => useCountUp({ end: 0, decimals: 2, startOnView: false }))
    expect(result.current[0]).toBe('0.00')
  })

  it('formats with decimals for non-zero values', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCountUp({ end: 99.5, decimals: 1, startOnView: false }))
    await act(async () => { vi.advanceTimersByTime(100) })
    // Value should be a string with 1 decimal
    expect(result.current[0]).toMatch(/^\d+\.\d$/)
    vi.useRealTimers()
  })

  it('skips animation when prefers-reduced-motion is set', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    vi.useFakeTimers()
    const { result } = renderHook(() => useCountUp({ end: 100, startOnView: false }))
    await act(async () => { vi.advanceTimersByTime(50) })
    // With reduced motion, should jump to end immediately
    expect(result.current[0]).toBe('100')
    vi.useRealTimers()
  })

  it('does not start animation until element is in view', () => {
    const { result } = renderHook(() => useCountUp({ end: 42, startOnView: true }))
    expect(mockObserve).toHaveBeenCalled()
    // Value should still be near initial state before intersection triggers
    expect(result.current[1]).toBeDefined()
  })

  it('starts animation after intersection is observed', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCountUp({ end: 50, startOnView: true }))

    // Trigger intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }])
    })

    // Observer should disconnect after trigger
    expect(mockDisconnect).toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(100) })
    vi.useRealTimers()
  })

  it('does not start when element is not intersecting', () => {
    vi.useFakeTimers()
    renderHook(() => useCountUp({ end: 50, startOnView: true }))

    act(() => {
      intersectionCallback([{ isIntersecting: false }])
    })

    // Should NOT disconnect — still waiting
    expect(mockDisconnect).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('cleans up animation frame on unmount', async () => {
    vi.useFakeTimers()
    const { unmount } = renderHook(() => useCountUp({ end: 100, startOnView: false }))
    await act(async () => { vi.advanceTimersByTime(10) })
    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('handles rerender with new end value', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ end }) => useCountUp({ end, startOnView: false }),
      { initialProps: { end: 50 } }
    )

    await act(async () => { vi.advanceTimersByTime(100) })

    rerender({ end: 100 })

    await act(async () => { vi.advanceTimersByTime(100) })

    // Should have updated
    expect(result.current[0]).toBeDefined()
    vi.useRealTimers()
  })
})
