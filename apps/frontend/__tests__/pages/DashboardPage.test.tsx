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

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
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
}))

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
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
