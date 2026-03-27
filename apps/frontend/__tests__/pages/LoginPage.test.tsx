/**
 * Login Page Tests
 *
 * Tests the login page (/login):
 * - Renders login form with email and password fields
 * - Displays page heading and branding
 * - Shows forgot password link
 * - Submit button present and clickable
 * - Validation error messages for empty fields
 * - API error display after failed login
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockPush, mockPost } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: mockPost },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import LoginPage from '@/app/login/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn() },
      writable: true,
    })
  })

  it('renders login form heading', () => {
    render(<LoginPage />)
    expect(screen.getByText('Zaloguj się')).toBeInTheDocument()
  })

  it('renders branding text', () => {
    render(<LoginPage />)
    expect(screen.getByText('Gościniec Rodzinny')).toBeInTheDocument()
    expect(screen.getByText('System zarządzania rezerwacjami')).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Adres email')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<LoginPage />)
    const buttons = screen.getAllByText('Zaloguj się')
    // One is the heading h2, one is the button text
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders forgot password link', () => {
    render(<LoginPage />)
    const link = screen.getByText('Nie pamiętam hasła')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('shows validation errors for empty fields on submit', async () => {
    render(<LoginPage />)
    const submitButton = screen.getByRole('button', { name: /zaloguj/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email jest wymagany')).toBeInTheDocument()
      expect(screen.getByText('Hasło jest wymagane')).toBeInTheDocument()
    })
  })

  it('calls API on valid form submission', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, data: { token: 'test-token', refreshToken: 'refresh-token' } },
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Adres email')
    const passwordInput = screen.getByLabelText('Hasło')

    await userEvent.type(emailInput, 'test@example.pl')
    await userEvent.type(passwordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: /zaloguj/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.pl',
        password: 'password123',
      })
    })
  })

  it('redirects to dashboard on successful login', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, data: { token: 'test-token', refreshToken: 'refresh-token' } },
    })

    render(<LoginPage />)

    await userEvent.type(screen.getByLabelText('Adres email'), 'test@example.pl')
    await userEvent.type(screen.getByLabelText('Hasło'), 'password123')
    fireEvent.click(screen.getByRole('button', { name: /zaloguj/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error message on failed login', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: 'Niepoprawny email lub hasło' } },
    })

    render(<LoginPage />)

    await userEvent.type(screen.getByLabelText('Adres email'), 'wrong@test.pl')
    await userEvent.type(screen.getByLabelText('Hasło'), 'wrongpass')
    fireEvent.click(screen.getByRole('button', { name: /zaloguj/i }))

    await waitFor(() => {
      expect(screen.getByText('Błąd logowania')).toBeInTheDocument()
      expect(screen.getByText('Niepoprawny email lub hasło')).toBeInTheDocument()
    })
  })

  it('renders copyright footer', () => {
    render(<LoginPage />)
    expect(screen.getByText(/2026 Gościniec Rodzinny/)).toBeInTheDocument()
  })
})
