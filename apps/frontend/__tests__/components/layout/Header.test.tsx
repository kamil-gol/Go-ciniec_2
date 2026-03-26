import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ── Mocks ──────────────────────────────────────────────────
const mockPush = vi.fn()
const mockSetTheme = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: mockSetTheme,
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    span: ({ children, ...props }: any) => React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }: any) => children,
}))

const mockMarkAsRead = { mutate: vi.fn() }
const mockMarkAllAsRead = { mutate: vi.fn() }

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: {
      data: [
        { id: 'n1', title: 'Nowa rezerwacja', message: 'Jan Kowalski', createdAt: new Date().toISOString(), read: false, entityType: 'RESERVATION', entityId: 'r1' },
        { id: 'n2', title: 'Wpłata', message: 'Deposit', createdAt: new Date(Date.now() - 3600000).toISOString(), read: true, entityType: 'DEPOSIT', entityId: 'd1' },
      ],
    },
  }),
  useUnreadCount: () => ({ data: 3 }),
  useMarkAsRead: () => mockMarkAsRead,
  useMarkAllAsRead: () => mockMarkAllAsRead,
}))

vi.mock('@/components/search/GlobalSearch', () => ({
  default: ({ open, onOpenChange }: any) =>
    open ? React.createElement('div', { 'data-testid': 'global-search' }, 'Search') : null,
}))

import Header from '@/components/layout/Header'

describe('Header', () => {
  const user = { firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.pl', role: 'ADMIN' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome message with user name', () => {
    render(<Header user={user} />)
    expect(screen.getByText(/Witaj, Anna!/)).toBeInTheDocument()
  })

  it('renders notification bell', () => {
    render(<Header user={user} />)
    expect(screen.getByLabelText('Powiadomienia')).toBeInTheDocument()
  })

  it('shows unread badge count', () => {
    render(<Header user={user} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('opens notification dropdown on bell click', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByLabelText('Powiadomienia'))
    expect(screen.getByText('Powiadomienia')).toBeInTheDocument()
    expect(screen.getByText('Nowa rezerwacja')).toBeInTheDocument()
  })

  it('navigates to notification link on click', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByLabelText('Powiadomienia'))
    fireEvent.click(screen.getByText('Nowa rezerwacja'))
    expect(mockMarkAsRead.mutate).toHaveBeenCalledWith('n1')
    expect(mockPush).toHaveBeenCalledWith('/dashboard/reservations/r1')
  })

  it('navigates to all notifications on "Zobacz wszystkie"', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByLabelText('Powiadomienia'))
    fireEvent.click(screen.getByText('Zobacz wszystkie'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard/notifications')
  })

  it('calls onMenuClick when hamburger is clicked', () => {
    const onMenuClick = vi.fn()
    render(<Header user={user} onMenuClick={onMenuClick} />)
    fireEvent.click(screen.getByLabelText('Otwórz menu nawigacji'))
    expect(onMenuClick).toHaveBeenCalled()
  })

  it('toggles theme on button click', () => {
    render(<Header user={user} />)
    // Light mode, button should say "switch to dark"
    const themeBtn = screen.getByLabelText('Przełącz na ciemny motyw')
    fireEvent.click(themeBtn)
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('opens search on search button click', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByLabelText('Szukaj'))
    expect(screen.getByTestId('global-search')).toBeInTheDocument()
  })

  it('marks all as read when button is clicked', () => {
    render(<Header user={user} />)
    fireEvent.click(screen.getByLabelText('Powiadomienia'))
    fireEvent.click(screen.getByTitle('Oznacz wszystkie jako przeczytane'))
    expect(mockMarkAllAsRead.mutate).toHaveBeenCalled()
  })
})
