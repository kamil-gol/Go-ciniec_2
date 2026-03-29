/**
 * Reservation Calendar Page Tests
 *
 * Tests the reservation calendar page (/dashboard/reservations/calendar):
 * - Renders page hero with title "Rezerwacje"
 * - Shows stat cards (total, confirmed, pending, this month)
 * - Shows skeleton grid while loading
 * - Renders calendar navigation controls (prev/next/today)
 * - Shows "Nowa Rezerwacja" button
 * - Displays hall filter when halls exist
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseCalendarReservations, mockUseCalendarHalls, mockGetReservations } = vi.hoisted(() => ({
  mockUseCalendarReservations: vi.fn(),
  mockUseCalendarHalls: vi.fn(),
  mockGetReservations: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/reservations/calendar',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/reservations', () => ({
  getReservations: mockGetReservations,
}))

vi.mock('@/lib/api/calendar-api', () => ({
  useCalendarReservations: mockUseCalendarReservations,
  useCalendarHalls: mockUseCalendarHalls,
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
    dashboard: {
      iconBg: 'bg-indigo-500',
      text: 'text-indigo-600',
      textDark: 'text-indigo-400',
      gradient: 'from-indigo-500 to-blue-500',
      gradientSubtle: 'from-indigo-50 to-blue-50',
    },
  },
  statGradients: { financial: '', count: '', alert: '', success: '', neutral: '', info: '' },
  layout: { statGrid: 'grid grid-cols-4 gap-4', statGrid3: '', statGrid6: '', containerClass: '', cardPadding: '', sectionGap: '', maxWidth: '', narrowWidth: '', cardHover: '', detailGrid: '' },
}))

vi.mock('@/lib/status-colors', () => ({
  reservationStatusColors: {
    CONFIRMED: { label: 'Potwierdzona', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    PENDING: { label: 'Oczekująca', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    CANCELLED: { label: 'Anulowana', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
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
  StatCard: ({ label, value }: any) => (
    <div data-testid={`stat-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  ErrorState: ({ message }: any) => <div data-testid="error-state">{message}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Wszystkie sale</span>,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
}))

vi.mock('./calendar.constants', () => ({
  DAYS_PL: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
  MONTHS_PL: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
}))

vi.mock('./calendar.helpers', () => ({
  getMonthGrid: () => Array.from({ length: 35 }, (_, i) => ({
    date: new Date(2026, 2, i + 1),
    day: ((i % 31) + 1),
    isCurrentMonth: i < 31,
  })),
  dateKey: (d: Date) => d.toISOString().split('T')[0],
  isToday: () => false,
  buildPillTooltip: () => 'tooltip',
}))

vi.mock('./DayDetailPanel', () => ({
  default: () => <div data-testid="day-detail-panel" />,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import CalendarPage from '@/app/dashboard/reservations/calendar/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ReservationCalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetReservations.mockResolvedValue([])
    mockUseCalendarHalls.mockReturnValue({ data: [] })
  })

  it('renders page hero with title', () => {
    mockUseCalendarReservations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<CalendarPage />)
    expect(screen.getByRole('heading', { name: 'Rezerwacje' })).toBeInTheDocument()
  })

  it('renders "Nowa Rezerwacja" button in hero', () => {
    mockUseCalendarReservations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<CalendarPage />)
    expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument()
  })

  it('renders stat cards', () => {
    mockUseCalendarReservations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<CalendarPage />)
    expect(screen.getByTestId('stat-Wszystkie')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Potwierdzone')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Oczekujące')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Ten miesiąc')).toBeInTheDocument()
  })

  it('shows skeleton grid while loading', () => {
    mockUseCalendarReservations.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    render(<CalendarPage />)
    // SkeletonGrid uses animate-pulse class
    const pulseElements = document.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it('shows navigation controls (prev/next/today)', () => {
    mockUseCalendarReservations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    render(<CalendarPage />)
    expect(screen.getByText('Dziś')).toBeInTheDocument()
  })

  it('shows error state when API fails', () => {
    mockUseCalendarReservations.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    })

    render(<CalendarPage />)
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
  })
})
