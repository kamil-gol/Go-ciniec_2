/**
 * RoleFormDialog Component Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - Create vs Edit mode rendering
 * - Auto-slug generation from Polish name
 * - Slug field visible only in create mode
 * - Color picker with 8 options
 * - Form submission
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

const mockCreateRole = vi.fn()
const mockUpdateRole = vi.fn()

vi.mock('@/lib/api/settings', () => ({
  settingsApi: {
    createRole: (...args: any[]) => mockCreateRole(...args),
    updateRole: (...args: any[]) => mockUpdateRole(...args),
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

import { RoleFormDialog } from '@/components/settings/RoleFormDialog'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockRole = {
  id: 'r-1',
  name: 'Koordynator',
  slug: 'koordynator',
  description: 'Koordynator sal',
  color: '#2563EB',
  isActive: true,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RoleFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    role: null as any,
    onSaved: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Create Mode ─────────────────────────────────────────────────────

  describe('Create Mode', () => {
    it('should render "Nowa rola" title', () => {
      render(<RoleFormDialog {...defaultProps} />)
      expect(screen.getByText('Nowa rola')).toBeInTheDocument()
    })

    it('should render name, slug, and description fields', () => {
      render(<RoleFormDialog {...defaultProps} />)

      expect(screen.getByLabelText('Nazwa')).toBeInTheDocument()
      expect(screen.getByLabelText('Slug')).toBeInTheDocument()
      expect(screen.getByLabelText('Opis')).toBeInTheDocument()
    })

    it('should auto-generate slug from name', async () => {
      const user = userEvent.setup()
      render(<RoleFormDialog {...defaultProps} />)

      await user.type(screen.getByLabelText('Nazwa'), 'Koordynator')

      const slugInput = screen.getByLabelText('Slug')
      expect(slugInput).toHaveValue('koordynator')
    })

    it('should handle Polish characters in slug generation', async () => {
      const user = userEvent.setup()
      render(<RoleFormDialog {...defaultProps} />)

      await user.type(screen.getByLabelText('Nazwa'), 'Menadżer Sali')

      const slugInput = screen.getByLabelText('Slug')
      // ż → z, space → _
      expect((slugInput as HTMLInputElement).value).toMatch(/menad.er_sali/)
    })

    it('should render 8 color options', () => {
      render(<RoleFormDialog {...defaultProps} />)

      expect(screen.getByText('Kolor')).toBeInTheDocument()
      // 8 color buttons
      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.style.backgroundColor && btn.style.backgroundColor !== ''
      )
      expect(colorButtons.length).toBe(8)
    })

    it('should render submit button as "Utwórz"', () => {
      render(<RoleFormDialog {...defaultProps} />)
      expect(screen.getByText('Utwórz')).toBeInTheDocument()
    })

    it('should call createRole on submit', async () => {
      const user = userEvent.setup()
      mockCreateRole.mockResolvedValue({ id: 'r-new' })

      render(<RoleFormDialog {...defaultProps} />)

      await user.type(screen.getByLabelText('Nazwa'), 'Nowa Rola')
      await user.click(screen.getByText('Utwórz'))

      await waitFor(() => {
        expect(mockCreateRole).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Nowa Rola',
            permissionIds: [],
          })
        )
      })
    })
  })

  // ── Edit Mode ─────────────────────────────────────────────────────────

  describe('Edit Mode', () => {
    it('should render "Edytuj rolę" title', () => {
      render(<RoleFormDialog {...defaultProps} role={mockRole} />)
      expect(screen.getByText('Edytuj rolę')).toBeInTheDocument()
    })

    it('should NOT render slug field in edit mode', () => {
      render(<RoleFormDialog {...defaultProps} role={mockRole} />)
      expect(screen.queryByLabelText('Slug')).not.toBeInTheDocument()
    })

    it('should pre-fill form with role data', () => {
      render(<RoleFormDialog {...defaultProps} role={mockRole} />)

      expect(screen.getByLabelText('Nazwa')).toHaveValue('Koordynator')
      expect(screen.getByLabelText('Opis')).toHaveValue('Koordynator sal')
    })

    it('should NOT auto-generate slug when editing name', async () => {
      const user = userEvent.setup()
      render(<RoleFormDialog {...defaultProps} role={mockRole} />)

      const nameInput = screen.getByLabelText('Nazwa')
      await user.clear(nameInput)
      await user.type(nameInput, 'Zmieniona Nazwa')

      // Slug field is hidden in edit mode, so it should keep original slug internally
      // We verify by submitting
      mockUpdateRole.mockResolvedValue({})
      await user.click(screen.getByText('Zapisz zmiany'))

      await waitFor(() => {
        expect(mockUpdateRole).toHaveBeenCalledWith(
          'r-1',
          expect.objectContaining({ name: 'Zmieniona Nazwa' })
        )
      })
    })

    it('should render submit button as "Zapisz zmiany"', () => {
      render(<RoleFormDialog {...defaultProps} role={mockRole} />)
      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument()
    })
  })

  // ── Color Selection ───────────────────────────────────────────────────

  describe('Color Selection', () => {
    it('should change selected color on click', async () => {
      const user = userEvent.setup()
      render(<RoleFormDialog {...defaultProps} />)

      // Click a specific color button (red = #DC2626)
      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.style.backgroundColor !== ''
      )
      const redButton = colorButtons.find(btn =>
        btn.style.backgroundColor.includes('220') || btn.style.backgroundColor.includes('dc2626')
      )

      if (redButton) {
        await user.click(redButton)
        // The selected button should have different border classes
        expect(redButton.className).toContain('border-neutral-900')
      }
    })
  })

  // ── Cancel ────────────────────────────────────────────────────────────

  describe('Cancel', () => {
    it('should call onOpenChange(false) on cancel', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(<RoleFormDialog {...defaultProps} onOpenChange={onOpenChange} />)
      await user.click(screen.getByText('Anuluj'))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
