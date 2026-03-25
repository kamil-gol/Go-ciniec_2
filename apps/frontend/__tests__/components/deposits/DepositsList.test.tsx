/**
 * DepositsList Component Tests
 *
 * Tests deposit list display:
 * - Client names and amounts in table view
 * - Status badges
 * - Payment method badges
 * - Due date display
 * - Links to reservation pages
 * - Empty/multiple deposits
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/components/deposits/deposit-actions', () => ({
  DepositActions: ({ deposit }: any) => <button data-testid={`actions-${deposit.id}`}>Actions</button>,
}))

// ── Test Data ────────────────────────────────────────────────────────────────

const mockDeposits = [
  {
    id: 'dep-1',
    reservationId: 'res-1',
    amount: '5000',
    remainingAmount: '5000',
    paidAmount: '0',
    dueDate: '2026-04-15',
    status: 'PENDING' as const,
    paid: false,
    paidAt: null,
    paymentMethod: 'TRANSFER' as const,
    title: null,
    description: null,
    internalNotes: null,
    receiptNumber: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    reservation: {
      id: 'res-1',
      date: '2026-06-15',
      startTime: '14:00',
      endTime: '22:00',
      guests: 120,
      totalPrice: '25000',
      status: 'CONFIRMED',
      client: {
        id: 'c-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@test.pl',
        phone: '500100200',
      },
      hall: { id: 'h-1', name: 'Sala Główna' },
      eventType: { id: 'et-1', name: 'Wesele', color: '#3b82f6' },
    },
  },
  {
    id: 'dep-2',
    reservationId: 'res-2',
    amount: '3000',
    remainingAmount: '1500',
    paidAmount: '1500',
    dueDate: '2026-04-01',
    status: 'PARTIALLY_PAID' as const,
    paid: false,
    paidAt: null,
    paymentMethod: 'CASH' as const,
    title: null,
    description: null,
    internalNotes: null,
    receiptNumber: null,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    reservation: {
      id: 'res-2',
      date: '2026-05-20',
      startTime: '12:00',
      endTime: '18:00',
      guests: 50,
      totalPrice: '12000',
      status: 'CONFIRMED',
      client: {
        id: 'c-2',
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna@test.pl',
        phone: '600300400',
      },
      hall: { id: 'h-2', name: 'Sala Kameralna' },
      eventType: { id: 'et-2', name: 'Komunia', color: '#10b981' },
    },
  },
  {
    id: 'dep-3',
    reservationId: 'res-3',
    amount: '2000',
    remainingAmount: '0',
    paidAmount: '2000',
    dueDate: '2026-03-01',
    status: 'PAID' as const,
    paid: true,
    paidAt: '2026-02-28T00:00:00Z',
    paymentMethod: 'BLIK' as const,
    title: null,
    description: null,
    internalNotes: null,
    receiptNumber: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-28T00:00:00Z',
    reservation: {
      id: 'res-3',
      date: '2026-04-10',
      startTime: '16:00',
      endTime: '22:00',
      guests: 30,
      totalPrice: '8000',
      status: 'CONFIRMED',
      client: {
        id: 'c-3',
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        email: 'piotr@test.pl',
        phone: '700500600',
      },
      hall: { id: 'h-1', name: 'Sala Główna' },
      eventType: { id: 'et-3', name: 'Chrzciny', color: '#f59e0b' },
    },
  },
]

// ── Import ───────────────────────────────────────────────────────────────────

import { DepositsList } from '@/components/deposits/deposits-list'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DepositsList', () => {
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Table Rendering (Desktop) ───────────────────────────────────────────

  describe('Table Rendering', () => {
    it('should render table headers', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      expect(screen.getByText('Klient')).toBeInTheDocument()
      expect(screen.getByText('Wydarzenie')).toBeInTheDocument()
      expect(screen.getByText('Sala')).toBeInTheDocument()
      expect(screen.getByText('Kwota')).toBeInTheDocument()
      expect(screen.getByText('Wpłacono')).toBeInTheDocument()
      expect(screen.getByText('Termin')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Metoda')).toBeInTheDocument()
    })

    it('should render client names', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      // Names appear in both mobile and desktop views
      const janElements = screen.getAllByText('Jan Kowalski')
      expect(janElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should render deposit amounts', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      const amountElements = screen.getAllByText(/5\s*000 zł/)
      expect(amountElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should render event type names', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      const weselElements = screen.getAllByText('Wesele')
      expect(weselElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should render hall names', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      const hallElements = screen.getAllByText('Sala Główna')
      expect(hallElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should show paid amount for partially paid deposits', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      // "wpłacono 1 500 zł" in mobile view, "1 500 zł" in table
      const paidElements = screen.getAllByText(/1\s*500 zł/)
      expect(paidElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should render payment method badges', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      const transferBadges = screen.getAllByText('Przelew')
      const cashBadges = screen.getAllByText('Gotówka')
      const blikBadges = screen.getAllByText('BLIK')
      expect(transferBadges.length).toBeGreaterThanOrEqual(1)
      expect(cashBadges.length).toBeGreaterThanOrEqual(1)
      expect(blikBadges.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Links ───────────────────────────────────────────────────────────────

  describe('Links', () => {
    it('should link to reservation detail pages', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      const links = screen.getAllByRole('link')
      const hrefs = links.map(l => l.getAttribute('href'))
      expect(hrefs).toContain('/dashboard/reservations/res-1')
      expect(hrefs).toContain('/dashboard/reservations/res-2')
    })
  })

  // ── Actions ─────────────────────────────────────────────────────────────

  describe('Actions', () => {
    it('should render action buttons for each deposit', () => {
      render(<DepositsList deposits={mockDeposits} onUpdate={mockOnUpdate} />)
      // Actions render in both mobile and desktop views
      expect(screen.getAllByTestId('actions-dep-1').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByTestId('actions-dep-2').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByTestId('actions-dep-3').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Missing Data ────────────────────────────────────────────────────────

  describe('Missing Data', () => {
    it('should show "Brak danych" when client is missing', () => {
      const depositNoClient = {
        ...mockDeposits[0],
        id: 'dep-no-client',
        reservation: {
          ...mockDeposits[0].reservation!,
          client: undefined as any,
        },
      }

      render(<DepositsList deposits={[depositNoClient]} onUpdate={mockOnUpdate} />)
      const noDataElements = screen.getAllByText('Brak danych')
      expect(noDataElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle deposit without payment method', () => {
      const depositNoMethod = {
        ...mockDeposits[0],
        id: 'dep-no-method',
        paymentMethod: null,
      }

      render(<DepositsList deposits={[depositNoMethod]} onUpdate={mockOnUpdate} />)
      // Should render without crashing, showing a dash instead
      expect(screen.getAllByText('Jan Kowalski').length).toBeGreaterThanOrEqual(1)
    })
  })
})
