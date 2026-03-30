/**
 * Archive Page Tests
 *
 * Tests the archive page (/dashboard/archive):
 * - Renders page hero with title "Archiwum Rezerwacji"
 * - Shows loading skeleton state
 * - Shows error state when API fails
 * - Displays stat cards with correct counts
 * - Shows empty state when archive is empty
 * - Renders archived reservation cards
 * - Shows "Wróć do rezerwacji" button
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseReservations, mockUseUnarchiveReservation } = vi.hoisted(() => ({
  mockUseReservations: vi.fn(),
  mockUseUnarchiveReservation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/archive',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/reservations', () => ({
  useReservations: mockUseReservations,
  useUnarchiveReservation: mockUseUnarchiveReservation,
}))

vi.mock('@/lib/utils', () => ({
  formatCurrency: (v: number) => `${v} zł`,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    archive: {
      iconBg: 'bg-neutral-500',
      text: 'text-neutral-600',
      textDark: 'text-neutral-500',
      gradient: 'from-neutral-500 to-zinc-500',
      gradientSubtle: 'from-neutral-50 to-zinc-50',
    },
  },
  statGradients: { financial: '', count: '', alert: '', success: '', neutral: '', info: '' },
  layout: { statGrid: '', statGrid3: 'grid grid-cols-3 gap-4', statGrid6: '', containerClass: '', cardPadding: '', sectionGap: '', maxWidth: '', narrowWidth: '', cardHover: '', detailGrid: '' },
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
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}))

vi.mock('@/components/shared/StatusBadge', () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div data-testid="skeleton" className={props.className} />,
}))

vi.mock('sonner', () => ({
  toast: { promise: vi.fn(), error: vi.fn(), success: vi.fn() },
}))

vi.mock('date-fns', () => ({
  format: (date: Date, fmt: string) => '15 mar 2026',
}))

vi.mock('date-fns/locale', () => ({
  pl: {},
}))

// ── Import ───────────────────────────────────────────────────────────────────

import ArchivePage from '@/app/dashboard/archive/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockArchivedReservations = [
  {
    id: 'ar-1',
    status: 'COMPLETED',
    startDateTime: '2026-01-15T14:00:00.000Z',
    adults: 80,
    children: 10,
    toddlers: 5,
    totalPrice: 21500,
    archivedAt: '2026-02-01T10:00:00.000Z',
    client: { firstName: 'Jan', lastName: 'Kowalski' },
    hall: { name: 'Sala Wielka' },
    eventType: { name: 'Wesele' },
  },
  {
    id: 'ar-2',
    status: 'CANCELLED',
    startDateTime: '2026-02-20T12:00:00.000Z',
    adults: 40,
    children: 5,
    toddlers: 0,
    totalPrice: 10000,
    archivedAt: '2026-03-01T08:00:00.000Z',
    client: { firstName: 'Maria', lastName: 'Nowak' },
    hall: { name: 'Sala Kameralna' },
    eventType: { name: 'Komunia' },
  },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ArchivePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page hero with title', () => {
    mockUseReservations.mockReturnValue({
      data: { data: [], totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    expect(screen.getByText('Archiwum Rezerwacji')).toBeInTheDocument()
  })

  it('shows "Wróć do rezerwacji" button', () => {
    mockUseReservations.mockReturnValue({
      data: { data: [], totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    expect(screen.getByText('Wróć do rezerwacji')).toBeInTheDocument()
  })

  it('shows loading skeletons when data is loading', () => {
    mockUseReservations.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error state when API fails', () => {
    mockUseReservations.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    expect(screen.getByText(/Wystąpił błąd podczas ładowania archiwum/)).toBeInTheDocument()
  })

  it('shows empty state when archive is empty', () => {
    mockUseReservations.mockReturnValue({
      data: { data: [], totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Archiwum jest puste')).toBeInTheDocument()
  })

  it('renders stat cards', () => {
    mockUseReservations.mockReturnValue({
      data: { data: mockArchivedReservations, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    expect(screen.getByTestId('stat-Zarchiwizowane')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Zakończone')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Anulowane')).toBeInTheDocument()
  })

  it('renders archived reservation cards with client names', () => {
    mockUseReservations.mockReturnValue({
      data: { data: mockArchivedReservations, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
    expect(screen.getByText('Maria Nowak')).toBeInTheDocument()
  })

  it('shows "Przywróć" button on archived items', () => {
    mockUseReservations.mockReturnValue({
      data: { data: mockArchivedReservations, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    render(<ArchivePage />)
    const restoreButtons = screen.getAllByText('Przywróć')
    expect(restoreButtons.length).toBe(2)
  })
})
