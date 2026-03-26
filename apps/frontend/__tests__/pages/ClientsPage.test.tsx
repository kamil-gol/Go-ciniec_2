/**
 * Clients Page Tests
 *
 * Tests the clients page (/dashboard/clients):
 * - Renders page hero with title
 * - Stat cards display
 * - Search input present
 * - "Add client" button
 * - Filter tabs (All / Individual / Company)
 * - Show/hide deleted toggle
 * - Loading state
 * - Client list rendering
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockClientsGetAll } = vi.hoisted(() => ({
  mockClientsGetAll: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/clients',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/api/clients', () => ({
  clientsApi: { getAll: mockClientsGetAll },
  clientsKeys: { list: (params: any) => ['clients', params] },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    clients: {
      iconBg: 'bg-violet-500',
      text: 'text-violet-600',
      textDark: 'text-violet-400',
      gradient: 'from-violet-500 to-purple-500',
      gradientSubtle: 'from-violet-50 to-purple-50',
    },
  },
}))

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => (props: any) => <span data-testid={`icon-${String(name).toLowerCase()}`} {...props} />,
}))

vi.mock('@/components/shared', () => ({
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
}))

vi.mock('@/components/shared/FilterTabs', () => ({
  FilterTabs: ({ tabs, activeKey, onChange }: any) => (
    <div data-testid="filter-tabs">
      {tabs.map((tab: any) => (
        <button key={tab.key} onClick={() => onChange(tab.key)} data-active={tab.key === activeKey}>
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/components/clients/clients-list', () => ({
  ClientsList: ({ clients }: any) => (
    <div data-testid="clients-list">
      {clients.map((c: any) => <div key={c.id}>{c.firstName} {c.lastName}</div>)}
    </div>
  ),
}))

vi.mock('@/components/clients/create-client-form', () => ({
  CreateClientForm: () => <div data-testid="create-client-form">Formularz klienta</div>,
}))

// ── Import ───────────────────────────────────────────────────────────────────

import ClientsPage from '@/app/dashboard/clients/page'

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockClients = [
  { id: 'c-1', firstName: 'Jan', lastName: 'Kowalski', clientType: 'INDIVIDUAL', _count: { reservations: 3 } },
  { id: 'c-2', firstName: 'Anna', lastName: 'Nowak', clientType: 'INDIVIDUAL', _count: { reservations: 1 } },
  { id: 'c-3', firstName: 'Firma', lastName: 'Sp.', clientType: 'COMPANY', _count: { reservations: 5 } },
]

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClientsGetAll.mockResolvedValue(mockClients)
  })

  it('renders page hero with title', () => {
    renderWithProviders(<ClientsPage />)
    expect(screen.getByText('Klienci')).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    renderWithProviders(<ClientsPage />)
    expect(screen.getByText('Zarządzaj bazą klientów')).toBeInTheDocument()
  })

  it('renders "Add client" button', () => {
    renderWithProviders(<ClientsPage />)
    expect(screen.getByText('Dodaj klienta')).toBeInTheDocument()
  })

  it('renders stat cards', async () => {
    renderWithProviders(<ClientsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('stat-Wszyscy')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Osoby prywatne')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Firmy')).toBeInTheDocument()
      expect(screen.getByTestId('stat-Rezerwacje')).toBeInTheDocument()
    })
  })

  it('renders search input', async () => {
    renderWithProviders(<ClientsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/szukaj/i)).toBeInTheDocument()
    })
  })

  it('renders filter tabs', async () => {
    renderWithProviders(<ClientsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('filter-tabs')).toBeInTheDocument()
    })
  })

  it('renders show/hide deleted button', async () => {
    renderWithProviders(<ClientsPage />)
    await waitFor(() => {
      expect(screen.getByText(/pokaż usuniętych/i)).toBeInTheDocument()
    })
  })

  it('renders clients list with data', async () => {
    renderWithProviders(<ClientsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('clients-list')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    mockClientsGetAll.mockReturnValue(new Promise(() => {})) // never resolves
    renderWithProviders(<ClientsPage />)
    // The loading state should show while query is pending
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })
})
