/**
 * Halls Page Tests
 *
 * Tests the halls listing page (/dashboard/halls):
 * - Renders page hero with title "Zarządzanie Salami"
 * - Shows loading state while fetching halls
 * - Displays stat cards with hall data
 * - Shows empty state when no halls exist
 * - Renders hall cards when data is loaded
 * - Shows "Dodaj Salę" button
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetHalls } = vi.hoisted(() => ({
  mockGetHalls: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/halls',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/halls', () => ({
  getHalls: mockGetHalls,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    halls: {
      iconBg: 'bg-sky-500',
      text: 'text-sky-600',
      textDark: 'text-sky-400',
      gradient: 'from-sky-500 to-blue-500',
      gradientSubtle: 'from-sky-50 to-blue-50',
    },
  },
  statGradients: { financial: '', count: '', alert: '', success: '', neutral: '', info: '' },
  layout: { statGrid: 'grid grid-cols-4 gap-4', statGrid3: '', statGrid6: '', containerClass: '', cardPadding: '', sectionGap: '', maxWidth: '', narrowWidth: '', cardHover: '', detailGrid: '' },
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
  LoadingState: () => <div data-testid="loading-state">Loading...</div>,
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/halls/hall-card', () => ({
  HallCard: ({ hall }: any) => (
    <div data-testid={`hall-card-${hall.id}`}>{hall.name}</div>
  ),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import HallsPage from '@/app/dashboard/halls/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockHalls = [
  { id: 'h-1', name: 'Sala Wielka', capacity: 200, isActive: true },
  { id: 'h-2', name: 'Sala Kameralna', capacity: 60, isActive: true },
  { id: 'h-3', name: 'Sala Ogrodowa', capacity: 100, isActive: false },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('HallsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetHalls.mockReturnValue(new Promise(() => {})) // never resolves
    render(<HallsPage />)
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('renders page hero with title after load', async () => {
    mockGetHalls.mockResolvedValue({ halls: mockHalls })
    render(<HallsPage />)
    await waitFor(() => {
      expect(screen.getByText('Zarządzanie Salami')).toBeInTheDocument()
    })
  })

  it('shows "Dodaj Salę" button', async () => {
    mockGetHalls.mockResolvedValue({ halls: mockHalls })
    render(<HallsPage />)
    await waitFor(() => {
      expect(screen.getByText('Dodaj Salę')).toBeInTheDocument()
    })
  })

  it('renders stat cards with correct data', async () => {
    mockGetHalls.mockResolvedValue({ halls: mockHalls })
    render(<HallsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('stat-Wszystkie sale')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Aktywne sale')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Całk. pojemność')).toBeInTheDocument()
    })
  })

  it('renders hall cards when data is loaded', async () => {
    mockGetHalls.mockResolvedValue({ halls: mockHalls })
    render(<HallsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('hall-card-h-1')).toBeInTheDocument()
      expect(screen.getByText('Sala Wielka')).toBeInTheDocument()
      expect(screen.getByText('Sala Kameralna')).toBeInTheDocument()
    })
  })

  it('shows empty state when no halls exist', async () => {
    mockGetHalls.mockResolvedValue({ halls: [] })
    render(<HallsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('Brak sal')).toBeInTheDocument()
    })
  })
})
