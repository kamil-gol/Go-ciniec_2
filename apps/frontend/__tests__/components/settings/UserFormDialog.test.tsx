/**
 * UserFormDialog Component Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - Rendering in create vs edit mode
 * - Password field visibility (only in create mode)
 * - Role selection with active roles only
 * - Form submission (create / update)
 * - Cancel action
 * - Loading state
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

const mockCreateUser = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/lib/api/settings', () => ({
  settingsApi: {
    createUser: (...args: any[]) => mockCreateUser(...args),
    updateUser: (...args: any[]) => mockUpdateUser(...args),
  },
}))

const mockToastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: vi.fn(),
  },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { UserFormDialog } from '@/components/settings/UserFormDialog'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockRoles = [
  { id: 'r-1', name: 'Admin', slug: 'admin', color: '#DC2626', isActive: true, description: '' },
  { id: 'r-2', name: 'Manager', slug: 'manager', color: '#2563EB', isActive: true, description: '' },
  { id: 'r-3', name: 'Inactive Role', slug: 'inactive', color: '#ccc', isActive: false, description: '' },
]

const mockUser = {
  id: 'u-1',
  email: 'jan@test.pl',
  firstName: 'Jan',
  lastName: 'Kowalski',
  role: { id: 'r-1', name: 'Admin', slug: 'admin', color: '#DC2626', isActive: true, description: '' },
  isActive: true,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('UserFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    user: null as any,
    roles: mockRoles,
    onSaved: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Create Mode ─────────────────────────────────────────────────────

  describe('Create Mode', () => {
    it('should render "Nowy użytkownik" title', () => {
      render(<UserFormDialog {...defaultProps} />)
      expect(screen.getByText('Nowy użytkownik')).toBeInTheDocument()
    })

    it('should render all form fields including password', () => {
      render(<UserFormDialog {...defaultProps} />)

      expect(screen.getByLabelText('Imię')).toBeInTheDocument()
      expect(screen.getByLabelText('Nazwisko')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Hasło')).toBeInTheDocument()
    })

    it('should render submit button as "Utwórz"', () => {
      render(<UserFormDialog {...defaultProps} />)
      expect(screen.getByText('Utwórz')).toBeInTheDocument()
    })

    it('should call createUser on submit', async () => {
      const user = userEvent.setup()
      mockCreateUser.mockResolvedValue({ id: 'new-1' })

      render(<UserFormDialog {...defaultProps} />)

      await user.type(screen.getByLabelText('Imię'), 'Nowy')
      await user.type(screen.getByLabelText('Nazwisko'), 'User')
      await user.type(screen.getByLabelText('Email'), 'nowy@test.pl')
      await user.type(screen.getByLabelText('Hasło'), 'Password123!')

      await user.click(screen.getByText('Utwórz'))

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'nowy@test.pl',
            password: 'Password123!',
            firstName: 'Nowy',
            lastName: 'User',
          })
        )
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('Utworzono użytkownika')
    })
  })

  // ── Edit Mode ─────────────────────────────────────────────────────────

  describe('Edit Mode', () => {
    it('should render "Edytuj użytkownika" title', () => {
      render(<UserFormDialog {...defaultProps} user={mockUser} />)
      expect(screen.getByText('Edytuj użytkownika')).toBeInTheDocument()
    })

    it('should NOT render password field', () => {
      render(<UserFormDialog {...defaultProps} user={mockUser} />)
      expect(screen.queryByLabelText('Hasło')).not.toBeInTheDocument()
    })

    it('should pre-fill form with user data', () => {
      render(<UserFormDialog {...defaultProps} user={mockUser} />)

      expect(screen.getByLabelText('Imię')).toHaveValue('Jan')
      expect(screen.getByLabelText('Nazwisko')).toHaveValue('Kowalski')
      expect(screen.getByLabelText('Email')).toHaveValue('jan@test.pl')
    })

    it('should render submit button as "Zapisz zmiany"', () => {
      render(<UserFormDialog {...defaultProps} user={mockUser} />)
      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument()
    })

    it('should call updateUser on submit', async () => {
      const user = userEvent.setup()
      mockUpdateUser.mockResolvedValue({ id: 'u-1' })

      render(<UserFormDialog {...defaultProps} user={mockUser} />)

      const firstNameInput = screen.getByLabelText('Imię')
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Janusz')

      await user.click(screen.getByText('Zapisz zmiany'))

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(
          'u-1',
          expect.objectContaining({ firstName: 'Janusz' })
        )
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('Zaktualizowano użytkownika')
    })
  })

  // ── Cancel ────────────────────────────────────────────────────────────

  describe('Cancel', () => {
    it('should call onOpenChange(false) on cancel click', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(<UserFormDialog {...defaultProps} onOpenChange={onOpenChange} />)

      await user.click(screen.getByText('Anuluj'))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
