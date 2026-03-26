/**
 * AuditLogTable Component Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - Table rendering with data
 * - System action filter toggle
 * - Pagination controls
 * - Date formatting
 * - User display (name or "System")
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@/components/audit-log/AuditLogDetails', () => ({
  AuditLogDetails: ({ log, open, onClose }: any) =>
    open ? <div data-testid="audit-details">{log.action}</div> : null,
}))

vi.mock('@/components/audit-log/LogActionBadge', () => ({
  LogActionBadge: ({ action }: any) => <span data-testid="action-badge">{action}</span>,
}))

vi.mock('@/components/audit-log/audit-log.constants', () => ({
  entityLabels: {
    RESERVATION: 'Rezerwacja',
    CLIENT: 'Klient',
    SYSTEM: 'System',
  } as Record<string, string>,
}))

vi.mock('@/components/audit-log/audit-log.utils', () => ({
  groupLogEntries: (entries: any[]) =>
    entries.map((e: any) => ({ primary: e, related: [] })),
  isSystemAction: (action: string) =>
    ['SYSTEM_CLEANUP', 'AUTO_ARCHIVE'].includes(action),
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { AuditLogTable } from '@/components/audit-log/AuditLogTable'

// ── Test Data ────────────────────────────────────────────────────────────────

const mockData = [
  {
    id: 'log-1',
    action: 'CREATE',
    entityType: 'RESERVATION',
    entityId: 'res-1',
    createdAt: '2026-03-25T14:30:00Z',
    user: { firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl' },
    details: { description: 'Nowa rezerwacja wesele' },
  },
  {
    id: 'log-2',
    action: 'UPDATE',
    entityType: 'CLIENT',
    entityId: 'cl-1',
    createdAt: '2026-03-25T15:00:00Z',
    user: null,
    details: { description: 'Aktualizacja danych' },
  },
  {
    id: 'log-3',
    action: 'SYSTEM_CLEANUP',
    entityType: 'SYSTEM',
    entityId: 'sys-1',
    createdAt: '2026-03-25T03:00:00Z',
    user: null,
    details: { description: 'Czyszczenie logów' },
  },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AuditLogTable', () => {
  const defaultProps = {
    data: mockData,
    isLoading: false,
    page: 1,
    pageSize: 20,
    totalPages: 3,
    total: 50,
    onPageChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Table Rendering ───────────────────────────────────────────────────

  describe('Desktop Table Rendering', () => {
    it('should render table headers', () => {
      render(<AuditLogTable {...defaultProps} />)

      expect(screen.getByText('Data')).toBeInTheDocument()
      expect(screen.getByText('Użytkownik')).toBeInTheDocument()
      expect(screen.getByText('Akcja')).toBeInTheDocument()
      expect(screen.getByText('Typ')).toBeInTheDocument()
      expect(screen.getByText('Opis')).toBeInTheDocument()
    })

    it('should render user name', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getAllByText('Jan Kowalski').length).toBeGreaterThan(0)
    })

    it('should show "System" for entries without user', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getAllByText('System').length).toBeGreaterThan(0)
    })

    it('should render entity type labels', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getAllByText('Rezerwacja').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Klient').length).toBeGreaterThan(0)
    })

    it('should render description text', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getAllByText('Nowa rezerwacja wesele').length).toBeGreaterThan(0)
    })
  })

  // ── System Actions Filter ─────────────────────────────────────────────

  describe('System Actions Filter', () => {
    it('should show system action toggle when system actions exist', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getByText(/Ukryj akcje systemowe/)).toBeInTheDocument()
    })

    it('should display system action count', () => {
      render(<AuditLogTable {...defaultProps} />)
      // One system action (SYSTEM_CLEANUP)
      expect(screen.getByText(/\(1\)/)).toBeInTheDocument()
    })

    it('should NOT show toggle when no system actions', () => {
      const dataWithoutSystem = mockData.filter(d => d.action !== 'SYSTEM_CLEANUP')
      render(<AuditLogTable {...defaultProps} data={dataWithoutSystem} />)
      expect(screen.queryByText(/Ukryj akcje systemowe/)).not.toBeInTheDocument()
    })

    it('should filter system actions when toggled', async () => {
      const user = userEvent.setup()
      render(<AuditLogTable {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      // SYSTEM_CLEANUP action badge should be hidden
      const badges = screen.getAllByTestId('action-badge')
      const systemBadge = badges.find(b => b.textContent === 'SYSTEM_CLEANUP')
      expect(systemBadge).toBeUndefined()
    })
  })

  // ── Pagination ────────────────────────────────────────────────────────

  describe('Pagination', () => {
    it('should render pagination when totalPages > 1', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getByText('Poprzednia')).toBeInTheDocument()
      expect(screen.getByText('Następna')).toBeInTheDocument()
    })

    it('should NOT render pagination when totalPages <= 1', () => {
      render(<AuditLogTable {...defaultProps} totalPages={1} />)
      expect(screen.queryByText('Poprzednia')).not.toBeInTheDocument()
    })

    it('should show page info', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show total count', () => {
      render(<AuditLogTable {...defaultProps} />)
      expect(screen.getByText(/50/)).toBeInTheDocument()
      expect(screen.getByText(/wpisów łącznie/)).toBeInTheDocument()
    })

    it('should disable "Poprzednia" on first page', () => {
      render(<AuditLogTable {...defaultProps} page={1} />)
      const prevBtn = screen.getByText('Poprzednia').closest('button')
      expect(prevBtn).toBeDisabled()
    })

    it('should disable "Następna" on last page', () => {
      render(<AuditLogTable {...defaultProps} page={3} />)
      const nextBtn = screen.getByText('Następna').closest('button')
      expect(nextBtn).toBeDisabled()
    })

    it('should call onPageChange on next click', async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()

      render(<AuditLogTable {...defaultProps} page={2} onPageChange={onPageChange} />)
      await user.click(screen.getByText('Następna'))

      expect(onPageChange).toHaveBeenCalledWith(3)
    })

    it('should call onPageChange on prev click', async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()

      render(<AuditLogTable {...defaultProps} page={2} onPageChange={onPageChange} />)
      await user.click(screen.getByText('Poprzednia'))

      expect(onPageChange).toHaveBeenCalledWith(1)
    })
  })
})
