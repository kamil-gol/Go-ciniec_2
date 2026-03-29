/**
 * CreateClientForm Component Tests
 *
 * Tests client creation form:
 * - Form field rendering (individual vs company)
 * - Client type toggle
 * - Company fields conditional display
 * - Form validation (required fields)
 * - Submit with correct payload
 * - Cancel action
 * - Loading state during submission
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

const mockCreateClient = vi.fn()

vi.mock('@/lib/api/clients', () => ({
  createClient: (...args: any[]) => mockCreateClient(...args),
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { CreateClientForm } from '@/components/clients/create-client-form'
import { toast } from 'sonner'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CreateClientForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue({ id: 'new-1' })
  })

  // ── Core Rendering ──────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render client type toggle', () => {
      render(<CreateClientForm />)
      expect(screen.getByText('Osoba prywatna')).toBeInTheDocument()
      expect(screen.getByText('Firma')).toBeInTheDocument()
    })

    it('should render personal info fields', () => {
      render(<CreateClientForm />)
      expect(screen.getByLabelText(/imię/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nazwisko/i)).toBeInTheDocument()
    })

    it('should render contact fields', () => {
      render(<CreateClientForm />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefon/i)).toBeInTheDocument()
    })

    it('should render notes field', () => {
      render(<CreateClientForm />)
      expect(screen.getByLabelText(/dodatkowe informacje/i)).toBeInTheDocument()
    })

    it('should render submit button with individual label by default', () => {
      render(<CreateClientForm />)
      expect(screen.getByText('Dodaj klienta')).toBeInTheDocument()
    })

    it('should show section heading "Dane podstawowe" for individual', () => {
      render(<CreateClientForm />)
      expect(screen.getByText('Dane podstawowe')).toBeInTheDocument()
    })
  })

  // ── Client Type Toggle ──────────────────────────────────────────────────

  describe('Client Type Toggle', () => {
    it('should show company fields when Firma is selected', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm />)

      await user.click(screen.getByText('Firma'))

      expect(screen.getByLabelText(/nazwa firmy/i)).toBeInTheDocument()
      expect(screen.getByText('Dane firmy')).toBeInTheDocument()
    })

    it('should show NIP and REGON fields for company', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm />)

      await user.click(screen.getByText('Firma'))

      expect(screen.getByLabelText(/nip/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/regon/i)).toBeInTheDocument()
    })

    it('should change submit button label when company is selected', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm />)

      await user.click(screen.getByText('Firma'))

      expect(screen.getByText('Dodaj firmę')).toBeInTheDocument()
    })

    it('should change section heading to "Osoba reprezentująca" for company', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm />)

      await user.click(screen.getByText('Firma'))

      expect(screen.getByText('Osoba reprezentująca')).toBeInTheDocument()
    })

    it('should hide company fields when switching back to individual', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm />)

      // Switch to company
      await user.click(screen.getByText('Firma'))
      expect(screen.getByLabelText(/nazwa firmy/i)).toBeInTheDocument()

      // Switch back
      await user.click(screen.getByText('Osoba prywatna'))
      expect(screen.queryByLabelText(/nazwa firmy/i)).not.toBeInTheDocument()
    })
  })

  // ── Form Validation ─────────────────────────────────────────────────────

  describe('Form Validation', () => {
    it('should show error toast when submitting with partial required fields', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm />)

      // Fill only firstName (not lastName or phone) to bypass native required on firstName
      // but trigger the manual validation in handleSubmit
      await user.type(screen.getByLabelText(/imię/i), 'Jan')

      // Submit the form programmatically to bypass native validation
      const form = screen.getByText('Dodaj klienta').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Nazwisko jest wymagane')
      })
    })

    it('should show error toast when company name is missing for COMPANY type', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm />)

      // Switch to company
      await user.click(screen.getByText('Firma'))

      // Fill personal fields but not company name
      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/nazwisko/i), 'Kowalski')
      await user.type(screen.getByLabelText(/telefon/i), '500100200')

      fireEvent.click(screen.getByText('Dodaj firmę'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Nazwa firmy jest wymagana')
      })
    })
  })

  // ── Successful Submission ───────────────────────────────────────────────

  describe('Successful Submission', () => {
    it('should call createClient with correct payload for individual', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/nazwisko/i), 'Kowalski')
      await user.type(screen.getByLabelText(/telefon/i), '500100200')

      fireEvent.click(screen.getByText('Dodaj klienta'))

      await waitFor(() => {
        expect(mockCreateClient).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Jan',
            lastName: 'Kowalski',
            phone: '500100200',
            clientType: 'INDIVIDUAL',
          })
        )
      })
    })

    it('should show success toast after creation', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/nazwisko/i), 'Kowalski')
      await user.type(screen.getByLabelText(/telefon/i), '500100200')

      fireEvent.click(screen.getByText('Dodaj klienta'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Klient został dodany')
      })
    })

    it('should call onSuccess after successful creation', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/nazwisko/i), 'Kowalski')
      await user.type(screen.getByLabelText(/telefon/i), '500100200')

      fireEvent.click(screen.getByText('Dodaj klienta'))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1)
      })
    })
  })

  // ── Cancel Action ───────────────────────────────────────────────────────

  describe('Cancel Action', () => {
    it('should render cancel button when onCancel is provided', () => {
      render(<CreateClientForm onCancel={mockOnCancel} />)
      expect(screen.getByText('Anuluj')).toBeInTheDocument()
    })

    it('should not render cancel button when onCancel is not provided', () => {
      render(<CreateClientForm />)
      expect(screen.queryByText('Anuluj')).not.toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreateClientForm onCancel={mockOnCancel} />)

      await user.click(screen.getByText('Anuluj'))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  // ── Error Handling ──────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should show error toast when API call fails', async () => {
      mockCreateClient.mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      render(<CreateClientForm />)

      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/nazwisko/i), 'Kowalski')
      await user.type(screen.getByLabelText(/telefon/i), '500100200')

      fireEvent.click(screen.getByText('Dodaj klienta'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error')
      })
    })
  })
})
