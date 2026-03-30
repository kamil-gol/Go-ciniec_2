/**
 * Breadcrumb Component Tests
 *
 * Tests breadcrumb navigation:
 * - Correct rendering of path segments
 * - Active segment uses font-semibold
 * - Home icon link
 * - Labels from pathLabels map
 *
 * Issue: #485
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockPathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

import { Breadcrumb } from '@/components/shared/Breadcrumb'

describe('Breadcrumb', () => {
  it('should not render for root path', () => {
    mockPathname.mockReturnValue('/dashboard')
    const { container } = render(<Breadcrumb />)
    expect(container.querySelector('nav')).toBeNull()
  })

  it('should render segments for nested path', () => {
    mockPathname.mockReturnValue('/dashboard/reservations')
    render(<Breadcrumb />)
    expect(screen.getByText('Rezerwacje')).toBeInTheDocument()
  })

  it('should render active segment with font-semibold', () => {
    mockPathname.mockReturnValue('/dashboard/deposits')
    render(<Breadcrumb />)
    const active = screen.getByText('Zaliczki')
    expect(active.className).toContain('font-semibold')
  })

  it('should render inactive segments as links', () => {
    mockPathname.mockReturnValue('/dashboard/reservations/new')
    render(<Breadcrumb />)
    const rezLink = screen.getByText('Rezerwacje')
    expect(rezLink.closest('a')).toHaveAttribute('href', '/dashboard/reservations')
  })

  it('should render Home icon link', () => {
    mockPathname.mockReturnValue('/dashboard/clients')
    render(<Breadcrumb />)
    const homeLink = screen.getByRole('link', { name: '' })
    expect(homeLink).toHaveAttribute('href', '/dashboard')
  })

  it('should translate path segments using pathLabels', () => {
    mockPathname.mockReturnValue('/dashboard/event-types')
    render(<Breadcrumb />)
    expect(screen.getByText('Typy Wydarzeń')).toBeInTheDocument()
  })
})
