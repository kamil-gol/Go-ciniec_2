/**
 * Audit Log Page Tests
 *
 * Tests the audit log page (/dashboard/audit-log):
 * - Renders page hero with title
 * - Stat cards with audit statistics
 * - Filter button present
 * - Audit log table rendering
 * - Loading state
 * - Empty state when no logs
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseAuditLogs, mockUseAuditLogStatistics } = vi.hoisted(() => ({
  mockUseAuditLogs: vi.fn(),
  mockUseAuditLogStatistics: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/audit-log',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/hooks/use-audit-log', () => ({
  useAuditLogs: mockUseAuditLogs,
  useAuditLogStatistics: mockUseAuditLogStatistics,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    auditLog: {
      iconBg: 'bg-zinc-500',
      text: 'text-zinc-600',
      textDark: 'text-zinc-400',
      gradient: 'from-zinc-500 to-neutral-500',
      gradientSubtle: 'from-zinc-50 to-neutral-50',
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
  PageHero: ({ title, subtitle }: any) => (
    <div data-testid="page-hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
  StatCard: ({ label, value, isLoading }: any) => (
    isLoading
      ? <div data-testid="loading-state">loading</div>
      : <div data-testid={`stat-${label}`}>
          <span>{label}</span>
          <span>{value}</span>
        </div>
  ),
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  LoadingState: ({ variant }: any) => <div data-testid="loading-state">{variant}</div>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div {...props} />,
}))

vi.mock('@/components/audit-log/AuditLogFilters', () => ({
  AuditLogFilters: () => <div data-testid="audit-filters">Filtry</div>,
}))

vi.mock('@/components/audit-log/AuditLogTable', () => ({
  AuditLogTable: ({ data }: any) => (
    <div data-testid="audit-table">
      {data.map((item: any) => <div key={item.id}>{item.action}</div>)}
    </div>
  ),
}))

// ── Import ───────────────────────────────────────────────────────────────────

import AuditLogPage from '@/app/dashboard/audit-log/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockStats = {
  totalLogs: 150,
  byAction: [{ action: 'CREATE', count: 50 }],
  byEntityType: [{ entityType: 'RESERVATION', count: 80 }],
  byUser: [{ userId: 'u1', count: 40 }],
}

const mockLogsData = {
  data: [
    { id: 'log-1', action: 'CREATE', entityType: 'RESERVATION', createdAt: '2026-03-15T10:00:00Z' },
    { id: 'log-2', action: 'UPDATE', entityType: 'CLIENT', createdAt: '2026-03-15T11:00:00Z' },
  ],
  total: 2,
  totalPages: 1,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page hero with title', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByRole('heading', { name: 'Dziennik Audytu' })).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByText('Historia wszystkich zmian w systemie')).toBeInTheDocument()
  })

  it('renders stat cards when stats loaded', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByTestId('stat-Wszystkie wpisy')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Najczęstsza akcja')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Najczęstszy typ')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Aktywni użytkownicy')).toBeInTheDocument()
  })

  it('renders filter button', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByText('Filtry')).toBeInTheDocument()
  })

  it('renders audit log table with data', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByTestId('audit-table')).toBeInTheDocument()
  })

  it('renders "Historia zmian" card title', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByText('Historia zmian')).toBeInTheDocument()
  })

  it('shows total count in subtitle', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByText('2 wpisy')).toBeInTheDocument()
  })

  it('shows loading state when logs are loading', () => {
    mockUseAuditLogs.mockReturnValue({ data: undefined, isLoading: true })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    const loadingElements = screen.getAllByTestId('loading-state')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no logs', () => {
    mockUseAuditLogs.mockReturnValue({ data: { data: [], total: 0, totalPages: 0 }, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: mockStats, isLoading: false })

    render(<AuditLogPage />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Brak wpisów w dzienniku')).toBeInTheDocument()
  })

  it('shows loading skeleton for stats when stats loading', () => {
    mockUseAuditLogs.mockReturnValue({ data: mockLogsData, isLoading: false })
    mockUseAuditLogStatistics.mockReturnValue({ data: undefined, isLoading: true })

    render(<AuditLogPage />)
    // Should show 4 skeleton cards
    const loadingStates = screen.getAllByTestId('loading-state')
    expect(loadingStates.length).toBe(4)
  })
})
