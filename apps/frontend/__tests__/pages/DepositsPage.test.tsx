/**
 * Deposits Page Tests
 *
 * Tests the deposits page (/dashboard/deposits):
 * - Renders page hero with title
 * - Stat cards with deposit statistics
 * - "New Deposit" button
 * - Search input
 * - Filter tabs (All, Pending, Paid, Overdue, Cancelled)
 * - Deposits list rendering
 * - Loading state
 * - Empty state
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockDepositsGetAll, mockDepositsGetStats } = vi.hoisted(() => ({
  mockDepositsGetAll: vi.fn(),
  mockDepositsGetStats: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/deposits',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/deposits', () => ({
  depositsApi: {
    getAll: mockDepositsGetAll,
    getStats: mockDepositsGetStats,
  },
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    deposits: {
      iconBg: 'bg-rose-500',
      text: 'text-rose-600',
      textDark: 'text-rose-400',
      gradient: 'from-rose-500 to-pink-500',
      gradientSubtle: 'from-rose-50 to-pink-50',
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
  EmptyState: ({ title, description, actionLabel, onAction }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && <button onClick={onAction}>{actionLabel}</button>}
    </div>
  ),
}))

vi.mock('@/components/shared/FilterTabs', () => ({
  FilterTabs: ({ tabs, activeKey, onChange }: any) => (
    <div data-testid="filter-tabs">
      {tabs.map((tab: any) => (
        <button key={tab.key} onClick={() => onChange(tab.key)} data-active={tab.key === activeKey}>
          {tab.label}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div {...props} />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/components/deposits/deposits-list', () => ({
  DepositsList: ({ deposits }: any) => (
    <div data-testid="deposits-list">
      {deposits.map((d: any) => <div key={d.id}>{d.title}</div>)}
    </div>
  ),
}))

vi.mock('@/components/deposits/create-deposit-form', () => ({
  CreateDepositForm: () => <div data-testid="create-deposit-form">Formularz zaliczki</div>,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import DepositsPage from '@/app/dashboard/deposits/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockStats = {
  counts: { total: 10, pending: 4, paid: 3, overdue: 2, cancelled: 1 },
  amounts: { total: 50000, pending: 20000, paid: 25000, overdue: 5000 },
}

const mockDeposits = [
  {
    id: 'dep-1',
    title: 'Zaliczka wesele',
    amount: 5000,
    status: 'PENDING',
    reservation: {
      client: { firstName: 'Jan', lastName: 'Kowalski' },
      hall: { name: 'Sala Główna' },
      eventType: { name: 'Wesele' },
    },
  },
  {
    id: 'dep-2',
    title: 'Zaliczka komunia',
    amount: 2000,
    status: 'PAID',
    reservation: {
      client: { firstName: 'Anna', lastName: 'Nowak' },
      hall: { name: 'Sala Kameralna' },
      eventType: { name: 'Komunia' },
    },
  },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DepositsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page hero with title', async () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    expect(screen.getByRole('heading', { name: 'Zaliczki' })).toBeInTheDocument()
  })

  it('renders subtitle', async () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    expect(screen.getByText('Zarządzaj zaliczkami i płatnościami')).toBeInTheDocument()
  })

  it('renders "New Deposit" button', () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    expect(screen.getByText('Nowa Zaliczka')).toBeInTheDocument()
  })

  it('renders stat cards after data loads', async () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('stat-Oczekujące')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Opłacone')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Przetermin.')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Łącznie')).toBeInTheDocument()
    })
  })

  it('renders filter tabs', async () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('filter-tabs')).toBeInTheDocument()
      expect(screen.getByText('Wszystkie')).toBeInTheDocument()
      expect(screen.getByText('Opłacone')).toBeInTheDocument()
    })
  })

  it('renders search input', async () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Szukaj...')).toBeInTheDocument()
    })
  })

  it('renders deposits list with data', async () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('deposits-list')).toBeInTheDocument()
    })
  })

  it('renders "Lista Zaliczek" card title', async () => {
    mockDepositsGetAll.mockResolvedValue(mockDeposits)
    mockDepositsGetStats.mockResolvedValue(mockStats)

    render(<DepositsPage />)
    await waitFor(() => {
      expect(screen.getByText('Lista Zaliczek')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    mockDepositsGetAll.mockReturnValue(new Promise(() => {}))
    mockDepositsGetStats.mockReturnValue(new Promise(() => {}))

    render(<DepositsPage />)
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('shows empty state when no deposits and no filters', async () => {
    mockDepositsGetAll.mockResolvedValue([])
    mockDepositsGetStats.mockResolvedValue({
      counts: { total: 0, pending: 0, paid: 0, overdue: 0, cancelled: 0 },
      amounts: { total: 0, pending: 0, paid: 0, overdue: 0 },
    })

    render(<DepositsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('Brak zaliczek')).toBeInTheDocument()
    })
  })
})
