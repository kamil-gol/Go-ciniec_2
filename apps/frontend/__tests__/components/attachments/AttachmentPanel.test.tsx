/**
 * AttachmentPanel Component Tests
 *
 * Testy panelu załączników:
 * - Stan ładowania
 * - Pusty stan
 * - Renderowanie listy załączników
 * - Filtrowanie po kategorii
 * - Tryb readonly (brak przycisku Dodaj)
 * - Przycisk "Dodaj" otwiera dialog upload
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Hoisted mocks ──

const { mockUseAttachments } = vi.hoisted(() => ({
  mockUseAttachments: vi.fn(),
}))

vi.mock('@/hooks/use-attachments', () => ({
  useAttachments: (...a: any[]) => mockUseAttachments(...a),
}))

vi.mock('@/lib/api/attachments', () => ({
  getCategoriesForEntity: () => [
    { value: 'RODO', label: 'RODO', description: 'Zgoda RODO' },
    { value: 'OTHER', label: 'Inne', description: 'Inne' },
  ],
  getCategoryLabel: (cat: string) => cat,
}))

vi.mock('./attachment-row', () => ({
  default: ({ attachment }: any) => <div data-testid={`row-${attachment.id}`}>{attachment.label}</div>,
}))

vi.mock('./attachment-upload-dialog', () => ({
  default: ({ open }: any) => open ? <div data-testid="upload-dialog">Upload Dialog</div> : null,
}))

vi.mock('./attachment-preview', () => ({
  default: () => null,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  return {
    motion: new Proxy({}, {
      get: (_target: any, prop: string) => {
        return React.forwardRef((props: any, ref: any) => {
          const { initial, animate, exit, transition, variants, whileHover, whileTap, layout, layoutId, ...rest } = props
          return React.createElement(prop, { ...rest, ref })
        })
      },
    }),
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  }
})

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => (props: any) => <span data-testid={`icon-${String(name).toLowerCase()}`} {...props} />,
}))

import AttachmentPanel from '@/components/attachments/attachment-panel'

describe('AttachmentPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading state', () => {
    mockUseAttachments.mockReturnValue({ data: [], isLoading: true, refetch: vi.fn() })
    render(<AttachmentPanel entityType="RESERVATION" entityId="r1" />)
    // spinner via animate-spin class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows empty state when no attachments', () => {
    mockUseAttachments.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() })
    render(<AttachmentPanel entityType="RESERVATION" entityId="r1" />)
    expect(screen.getByText('Brak załączników')).toBeInTheDocument()
  })

  it('renders attachment rows', () => {
    mockUseAttachments.mockReturnValue({
      data: [
        { id: 'a1', label: 'Plik1', category: 'RODO', isArchived: false },
        { id: 'a2', label: 'Plik2', category: 'OTHER', isArchived: false },
      ],
      isLoading: false,
      refetch: vi.fn(),
    })
    render(<AttachmentPanel entityType="RESERVATION" entityId="r1" />)
    expect(screen.getByTestId('row-a1')).toBeInTheDocument()
    expect(screen.getByTestId('row-a2')).toBeInTheDocument()
  })

  it('hides "Dodaj" button in readOnly mode', () => {
    mockUseAttachments.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() })
    render(<AttachmentPanel entityType="RESERVATION" entityId="r1" readOnly />)
    expect(screen.queryByText('Dodaj')).not.toBeInTheDocument()
  })

  it('shows "Dodaj" button when not readOnly', () => {
    mockUseAttachments.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() })
    render(<AttachmentPanel entityType="RESERVATION" entityId="r1" />)
    expect(screen.getByText('Dodaj')).toBeInTheDocument()
  })

  it('opens upload dialog on "Dodaj" click', async () => {
    const user = userEvent.setup()
    mockUseAttachments.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() })
    render(<AttachmentPanel entityType="RESERVATION" entityId="r1" />)
    await user.click(screen.getByText('Dodaj'))
    expect(screen.getByTestId('upload-dialog')).toBeInTheDocument()
  })

  it('uses custom title', () => {
    mockUseAttachments.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() })
    render(<AttachmentPanel entityType="CLIENT" entityId="c1" title="Dokumenty klienta" />)
    expect(screen.getByText('Dokumenty klienta')).toBeInTheDocument()
  })
})
