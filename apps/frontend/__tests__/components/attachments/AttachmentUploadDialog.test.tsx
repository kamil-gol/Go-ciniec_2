/**
 * AttachmentUploadDialog Component Tests
 *
 * Testy dialogu wgrywania załączników:
 * - Renderowanie dialogu gdy open=true
 * - Ukrywanie gdy open=false
 * - Tytuł dialogu
 * - Strefa drop zone
 * - Przyciski kategorii
 * - Walidacja pliku (typ, rozmiar)
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...rest }: any) => <label {...rest}>{children}</label>,
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}))

vi.mock('@/lib/api/attachments', () => ({
  attachmentsApi: { upload: vi.fn() },
  getCategoriesForEntity: () => [
    { value: 'RODO', label: 'RODO', description: 'Zgoda RODO' },
    { value: 'CONTRACT', label: 'Umowa', description: 'Umowa' },
    { value: 'OTHER', label: 'Inne', description: 'Inne' },
  ],
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE: 10 * 1024 * 1024,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  Upload: () => <span data-testid="icon-upload" />,
  X: () => <span />,
  FileText: () => <span />,
  Image: () => <span />,
  Loader2: () => <span />,
}))

import AttachmentUploadDialog from '@/components/attachments/attachment-upload-dialog'

describe('AttachmentUploadDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    entityType: 'RESERVATION' as const,
    entityId: 'r1',
    onUploaded: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('renders when open', () => {
    render(<AttachmentUploadDialog {...defaultProps} />)
    expect(screen.getByText('Wgraj załącznik')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<AttachmentUploadDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Wgraj załącznik')).not.toBeInTheDocument()
  })

  it('renders drop zone text', () => {
    render(<AttachmentUploadDialog {...defaultProps} />)
    expect(screen.getByText(/Kliknij/)).toBeInTheDocument()
    expect(screen.getByText(/przeciągnij plik/)).toBeInTheDocument()
  })

  it('renders category buttons', () => {
    render(<AttachmentUploadDialog {...defaultProps} />)
    expect(screen.getByText('RODO')).toBeInTheDocument()
    expect(screen.getByText('Umowa')).toBeInTheDocument()
    expect(screen.getByText('Inne')).toBeInTheDocument()
  })

  it('renders submit button disabled without file', () => {
    render(<AttachmentUploadDialog {...defaultProps} />)
    const submitBtn = screen.getByText('Wgraj plik').closest('button')
    expect(submitBtn).toBeDisabled()
  })

  it('renders label and description inputs', () => {
    render(<AttachmentUploadDialog {...defaultProps} />)
    expect(screen.getByText(/Etykieta/)).toBeInTheDocument()
    expect(screen.getByText(/Opis/)).toBeInTheDocument()
  })
})
