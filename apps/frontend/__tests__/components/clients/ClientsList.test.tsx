/**
 * ClientsList Component Tests
 *
 * Tests client list display:
 * - Client names, email, phone rendering
 * - Search/filter behavior
 * - Empty state (no clients / no search results)
 * - RODO badge display
 * - Deleted client styling
 * - Company client display
 * - Reservation count badge
 * - Link navigation
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/dashboard/clients',
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    clients: {
      iconBg: 'bg-violet-500',
      text: 'text-violet-600',
      textDark: 'text-violet-400',
      badge: 'bg-violet-50',
      badgeText: 'text-violet-700',
    },
  },
}))

// ── Test Data ────────────────────────────────────────────────────────────────

const mockClients = [
  {
    id: 'c-1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan@test.pl',
    phone: '500100200',
    createdAt: '2026-01-01T00:00:00Z',
    clientType: 'INDIVIDUAL' as const,
    _count: { reservations: 3 },
  },
  {
    id: 'c-2',
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna@test.pl',
    phone: '600300400',
    createdAt: '2026-02-01T00:00:00Z',
    clientType: 'INDIVIDUAL' as const,
    _count: { reservations: 0 },
  },
  {
    id: 'c-3',
    firstName: 'Marek',
    lastName: 'Wiśniewski',
    phone: '700500600',
    createdAt: '2026-03-01T00:00:00Z',
    clientType: 'COMPANY' as const,
    companyName: 'Budimex S.A.',
    nip: '1234567890',
    _count: { reservations: 5 },
  },
]

const deletedClient = {
  id: 'c-4',
  firstName: 'Tomek',
  lastName: 'Usunięty',
  phone: '800600700',
  createdAt: '2026-01-15T00:00:00Z',
  isDeleted: true,
  _count: { reservations: 0 },
}

// ── Import ───────────────────────────────────────────────────────────────────

import { ClientsList } from '@/components/clients/clients-list'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Core Rendering ──────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render all client names', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument()
    })

    it('should render company name for COMPANY clients', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('Budimex S.A.')).toBeInTheDocument()
    })

    it('should display Firma badge for company clients', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('Firma')).toBeInTheDocument()
    })

    it('should render email addresses', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('jan@test.pl')).toBeInTheDocument()
      expect(screen.getByText('anna@test.pl')).toBeInTheDocument()
    })

    it('should render phone numbers', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('500100200')).toBeInTheDocument()
      expect(screen.getByText('600300400')).toBeInTheDocument()
    })

    it('should render NIP for company clients', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('1234567890')).toBeInTheDocument()
    })

    it('should show reservation count badge', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('3 rezerwacji')).toBeInTheDocument()
      expect(screen.getByText('5 rezerwacji')).toBeInTheDocument()
    })

    it('should render links to client detail pages', () => {
      render(<ClientsList clients={mockClients} />)
      const links = screen.getAllByRole('link')
      const hrefs = links.map(l => l.getAttribute('href'))
      expect(hrefs).toContain('/dashboard/clients/c-1')
      expect(hrefs).toContain('/dashboard/clients/c-2')
      expect(hrefs).toContain('/dashboard/clients/c-3')
    })
  })

  // ── Search Filtering ────────────────────────────────────────────────────

  describe('Search Filtering', () => {
    it('should filter clients by name', () => {
      render(<ClientsList clients={mockClients} searchQuery="Jan" />)
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
      expect(screen.queryByText('Anna Nowak')).not.toBeInTheDocument()
    })

    it('should filter clients by phone', () => {
      render(<ClientsList clients={mockClients} searchQuery="600300" />)
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument()
      expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument()
    })

    it('should filter clients by email', () => {
      render(<ClientsList clients={mockClients} searchQuery="anna@test" />)
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument()
      expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument()
    })

    it('should filter clients by company name', () => {
      render(<ClientsList clients={mockClients} searchQuery="Budimex" />)
      expect(screen.getByText('Budimex S.A.')).toBeInTheDocument()
      expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument()
    })

    it('should show all clients when no searchQuery', () => {
      render(<ClientsList clients={mockClients} />)
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument()
      expect(screen.getByText('Budimex S.A.')).toBeInTheDocument()
    })
  })

  // ── Empty State ─────────────────────────────────────────────────────────

  describe('Empty State', () => {
    it('should show empty state when no clients exist', () => {
      render(<ClientsList clients={[]} />)
      expect(screen.getByText('Brak klientów')).toBeInTheDocument()
      expect(screen.getByText('Nie masz jeszcze żadnych klientów w bazie. Dodaj pierwszego klienta, aby rozpocząć zarządzanie kontaktami.')).toBeInTheDocument()
    })

    it('should show search empty state when search finds nothing', () => {
      render(<ClientsList clients={mockClients} searchQuery="XXXXXX" />)
      expect(screen.getByText('Nie znaleziono klientów')).toBeInTheDocument()
      expect(screen.getByText('Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtr, aby zobaczyć wszystkich klientów.')).toBeInTheDocument()
    })
  })

  // ── Deleted Clients ─────────────────────────────────────────────────────

  describe('Deleted Clients', () => {
    it('should show Usunięty badge for deleted clients', () => {
      render(<ClientsList clients={[deletedClient]} />)
      expect(screen.getByText('Usunięty')).toBeInTheDocument()
    })

    it('should not show phone for deleted clients', () => {
      render(<ClientsList clients={[deletedClient]} />)
      expect(screen.queryByText('800600700')).not.toBeInTheDocument()
    })
  })

  // ── RODO Badges ─────────────────────────────────────────────────────────

  describe('RODO Badges', () => {
    it('should show RODO badge when client has RODO consent', () => {
      render(<ClientsList clients={mockClients} rodoMap={{ 'c-1': true }} />)
      expect(screen.getByText('RODO')).toBeInTheDocument()
    })

    it('should show Brak RODO badge when client lacks consent', () => {
      render(<ClientsList clients={mockClients} rodoMap={{ 'c-1': false }} />)
      expect(screen.getByText('Brak RODO')).toBeInTheDocument()
    })

    it('should not show RODO badge when rodoMap has no entry for client', () => {
      render(<ClientsList clients={mockClients} rodoMap={{}} />)
      expect(screen.queryByText('RODO')).not.toBeInTheDocument()
      expect(screen.queryByText('Brak RODO')).not.toBeInTheDocument()
    })
  })
})
