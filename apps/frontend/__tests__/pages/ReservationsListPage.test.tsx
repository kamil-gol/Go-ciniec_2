/**
 * Reservations List Page Tests
 *
 * Tests the reservations list page (/dashboard/reservations/list):
 * - Renders page hero with title
 * - Displays stat cards
 * - Shows "New Reservation" button
 * - Calendar/List view toggle
 * - Renders reservation list component
 * - Loading state handling
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetReservations } = vi.hoisted(() => ({
  mockGetReservations: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/reservations/list',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/reservations', () => ({
  getReservations: mockGetReservations,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    reservations: {
      iconBg: 'bg-blue-500',
      text: 'text-blue-600',
      textDark: 'text-blue-400',
      gradient: 'from-blue-500 to-cyan-500',
      gradientSubtle: 'from-blue-50 to-cyan-50',
    },
  },
}))

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => (props: any) => <span data-testid={`icon-${String(name).toLowerCase()}`} {...props} />,
}))

vi.mock('@/components/shared', () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
  PageHero: ({ title, subtitle, action }: any) => (
    <div data-testid="page-hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {action}
    </div>
  ),
  StatCard: ({ label, value }: any) => (
    <div data-testid={`stat-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/reservations/reservations-list', () => ({
  ReservationsList: () => <div data-testid="reservations-list">Lista rezerwacji</div>,
}))

vi.mock('@/components/reservations/create-reservation-form', () => ({
  CreateReservationForm: () => <div data-testid="create-form">Formularz nowej rezerwacji</div>,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import ReservationsListPage from '@/app/dashboard/reservations/list/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ReservationsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetReservations.mockResolvedValue([
      {
        id: 'res-1',
        status: 'CONFIRMED',
        startDateTime: '2026-03-15T14:00:00Z',
        guests: 120,
        client: { firstName: 'Jan', lastName: 'Kowalski' },
      },
      {
        id: 'res-2',
        status: 'PENDING',
        startDateTime: '2026-03-16T12:00:00Z',
        guests: 50,
        client: { firstName: 'Anna', lastName: 'Nowak' },
      },
    ])
  })

  it('renders page hero with title', async () => {
    render(<ReservationsListPage />)
    expect(screen.getByText('Rezerwacje')).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    render(<ReservationsListPage />)
    expect(screen.getByText('Zarządzaj rezerwacjami sal weselnych')).toBeInTheDocument()
  })

  it('renders "New Reservation" button', () => {
    render(<ReservationsListPage />)
    expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument()
  })

  it('renders stat cards', async () => {
    render(<ReservationsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId('stat-Wszystkie')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Potwierdzone')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Oczekujące')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Ten miesiąc')).toBeInTheDocument()
    })
  })

  it('renders list/calendar view toggle', () => {
    render(<ReservationsListPage />)
    expect(screen.getByText('Lista')).toBeInTheDocument()
    expect(screen.getByText('Kalendarz')).toBeInTheDocument()
  })

  it('calendar link points to calendar view', () => {
    render(<ReservationsListPage />)
    const calendarLink = screen.getByText('Kalendarz').closest('a')
    expect(calendarLink).toHaveAttribute('href', '/dashboard/reservations/calendar')
  })

  it('renders reservations list component', () => {
    render(<ReservationsListPage />)
    expect(screen.getByTestId('reservations-list')).toBeInTheDocument()
  })

  it('calls getReservations on mount', async () => {
    render(<ReservationsListPage />)
    await waitFor(() => {
      expect(mockGetReservations).toHaveBeenCalled()
    })
  })
})
