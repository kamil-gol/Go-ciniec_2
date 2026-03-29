/**
 * Daily View Page Tests
 *
 * Tests the daily view page (/dashboard/daily-view):
 * - Renders page hero with title "Widok Dzienny"
 * - Shows formatted date subtitle (with "Dzisiaj" label)
 * - Shows navigation buttons (prev/next day)
 * - Renders DailyReservationsSection and CateringDailyWidget
 * - Does not show "Dziś" button when already viewing today
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockUseReservations } = vi.hoisted(() => ({
  mockUseReservations: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/daily-view',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/reservations', () => ({
  useReservations: mockUseReservations,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    dailyView: {
      iconBg: 'bg-orange-500',
      text: 'text-orange-600',
      textDark: 'text-orange-400',
      gradient: 'from-orange-500 to-amber-500',
      gradientSubtle: 'from-orange-50 to-amber-50',
    },
  },
  statGradients: { financial: '', count: '', alert: '', success: '', neutral: '', info: '' },
  layout: { statGrid: '', statGrid3: '', statGrid6: '', containerClass: '', cardPadding: '', sectionGap: '', maxWidth: '', narrowWidth: '', cardHover: '', detailGrid: '' },
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
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
}))

vi.mock('@/app/dashboard/daily-view/components/DailyReservationsSection', () => ({
  default: ({ date }: any) => (
    <div data-testid="daily-reservations-section" data-date={date}>
      Rezerwacje dnia
    </div>
  ),
}))

vi.mock('@/app/dashboard/daily-view/components/CateringDailyWidget', () => ({
  default: ({ date }: any) => (
    <div data-testid="catering-daily-widget" data-date={date}>
      Catering dnia
    </div>
  ),
}))

// ── Import ───────────────────────────────────────────────────────────────────

import DailyViewPage from '@/app/dashboard/daily-view/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DailyViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock for WeekSummaryBanner
    mockUseReservations.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
    })
  })

  it('renders page hero with title', () => {
    render(<DailyViewPage />)
    expect(screen.getByText('Widok Dzienny')).toBeInTheDocument()
  })

  it('renders subtitle with today label', () => {
    render(<DailyViewPage />)
    const subtitle = screen.getByTestId('page-hero').querySelector('p')
    expect(subtitle?.textContent).toContain('Dzisiaj')
  })

  it('renders day navigation buttons', () => {
    render(<DailyViewPage />)
    expect(screen.getByLabelText('Poprzedni dzień')).toBeInTheDocument()
    expect(screen.getByLabelText('Następny dzień')).toBeInTheDocument()
  })

  it('renders DailyReservationsSection component', () => {
    render(<DailyViewPage />)
    expect(screen.getByTestId('daily-reservations-section')).toBeInTheDocument()
  })

  it('renders CateringDailyWidget component', () => {
    render(<DailyViewPage />)
    expect(screen.getByTestId('catering-daily-widget')).toBeInTheDocument()
  })

  it('does not show "Dziś" button when viewing today', () => {
    render(<DailyViewPage />)
    // When already on today, the "Dziś" button should not be visible
    const dzisButtons = screen.queryAllByText('Dziś')
    expect(dzisButtons.length).toBe(0)
  })
})
