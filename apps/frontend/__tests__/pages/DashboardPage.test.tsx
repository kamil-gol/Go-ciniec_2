/**
 * Dashboard Page Tests
 *
 * Tests the main dashboard page (/dashboard):
 * - Renders page hero with title
 * - Displays stat cards when data loaded
 * - Shows loading skeleton state
 * - Shows error state when API fails
 * - Renders upcoming events section
 * - Refresh button present
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseDashboardOverview, mockUseDashboardUpcoming } = vi.hoisted(() => ({
  mockUseDashboardOverview: vi.fn(),
  mockUseDashboardUpcoming: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/stats-api', () => ({
  useDashboardOverview: mockUseDashboardOverview,
  useDashboardUpcoming: mockUseDashboardUpcoming,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    dashboard: {
      iconBg: 'bg-indigo-500',
      text: 'text-indigo-600',
      textDark: 'text-indigo-400',
      gradient: 'from-indigo-500 to-blue-500',
      gradientSubtle: 'from-indigo-50 to-blue-50',
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
  PageHeader: ({ title, subtitle, action }: any) => (
    <div data-testid="page-header">
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

// ── Import ───────────────────────────────────────────────────────────────────

import DashboardPage from '@/app/dashboard/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockOverviewData = {
  reservationsToday: 3,
  reservationsThisWeek: 12,
  queueCount: 5,
  reservationsThisMonth: 45,
  confirmedThisMonth: 30,
  revenueThisMonth: 120000,
  revenueChangePercent: 15,
  totalClients: 200,
  newClientsThisMonth: 10,
  pendingDepositsCount: 4,
  pendingDepositsAmount: 15000,
}

const mockUpcomingData = [
  {
    id: 'res-1',
    date: '2026-04-15',
    status: 'CONFIRMED',
    startTime: '14:00',
    guests: 120,
    totalPrice: '25000',
    client: { firstName: 'Jan', lastName: 'Kowalski' },
    eventType: { name: 'Wesele' },
    hall: { name: 'Sala Główna' },
    deposits: [],
  },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page hero with title', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: mockUpcomingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByText('Panel Główny')).toBeInTheDocument()
  })

  it('renders stat cards with data', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: mockUpcomingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByTestId('stat-Rezerwacje Dziś')).toBeInTheDocument()
    expect(screen.getByTestId('stat-W Kolejce')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Potwierdzone')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Klienci')).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: mockUpcomingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByText('Odśwież')).toBeInTheDocument()
  })

  it('shows loading text when data is loading', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument()
  })

  it('shows error message when overview API fails', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API error'),
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByText('Nie udało się pobrać statystyk')).toBeInTheDocument()
    expect(screen.getByText('Spróbuj ponownie')).toBeInTheDocument()
  })

  it('renders upcoming events section heading', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: mockUpcomingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByText(/Najbliższe Wydarzenia/)).toBeInTheDocument()
  })

  it('renders link to all reservations', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: mockUpcomingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    const link = screen.getByText('Zobacz wszystkie')
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard/reservations')
  })

  it('renders empty state when no upcoming events', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseDashboardUpcoming.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByText('Brak nadchodzących wydarzeń')).toBeInTheDocument()
  })
})
