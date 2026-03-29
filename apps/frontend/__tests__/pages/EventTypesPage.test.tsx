/**
 * Event Types Page Tests
 *
 * Tests the event types page (/dashboard/event-types):
 * - Renders page hero with title "Typy Wydarzeń"
 * - Shows loading state while fetching data
 * - Displays stat cards with correct counts
 * - Shows event type cards when data is loaded
 * - Shows empty state when no event types exist
 * - Shows "Nowy Typ" button
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetEventTypes, mockGetEventTypeStats } = vi.hoisted(() => ({
  mockGetEventTypes: vi.fn(),
  mockGetEventTypeStats: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/event-types',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/event-types-api', () => ({
  getEventTypes: mockGetEventTypes,
  getEventTypeStats: mockGetEventTypeStats,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    eventTypes: {
      iconBg: 'bg-fuchsia-500',
      text: 'text-fuchsia-600',
      textDark: 'text-fuchsia-400',
      gradient: 'from-fuchsia-500 to-pink-500',
      gradientSubtle: 'from-fuchsia-50 to-pink-50',
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
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/event-types/event-type-card', () => ({
  EventTypeCard: ({ eventType }: any) => (
    <div data-testid={`event-type-card-${eventType.id}`}>{eventType.name}</div>
  ),
}))

vi.mock('@/components/event-types/event-type-form-dialog', () => ({
  EventTypeFormDialog: () => <div data-testid="form-dialog" />,
}))

vi.mock('@/components/event-types/event-type-delete-dialog', () => ({
  EventTypeDeleteDialog: () => <div data-testid="delete-dialog" />,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// ── Import ───────────────────────────────────────────────────────────────────

import EventTypesPage from '@/app/dashboard/event-types/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockEventTypes = [
  { id: 'et-1', name: 'Wesele', description: 'Uroczystość weselna', isActive: true, color: '#6366f1' },
  { id: 'et-2', name: 'Komunia', description: 'Pierwsza komunia', isActive: true, color: '#22c55e' },
  { id: 'et-3', name: 'Chrzciny', description: null, isActive: false, color: '#f59e0b' },
]

const mockStats = [
  { id: 'et-1', reservationCount: 15, menuTemplateCount: 3 },
  { id: 'et-2', reservationCount: 8, menuTemplateCount: 2 },
  { id: 'et-3', reservationCount: 0, menuTemplateCount: 0 },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('EventTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetEventTypes.mockReturnValue(new Promise(() => {}))
    mockGetEventTypeStats.mockReturnValue(new Promise(() => {}))
    render(<EventTypesPage />)
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('renders page hero with title after load', async () => {
    mockGetEventTypes.mockResolvedValue(mockEventTypes)
    mockGetEventTypeStats.mockResolvedValue(mockStats)
    render(<EventTypesPage />)
    await waitFor(() => {
      expect(screen.getByText('Typy Wydarzeń')).toBeInTheDocument()
    })
  })

  it('shows "Nowy Typ" button', async () => {
    mockGetEventTypes.mockResolvedValue(mockEventTypes)
    mockGetEventTypeStats.mockResolvedValue(mockStats)
    render(<EventTypesPage />)
    await waitFor(() => {
      expect(screen.getByText('Nowy Typ')).toBeInTheDocument()
    })
  })

  it('renders stat cards', async () => {
    mockGetEventTypes.mockResolvedValue(mockEventTypes)
    mockGetEventTypeStats.mockResolvedValue(mockStats)
    render(<EventTypesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('stat-Typy wydarzeń')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Aktywne typy')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Rezerwacje')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Szablony menu')).toBeInTheDocument()
    })
  })

  it('renders event type cards when data is loaded', async () => {
    mockGetEventTypes.mockResolvedValue(mockEventTypes)
    mockGetEventTypeStats.mockResolvedValue(mockStats)
    render(<EventTypesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('event-type-card-et-1')).toBeInTheDocument()
      expect(screen.getByText('Wesele')).toBeInTheDocument()
      expect(screen.getByText('Komunia')).toBeInTheDocument()
    })
  })

  it('shows empty state when no event types exist', async () => {
    mockGetEventTypes.mockResolvedValue([])
    mockGetEventTypeStats.mockResolvedValue([])
    render(<EventTypesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('Brak typów wydarzeń')).toBeInTheDocument()
    })
  })
})
