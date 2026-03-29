/**
 * CreateDepositForm Component Tests
 *
 * Tests deposit creation form:
 * - Renders all fields (reservation select, amount, due date, title, notes)
 * - Loading state while fetching reservations
 * - Validation (required reservation, amount, due date)
 * - Successful submission
 * - Cancel action
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// -- Mocks --

const mockReservations = [
  {
    id: 'res-1',
    date: '2027-06-15',
    startTime: '14:00',
    endTime: '22:00',
    guests: 80,
    totalPrice: '12000',
    status: 'CONFIRMED',
    client: { firstName: 'Jan', lastName: 'Kowalski' },
    hall: { name: 'Sala Wielka' },
    eventType: { name: 'Wesele' },
  },
  {
    id: 'res-2',
    date: '2027-07-20',
    startTime: '16:00',
    endTime: '23:00',
    guests: 40,
    totalPrice: '6000',
    status: 'PENDING',
    client: { firstName: 'Anna', lastName: 'Nowak' },
    hall: { name: 'Sala Kameralna' },
    eventType: { name: 'Komunia' },
  },
]

const mockGet = vi.fn()
const mockDepositCreate = vi.fn()

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: (...args: any[]) => mockGet(...args) },
}))

vi.mock('@/lib/api/deposits', () => ({
  depositsApi: { create: (...args: any[]) => mockDepositCreate(...args) },
}))

// -- Import --

import { CreateDepositForm } from '@/components/deposits/create-deposit-form'
import { toast } from 'sonner'

// -- Tests --

describe('CreateDepositForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { data: mockReservations } })
    mockDepositCreate.mockResolvedValue({ id: 'dep-1' })
  })

  // -- Rendering --

  describe('Rendering', () => {
    it('should show loading state while fetching reservations', () => {
      // Make the request hang
      mockGet.mockReturnValue(new Promise(() => {}))
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      expect(screen.getByText(/ładowanie rezerwacji/i)).toBeInTheDocument()
    })

    it('should render reservation select after loading', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })
    })

    it('should render amount field', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/kwota zaliczki/i)).toBeInTheDocument()
      })
    })

    it('should render due date field', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/termin płatności/i)).toBeInTheDocument()
      })
    })

    it('should render title and notes fields', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/tytuł/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/notatki wewnętrzne/i)).toBeInTheDocument()
      })
    })

    it('should render submit and cancel buttons', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByText(/utwórz zaliczkę/i)).toBeInTheDocument()
        expect(screen.getByText(/anuluj/i)).toBeInTheDocument()
      })
    })

    it('should show message when no reservations available', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } })
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByText(/brak przyszłych rezerwacji/i)).toBeInTheDocument()
      })
    })
  })

  // -- Validation --

  describe('Validation', () => {
    it('should show error toast when no reservation selected', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })

      fireEvent.submit(screen.getByText(/utwórz zaliczkę/i).closest('form')!)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Wybierz rezerwację')
      })
    })

    it('should show error toast when amount is empty', async () => {
      const user = userEvent.setup()
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })

      // Select a reservation
      fireEvent.change(screen.getByLabelText(/rezerwacja/i), { target: { value: 'res-1' } })

      fireEvent.submit(screen.getByText(/utwórz zaliczkę/i).closest('form')!)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Podaj prawidłową kwotę')
      })
    })

    it('should show error toast when due date is empty', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/rezerwacja/i), { target: { value: 'res-1' } })
      fireEvent.change(screen.getByLabelText(/kwota zaliczki/i), { target: { value: '500' } })

      fireEvent.submit(screen.getByText(/utwórz zaliczkę/i).closest('form')!)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Podaj termin płatności')
      })
    })
  })

  // -- Successful Submission --

  describe('Successful Submission', () => {
    it('should call depositsApi.create with correct payload', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/rezerwacja/i), { target: { value: 'res-1' } })
      fireEvent.change(screen.getByLabelText(/kwota zaliczki/i), { target: { value: '2000' } })
      fireEvent.change(screen.getByLabelText(/termin płatności/i), { target: { value: '2027-06-01' } })

      fireEvent.submit(screen.getByText(/utwórz zaliczkę/i).closest('form')!)

      await waitFor(() => {
        expect(mockDepositCreate).toHaveBeenCalledWith('res-1', {
          amount: 2000,
          dueDate: '2027-06-01',
          title: undefined,
          internalNotes: undefined,
        })
      })
    })

    it('should show success toast after creation', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/rezerwacja/i), { target: { value: 'res-1' } })
      fireEvent.change(screen.getByLabelText(/kwota zaliczki/i), { target: { value: '2000' } })
      fireEvent.change(screen.getByLabelText(/termin płatności/i), { target: { value: '2027-06-01' } })

      fireEvent.submit(screen.getByText(/utwórz zaliczkę/i).closest('form')!)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Zaliczka została utworzona')
      })
    })

    it('should call onSuccess after successful creation', async () => {
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/rezerwacja/i), { target: { value: 'res-1' } })
      fireEvent.change(screen.getByLabelText(/kwota zaliczki/i), { target: { value: '2000' } })
      fireEvent.change(screen.getByLabelText(/termin płatności/i), { target: { value: '2027-06-01' } })

      fireEvent.submit(screen.getByText(/utwórz zaliczkę/i).closest('form')!)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
      })
    })

    it('should include optional title and notes in payload', async () => {
      const user = userEvent.setup()
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/rezerwacja/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/rezerwacja/i), { target: { value: 'res-1' } })
      fireEvent.change(screen.getByLabelText(/kwota zaliczki/i), { target: { value: '2000' } })
      fireEvent.change(screen.getByLabelText(/termin płatności/i), { target: { value: '2027-06-01' } })
      await user.type(screen.getByLabelText(/tytuł/i), 'Zaliczka na wesele')
      await user.type(screen.getByLabelText(/notatki wewnętrzne/i), 'Przelew bankowy')

      fireEvent.submit(screen.getByText(/utwórz zaliczkę/i).closest('form')!)

      await waitFor(() => {
        expect(mockDepositCreate).toHaveBeenCalledWith('res-1', {
          amount: 2000,
          dueDate: '2027-06-01',
          title: 'Zaliczka na wesele',
          internalNotes: 'Przelew bankowy',
        })
      })
    })
  })

  // -- Cancel Action --

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreateDepositForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await waitFor(() => {
        expect(screen.getByText(/anuluj/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/anuluj/i))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })
})
