/**
 * EventTypeFormDialog Component Tests
 *
 * Tests the event type form dialog:
 * - Create mode vs edit mode rendering
 * - Field rendering (name, description, color, hours, rate, active toggle)
 * - Form validation (empty name)
 * - Submit handler (create and update flows)
 * - Color picker interaction
 * - Cancel button behavior
 * - Error handling on submit failure
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

vi.mock('@/lib/api/event-types-api', () => ({
  createEventType: vi.fn(),
  updateEventType: vi.fn(),
  getPredefinedColors: vi.fn().mockResolvedValue([
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
    '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6',
  ]),
}))

// Mock Radix Dialog to render inline (no portal) so content is visible in tests
vi.mock('@radix-ui/react-dialog', () => {
  const React = require('react')
  return {
    Root: ({ children, open }: any) => open ? <div>{children}</div> : null,
    Portal: ({ children }: any) => <>{children}</>,
    Overlay: ({ children }: any) => <div>{children}</div>,
    Content: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} role="dialog" {...props}>{children}</div>
    )),
    Title: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <h2 ref={ref} {...props}>{children}</h2>
    )),
    Description: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <p ref={ref} {...props}>{children}</p>
    )),
    Close: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>{children}</button>
    )),
    Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>{children}</button>
    )),
  }
})

// ── Test Data ────────────────────────────────────────────────────────────────

const mockExistingEventType = {
  id: 'et-1',
  name: 'Wesele',
  description: 'Przyjęcie weselne',
  color: '#3B82F6',
  isActive: true,
  standardHours: 8,
  extraHourRate: 600,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

// ── Import ───────────────────────────────────────────────────────────────────

import { EventTypeFormDialog } from '@/components/event-types/event-type-form-dialog'
import { createEventType, updateEventType } from '@/lib/api/event-types-api'
import { toast } from 'sonner'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('EventTypeFormDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Create Mode ────────────────────────────────────────────────────────

  describe('Create Mode', () => {
    it('should render create mode title', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByText('Nowy typ wydarzenia')).toBeInTheDocument()
    })

    it('should render create mode description', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByText('Utwórz nowy typ wydarzenia dla systemu rezerwacji')).toBeInTheDocument()
    })

    it('should render submit button with create label', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByText('Utwórz typ')).toBeInTheDocument()
    })

    it('should render empty name field in create mode', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      const nameInput = screen.getByLabelText('Nazwa *')
      expect(nameInput).toHaveValue('')
    })
  })

  // ── Edit Mode ──────────────────────────────────────────────────────────

  describe('Edit Mode', () => {
    it('should render edit mode title', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={mockExistingEventType}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByText('Edytuj typ wydarzenia')).toBeInTheDocument()
    })

    it('should render edit mode description', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={mockExistingEventType}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByText('Zmień parametry typu wydarzenia')).toBeInTheDocument()
    })

    it('should render submit button with save label', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={mockExistingEventType}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument()
    })

    it('should pre-fill name field with existing value', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={mockExistingEventType}
          onSuccess={mockOnSuccess}
        />
      )
      const nameInput = screen.getByLabelText('Nazwa *')
      expect(nameInput).toHaveValue('Wesele')
    })

    it('should pre-fill description field with existing value', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={mockExistingEventType}
          onSuccess={mockOnSuccess}
        />
      )
      const descInput = screen.getByLabelText('Opis')
      expect(descInput).toHaveValue('Przyjęcie weselne')
    })
  })

  // ── Form Fields ────────────────────────────────────────────────────────

  describe('Form Fields', () => {
    it('should render all form labels', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByLabelText('Nazwa *')).toBeInTheDocument()
      expect(screen.getByLabelText('Opis')).toBeInTheDocument()
      expect(screen.getByText('Kolor')).toBeInTheDocument()
      expect(screen.getByLabelText('Godziny w cenie (standard)')).toBeInTheDocument()
      expect(screen.getByLabelText('Stawka za dodatkową godzinę (zł)')).toBeInTheDocument()
      expect(screen.getByLabelText('Aktywny')).toBeInTheDocument()
    })

    it('should render cancel button', () => {
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      expect(screen.getByText('Anuluj')).toBeInTheDocument()
    })

    it('should call onOpenChange(false) when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      await user.click(screen.getByText('Anuluj'))
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ── Validation ─────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('should show error toast when name is empty on submit', async () => {
      const user = userEvent.setup()
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      await user.click(screen.getByText('Utwórz typ'))
      expect(toast.error).toHaveBeenCalledWith('Nazwa typu jest wymagana')
      expect(createEventType).not.toHaveBeenCalled()
    })

    it('should show error toast when name contains only whitespace', async () => {
      const user = userEvent.setup()
      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      await user.type(screen.getByLabelText('Nazwa *'), '   ')
      await user.click(screen.getByText('Utwórz typ'))
      expect(toast.error).toHaveBeenCalledWith('Nazwa typu jest wymagana')
      expect(createEventType).not.toHaveBeenCalled()
    })
  })

  // ── Submit (Create) ────────────────────────────────────────────────────

  describe('Submit - Create', () => {
    it('should call createEventType with form data', async () => {
      const user = userEvent.setup()
      vi.mocked(createEventType).mockResolvedValueOnce({} as any)

      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Nazwa *'), 'Chrzciny')
      await user.click(screen.getByText('Utwórz typ'))

      await waitFor(() => {
        expect(createEventType).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Chrzciny' })
        )
      })
    })

    it('should show success toast and close dialog after create', async () => {
      const user = userEvent.setup()
      vi.mocked(createEventType).mockResolvedValueOnce({} as any)

      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Nazwa *'), 'Chrzciny')
      await user.click(screen.getByText('Utwórz typ'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled()
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  // ── Submit (Edit) ──────────────────────────────────────────────────────

  describe('Submit - Edit', () => {
    it('should call updateEventType with form data', async () => {
      const user = userEvent.setup()
      vi.mocked(updateEventType).mockResolvedValueOnce({} as any)

      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={mockExistingEventType}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByText('Zapisz zmiany'))

      await waitFor(() => {
        expect(updateEventType).toHaveBeenCalledWith(
          'et-1',
          expect.objectContaining({ name: 'Wesele' })
        )
      })
    })

    it('should show success toast after update', async () => {
      const user = userEvent.setup()
      vi.mocked(updateEventType).mockResolvedValueOnce({} as any)

      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={mockExistingEventType}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByText('Zapisz zmiany'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  // ── Error Handling ─────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should show error toast when create fails', async () => {
      const user = userEvent.setup()
      vi.mocked(createEventType).mockRejectedValueOnce(new Error('Server error'))

      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Nazwa *'), 'Chrzciny')
      await user.click(screen.getByText('Utwórz typ'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error')
      })
    })

    it('should not close dialog or call onSuccess when create fails', async () => {
      const user = userEvent.setup()
      vi.mocked(createEventType).mockRejectedValueOnce(new Error('fail'))

      render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )

      await user.type(screen.getByLabelText('Nazwa *'), 'Chrzciny')
      await user.click(screen.getByText('Utwórz typ'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  // ── Color Picker ───────────────────────────────────────────────────────

  describe('Color Picker', () => {
    it('should render color buttons', async () => {
      const { container } = render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )
      await waitFor(() => {
        const colorButtons = container.querySelectorAll('button.rounded-full')
        expect(colorButtons.length).toBeGreaterThanOrEqual(10)
      })
    })

    it('should show selected color text when a color is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(container.querySelectorAll('button.rounded-full').length).toBeGreaterThanOrEqual(1)
      })

      const colorButtons = container.querySelectorAll('button.rounded-full')
      await user.click(colorButtons[0])

      expect(screen.getByText(/Wybrany:/)).toBeInTheDocument()
    })

    it('should deselect color when clicking the same color again', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <EventTypeFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          eventType={null}
          onSuccess={mockOnSuccess}
        />
      )

      await waitFor(() => {
        expect(container.querySelectorAll('button.rounded-full').length).toBeGreaterThanOrEqual(1)
      })

      const colorButtons = container.querySelectorAll('button.rounded-full')
      await user.click(colorButtons[0])
      expect(screen.getByText(/Wybrany:/)).toBeInTheDocument()

      await user.click(colorButtons[0])
      expect(screen.queryByText(/Wybrany:/)).not.toBeInTheDocument()
    })
  })
})
