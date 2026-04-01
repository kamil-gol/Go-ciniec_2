import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock framer-motion useInView to always return true (element visible)
const mockUseInView = vi.fn()
vi.mock('framer-motion', () => ({
  useInView: mockUseInView,
}))

import { AnimatedCounter } from '@/components/shared/AnimatedCounter'

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: element is in view
    mockUseInView.mockReturnValue(true)
    // Use fake timers for requestAnimationFrame control
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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
  })

  it('should display the target value after animation completes', async () => {
    // useInView returns true, animation should start
    render(<AnimatedCounter value={50} duration={100} />)

    // Advance timers to let requestAnimationFrame callbacks fire
    vi.useRealTimers()
    await new Promise((r) => setTimeout(r, 200))

    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('should use formatFn when provided', async () => {
    const formatFn = (n: number) => `${n} zł`
    render(<AnimatedCounter value={100} duration={50} formatFn={formatFn} />)

    vi.useRealTimers()
    await new Promise((r) => setTimeout(r, 150))

    expect(screen.getByText('100 zł')).toBeInTheDocument()
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
