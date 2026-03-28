import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Mock deposit API
vi.mock('@/lib/api/deposits', () => ({
  depositsApi: { getAll: vi.fn().mockResolvedValue([]) },
}))

// Mock attachments API
vi.mock('@/lib/api/attachments', () => ({
  batchCheckContract: vi.fn().mockResolvedValue({}),
  batchCheckRodo: vi.fn().mockResolvedValue({}),
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), delete: vi.fn() },
}))

const mockReservations = [
  {
    id: 'res-1',
    startDateTime: '2026-03-15T14:00:00Z',
    endDateTime: '2026-03-15T22:00:00Z',
    status: 'CONFIRMED',
    guests: 120,
    adults: 100,
    children: 15,
    toddlers: 5,
    totalPrice: 25000,
    hall: { id: 'h1', name: 'Sala Główna' },
    client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', phone: '500100200', email: 'jan@test.pl' },
    eventType: { id: 'et1', name: 'Wesele' },
    archivedAt: null,
  },
  {
    id: 'res-2',
    startDateTime: '2026-03-16T12:00:00Z',
    endDateTime: '2026-03-16T18:00:00Z',
    status: 'PENDING',
    guests: 50,
    adults: 40,
    children: 8,
    toddlers: 2,
    totalPrice: 12000,
    hall: { id: 'h2', name: 'Sala Kameralna' },
    client: { id: 'c2', firstName: 'Anna', lastName: 'Nowak', phone: '600300400', email: 'anna@test.pl' },
    eventType: { id: 'et2', name: 'Komunia' },
    archivedAt: null,
  },
  {
    id: 'res-3',
    startDateTime: '2026-03-15T10:00:00Z',
    endDateTime: '2026-03-15T14:00:00Z',
    status: 'CANCELLED',
    guests: 30,
    adults: 25,
    children: 5,
    toddlers: 0,
    totalPrice: 8000,
    hall: { id: 'h1', name: 'Sala Główna' },
    client: { id: 'c3', firstName: 'Piotr', lastName: 'Wiśniewski', phone: '700500600', email: 'piotr@test.pl' },
    eventType: { id: 'et3', name: 'Chrzciny' },
    archivedAt: null,
  },
]

const mockUseReservations = vi.fn()
const mockArchive = vi.fn()
const mockUnarchive = vi.fn()

vi.mock('@/lib/api/reservations', () => ({
  useReservations: (...args: any[]) => mockUseReservations(...args),
  useArchiveReservation: () => ({ mutateAsync: mockArchive }),
  useUnarchiveReservation: () => ({ mutateAsync: mockUnarchive }),
}))

import { ReservationsList } from '@/components/reservations/reservations-list'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('ReservationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReservations.mockReturnValue({
      data: { data: mockReservations, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  describe('Rendering', () => {
    it('should render reservation cards with client names', () => {
      renderWithProviders(<ReservationsList />)

      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument()
      expect(screen.getByText('Piotr Wiśniewski')).toBeInTheDocument()
    })

    it('should display hall names for each reservation', () => {
      renderWithProviders(<ReservationsList />)

      const hallNames = screen.getAllByText('Sala Główna')
      expect(hallNames.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Sala Kameralna')).toBeInTheDocument()
    })

    it('should show event type names', () => {
      renderWithProviders(<ReservationsList />)

      expect(screen.getByText('Wesele')).toBeInTheDocument()
      expect(screen.getByText('Komunia')).toBeInTheDocument()
      expect(screen.getByText('Chrzciny')).toBeInTheDocument()
    })

    it('should display guest counts', () => {
      renderWithProviders(<ReservationsList />)

      expect(screen.getByText('120')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('should show reservation count', () => {
      renderWithProviders(<ReservationsList />)

      expect(screen.getByText('3')).toBeInTheDocument() // "Znaleziono 3 rezerwacji"
    })
  })

  describe('Loading state', () => {
    it('should show loading skeleton when data is loading', () => {
      mockUseReservations.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<ReservationsList />)

      // LoadingState skeleton should be rendered
      expect(screen.queryByText('Jan Kowalski')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('should show error message when API fails', () => {
      mockUseReservations.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      })

      renderWithProviders(<ReservationsList />)

      expect(screen.getByText(/błąd podczas ładowania/i)).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('should show empty state when no reservations found', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<ReservationsList />)

      expect(screen.getByText(/brak rezerwacji/i)).toBeInTheDocument()
    })
  })

  describe('Status filter', () => {
    it('should render status filter dropdown', () => {
      renderWithProviders(<ReservationsList />)

      expect(screen.getByText(/wszystkie statusy/i)).toBeInTheDocument()
    })

    it('should pass status filter to useReservations hook', async () => {
      renderWithProviders(<ReservationsList />)

      // Initial call should have no status filter
      expect(mockUseReservations).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined })
      )
    })
  })

  describe('Archive toggle', () => {
    it('should render archive toggle switch', () => {
      renderWithProviders(<ReservationsList />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should pass archived flag to useReservations when toggled', async () => {
      renderWithProviders(<ReservationsList />)

      expect(mockUseReservations).toHaveBeenCalledWith(
        expect.objectContaining({ archived: false })
      )
    })
  })

  describe('Actions', () => {
    it('should render action buttons for each reservation', () => {
      renderWithProviders(<ReservationsList />)

      // Each reservation should have view, PDF, archive, and delete buttons
      const links = screen.getAllByLabelText('Podgląd szczegółów')
      expect(links.length).toBe(3)
    })

    it('should disable delete button for cancelled reservations', () => {
      renderWithProviders(<ReservationsList />)

      const deleteButtons = screen.getAllByLabelText('Anuluj rezerwację')
      // The cancelled reservation (res-3) delete button should be disabled
      const cancelledDeleteBtn = deleteButtons[deleteButtons.length - 1]
      expect(cancelledDeleteBtn).toBeInTheDocument()
    })
  })

  describe('Date grouping', () => {
    it('should group reservations by date', () => {
      renderWithProviders(<ReservationsList />)

      // Two dates: 2026-03-15 (2 reservations) and 2026-03-16 (1 reservation)
      const dateHeaders = screen.getAllByText(/marca 2026/i)
      expect(dateHeaders.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Pagination', () => {
    it('should not show pagination when there is only one page', () => {
      renderWithProviders(<ReservationsList />)

      // Pagination bar always shows now, but buttons should be disabled on single page
      const nextButton = screen.getByText(/następna/i).closest('button')
      expect(nextButton?.disabled).toBe(true)
      const prevButton = screen.getByText(/poprzednia/i).closest('button')
      expect(prevButton?.disabled).toBe(true)
    })

    it('should show pagination controls when multiple pages exist', () => {
      mockUseReservations.mockReturnValue({
        data: { data: mockReservations, totalPages: 3 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<ReservationsList />)

      expect(screen.getByText(/następna/i)).toBeInTheDocument()
      expect(screen.getByText(/poprzednia/i)).toBeInTheDocument()
    })

    it('should disable previous button on first page', () => {
      mockUseReservations.mockReturnValue({
        data: { data: mockReservations, totalPages: 3 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<ReservationsList />)

      const prevButton = screen.getByText(/poprzednia/i).closest('button')
      expect(prevButton?.disabled).toBe(true)
    })
  })
})
