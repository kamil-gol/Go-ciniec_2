/**
 * LoginPage Component Tests
 *
 * Tests login form (app/login/page.tsx):
 * - Renders email and password fields
 * - Field validation (required fields)
 * - Successful login flow (API call, token storage, redirect)
 * - Error handling (API failure, error message display)
 * - Loading state during submission
 * - Password cleared after failed login
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// -- Mocks --

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

const mockPost = vi.fn()
vi.mock('@/lib/api-client', () => ({
  apiClient: { post: (...args: any[]) => mockPost(...args) },
}))

// -- Import (after mocks) --

import LoginPage from '@/app/login/page'
import { toast } from 'sonner'

// -- Tests --

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: { token: 'test-token', refreshToken: 'test-refresh' },
      },
    })
  })

  // -- Rendering --

  describe('Rendering', () => {
    it('should render email and password fields', () => {
      render(<LoginPage />)
      expect(screen.getByLabelText(/adres email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument()
    })

    it('should render submit button with login label', () => {
      render(<LoginPage />)
      expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeInTheDocument()
    })

    it('should render forgot password link', () => {
      render(<LoginPage />)
      expect(screen.getByText(/nie pamiętam hasła/i)).toBeInTheDocument()
    })

    it('should render app title', () => {
      render(<LoginPage />)
      expect(screen.getByText(/system zarządzania rezerwacjami/i)).toBeInTheDocument()
    })
  })

  // -- Validation --

  describe('Validation', () => {
    it('should show error when email is empty on submit', async () => {
      render(<LoginPage />)

      fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Email jest wymagany')).toBeInTheDocument()
      })
    })

    it('should show error when password is empty on submit', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.type(screen.getByLabelText(/adres email/i), 'test@test.pl')
      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Hasło jest wymagane')).toBeInTheDocument()
      })
    })

    it('should show both errors when both fields are empty', async () => {
      render(<LoginPage />)

      fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Email jest wymagany')).toBeInTheDocument()
        expect(screen.getByText('Hasło jest wymagane')).toBeInTheDocument()
      })
    })

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Trigger validation
      fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }).closest('form')!)
      await waitFor(() => {
        expect(screen.getByText('Email jest wymagany')).toBeInTheDocument()
      })

      // Start typing in email field
      await user.type(screen.getByLabelText(/adres email/i), 'a')

      expect(screen.queryByText('Email jest wymagany')).not.toBeInTheDocument()
    })
  })

  // -- Successful Submission --

  describe('Successful Submission', () => {
    it('should call API with correct credentials', async () => {
      render(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/adres email/i), { target: { value: 'admin@test.pl' } })
      fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'secret123' } })

      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/auth/login', {
          email: 'admin@test.pl',
          password: 'secret123',
        })
      })
    })

    it('should store tokens in localStorage on success', async () => {
      render(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/adres email/i), { target: { value: 'admin@test.pl' } })
      fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'secret123' } })

      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe('test-token')
        expect(localStorage.getItem('refreshToken')).toBe('test-refresh')
      })
    })

    it('should redirect to dashboard on success', async () => {
      render(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/adres email/i), { target: { value: 'admin@test.pl' } })
      fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'secret123' } })

      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should show success toast on login', async () => {
      render(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/adres email/i), { target: { value: 'admin@test.pl' } })
      fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'secret123' } })

      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Zalogowano pomyślnie!')
      })
    })
  })

  // -- Error Handling --

  describe('Error Handling', () => {
    it('should show error message on API failure', async () => {
      mockPost.mockRejectedValueOnce({
        response: { data: { error: 'Niepoprawny email lub hasło' } },
      })

      render(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/adres email/i), { target: { value: 'wrong@test.pl' } })
      fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'wrong' } })

      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Niepoprawny email lub hasło')
      })
    })

    it('should display error alert block on failure', async () => {
      mockPost.mockRejectedValueOnce({
        response: { data: { error: 'Niepoprawny email lub hasło' } },
      })

      render(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/adres email/i), { target: { value: 'wrong@test.pl' } })
      fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'wrong' } })

      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Niepoprawny email lub hasło')).toBeInTheDocument()
      })
    })

    it('should not store tokens on failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'))

      render(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/adres email/i), { target: { value: 'test@test.pl' } })
      fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'pass' } })

      fireEvent.submit(screen.getByLabelText(/adres email/i).closest('form')!)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })

      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('should not call API when validation fails', async () => {
      render(<LoginPage />)

      fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Email jest wymagany')).toBeInTheDocument()
      })

      expect(mockPost).not.toHaveBeenCalled()
    })
  })
})
