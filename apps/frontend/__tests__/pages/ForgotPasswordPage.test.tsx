/**
 * Forgot Password Page Tests
 *
 * Tests the forgot password page (/forgot-password):
 * - Renders form with email field
 * - Shows heading and description
 * - Back to login link
 * - Validation for empty email
 * - Validation for invalid email format
 * - Success state after submission
 * - Error state on API failure
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/forgot-password',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: mockPost },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import ForgotPasswordPage from '@/app/forgot-password/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page heading', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Resetuj hasło')).toBeInTheDocument()
  })

  it('renders branding', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Gościniec Rodzinny')).toBeInTheDocument()
  })

  it('renders email input', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByLabelText('Adres email')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Wyślij link resetujący')).toBeInTheDocument()
  })

  it('renders back to login link', () => {
    render(<ForgotPasswordPage />)
    const link = screen.getByText('Wróć do logowania')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  it('shows error for empty email on submit', async () => {
    render(<ForgotPasswordPage />)
    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }))

    await waitFor(() => {
      expect(screen.getByText('Adres email jest wymagany')).toBeInTheDocument()
    })
  })

  it('shows error for invalid email format', async () => {
    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Adres email'), 'not-an-email')
    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }))

    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy format adresu email')).toBeInTheDocument()
    })
  })

  it('shows success state after valid submission', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } })

    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Adres email'), 'user@example.pl')
    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }))

    await waitFor(() => {
      expect(screen.getByText('Sprawdź swoją skrzynkę')).toBeInTheDocument()
    })
  })

  it('calls API with correct email', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } })

    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Adres email'), 'user@example.pl')
    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'user@example.pl' })
    })
  })

  it('shows return to login link in success state', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } })

    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Adres email'), 'user@example.pl')
    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }))

    await waitFor(() => {
      const link = screen.getByText('Wróć do logowania')
      expect(link.closest('a')).toHaveAttribute('href', '/login')
    })
  })

  it('shows error on API failure', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: 'Wystąpił błąd. Spróbuj ponownie.' } },
    })

    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Adres email'), 'user@example.pl')
    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }))

    await waitFor(() => {
      expect(screen.getByText('Wystąpił błąd. Spróbuj ponownie.')).toBeInTheDocument()
    })
  })

  it('renders copyright footer', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText(/2026 Gościniec Rodzinny/)).toBeInTheDocument()
  })
})
