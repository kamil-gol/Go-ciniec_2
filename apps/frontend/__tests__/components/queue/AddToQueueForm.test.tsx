/**
 * AddToQueueForm Component Tests
 *
 * Tests queue form:
 * - Form field rendering (client search, date, adults, children, notes)
 * - Client autocomplete search behavior
 * - New client dialog
 * - Form validation
 * - Submit and cancel actions
 *
 * Issue: #101
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

vi.mock('@/lib/api/clients', () => ({
  clientsApi: {
    create: vi.fn().mockResolvedValue({ id: 'new-client-1', firstName: 'Nowy', lastName: 'Klient', phone: '111222333' }),
  },
}))

// ── Test Data ────────────────────────────────────────────────────────────────

const mockClients = [
  { id: 'c-1', firstName: 'Jan', lastName: 'Kowalski', phone: '500100200', email: 'jan@test.pl' },
  { id: 'c-2', firstName: 'Anna', lastName: 'Nowak', phone: '600300400', email: 'anna@test.pl' },
  { id: 'c-3', firstName: 'Piotr', lastName: 'Wiśniewski', phone: '700500600', email: '' },
]

// ── Import ───────────────────────────────────────────────────────────────────

import { AddToQueueForm } from '@/components/queue/add-to-queue-form'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AddToQueueForm', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined)
  const mockCancel = vi.fn()
  const mockClientAdded = vi.fn()

  const defaultProps = {
    clients: mockClients,
    onSubmit: mockSubmit,
    onCancel: mockCancel,
    onClientAdded: mockClientAdded,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Core Rendering ──────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render client search field', () => {
      render(<AddToQueueForm {...defaultProps} />)
      expect(screen.getByText('Klient')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Wpisz min. 3 znaki aby wyszukać...')).toBeInTheDocument()
    })

    it('should render date picker field', () => {
      render(<AddToQueueForm {...defaultProps} />)
      expect(screen.getByText('Data wydarzenia (docelowa)')).toBeInTheDocument()
      expect(screen.getByText('Wybierz datę')).toBeInTheDocument()
    })

    it('should render adults and children fields', () => {
      render(<AddToQueueForm {...defaultProps} />)
      expect(screen.getByText('Dorośli')).toBeInTheDocument()
      expect(screen.getByText('Dzieci')).toBeInTheDocument()
    })

    it('should render notes field', () => {
      render(<AddToQueueForm {...defaultProps} />)
      expect(screen.getByText('Notatki (opcjonalnie)')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Dodatkowe informacje...')).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<AddToQueueForm {...defaultProps} />)
      expect(screen.getByText('Dodaj do kolejki')).toBeInTheDocument()
    })

    it('should render cancel button when onCancel is provided', () => {
      render(<AddToQueueForm {...defaultProps} />)
      const cancelBtn = screen.getByText('Anuluj')
      expect(cancelBtn).toBeInTheDocument()
    })

    it('should not render cancel button when onCancel is not provided', () => {
      render(<AddToQueueForm {...defaultProps} onCancel={undefined} />)
      expect(screen.queryByText('Anuluj')).not.toBeInTheDocument()
    })
  })

  // ── Client Autocomplete ─────────────────────────────────────────────────

  describe('Client Autocomplete', () => {
    it('should not show dropdown with less than 3 characters', async () => {
      const user = userEvent.setup()
      render(<AddToQueueForm {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Wpisz min. 3 znaki aby wyszukać...')
      await user.type(searchInput, 'Ja')

      expect(screen.queryByText('Jan Kowalski (500100200)')).not.toBeInTheDocument()
    })

    it('should show filtered clients with 3+ characters', async () => {
      const user = userEvent.setup()
      render(<AddToQueueForm {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Wpisz min. 3 znaki aby wyszukać...')
      await user.type(searchInput, 'Jan')

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski (500100200)')).toBeInTheDocument()
      })
    })

    it('should show no results message when search finds nothing', async () => {
      const user = userEvent.setup()
      render(<AddToQueueForm {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Wpisz min. 3 znaki aby wyszukać...')
      await user.type(searchInput, 'XYZ')

      await waitFor(() => {
        expect(screen.getByText('Nie znaleziono klienta')).toBeInTheDocument()
      })
    })
  })

  // ── New Client Dialog ───────────────────────────────────────────────────

  describe('New Client Dialog', () => {
    it('should open new client dialog when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<AddToQueueForm {...defaultProps} />)

      const addBtn = screen.getByTitle('Dodaj nowego klienta')
      await user.click(addBtn)

      await waitFor(() => {
        expect(screen.getByText('Dodaj nowego klienta')).toBeInTheDocument()
      })
    })

    it('should show new client form fields in dialog', async () => {
      const user = userEvent.setup()
      render(<AddToQueueForm {...defaultProps} />)

      const addBtn = screen.getByTitle('Dodaj nowego klienta')
      await user.click(addBtn)

      await waitFor(() => {
        expect(screen.getByText('Imię')).toBeInTheDocument()
        expect(screen.getByText('Nazwisko')).toBeInTheDocument()
        expect(screen.getByText('Telefon')).toBeInTheDocument()
      })
    })
  })

  // ── Cancel Action ───────────────────────────────────────────────────────

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AddToQueueForm {...defaultProps} />)

      const cancelBtn = screen.getByText('Anuluj')
      await user.click(cancelBtn)

      expect(mockCancel).toHaveBeenCalledTimes(1)
    })
  })

  // ── Default Values ──────────────────────────────────────────────────────

  describe('Default Values', () => {
    it('should default adults to 1', () => {
      render(<AddToQueueForm {...defaultProps} />)
      const adultsInput = screen.getByRole('spinbutton', { name: /dorośli/i })
      expect(adultsInput).toHaveValue(1)
    })

    it('should default children to 0', () => {
      render(<AddToQueueForm {...defaultProps} />)
      const childrenInput = screen.getByRole('spinbutton', { name: /dzieci/i })
      expect(childrenInput).toHaveValue(0)
    })
  })
})
