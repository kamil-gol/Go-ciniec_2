/**
 * DepositStatusBadge Component Tests
 *
 * Tests deposit status display:
 * - All status labels render correctly
 * - Icons are present
 * - Unknown status returns null
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// ── Import ───────────────────────────────────────────────────────────────────

import { DepositStatusBadge } from '@/components/deposits/deposit-status-badge'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DepositStatusBadge', () => {
  describe('Status Labels', () => {
    it('should render "Oczekująca" for PENDING status', () => {
      render(<DepositStatusBadge status="PENDING" />)
      expect(screen.getByText('Oczekująca')).toBeInTheDocument()
    })

    it('should render "Opłacona" for PAID status', () => {
      render(<DepositStatusBadge status="PAID" />)
      expect(screen.getByText('Opłacona')).toBeInTheDocument()
    })

    it('should render "Przetermin." for OVERDUE status', () => {
      render(<DepositStatusBadge status="OVERDUE" />)
      expect(screen.getByText('Przetermin.')).toBeInTheDocument()
    })

    it('should render "Częściowa" for PARTIALLY_PAID status', () => {
      render(<DepositStatusBadge status="PARTIALLY_PAID" />)
      expect(screen.getByText('Częściowa')).toBeInTheDocument()
    })

    it('should render "Anulowana" for CANCELLED status', () => {
      render(<DepositStatusBadge status="CANCELLED" />)
      expect(screen.getByText('Anulowana')).toBeInTheDocument()
    })
  })

  describe('Badge Structure', () => {
    it('should render as an inline-flex span element', () => {
      const { container } = render(<DepositStatusBadge status="PAID" />)
      const badge = container.querySelector('span')
      expect(badge).not.toBeNull()
      expect(badge?.className).toContain('inline-flex')
    })

    it('should include an SVG icon', () => {
      const { container } = render(<DepositStatusBadge status="PENDING" />)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
    })
  })

  describe('Unknown Status', () => {
    it('should return null for unknown status', () => {
      const { container } = render(<DepositStatusBadge status={'UNKNOWN' as any} />)
      expect(container.innerHTML).toBe('')
    })
  })
})
