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
  layout: { statGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4", statGrid3: "grid grid-cols-2 sm:grid-cols-3 gap-4", statGrid6: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", containerClass: "container mx-auto", cardPadding: "p-4", sectionGap: "space-y-6", maxWidth: "max-w-7xl", narrowWidth: "max-w-5xl", cardHover: "", detailGrid: "grid grid-cols-2 md:grid-cols-4 gap-3" },
  statGradients: { financial: "from-amber-500 to-yellow-600", count: "from-blue-600 to-blue-800", alert: "from-rose-500 to-red-600", success: "from-emerald-500 to-teal-600", neutral: "from-zinc-500 to-neutral-600", info: "from-violet-500 to-purple-600" },
  typography: { pageTitle: "", sectionTitle: "", cardTitle: "", body: "", muted: "", smallMuted: "", label: "", heroSubtitle: "", statValue: "", statLabel: "", tableHeader: "", pageTitleStandalone: "" },
  animations: { fadeIn: "", slideUp: "", scaleIn: "", cardHover: "", buttonPress: "", pageEnter: "" },
  motionTokens: { duration: { instant: 0.1, fast: 0.2, normal: 0.3, slow: 0.5 }, ease: { default: "easeOut", smooth: [0.4, 0, 0.2, 1] }, stagger: { cards: 0.06, list: 0.04 } },
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
  FilterTabs: ({ tabs, activeKey, onChange }: any) => (
    <div data-testid="filter-tabs">
      {tabs.map((t: any) => (
        <button key={t.key} onClick={() => onChange(t.key)} data-active={t.key === activeKey}>
          {t.label}
        </button>
      ))}
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
    expect(screen.getByRole('heading', { name: 'Rezerwacje' })).toBeInTheDocument()
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
    expect(screen.getAllByText('Lista').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Kalendarz')).toBeInTheDocument()
  })

  it('calendar button is present in filter tabs', () => {
    render(<ReservationsListPage />)
    const calendarButton = screen.getByText('Kalendarz')
    expect(calendarButton).toBeInTheDocument()
    expect(calendarButton.tagName).toBe('BUTTON')
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
