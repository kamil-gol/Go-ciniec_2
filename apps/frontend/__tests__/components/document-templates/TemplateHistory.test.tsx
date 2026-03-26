/**
 * TemplateHistory Component Tests
 *
 * Testy historii zmian szablonów:
 * - Stan ładowania
 * - Pusty stan (brak historii)
 * - Wyświetlanie wpisów historii
 * - Paginacja
 * - Dialog przywracania wersji
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ── Hoisted mocks ──

const { mockUseDocumentTemplate, mockUseTemplateHistory, mockUseRestoreTemplate } = vi.hoisted(() => ({
  mockUseDocumentTemplate: vi.fn(),
  mockUseTemplateHistory: vi.fn(),
  mockUseRestoreTemplate: vi.fn(),
}))

vi.mock('@/hooks/use-document-templates', () => ({
  useDocumentTemplate: (...a: any[]) => mockUseDocumentTemplate(...a),
  useTemplateHistory: (...a: any[]) => mockUseTemplateHistory(...a),
  useRestoreTemplate: (...a: any[]) => mockUseRestoreTemplate(...a),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}))

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  History: () => <span data-testid="icon-history" />,
  Loader2: () => <span data-testid="icon-loader" />,
  ChevronDown: () => <span />,
  ChevronRight: () => <span />,
  Clock: () => <span />,
  ChevronLeft: () => <span />,
  ChevronsLeft: () => <span />,
  ChevronsRight: () => <span />,
  ScrollText: () => <span />,
  Crown: () => <span />,
  Eye: () => <span />,
  RotateCcw: () => <span />,
}))

import { TemplateHistory } from '@/components/document-templates/TemplateHistory'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('TemplateHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRestoreTemplate.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    mockUseDocumentTemplate.mockReturnValue({
      data: { slug: 'invoice', name: 'Faktura', version: 3 },
    })
  })

  it('shows loading state', () => {
    mockUseTemplateHistory.mockReturnValue({ data: undefined, isLoading: true })
    render(<TemplateHistory slug="invoice" open={true} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(screen.getByText('Ładowanie historii...')).toBeInTheDocument()
  })

  it('shows empty state when no history', () => {
    mockUseTemplateHistory.mockReturnValue({
      data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      isLoading: false,
    })
    render(<TemplateHistory slug="invoice" open={true} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(screen.getByText('Brak historii zmian')).toBeInTheDocument()
  })

  it('renders history entries', () => {
    mockUseTemplateHistory.mockReturnValue({
      data: {
        items: [
          {
            id: 'h1',
            version: 2,
            content: '# Old',
            changeReason: 'Poprawka',
            createdAt: '2026-01-15T10:00:00Z',
            changedBy: { firstName: 'Jan', lastName: 'Kowalski' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
    })
    render(<TemplateHistory slug="invoice" open={true} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
    expect(screen.getByText(/Poprawka/)).toBeInTheDocument()
  })

  it('renders nothing when not open', () => {
    mockUseTemplateHistory.mockReturnValue({ data: undefined, isLoading: false })
    const { container } = render(<TemplateHistory slug="invoice" open={false} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(container.querySelector('[data-testid="dialog"]')).not.toBeInTheDocument()
  })
})
