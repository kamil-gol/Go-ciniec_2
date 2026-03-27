/**
 * Queue Page Tests
 *
 * Tests the queue page (/dashboard/queue):
 * - Renders page hero with title
 * - Stat cards display with queue data
 * - "Add to queue" button
 * - "Rebuild" button
 * - Date tabs rendering
 * - Loading state
 * - Empty state when no queue items
 * - Queue list rendering
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockQueueGetAll, mockQueueGetStats, mockClientsGetAll } = vi.hoisted(() => ({
  mockQueueGetAll: vi.fn(),
  mockQueueGetStats: vi.fn(),
  mockClientsGetAll: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/queue',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/queue', () => ({
  queueApi: {
    getAll: mockQueueGetAll,
    getStats: mockQueueGetStats,
    addToQueue: vi.fn(),
    updateQueueReservation: vi.fn(),
    batchUpdatePositions: vi.fn(),
    rebuildPositions: vi.fn(),
    promoteReservation: vi.fn(),
  },
}))

vi.mock('@/lib/api/clients', () => ({
  clientsApi: { getAll: mockClientsGetAll },
}))

vi.mock('date-fns', () => ({
  format: (date: any, fmt: string) => '15 Mar 2026',
  parseISO: (str: string) => new Date(str),
}))

vi.mock('date-fns/locale', () => ({
  pl: {},
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    queue: {
      iconBg: 'bg-amber-500',
      text: 'text-amber-600',
      textDark: 'text-amber-400',
      gradient: 'from-amber-500 to-orange-500',
      gradientSubtle: 'from-amber-50 to-orange-50',
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
  StatCard: ({ label, value }: any) => (
    <div data-testid={`stat-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  LoadingState: ({ message }: any) => <div data-testid="loading-state">{message}</div>,
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props: any) => <input type="checkbox" {...props} />,
}))

vi.mock('@/components/queue/draggable-queue-list', () => ({
  DraggableQueueList: ({ items }: any) => (
    <div data-testid="queue-list">
      {items.map((item: any) => <div key={item.id}>{item.id}</div>)}
    </div>
  ),
}))

vi.mock('@/components/queue/add-to-queue-form', () => ({
  AddToQueueForm: () => <div data-testid="add-queue-form">Formularz kolejki</div>,
}))

vi.mock('@/components/queue/edit-queue-form', () => ({
  EditQueueForm: () => <div data-testid="edit-queue-form">Edycja kolejki</div>,
}))

vi.mock('@/components/queue/promote-modal', () => ({
  PromoteModal: () => null,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import QueuePage from '@/app/dashboard/queue/page'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockStats = {
  totalQueued: 8,
  oldestQueueDate: '2026-03-01',
  manualOrderCount: 2,
  queuesByDate: [
    { date: '2026-04-15', count: 5 },
    { date: '2026-04-20', count: 3 },
  ],
}

const mockQueues = [
  { id: 'q-1', position: 1, queueDate: '2026-04-15', client: { firstName: 'Jan', lastName: 'Kowalski' } },
  { id: 'q-2', position: 2, queueDate: '2026-04-15', client: { firstName: 'Anna', lastName: 'Nowak' } },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('QueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while data is fetching', () => {
    mockQueueGetAll.mockReturnValue(new Promise(() => {}))
    mockQueueGetStats.mockReturnValue(new Promise(() => {}))
    mockClientsGetAll.mockReturnValue(new Promise(() => {}))

    render(<QueuePage />)
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('renders page hero with title after loading', async () => {
    mockQueueGetAll.mockResolvedValue(mockQueues)
    mockQueueGetStats.mockResolvedValue(mockStats)
    mockClientsGetAll.mockResolvedValue([])

    render(<QueuePage />)
    await waitFor(() => {
      expect(screen.getByText('Kolejka rezerwacji')).toBeInTheDocument()
    })
  })

  it('renders stat cards after loading', async () => {
    mockQueueGetAll.mockResolvedValue(mockQueues)
    mockQueueGetStats.mockResolvedValue(mockStats)
    mockClientsGetAll.mockResolvedValue([])

    render(<QueuePage />)
    await waitFor(() => {
      expect(screen.getByTestId('stat-W kolejce')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Najstarsza data')).toBeInTheDocument()
    })
  })

  it('renders "Add to queue" button', async () => {
    mockQueueGetAll.mockResolvedValue(mockQueues)
    mockQueueGetStats.mockResolvedValue(mockStats)
    mockClientsGetAll.mockResolvedValue([])

    render(<QueuePage />)
    await waitFor(() => {
      expect(screen.getByText('Dodaj do kolejki')).toBeInTheDocument()
    })
  })

  it('renders "Rebuild" button', async () => {
    mockQueueGetAll.mockResolvedValue(mockQueues)
    mockQueueGetStats.mockResolvedValue(mockStats)
    mockClientsGetAll.mockResolvedValue([])

    render(<QueuePage />)
    await waitFor(() => {
      expect(screen.getByText('Przebuduj numerację')).toBeInTheDocument()
    })
  })

  it('renders queue list with items', async () => {
    mockQueueGetAll.mockResolvedValue(mockQueues)
    mockQueueGetStats.mockResolvedValue(mockStats)
    mockClientsGetAll.mockResolvedValue([])

    render(<QueuePage />)
    await waitFor(() => {
      expect(screen.getByTestId('queue-list')).toBeInTheDocument()
    })
  })

  it('renders "All" date button with count', async () => {
    mockQueueGetAll.mockResolvedValue(mockQueues)
    mockQueueGetStats.mockResolvedValue(mockStats)
    mockClientsGetAll.mockResolvedValue([])

    render(<QueuePage />)
    await waitFor(() => {
      expect(screen.getByText(/Wszystkie \(2\)/)).toBeInTheDocument()
    })
  })

  it('shows empty state when no queue items', async () => {
    mockQueueGetAll.mockResolvedValue([])
    mockQueueGetStats.mockResolvedValue({ ...mockStats, totalQueued: 0, queuesByDate: [] })
    mockClientsGetAll.mockResolvedValue([])

    render(<QueuePage />)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('Kolejka jest pusta')).toBeInTheDocument()
    })
  })
})
