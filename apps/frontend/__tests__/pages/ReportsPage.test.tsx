/**
 * Reports Page Tests
 *
 * Tests the reports page (/dashboard/reports):
 * - Renders page hero with title "Raporty"
 * - Shows report tabs (Przychody, Zajętość, Przygotowania, Menu)
 * - Shows export buttons (Excel, PDF)
 * - Renders revenue tab by default
 * - Shows ReportFilters component
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseRevenueReport, mockUseOccupancyReport, mockUsePreparationsReport, mockUseMenuPreparationsReport } = vi.hoisted(() => ({
  mockUseRevenueReport: vi.fn(),
  mockUseOccupancyReport: vi.fn(),
  mockUsePreparationsReport: vi.fn(),
  mockUseMenuPreparationsReport: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/reports',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('next/dynamic', () => {
  return {
    default: (loader: any, opts: any) => {
      const Component = (props: any) => {
        const Loading = opts?.loading
        return Loading ? <Loading /> : <div data-testid="dynamic-component" />
      }
      Component.displayName = 'DynamicComponent'
      return Component
    },
  }
})

vi.mock('@/hooks/use-reports', () => ({
  useRevenueReport: mockUseRevenueReport,
  useOccupancyReport: mockUseOccupancyReport,
  usePreparationsReport: mockUsePreparationsReport,
  useMenuPreparationsReport: mockUseMenuPreparationsReport,
  exportRevenueExcel: vi.fn(),
  exportRevenuePDF: vi.fn(),
  exportOccupancyExcel: vi.fn(),
  exportOccupancyPDF: vi.fn(),
  exportPreparationsExcel: vi.fn(),
  exportPreparationsPDF: vi.fn(),
  exportMenuPreparationsExcel: vi.fn(),
  exportMenuPreparationsPDF: vi.fn(),
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    reports: {
      iconBg: 'bg-purple-500',
      text: 'text-purple-600',
      textDark: 'text-purple-400',
      gradient: 'from-purple-500 to-violet-500',
      gradientSubtle: 'from-purple-50 to-violet-50',
    },
    calendar: {
      iconBg: 'bg-indigo-500',
      text: 'text-indigo-600',
      textDark: 'text-indigo-400',
      gradient: 'from-indigo-500 to-blue-500',
      gradientSubtle: 'from-indigo-50 to-blue-50',
    },
  },
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
  LoadingState: ({ variant }: any) => <div data-testid="loading-state">{variant}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div data-testid="skeleton" className={props.className} />,
}))

vi.mock('./components/types', () => ({}))

vi.mock('./components/chart-utils', () => ({
  getDatePresets: () => [
    { label: 'Ostatni miesiąc', dateFrom: '2026-03-01', dateTo: '2026-03-31' },
  ],
}))

vi.mock('./components/ReportFilters', () => ({
  ReportFilters: (props: any) => <div data-testid="report-filters">Filters</div>,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import ReportsPage from '@/app/dashboard/reports/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRevenueReport.mockReturnValue({ data: null, isLoading: false, error: null })
    mockUseOccupancyReport.mockReturnValue({ data: null, isLoading: false, error: null })
    mockUsePreparationsReport.mockReturnValue({ data: null, isLoading: false, error: null })
    mockUseMenuPreparationsReport.mockReturnValue({ data: null, isLoading: false, error: null })
  })

  it('renders page hero with title', () => {
    render(<ReportsPage />)
    expect(screen.getByRole('heading', { name: 'Raporty' })).toBeInTheDocument()
  })

  it('renders subtitle with description', () => {
    render(<ReportsPage />)
    expect(screen.getByText(/Analityka przychodów/)).toBeInTheDocument()
  })

  it('shows export buttons (Excel, PDF)', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Excel')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('renders report tabs', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Przychody')).toBeInTheDocument()
    expect(screen.getByText('Zajętość sal')).toBeInTheDocument()
    expect(screen.getByText('Przygotowania')).toBeInTheDocument()
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('renders revenue tab as active by default', () => {
    render(<ReportsPage />)
    const revenueTab = screen.getByText('Przychody').closest('button')
    expect(revenueTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders tab panel', () => {
    render(<ReportsPage />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })
})
