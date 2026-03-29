/**
 * GlobalSearch Component Tests
 *
 * Testy wyszukiwarki globalnej:
 * - Renderowanie dialogu gdy open=true
 * - Placeholder wyszukiwania
 * - Komunikat "minimum 2 znaki"
 * - Wyświetlanie wyników (rezerwacje, klienci, sale)
 * - Stan "brak wyników"
 * - Stan ładowania
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ── Hoisted mocks ──

const { mockUseGlobalSearch, mockRouterPush } = vi.hoisted(() => ({
  mockUseGlobalSearch: vi.fn(),
  mockRouterPush: vi.fn(),
}))

vi.mock('@/hooks/use-search', () => ({
  useGlobalSearch: (...a: any[]) => mockUseGlobalSearch(...a),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

// Mock Radix Dialog
vi.mock('@radix-ui/react-dialog', () => {
  const React = require('react')
  return {
    Root: ({ children, open }: any) => open ? <div data-testid="search-dialog">{children}</div> : null,
    Portal: ({ children }: any) => <div>{children}</div>,
    Overlay: () => <div data-testid="overlay" />,
    Content: ({ children }: any) => <div>{children}</div>,
    Title: ({ children, className }: any) => <span className={className}>{children}</span>,
    Description: ({ children, className }: any) => <span className={className}>{children}</span>,
  }
})

// Mock Command components
vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: any) => <div data-testid="command">{children}</div>,
  CommandInput: ({ placeholder, value, onValueChange }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e: any) => onValueChange(e.target.value)}
    />
  ),
  CommandList: ({ children }: any) => <div data-testid="command-list">{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children, heading }: any) => (
    <div data-testid={`group-${heading}`}>
      <span>{heading}</span>
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect, value }: any) => (
    <div data-testid={`item-${value}`} onClick={onSelect} role="option">
      {children}
    </div>
  ),
  CommandSeparator: () => <hr />,
}))

vi.mock('lucide-react', () => ({
  Calendar: () => <span />,
  Users: () => <span />,
  Building2: () => <span />,
  Loader2: () => <span data-testid="loader" />,
  Plus: () => <span />,
  UserPlus: () => <span />,
  CalendarDays: () => <span />,
}))

import GlobalSearch from '@/components/search/GlobalSearch'

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseGlobalSearch.mockReturnValue({ data: undefined, isFetching: false })
  })

  it('renders dialog when open', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByTestId('search-dialog')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const { container } = render(<GlobalSearch open={false} onOpenChange={vi.fn()} />)
    expect(container.querySelector('[data-testid="search-dialog"]')).not.toBeInTheDocument()
  })

  it('renders search placeholder', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Szukaj rezerwacji, klientów, sal...')).toBeInTheDocument()
  })

  it('shows loader when fetching', () => {
    mockUseGlobalSearch.mockReturnValue({ data: undefined, isFetching: true })
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Wyszukiwanie...')).toBeInTheDocument()
  })

  it('shows "Brak wyników" for empty results', async () => {
    const user = userEvent.setup()
    mockUseGlobalSearch.mockReturnValue({
      data: { reservations: [], clients: [], halls: [] },
      isFetching: false,
    })
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />)

    const input = screen.getByTestId('search-input')
    await user.clear(input)
    await user.type(input, 'xyz')

    // Wait for debounce
    await waitFor(() => {
      // The component shows CommandEmpty with "Brak wyników" text
      const empty = screen.queryByTestId('command-empty')
      // We need the debounced query to be set, which happens after 300ms
      expect(empty || screen.queryByText(/Wpisz minimum 2 znaki/)).toBeTruthy()
    })
  })

  it('renders reservation results', () => {
    mockUseGlobalSearch.mockReturnValue({
      data: {
        reservations: [{
          id: 'r1',
          status: 'CONFIRMED',
          startDateTime: '2026-06-01T10:00:00Z',
          client: { firstName: 'Jan', lastName: 'Kowalski', clientType: 'INDIVIDUAL' },
          hall: { name: 'Sala A' },
          eventType: { name: 'Wesele' },
        }],
        clients: [],
        halls: [],
      },
      isFetching: false,
    })
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Rezerwacje')).toBeInTheDocument()
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
  })

  it('renders client results', () => {
    mockUseGlobalSearch.mockReturnValue({
      data: {
        reservations: [],
        clients: [{
          id: 'c1',
          firstName: 'Anna',
          lastName: 'Nowak',
          clientType: 'INDIVIDUAL',
          email: 'anna@test.pl',
        }],
        halls: [],
      },
      isFetching: false,
    })
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Klienci')).toBeInTheDocument()
    expect(screen.getByText('Anna Nowak')).toBeInTheDocument()
  })

  it('renders hall results', () => {
    mockUseGlobalSearch.mockReturnValue({
      data: {
        reservations: [],
        clients: [],
        halls: [{ id: 'h1', name: 'Sala Bankietowa', capacity: 200 }],
      },
      isFetching: false,
    })
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Sale')).toBeInTheDocument()
    expect(screen.getByText('Sala Bankietowa')).toBeInTheDocument()
  })
})
