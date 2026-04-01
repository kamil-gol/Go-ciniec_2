import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockUseInView } = vi.hoisted(() => ({
  mockUseInView: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  useInView: mockUseInView,
}))

import { AnimatedCounter } from '@/components/shared/AnimatedCounter'

describe('AnimatedCounter', () => {
  let rafCallbacks: FrameRequestCallback[]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseInView.mockReturnValue(true)
    rafCallbacks = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    // Pin performance.now to 0 so rAF timestamps are relative to start
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function flushRAF(timestamp: number) {
    const cbs = [...rafCallbacks]
    rafCallbacks = []
    cbs.forEach((cb) => cb(timestamp))
  }

  it('should render a span element', () => {
    render(<AnimatedCounter value={42} />)
    const el = screen.getByText(/\d+/)
    expect(el.tagName).toBe('SPAN')
  })

  it('should apply custom className', () => {
    render(<AnimatedCounter value={10} className="my-class" />)
    const el = screen.getByText(/\d+/)
    expect(el.className).toContain('my-class')
  })

  it('should display 0 when not in view', () => {
    mockUseInView.mockReturnValue(false)
    render(<AnimatedCounter value={100} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(rafCallbacks.length).toBe(0)
  })

  it('should animate toward target value via requestAnimationFrame', () => {
    render(<AnimatedCounter value={100} duration={800} />)

    expect(rafCallbacks.length).toBe(1)

    // t=0: progress=0 → value=0
    act(() => flushRAF(0))
    expect(screen.getByText('0')).toBeInTheDocument()

    // t=800: progress=1 → value=100
    act(() => flushRAF(800))
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should use formatFn when provided', () => {
    const formatFn = (n: number) => `${n} zł`

    render(<AnimatedCounter value={50} duration={500} formatFn={formatFn} />)

    // Initial state
    expect(screen.getByText('0 zł')).toBeInTheDocument()

    // Complete the animation: t=0, then t=500 (= duration)
    act(() => flushRAF(0))
    act(() => flushRAF(500))

    expect(screen.getByText('50 zł')).toBeInTheDocument()
  })

  it('should handle value of 0', () => {
    render(<AnimatedCounter value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should call useInView with once: true', () => {
    render(<AnimatedCounter value={10} />)
    expect(mockUseInView).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ once: true })
    )
  })
})
