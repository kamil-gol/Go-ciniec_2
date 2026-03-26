/**
 * TemplateEditor Component Tests
 *
 * Testy edytora szablonów dokumentów:
 * - Wyświetlanie stanu ładowania
 * - Renderowanie nazwy szablonu po załadowaniu
 * - Informacja "Nie znaleziono" gdy brak danych
 * - Renderowanie textarea do edycji
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ── Hoisted mocks ──

const { mockUseDocumentTemplate, mockUseUpdateTemplate, mockUsePreviewTemplate } = vi.hoisted(() => ({
  mockUseDocumentTemplate: vi.fn(),
  mockUseUpdateTemplate: vi.fn(),
  mockUsePreviewTemplate: vi.fn(),
}))

vi.mock('@/hooks/use-document-templates', () => ({
  useDocumentTemplate: (...a: any[]) => mockUseDocumentTemplate(...a),
  useUpdateTemplate: (...a: any[]) => mockUseUpdateTemplate(...a),
  usePreviewTemplate: (...a: any[]) => mockUsePreviewTemplate(...a),
}))

vi.mock('./editor', () => ({
  EditorHeader: ({ templateName }: any) => <div data-testid="editor-header">{templateName}</div>,
  VariablePicker: () => <div data-testid="variable-picker" />,
  EditorToolbar: () => <div data-testid="editor-toolbar" />,
  TemplatePreview: () => <div data-testid="template-preview" />,
  SaveDialog: () => null,
  CloseDialog: () => null,
  SAMPLE_VARS: { name: 'Jan Kowalski' },
  MD_TOOLBAR: [{ action: 'wrap', before: '**', after: '**', label: 'Bold' }],
}))

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
  SheetDescription: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => (props: any) => <div data-testid={`icon-${String(name).toLowerCase()}`} {...props} />,
}))

import { TemplateEditor } from '@/components/document-templates/TemplateEditor'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('TemplateEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUpdateTemplate.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    mockUsePreviewTemplate.mockReturnValue({ mutate: vi.fn(), data: null })
  })

  it('shows loading spinner while fetching', () => {
    mockUseDocumentTemplate.mockReturnValue({ data: undefined, isLoading: true })
    render(<TemplateEditor slug="invoice" open={true} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('renders template name after loading', async () => {
    mockUseDocumentTemplate.mockReturnValue({
      data: {
        slug: 'invoice',
        name: 'Faktura',
        content: '# Hello',
        version: 1,
        updatedAt: '2026-01-01T00:00:00Z',
        availableVars: ['name'],
      },
      isLoading: false,
    })
    render(<TemplateEditor slug="invoice" open={true} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(screen.getByTestId('editor-header')).toHaveTextContent('Faktura')
  })

  it('shows "Nie znaleziono" when template is null', () => {
    mockUseDocumentTemplate.mockReturnValue({ data: null, isLoading: false })
    render(<TemplateEditor slug="missing" open={true} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(screen.getByText('Nie znaleziono szablonu')).toBeInTheDocument()
  })

  it('renders nothing when not open', () => {
    mockUseDocumentTemplate.mockReturnValue({ data: null, isLoading: false })
    const { container } = render(<TemplateEditor slug="invoice" open={false} onClose={vi.fn()} />, { wrapper: createWrapper() })
    expect(container.innerHTML).toBe('')
  })
})
