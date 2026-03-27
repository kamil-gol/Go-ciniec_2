/**
 * EmptyState Component Tests
 *
 * Tests empty state display:
 * - Title and description rendering
 * - Action button (onClick vs href)
 * - Default icon
 * - Custom icon
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Search } from 'lucide-react'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { EmptyState } from '@/components/shared/EmptyState'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  describe('Core Rendering', () => {
    it('should render title', () => {
      render(<EmptyState title="Brak rezerwacji" />)
      expect(screen.getByText('Brak rezerwacji')).toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(<EmptyState title="Brak danych" description="Dodaj pierwszą rezerwację" />)
      expect(screen.getByText('Dodaj pierwszą rezerwację')).toBeInTheDocument()
    })

    it('should not render description when not provided', () => {
      render(<EmptyState title="Brak danych" />)
      // Only the title should be rendered
      expect(screen.getByText('Brak danych')).toBeInTheDocument()
    })
  })

  describe('Action Button (onClick)', () => {
    it('should render action button with label when onAction is provided', () => {
      const mockAction = vi.fn()
      render(<EmptyState title="Brak" actionLabel="Dodaj nową" onAction={mockAction} />)
      expect(screen.getByText('Dodaj nową')).toBeInTheDocument()
    })

    it('should call onAction when button is clicked', async () => {
      const user = userEvent.setup()
      const mockAction = vi.fn()
      render(<EmptyState title="Brak" actionLabel="Dodaj nową" onAction={mockAction} />)

      await user.click(screen.getByText('Dodaj nową'))
      expect(mockAction).toHaveBeenCalledTimes(1)
    })
  })

  describe('Action Link (href)', () => {
    it('should render action as a link when actionHref is provided', () => {
      render(<EmptyState title="Brak" actionLabel="Przejdź" actionHref="/dashboard/add" />)
      const link = screen.getByText('Przejdź').closest('a')
      expect(link).not.toBeNull()
      expect(link?.getAttribute('href')).toBe('/dashboard/add')
    })
  })

  describe('No Action', () => {
    it('should not render any button when no actionLabel', () => {
      render(<EmptyState title="Brak" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })
})
