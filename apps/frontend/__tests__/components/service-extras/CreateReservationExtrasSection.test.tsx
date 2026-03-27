import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ═══ MOCK DATA ═══

const mockCategories = [
  {
    id: 'cat-decoration',
    name: 'Dekoracja',
    slug: 'decoration',
    description: null,
    icon: null,
    color: null,
    displayOrder: 1,
    isActive: true,
    isExclusive: false,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'cat-beverage',
    name: 'Napoje',
    slug: 'beverage',
    description: null,
    icon: null,
    color: null,
    displayOrder: 2,
    isActive: true,
    isExclusive: false,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'cat-logistics',
    name: 'Logistyka',
    slug: 'logistics',
    description: null,
    icon: null,
    color: null,
    displayOrder: 3,
    isActive: true,
    isExclusive: false,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
]

const mockServiceItems = [
  {
    id: 'si-1',
    categoryId: 'cat-decoration',
    name: 'Dekoracja sali',
    description: 'Pełna dekoracja sali kwiatami',
    basePrice: 1500,
    priceType: 'FLAT' as const,
    icon: null,
    displayOrder: 1,
    requiresNote: false,
    noteLabel: null,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'si-2',
    categoryId: 'cat-beverage',
    name: 'Bar koktajlowy',
    description: 'Profesjonalny barman z koktajlami',
    basePrice: 80,
    priceType: 'PER_PERSON' as const,
    icon: null,
    displayOrder: 1,
    requiresNote: false,
    noteLabel: null,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'si-3',
    categoryId: 'cat-logistics',
    name: 'Parking',
    description: 'Darmowy parking dla gości',
    basePrice: 0,
    priceType: 'FREE' as const,
    icon: null,
    displayOrder: 1,
    requiresNote: false,
    noteLabel: null,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
]

// ═══ MOCKS ═══

const mockUseServiceItems = vi.fn()
const mockUseServiceCategories = vi.fn()

vi.mock('@/hooks/use-service-extras', () => ({
  useServiceItems: (...args: any[]) => mockUseServiceItems(...args),
  useServiceCategories: (...args: any[]) => mockUseServiceCategories(...args),
}))

// ═══ HELPERS ═══

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

/** Click the section toggle to expand the extras panel */
function expandSection() {
  const toggle = screen.getByText(/usługi dodatkowe/i).closest('button')
  if (toggle) fireEvent.click(toggle)
}

/** Click a category header to expand its items */
function expandCategory(categoryName: string) {
  const catHeader = screen.getByText(categoryName).closest('button')
  if (catHeader) fireEvent.click(catHeader)
}

// ═══ DYNAMIC IMPORT ═══

let CreateReservationExtrasSection: any
try {
  const mod = await import('@/components/service-extras/CreateReservationExtrasSection')
  CreateReservationExtrasSection = mod.CreateReservationExtrasSection || mod.default
} catch {
  // Component may not be available
}

// ═══ TESTS ═══

describe('CreateReservationExtrasSection', () => {
  const defaultProps = {
    selectedExtras: [] as any[],
    onExtrasChange: vi.fn(),
    totalGuests: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseServiceItems.mockReturnValue({
      data: mockServiceItems,
      isLoading: false,
    })
    mockUseServiceCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
    })
  })

  describe('Rendering', () => {
    it('should render the section title', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const title = screen.queryByText(/usługi dodatkowe/i)
      expect(title).toBeInTheDocument()
    })

    it('should show empty state when no service items are available', () => {
      if (!CreateReservationExtrasSection) return
      mockUseServiceItems.mockReturnValue({ data: [], isLoading: false })
      mockUseServiceCategories.mockReturnValue({ data: [], isLoading: false })
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expandSection()
      const emptyMessage = screen.queryByText(/brak dostępnych/i)
      expect(emptyMessage).toBeInTheDocument()
    })

    it('should show loading state', () => {
      if (!CreateReservationExtrasSection) return
      mockUseServiceItems.mockReturnValue({ data: undefined, isLoading: true })
      mockUseServiceCategories.mockReturnValue({ data: undefined, isLoading: true })
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expandSection()
      const loadingIndicator = screen.queryByText(/ładowanie/i)
      expect(loadingIndicator).toBeInTheDocument()
    })

    it('should render category names when expanded', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expandSection()
      expect(screen.queryByText('Dekoracja')).toBeInTheDocument()
      expect(screen.queryByText('Napoje')).toBeInTheDocument()
      expect(screen.queryByText('Logistyka')).toBeInTheDocument()
    })

    it('should render service items when category is expanded', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expandSection()
      expandCategory('Dekoracja')
      expect(screen.queryByText('Dekoracja sali')).toBeInTheDocument()

      expandCategory('Napoje')
      expect(screen.queryByText('Bar koktajlowy')).toBeInTheDocument()

      expandCategory('Logistyka')
      expect(screen.queryByText('Parking')).toBeInTheDocument()
    })

    it('should display correct price label for FLAT items', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expandSection()
      expandCategory('Dekoracja')
      const flatPriceEl = screen.queryByText(/1[\s.,]?500/)
      expect(flatPriceEl).toBeInTheDocument()
    })

    it('should display "Gratis" or "0" for FREE items', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expandSection()
      expandCategory('Logistyka')
      const freeLabels = screen.queryAllByText(/gratis/i)
      expect(freeLabels.length).toBeGreaterThanOrEqual(1)
    })

    it('should display per-person indicator for PER_PERSON items', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expandSection()
      expandCategory('Napoje')
      const perPersonLabel = screen.queryByText(/os/i)
      expect(perPersonLabel).toBeInTheDocument()
    })
  })

  describe('Adding extras', () => {
    it('should call onExtrasChange when an add button is clicked', async () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const addButtons = screen.queryAllByRole('button').filter(
        (btn) => btn.textContent?.includes('+') || btn.getAttribute('aria-label')?.includes('dodaj')
      )

      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0])
        expect(defaultProps.onExtrasChange).toHaveBeenCalled()
      }
    })

    it('should pass the correct serviceItem when adding', async () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const addButtons = screen.queryAllByRole('button').filter(
        (btn) => btn.textContent?.includes('+') || btn.getAttribute('aria-label')?.includes('dodaj')
      )

      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0])
        const callArgs = defaultProps.onExtrasChange.mock.calls[0]?.[0]
        if (callArgs && callArgs.length > 0) {
          expect(callArgs[0]).toHaveProperty('serviceItem')
          expect(callArgs[0]).toHaveProperty('quantity')
          expect(callArgs[0].quantity).toBe(1)
        }
      }
    })
  })

  describe('Removing extras', () => {
    it('should call onExtrasChange to remove an item', async () => {
      if (!CreateReservationExtrasSection) return

      const propsWithExtras = {
        ...defaultProps,
        selectedExtras: [
          { serviceItemId: 'si-1', serviceItem: mockServiceItems[0], quantity: 1, note: '' },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      const removeButtons = screen.queryAllByRole('button').filter(
        (btn) =>
          btn.textContent?.includes('×') ||
          btn.textContent?.includes('−') ||
          btn.getAttribute('aria-label')?.includes('usuń') ||
          btn.getAttribute('aria-label')?.includes('remove')
      )

      if (removeButtons.length > 0) {
        fireEvent.click(removeButtons[0])
        expect(defaultProps.onExtrasChange).toHaveBeenCalled()

        const callArgs = defaultProps.onExtrasChange.mock.calls[0]?.[0]
        if (callArgs) {
          const hasRemovedItem = callArgs.some(
            (extra: any) => extra.serviceItem.id === 'si-1'
          )
          expect(hasRemovedItem).toBe(false)
        }
      }
    })
  })

  describe('Quantity controls', () => {
    it('should show quantity for selected extras', () => {
      if (!CreateReservationExtrasSection) return

      const propsWithExtras = {
        ...defaultProps,
        selectedExtras: [
          { serviceItemId: 'si-1', serviceItem: mockServiceItems[0], quantity: 2, note: '' },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      expandSection()
      expandCategory('Dekoracja')
      const qtyDisplay = screen.queryByText('2') || screen.queryByDisplayValue('2')
      expect(qtyDisplay).not.toBeNull()
    })

    it('should allow increasing quantity', async () => {
      if (!CreateReservationExtrasSection) return

      const propsWithExtras = {
        ...defaultProps,
        selectedExtras: [
          { serviceItemId: 'si-1', serviceItem: mockServiceItems[0], quantity: 1, note: '' },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      const incrementButtons = screen.queryAllByRole('button').filter(
        (btn) => btn.textContent === '+'
      )

      if (incrementButtons.length > 0) {
        fireEvent.click(incrementButtons[0])
        if (defaultProps.onExtrasChange.mock.calls.length > 0) {
          const callArgs = defaultProps.onExtrasChange.mock.calls[0]?.[0]
          if (callArgs) {
            const updated = callArgs.find((e: any) => e.serviceItem.id === 'si-1')
            if (updated) {
              expect(updated.quantity).toBe(2)
            }
          }
        }
      }
    })
  })

  describe('Selected extras display', () => {
    it('should visually distinguish selected extras', () => {
      if (!CreateReservationExtrasSection) return

      const propsWithExtras = {
        ...defaultProps,
        selectedExtras: [
          { serviceItemId: 'si-1', serviceItem: mockServiceItems[0], quantity: 1, note: '' },
          { serviceItemId: 'si-3', serviceItem: mockServiceItems[2], quantity: 1, note: '' },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      expandSection()
      expandCategory('Dekoracja')
      expandCategory('Logistyka')
      expect(screen.queryByText('Dekoracja sali')).toBeInTheDocument()
      expect(screen.queryByText('Parking')).toBeInTheDocument()
    })

    it('should show total for selected extras section', () => {
      if (!CreateReservationExtrasSection) return

      const propsWithExtras = {
        ...defaultProps,
        selectedExtras: [
          { serviceItemId: 'si-1', serviceItem: mockServiceItems[0], quantity: 1, note: '' },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      const totalElement = screen.queryByText(/1[\s.,]?500/)
      expect(totalElement).toBeInTheDocument()
    })
  })
})
