/**
 * useIdleTimer Hook Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - Initial state (not idle, not warning)
 * - Warning phase triggers after (idleTimeout - warningBefore)
 * - Idle phase triggers after idleTimeout
 * - Countdown during warning phase
 * - reset() restarts timers
 * - pause() / resume() behavior
 * - Activity events reset timer (but NOT during warning phase)
 * - Disabled mode
 * - Callback invocation (onWarning, onIdle)
 */
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIdleTimer } from '@/hooks/use-idle-timer'

describe('useIdleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Initial State ──────────────────────────────────────────────────────

  describe('Initial State', () => {
    it('should start with isIdle=false, isWarning=false', () => {
      const { result } = renderHook(() => useIdleTimer())

      expect(result.current.isIdle).toBe(false)
      expect(result.current.isWarning).toBe(false)
      expect(result.current.remainingSeconds).toBeNull()
    })

    it('should expose reset, pause, resume functions', () => {
      const { result } = renderHook(() => useIdleTimer())

      expect(typeof result.current.reset).toBe('function')
      expect(typeof result.current.pause).toBe('function')
      expect(typeof result.current.resume).toBe('function')
    })
  })

  // ── Warning Phase ─────────────────────────────────────────────────────

  describe('Warning Phase', () => {
    it('should enter warning phase after (idleTimeout - warningBefore)', () => {
      const onWarning = vi.fn()

      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,    // 10s
          warningBefore: 3_000,   // 3s warning
          onWarning,
        })
      )

      // Advance to just before warning (7s - 1ms)
      act(() => { vi.advanceTimersByTime(6_999) })
      expect(result.current.isWarning).toBe(false)
      expect(onWarning).not.toHaveBeenCalled()

      // Advance into warning phase
      act(() => { vi.advanceTimersByTime(1) })
      expect(result.current.isWarning).toBe(true)
      expect(onWarning).toHaveBeenCalledTimes(1)
    })

    it('should start countdown when entering warning', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,
          warningBefore: 3_000,
        })
      )

      // Enter warning phase
      act(() => { vi.advanceTimersByTime(7_000) })
      expect(result.current.remainingSeconds).toBe(3)

      // Countdown ticks
      act(() => { vi.advanceTimersByTime(1_000) })
      expect(result.current.remainingSeconds).toBe(2)

      act(() => { vi.advanceTimersByTime(1_000) })
      expect(result.current.remainingSeconds).toBe(1)
    })
  })

  // ── Idle Phase ────────────────────────────────────────────────────────

  describe('Idle Phase', () => {
    it('should call onIdle callback after full timeout', () => {
      const onIdle = vi.fn()
      const onWarning = vi.fn()

      renderHook(() =>
        useIdleTimer({
          idleTimeout: 5_000,
          warningBefore: 2_000,
          onIdle,
          onWarning,
        })
      )

      // Advance past full timeout in one step
      act(() => { vi.advanceTimersByTime(5_500) })

      expect(onWarning).toHaveBeenCalledTimes(1)
      expect(onIdle).toHaveBeenCalledTimes(1)
    })

    it('should transition through warning to idle', () => {
      const onIdle = vi.fn()

      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,
          warningBefore: 3_000,
          onIdle,
        })
      )

      // Enter warning phase
      act(() => { vi.advanceTimersByTime(7_000) })
      expect(result.current.isWarning).toBe(true)
      expect(result.current.isIdle).toBe(false)

      // Advance remaining 3s to idle
      act(() => { vi.advanceTimersByTime(3_500) })

      // onIdle should have been called
      expect(onIdle).toHaveBeenCalledTimes(1)
    })
  })

  // ── Reset ─────────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('should reset all states and restart timers', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,
          warningBefore: 3_000,
        })
      )

      // Enter warning
      act(() => { vi.advanceTimersByTime(7_000) })
      expect(result.current.isWarning).toBe(true)

      // Reset
      act(() => { result.current.reset() })
      expect(result.current.isWarning).toBe(false)
      expect(result.current.isIdle).toBe(false)
      expect(result.current.remainingSeconds).toBeNull()

      // Timer restarts — should not be warning yet after 5s
      act(() => { vi.advanceTimersByTime(5_000) })
      expect(result.current.isWarning).toBe(false)

      // But should warn after 7s from reset
      act(() => { vi.advanceTimersByTime(2_000) })
      expect(result.current.isWarning).toBe(true)
    })
  })

  // ── Pause / Resume ────────────────────────────────────────────────────

  describe('pause() / resume()', () => {
    it('should stop timers on pause', () => {
      const onWarning = vi.fn()

      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,
          warningBefore: 3_000,
          onWarning,
        })
      )

      // Pause at 5s
      act(() => { vi.advanceTimersByTime(5_000) })
      act(() => { result.current.pause() })

      // Advance past warning time — should NOT trigger
      act(() => { vi.advanceTimersByTime(10_000) })
      expect(result.current.isWarning).toBe(false)
      expect(onWarning).not.toHaveBeenCalled()
    })

    it('should restart timers on resume', () => {
      const onWarning = vi.fn()

      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,
          warningBefore: 3_000,
          onWarning,
        })
      )

      act(() => { result.current.pause() })

      // Long pause — no triggers
      act(() => { vi.advanceTimersByTime(20_000) })
      expect(onWarning).not.toHaveBeenCalled()

      // Resume — restarts timers fresh
      act(() => { result.current.resume() })

      act(() => { vi.advanceTimersByTime(7_000) })
      expect(result.current.isWarning).toBe(true)
      expect(onWarning).toHaveBeenCalledTimes(1)
    })
  })

  // ── Activity Events ───────────────────────────────────────────────────

  describe('Activity Events', () => {
    it('should reset timer on user activity', () => {
      const onWarning = vi.fn()

      renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,
          warningBefore: 3_000,
          onWarning,
        })
      )

      // Advance to 5s, then simulate activity
      act(() => { vi.advanceTimersByTime(5_000) })
      act(() => {
        document.dispatchEvent(new Event('mousemove'))
        // Need to advance past throttle (1s)
        vi.advanceTimersByTime(1_001)
        document.dispatchEvent(new Event('keydown'))
      })

      // After activity reset, should need another 7s to reach warning
      act(() => { vi.advanceTimersByTime(6_000) })
      expect(onWarning).not.toHaveBeenCalled()
    })

    it('should IGNORE activity during warning phase', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 10_000,
          warningBefore: 3_000,
        })
      )

      // Enter warning
      act(() => { vi.advanceTimersByTime(7_000) })
      expect(result.current.isWarning).toBe(true)

      // Activity should be ignored
      act(() => {
        document.dispatchEvent(new Event('mousemove'))
        vi.advanceTimersByTime(1_001)
        document.dispatchEvent(new Event('click'))
      })

      // Still in warning
      expect(result.current.isWarning).toBe(true)
    })
  })

  // ── Disabled Mode ─────────────────────────────────────────────────────

  describe('Disabled Mode', () => {
    it('should not start timers when disabled', () => {
      const onWarning = vi.fn()
      const onIdle = vi.fn()

      const { result } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 5_000,
          warningBefore: 2_000,
          onWarning,
          onIdle,
          enabled: false,
        })
      )

      act(() => { vi.advanceTimersByTime(10_000) })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.isWarning).toBe(false)
      expect(onWarning).not.toHaveBeenCalled()
      expect(onIdle).not.toHaveBeenCalled()
    })

    it('should start timers when re-enabled', () => {
      const onWarning = vi.fn()
      let enabled = false

      const { result, rerender } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 5_000,
          warningBefore: 2_000,
          onWarning,
          enabled,
        })
      )

      act(() => { vi.advanceTimersByTime(10_000) })
      expect(onWarning).not.toHaveBeenCalled()

      // Re-enable
      enabled = true
      rerender()

      act(() => { vi.advanceTimersByTime(3_000) })
      expect(result.current.isWarning).toBe(true)
      expect(onWarning).toHaveBeenCalledTimes(1)
    })
  })

  // ── Cleanup ───────────────────────────────────────────────────────────

  describe('Cleanup', () => {
    it('should clear timers on unmount', () => {
      const onIdle = vi.fn()

      const { unmount } = renderHook(() =>
        useIdleTimer({
          idleTimeout: 5_000,
          warningBefore: 2_000,
          onIdle,
        })
      )

      unmount()

      act(() => { vi.advanceTimersByTime(10_000) })
      expect(onIdle).not.toHaveBeenCalled()
    })
  })
})
