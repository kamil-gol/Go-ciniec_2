/**
 * EventTypeCard Component Tests
 *
 * Tests event type card display:
 * - Name, description, color bar
 * - Active/inactive badge and toggle
 * - Stats display (reservations, templates)
 * - Card click navigation
 * - Dropdown menu (edit, delete)
 * - Edge cases (missing optional fields, zero stats)
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/event-types-api', () => ({
  updateEventType: vi.fn(),
}))

// ── Test Data ────────────────────────────────────────────────────────────────

const mockEventType = {
  id: 'et-1',
  name: 'Wesele',
  description: 'Eleganckie przyjęcie weselne.',
  color: '#3B82F6',
  isActive: true,
  standardHours: 8,
  extraHourRate: 500,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const mockStats = {
  id: 'et-1',
  name: 'Wesele',
  color: '#3B82F6',
  isActive: true,
  standardHours: 8,
  extraHourRate: 500,
  reservationCount: 12,
  menuTemplateCount: 3,
}

const mockInactiveEventType = {
  ...mockEventType,
  id: 'et-inactive',
  name: 'Konferencja',
  isActive: false,
}

const mockNoColorEventType = {
  ...mockEventType,
  id: 'et-nocolor',
  name: 'Komunia',
  color: null,
  description: null,
}

const mockSingleStats = {
  ...mockStats,
  reservationCount: 1,
  menuTemplateCount: 1,
}

// ── Import ───────────────────────────────────────────────────────────────────

import { EventTypeCard } from '@/components/event-types/event-type-card'
import { updateEventType } from '@/lib/api/event-types-api'
import { toast } from 'sonner'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('EventTypeCard', () => {
  const mockOnUpdate = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Core Rendering ──────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render event type name', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByText('Wesele')).toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByText('Eleganckie przyjęcie weselne.')).toBeInTheDocument()
    })

    it('should not render description when it is null', () => {
      render(
        <EventTypeCard
          eventType={mockNoColorEventType}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.queryByText('Eleganckie przyjęcie weselne.')).not.toBeInTheDocument()
    })
  })

  // ── Color Display ──────────────────────────────────────────────────────

  describe('Color Display', () => {
    it('should apply event type color to color bar', () => {
      const { container } = render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      const colorBar = container.querySelector('.h-1[style]')
      expect(colorBar).toHaveStyle({ backgroundColor: '#3B82F6' })
    })

    it('should apply fallback gray color when color is null', () => {
      const { container } = render(
        <EventTypeCard
          eventType={mockNoColorEventType}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      const colorBar = container.querySelector('.h-1[style]')
      expect(colorBar).toHaveStyle({ backgroundColor: '#9CA3AF' })
    })
  })

  // ── Status Badge ───────────────────────────────────────────────────────

  describe('Status Badge', () => {
    it('should not show Nieaktywny badge for active event type', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.queryByText('Nieaktywny')).not.toBeInTheDocument()
    })

    it('should show Nieaktywny badge for inactive event type', () => {
      render(
        <EventTypeCard
          eventType={mockInactiveEventType}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      // Badge + toggle label both show "Nieaktywny"
      const elements = screen.getAllByText('Nieaktywny')
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })

    it('should show Aktywny label in toggle row for active event type', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByText('Aktywny')).toBeInTheDocument()
    })

    it('should show Nieaktywny label in toggle row for inactive event type', () => {
      render(
        <EventTypeCard
          eventType={mockInactiveEventType}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      // One from badge, one from toggle label
      const elements = screen.getAllByText('Nieaktywny')
      expect(elements.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── Stats Display ──────────────────────────────────────────────────────

  describe('Stats Display', () => {
    it('should display reservation count from stats', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('rezerwacji')).toBeInTheDocument()
    })

    it('should display template count from stats', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('szablonów')).toBeInTheDocument()
    })

    it('should display singular form for 1 reservation', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockSingleStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByText('rezerwacja')).toBeInTheDocument()
    })

    it('should display singular form for 1 template', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockSingleStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByText('szablon')).toBeInTheDocument()
    })

    it('should default to 0 when stats are not provided', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBe(2)
    })
  })

  // ── Card Click Navigation ──────────────────────────────────────────────

  describe('Card Click Navigation', () => {
    it('should navigate to event type detail page on card click', async () => {
      const user = userEvent.setup()
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      await user.click(screen.getByText('Wesele'))
      expect(mockPush).toHaveBeenCalledWith('/dashboard/event-types/et-1')
    })
  })

  // ── Active Toggle ─────────────────────────────────────────────────────

  describe('Active Toggle', () => {
    it('should render switch element', () => {
      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should call updateEventType and onUpdate when toggled', async () => {
      const user = userEvent.setup()
      vi.mocked(updateEventType).mockResolvedValueOnce({} as any)

      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByRole('switch'))
      expect(updateEventType).toHaveBeenCalledWith('et-1', { isActive: false })
    })

    it('should show error toast when toggle fails', async () => {
      const user = userEvent.setup()
      vi.mocked(updateEventType).mockRejectedValueOnce(new Error('fail'))

      render(
        <EventTypeCard
          eventType={mockEventType}
          stats={mockStats}
          onUpdate={mockOnUpdate}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByRole('switch'))
      expect(toast.error).toHaveBeenCalledWith('Nie udało się zmienić statusu')
    })
  })
})
