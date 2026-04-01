/**
 * New Reservation Page Tests
 *
 * Tests the new reservation page (/dashboard/reservations/new):
 * - Renders page hero with title "Nowa Rezerwacja"
 * - Shows back button to reservations list
 * - Renders CreateReservationForm component
 * - Passes hallId from search params when present
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockPush, mockUseSearchParams } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseSearchParams: vi.fn(() => new URLSearchParams()),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/reservations/new',
  useSearchParams: mockUseSearchParams,
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    reservations: {
      iconBg: 'bg-blue-500',
      text: 'text-blue-600',
      textDark: 'text-blue-400',
      gradient: 'from-blue-500 to-cyan-500',
      gradientSubtle: 'from-blue-50 to-cyan-50',
    },
  },
}))

vi.mock('@/components/shared', () => ({
  PageLayout: ({ children, narrowContent }: any) => (
    <div data-testid="page-layout" data-narrow={narrowContent ? 'true' : 'false'}>{children}</div>
  ),
  PageHeader: ({ title, subtitle }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

vi.mock('@/components/reservations/create-reservation-form', () => ({
  CreateReservationForm: ({ defaultHallId }: any) => (
    <div data-testid="create-reservation-form" data-hall-id={defaultHallId || ''}>
      Formularz rezerwacji
    </div>
  ),
}))

// ── Import ───────────────────────────────────────────────────────────────────

import NewReservationPage from '@/app/dashboard/reservations/new/page'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('NewReservationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
  })

  it('renders page hero with title', () => {
    render(<NewReservationPage />)
    expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument()
  })

  it('renders subtitle with form instructions', () => {
    render(<NewReservationPage />)
    expect(
      screen.getByText(/Wypełnij formularz krok po kroku/)
    ).toBeInTheDocument()
  })

  it('renders back button to reservations list', () => {
    render(<NewReservationPage />)
    expect(screen.getByText('Powrót do listy')).toBeInTheDocument()
  })

  it('renders CreateReservationForm component', () => {
    render(<NewReservationPage />)
    expect(screen.getByTestId('create-reservation-form')).toBeInTheDocument()
  })

  it('passes hallId from search params to form', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('hallId=hall-abc'))
    render(<NewReservationPage />)
    const form = screen.getByTestId('create-reservation-form')
    expect(form).toHaveAttribute('data-hall-id', 'hall-abc')
  })

  it('renders with narrow content layout', () => {
    render(<NewReservationPage />)
    expect(screen.getByTestId('page-layout')).toHaveAttribute('data-narrow', 'true')
  })
})
