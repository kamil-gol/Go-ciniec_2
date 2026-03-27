/**
 * LoadingState Component Tests
 *
 * Tests loading state display:
 * - Spinner variant (default)
 * - Skeleton variant
 * - Custom message
 * - Custom row count
 * - Default values
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// ── Import ───────────────────────────────────────────────────────────────────

import { LoadingState } from '@/components/shared/LoadingState'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LoadingState', () => {
  // ── Spinner Variant ─────────────────────────────────────────────────────

  describe('Spinner Variant (default)', () => {
    it('should render default loading message', () => {
      render(<LoadingState />)
      expect(screen.getByText('Ładowanie...')).toBeInTheDocument()
    })

    it('should render custom message', () => {
      render(<LoadingState message="Pobieranie danych..." />)
      expect(screen.getByText('Pobieranie danych...')).toBeInTheDocument()
    })

    it('should render spinning animation element', () => {
      const { container } = render(<LoadingState />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).not.toBeNull()
    })

    it('should not render skeleton rows', () => {
      const { container } = render(<LoadingState />)
      const skeletons = container.querySelectorAll('.animate-skeleton')
      expect(skeletons.length).toBe(0)
    })
  })

  // ── Skeleton Variant ────────────────────────────────────────────────────

  describe('Skeleton Variant', () => {
    it('should render default 3 skeleton rows', () => {
      const { container } = render(<LoadingState variant="skeleton" />)
      const skeletons = container.querySelectorAll('.animate-skeleton')
      expect(skeletons.length).toBe(3)
    })

    it('should render custom number of rows', () => {
      const { container } = render(<LoadingState variant="skeleton" rows={5} />)
      const skeletons = container.querySelectorAll('.animate-skeleton')
      expect(skeletons.length).toBe(5)
    })

    it('should support count prop as alias for rows', () => {
      const { container } = render(<LoadingState variant="skeleton" count={7} />)
      const skeletons = container.querySelectorAll('.animate-skeleton')
      expect(skeletons.length).toBe(7)
    })

    it('should not show spinner message in skeleton mode', () => {
      render(<LoadingState variant="skeleton" />)
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument()
    })

    it('should not render spinning element', () => {
      const { container } = render(<LoadingState variant="skeleton" />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeNull()
    })
  })

  // ── Custom className ────────────────────────────────────────────────────

  describe('Custom className', () => {
    it('should apply custom className to spinner variant', () => {
      const { container } = render(<LoadingState className="my-custom-class" />)
      expect(container.firstChild).toHaveClass('my-custom-class')
    })

    it('should apply custom className to skeleton variant', () => {
      const { container } = render(<LoadingState variant="skeleton" className="my-custom-class" />)
      expect(container.firstChild).toHaveClass('my-custom-class')
    })
  })
})
