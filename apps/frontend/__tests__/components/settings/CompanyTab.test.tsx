import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// ── Mocks ──────────────────────────────────────────────────
const mockGetCompanySettings = vi.fn()
const mockUpdateCompanySettings = vi.fn()

vi.mock('@/lib/api/settings', () => ({
  settingsApi: {
    getCompanySettings: () => mockGetCompanySettings(),
    updateCompanySettings: (data: any) => mockUpdateCompanySettings(data),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/shared', () => ({
  LoadingState: ({ message }: { message: string }) =>
    React.createElement('div', { 'data-testid': 'loading' }, message),
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) =>
    React.createElement('button', props, children),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => React.createElement('input', props),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) =>
    React.createElement('label', props, children),
}))

import { CompanyTab } from '@/components/settings/CompanyTab'
import { toast } from 'sonner'

const mockSettings = {
  companyName: 'Testowa Sala',
  address: 'ul. Testowa 1',
  city: 'Warszawa',
  postalCode: '00-001',
  phone: '123456789',
  email: 'kontakt@test.pl',
  nip: '1234567890',
  regon: '123456789',
  website: 'https://test.pl',
}

describe('CompanyTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCompanySettings.mockResolvedValue(mockSettings)
  })

  it('shows loading state initially', () => {
    mockGetCompanySettings.mockReturnValue(new Promise(() => {})) // never resolves
    render(<CompanyTab />)
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('renders form with fetched data', async () => {
    render(<CompanyTab />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Testowa Sala')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('kontakt@test.pl')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Warszawa')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument()
  })

  it('renders form labels', async () => {
    render(<CompanyTab />)
    await waitFor(() => {
      expect(screen.getByText('Nazwa firmy')).toBeInTheDocument()
    })
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Telefon')).toBeInTheDocument()
    expect(screen.getByText('NIP')).toBeInTheDocument()
    expect(screen.getByText('REGON')).toBeInTheDocument()
  })

  it('renders section titles', async () => {
    render(<CompanyTab />)
    await waitFor(() => {
      expect(screen.getByText('Dane firmy')).toBeInTheDocument()
    })
    expect(screen.getByText('Adres')).toBeInTheDocument()
    expect(screen.getByText('Dane podatkowe')).toBeInTheDocument()
  })

  it('updates form field on input change', async () => {
    render(<CompanyTab />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Testowa Sala')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('Testowa Sala')
    fireEvent.change(nameInput, { target: { value: 'Nowa Nazwa' } })
    expect(screen.getByDisplayValue('Nowa Nazwa')).toBeInTheDocument()
  })

  it('submits form and shows success toast', async () => {
    mockUpdateCompanySettings.mockResolvedValue(mockSettings)
    render(<CompanyTab />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Testowa Sala')).toBeInTheDocument()
    })

    const submitBtn = screen.getByText('Zapisz zmiany')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockUpdateCompanySettings).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Zapisano dane firmy')
    })
  })

  it('renders submit button', async () => {
    render(<CompanyTab />)
    await waitFor(() => {
      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument()
    })
  })
})
