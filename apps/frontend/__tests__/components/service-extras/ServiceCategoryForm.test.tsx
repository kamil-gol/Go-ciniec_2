/**
 * ServiceCategoryForm Component Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - Form rendering (create vs edit mode)
 * - Auto-slug generation from name
 * - Manual slug disables auto mode
 * - Validation (name, slug required)
 * - Toggles (isExclusive, isActive)
 * - Form submission (create / update)
 * - Loading state
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockCreateMutateAsync = vi.fn()
const mockUpdateMutateAsync = vi.fn()

vi.mock('@/hooks/use-service-extras', () => ({
  useCreateCategory: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateCategory: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { ServiceCategoryForm } from '@/components/service-extras/ServiceCategoryForm'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockCategory = {
  id: 'cat-1',
  name: 'Tort',
  slug: 'tort',
  description: 'Tort weselny',
  icon: '🎂',
  color: '#3B82F6',
  isActive: true,
  isExclusive: false,
  sortOrder: 0,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ServiceCategoryForm', () => {
  const defaultProps = {
    category: null as any,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Create Mode Rendering ─────────────────────────────────────────────

  describe('Create Mode', () => {
    it('should render all fields', () => {
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByLabelText(/Nazwa kategorii/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Slug/)).toBeInTheDocument()
      expect(screen.getByLabelText('Opis')).toBeInTheDocument()
      expect(screen.getByLabelText(/Ikona/)).toBeInTheDocument()
      expect(screen.getByLabelText('Kolor')).toBeInTheDocument()
    })

    it('should render toggle switches', () => {
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Kategoria wyłączna')).toBeInTheDocument()
      expect(screen.getByText('Aktywna')).toBeInTheDocument()
    })

    it('should render "Utwórz kategorię" button', () => {
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })
      expect(screen.getByText('Utwórz kategorię')).toBeInTheDocument()
    })

    it('should auto-generate slug from name', async () => {
      const user = userEvent.setup()
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText(/Nazwa kategorii/), 'Wystrój sali')

      await waitFor(() => {
        expect(screen.getByLabelText(/Slug/)).toHaveValue('wystroj-sali')
      })
    })

    it('should handle Polish ł in slug', async () => {
      const user = userEvent.setup()
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText(/Nazwa kategorii/), 'Łuk Balonowy')

      await waitFor(() => {
        const slug = (screen.getByLabelText(/Slug/) as HTMLInputElement).value
        expect(slug).toBe('luk-balonowy')
      })
    })
  })

  // ── Auto-slug Toggle ──────────────────────────────────────────────────

  describe('Auto-slug', () => {
    it('should disable auto-slug when slug field is manually edited', async () => {
      const user = userEvent.setup()
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      // Type name first — auto-slug fires
      await user.type(screen.getByLabelText(/Nazwa kategorii/), 'Test')
      expect(screen.getByLabelText(/Slug/)).toHaveValue('test')

      // Manually edit slug
      const slugInput = screen.getByLabelText(/Slug/)
      await user.clear(slugInput)
      await user.type(slugInput, 'custom-slug')

      // Now typing more into name should NOT change slug
      await user.type(screen.getByLabelText(/Nazwa kategorii/), ' More')

      await waitFor(() => {
        expect(screen.getByLabelText(/Slug/)).toHaveValue('custom-slug')
      })
    })
  })

  // ── Validation ────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('should show error toast when name is empty', async () => {
      const user = userEvent.setup()
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      await user.click(screen.getByText('Utwórz kategorię'))

      expect(mockToastError).toHaveBeenCalledWith('Nazwa jest wymagana')
      expect(mockCreateMutateAsync).not.toHaveBeenCalled()
    })

    it('should show error toast when slug is empty', async () => {
      const user = userEvent.setup()
      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      // Type name but clear auto-generated slug
      await user.type(screen.getByLabelText(/Nazwa kategorii/), 'Test')
      const slugInput = screen.getByLabelText(/Slug/)
      await user.clear(slugInput)

      await user.click(screen.getByText('Utwórz kategorię'))

      expect(mockToastError).toHaveBeenCalledWith('Slug jest wymagany')
      expect(mockCreateMutateAsync).not.toHaveBeenCalled()
    })
  })

  // ── Submission ────────────────────────────────────────────────────────

  describe('Submission', () => {
    it('should call createCategory on valid submit', async () => {
      const user = userEvent.setup()
      mockCreateMutateAsync.mockResolvedValue({ id: 'new-cat' })

      render(<ServiceCategoryForm {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText(/Nazwa kategorii/), 'Muzyka')
      await user.click(screen.getByText('Utwórz kategorię'))

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Muzyka',
            slug: 'muzyka',
            isActive: true,
            isExclusive: false,
          })
        )
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('Kategoria utworzona: Muzyka')
    })

    it('should call onClose after successful create', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      mockCreateMutateAsync.mockResolvedValue({})

      render(
        <ServiceCategoryForm category={null} onClose={onClose} />,
        { wrapper: createWrapper() }
      )

      await user.type(screen.getByLabelText(/Nazwa kategorii/), 'Test')
      await user.click(screen.getByText('Utwórz kategorię'))

      await waitFor(() => expect(onClose).toHaveBeenCalled())
    })
  })

  // ── Edit Mode ─────────────────────────────────────────────────────────

  describe('Edit Mode', () => {
    it('should pre-fill form with category data', () => {
      render(
        <ServiceCategoryForm category={mockCategory} onClose={vi.fn()} />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByLabelText(/Nazwa kategorii/)).toHaveValue('Tort')
      expect(screen.getByLabelText(/Slug/)).toHaveValue('tort')
      expect(screen.getByLabelText('Opis')).toHaveValue('Tort weselny')
    })

    it('should render "Zapisz zmiany" button', () => {
      render(
        <ServiceCategoryForm category={mockCategory} onClose={vi.fn()} />,
        { wrapper: createWrapper() }
      )
      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument()
    })

    it('should call updateCategory on submit in edit mode', async () => {
      const user = userEvent.setup()
      mockUpdateMutateAsync.mockResolvedValue({})

      render(
        <ServiceCategoryForm category={mockCategory} onClose={vi.fn()} />,
        { wrapper: createWrapper() }
      )

      const nameInput = screen.getByLabelText(/Nazwa kategorii/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Tort Premium')
      await user.click(screen.getByText('Zapisz zmiany'))

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'cat-1',
            data: expect.objectContaining({ name: 'Tort Premium' }),
          })
        )
      })
    })
  })

  // ── Cancel ────────────────────────────────────────────────────────────

  describe('Cancel', () => {
    it('should call onClose on cancel click', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<ServiceCategoryForm category={null} onClose={onClose} />, { wrapper: createWrapper() })
      await user.click(screen.getByText('Anuluj'))

      expect(onClose).toHaveBeenCalled()
    })
  })
})
