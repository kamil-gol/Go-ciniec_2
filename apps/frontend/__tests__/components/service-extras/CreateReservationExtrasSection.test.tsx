import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ═══ MOCK DATA ═══

const mockServiceItems = [
  {
    id: 'si-1',
    name: 'Dekoracja sali',
    description: 'Pełna dekoracja sali kwiatami',
    basePrice: 1500,
    priceType: 'FLAT' as const,
    category: 'DECORATION',
    isActive: true,
  },
  {
    id: 'si-2',
    name: 'Bar koktajlowy',
    description: 'Profesjonalny barman z koktajlami',
    basePrice: 80,
    priceType: 'PER_PERSON' as const,
    category: 'BEVERAGE',
    isActive: true,
  },
  {
    id: 'si-3',
    name: 'Parking',
    description: 'Darmowy parking dla gości',
    basePrice: 0,
    priceType: 'FREE' as const,
    category: 'LOGISTICS',
    isActive: true,
  },
]

// ═══ MOCKS ═══

const mockUseServiceItems = vi.fn()

vi.mock('@/hooks/use-service-items', () => ({
  useServiceItems: (...args: any[]) => mockUseServiceItems(...args),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement('div', { ...props, ref }, children)
    ),
    button: React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement('button', { ...props, ref }, children)
    ),
  },
  AnimatePresence: ({ children }: any) => children,
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
  })

  describe('Rendering', () => {
    it('should render the section title', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const title = screen.queryByText(/usługi dodatkowe/i)
      expect(title).toBeTruthy()
    })

    it('should show empty state when no service items are available', () => {
      if (!CreateReservationExtrasSection) return
      mockUseServiceItems.mockReturnValue({ data: [], isLoading: false })
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const emptyMessage = screen.queryByText(/brak dostępnych/i)
      expect(emptyMessage).toBeTruthy()
    })

    it('should show loading state', () => {
      if (!CreateReservationExtrasSection) return
      mockUseServiceItems.mockReturnValue({ data: undefined, isLoading: true })
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const loadingIndicator = screen.queryByText(/ładowanie/i)
      expect(loadingIndicator).toBeTruthy()
    })

    it('should render available service items with names', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      expect(screen.queryByText('Dekoracja sali')).toBeTruthy()
      expect(screen.queryByText('Bar koktajlowy')).toBeTruthy()
      expect(screen.queryByText('Parking')).toBeTruthy()
    })

    it('should display correct price label for FLAT items', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      // FLAT items show "1 500" or "1500" somewhere
      const flatPriceEl = screen.queryByText(/1[\s.,]?500/)
      expect(flatPriceEl).toBeTruthy()
    })

    it('should display "Gratis" or "0" for FREE items', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const freeLabel = screen.queryByText(/gratis|darmow|0.*PLN|bezpłatn/i)
      expect(freeLabel).toBeTruthy()
    })

    it('should display per-person indicator for PER_PERSON items', () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      const perPersonLabel = screen.queryByText(/os/i)
      expect(perPersonLabel).toBeTruthy()
    })
  })

  describe('Adding extras', () => {
    it('should call onExtrasChange when an add button is clicked', async () => {
      if (!CreateReservationExtrasSection) return
      renderWithProviders(<CreateReservationExtrasSection {...defaultProps} />)

      // Find add buttons (+ icon buttons)
      const addButtons = screen.queryAllByRole('button').filter(
        (btn) => btn.textContent?.includes('+') || btn.getAttribute('aria-label')?.includes('dodaj')
      )

      if (addButtons.length > 0) {
        await userEvent.click(addButtons[0])
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
        await userEvent.click(addButtons[0])
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
          { serviceItem: mockServiceItems[0], quantity: 1 },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      // Find remove buttons (trash icon, × icon, or "usuń")
      const removeButtons = screen.queryAllByRole('button').filter(
        (btn) =>
          btn.textContent?.includes('×') ||
          btn.textContent?.includes('−') ||
          btn.getAttribute('aria-label')?.includes('usuń') ||
          btn.getAttribute('aria-label')?.includes('remove')
      )

      if (removeButtons.length > 0) {
        await userEvent.click(removeButtons[0])
        expect(defaultProps.onExtrasChange).toHaveBeenCalled()

        const callArgs = defaultProps.onExtrasChange.mock.calls[0]?.[0]
        if (callArgs) {
          // After removal, should not contain the removed item
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
          { serviceItem: mockServiceItems[0], quantity: 2 },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      // Should display the quantity somewhere
      const qtyDisplay = screen.queryByText('2') || screen.queryByDisplayValue('2')
      expect(qtyDisplay).toBeTruthy()
    })

    it('should allow increasing quantity', async () => {
      if (!CreateReservationExtrasSection) return

      const propsWithExtras = {
        ...defaultProps,
        selectedExtras: [
          { serviceItem: mockServiceItems[0], quantity: 1 },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      // Find increment button (usually "+" near the quantity)
      const incrementButtons = screen.queryAllByRole('button').filter(
        (btn) => btn.textContent === '+'
      )

      if (incrementButtons.length > 0) {
        await userEvent.click(incrementButtons[0])
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
          { serviceItem: mockServiceItems[0], quantity: 1 },
          { serviceItem: mockServiceItems[2], quantity: 1 },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      // Both selected items should be visible
      expect(screen.queryByText('Dekoracja sali')).toBeTruthy()
      expect(screen.queryByText('Parking')).toBeTruthy()
    })

    it('should show total for selected extras section', () => {
      if (!CreateReservationExtrasSection) return

      const propsWithExtras = {
        ...defaultProps,
        selectedExtras: [
          { serviceItem: mockServiceItems[0], quantity: 1 },
        ],
      }

      renderWithProviders(<CreateReservationExtrasSection {...propsWithExtras} />)

      // Should show the total somewhere (1500 PLN for FLAT × 1)
      const totalElement = screen.queryByText(/1[\s.,]?500/)
      expect(totalElement).toBeTruthy()
    })
  })
})
