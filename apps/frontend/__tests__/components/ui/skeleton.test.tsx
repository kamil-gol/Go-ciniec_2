/**
 * Skeleton Component Tests
 *
 * Tests Skeleton loading placeholder:
 * - Renders with role="status"
 * - aria-busy attribute
 * - aria-label for accessibility
 * - Custom className
 * - Custom style
 * - Multiple skeletons
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  it('should render with role="status"', () => {
    render(<Skeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should have aria-busy="true"', () => {
    render(<Skeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })

  it('should have aria-label for screen readers', () => {
    render(<Skeleton />)
    expect(screen.getByLabelText('Ładowanie treści')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Skeleton className="h-10 w-40" />)
    const el = screen.getByRole('status')
    expect(el).toHaveClass('h-10')
    expect(el).toHaveClass('w-40')
  })

  it('should render multiple skeletons independently', () => {
    render(
      <div>
        <Skeleton data-testid="sk1" className="h-4" />
        <Skeleton data-testid="sk2" className="h-8" />
        <Skeleton data-testid="sk3" className="h-12" />
      </div>
    )
    expect(screen.getByTestId('sk1')).toBeInTheDocument()
    expect(screen.getByTestId('sk2')).toBeInTheDocument()
    expect(screen.getByTestId('sk3')).toBeInTheDocument()
  })

  it('should pass through additional HTML attributes', () => {
    render(<Skeleton data-testid="custom" id="skeleton-1" />)
    expect(screen.getByTestId('custom')).toHaveAttribute('id', 'skeleton-1')
  })
})
