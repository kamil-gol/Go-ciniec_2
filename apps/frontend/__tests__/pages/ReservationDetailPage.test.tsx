/**
 * Reservation Detail Page Tests
 *
 * Tests the reservation detail page (/dashboard/reservations/[id]):
 * - Shows loading skeleton state
 * - Shows error state when reservation fails to load
 * - Renders reservation data (client name, tabs, hero)
 * - Renders details and history tabs
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseReservation, mockUseCancelReservation, mockUseArchiveReservation, mockUseUnarchiveReservation } = vi.hoisted(() => ({
  mockUseReservation: vi.fn(),
  mockUseCancelReservation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  mockUseArchiveReservation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  mockUseUnarchiveReservation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/reservations/res-1',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'res-1' }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/reservations', () => ({
  useReservation: mockUseReservation,
  useCancelReservation: mockUseCancelReservation,
  useArchiveReservation: mockUseArchiveReservation,
  useUnarchiveReservation: mockUseUnarchiveReservation,
  downloadReservationPDF: vi.fn(),
}))

vi.mock('@/hooks/use-confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    ConfirmDialog: <div data-testid="confirm-dialog" />,
  }),
}))

vi.mock('@/components/shared/ErrorState', () => ({
  ErrorState: ({ title, message }: any) => (
    <div data-testid="error-state">
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}))

vi.mock('@/components/shared/LoadingState', () => ({
  LoadingState: () => <div data-testid="loading-state">Loading...</div>,
}))

vi.mock('@/components/shared/Breadcrumb', () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb">Breadcrumb</nav>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div data-testid="skeleton" className={props.className} />,
}))

vi.mock('@/components/reservations/ReservationMenuSection', () => ({
  ReservationMenuSection: () => <div data-testid="menu-section" />,
}))

vi.mock('@/components/reservations/ReservationFinancialSummary', () => ({
  ReservationFinancialSummary: () => <div data-testid="financial-summary" />,
}))

vi.mock('@/components/reservations/CategoryExtrasList', () => ({
  default: () => <div data-testid="category-extras" />,
}))

vi.mock('@/components/service-extras/ReservationExtrasPanel', () => ({
  ReservationExtrasPanel: () => <div data-testid="extras-panel" />,
}))

vi.mock('@/components/reservations/editable', () => ({
  EditableCard: () => <div data-testid="editable-card" />,
  StatusChanger: () => <div data-testid="status-changer" />,
  EditableHallCard: () => <div data-testid="hall-card" />,
  EditableEventCard: () => <div data-testid="event-card" />,
  EditableGuestsCard: () => <div data-testid="guests-card" />,
  EditableNotesCard: () => <div data-testid="notes-card" />,
  EditableInternalNotesCard: () => <div data-testid="internal-notes-card" />,
}))

vi.mock('@/components/attachments/attachment-panel', () => ({
  default: () => <div data-testid="attachment-panel" />,
}))

vi.mock('@/components/audit-log/EntityActivityTimeline', () => ({
  EntityActivityTimeline: () => <div data-testid="activity-timeline" />,
}))

vi.mock('@/components/reservations/ReservationTimeline', () => ({
  ReservationTimeline: ({ status }: any) => <div data-testid="reservation-timeline">{status}</div>,
}))

vi.mock('./components/ReservationHero', () => ({
  ReservationHero: ({ reservation }: any) => (
    <div data-testid="reservation-hero">{reservation?.client?.firstName}</div>
  ),
}))

vi.mock('./components/QuickActionsCard', () => ({
  QuickActionsCard: () => <div data-testid="quick-actions" />,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import ReservationDetailsPage from '@/app/dashboard/reservations/[id]/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockReservation = {
  id: 'res-1',
  status: 'CONFIRMED',
  startDateTime: '2026-06-15T14:00:00.000Z',
  endDateTime: '2026-06-15T22:00:00.000Z',
  date: '2026-06-15',
  adults: 80,
  children: 10,
  toddlers: 5,
  notes: 'Test notes',
  internalNotes: null,
  pricePerAdult: 250,
  pricePerChild: 150,
  pricePerToddler: 0,
  totalPrice: 21500,
  discountType: null,
  discountValue: null,
  discountAmount: null,
  discountReason: null,
  priceBeforeDiscount: null,
  categoryExtras: [],
  categoryExtrasTotal: null,
  venueSurcharge: null,
  venueSurchargeLabel: null,
  confirmationDeadline: null,
  archivedAt: null,
  client: { firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.pl', phone: '500100200' },
  hall: { id: 'hall-1', name: 'Sala Wielka', capacity: 200, isWholeVenue: false },
  eventType: { id: 'et-1', name: 'Wesele', standardHours: 8, extraHourRate: 600 },
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ReservationDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress window.scrollTo in tests
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  it('shows loading skeletons when data is loading', () => {
    mockUseReservation.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ReservationDetailsPage />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error state when reservation fails to load', () => {
    mockUseReservation.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    render(<ReservationDetailsPage />)
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
    expect(screen.getByText('Nie udało się załadować rezerwacji')).toBeInTheDocument()
  })

  it('shows error state when reservation data is null', () => {
    mockUseReservation.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ReservationDetailsPage />)
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
  })

  it('renders client info when data is loaded', () => {
    mockUseReservation.mockReturnValue({
      data: mockReservation,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ReservationDetailsPage />)
    expect(screen.getByText('Anna Nowak')).toBeInTheDocument()
    expect(screen.getByText('anna@test.pl')).toBeInTheDocument()
    expect(screen.getByText('500100200')).toBeInTheDocument()
  })

  it('renders details and history tabs', () => {
    mockUseReservation.mockReturnValue({
      data: mockReservation,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ReservationDetailsPage />)
    expect(screen.getByText('Szczegóły')).toBeInTheDocument()
    expect(screen.getByText('Historia')).toBeInTheDocument()
  })

  it('renders back link to reservations list', () => {
    mockUseReservation.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    render(<ReservationDetailsPage />)
    expect(screen.getByText('Powrót do listy')).toBeInTheDocument()
  })
})
