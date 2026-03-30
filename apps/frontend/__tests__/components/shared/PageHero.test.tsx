/**
 * PageHero Component Tests
 *
 * Tests hero section rendering:
 * - Standard variant
 * - Compact variant (reduced padding, no subtitle/stats)
 * - Stats rendering
 * - Action button rendering
 * - Back navigation link
 *
 * Issue: #484
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Calendar, Users, Plus } from 'lucide-react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: any) => <div className={className}>{children}</div>,
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

import { PageHero } from '@/components/shared/PageHero'

const mockAccent = {
  name: 'Test',
  gradient: 'from-[#1e3a5f] via-[#2a4a70] to-[#1e3a5f]',
  gradientSubtle: 'from-blue-900/5 via-slate-800/5 to-blue-900/5',
  iconBg: 'from-[#2a4a70] to-[#1e3a5f]',
  text: 'text-blue-700',
  textDark: 'dark:text-blue-300',
  ring: 'ring-blue-800/20',
  badge: 'bg-blue-50',
  badgeText: 'text-blue-800',
}

describe('PageHero', () => {
  it('should render title and subtitle', () => {
    render(
      <PageHero
        accent={mockAccent}
        title="Rezerwacje"
        subtitle="Zarządzaj rezerwacjami"
        icon={Calendar}
      />
    )
    expect(screen.getByText('Rezerwacje')).toBeInTheDocument()
    expect(screen.getByText('Zarządzaj rezerwacjami')).toBeInTheDocument()
  })

  it('should render stats when provided', () => {
    render(
      <PageHero
        accent={mockAccent}
        title="Dashboard"
        icon={Calendar}
        stats={[
          { icon: Users, label: 'Goście', value: 42 },
        ]}
      />
    )
    expect(screen.getByText('Goście')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should render action button', () => {
    render(
      <PageHero
        accent={mockAccent}
        title="Test"
        icon={Calendar}
        action={<button>Nowa rezerwacja</button>}
      />
    )
    expect(screen.getByText('Nowa rezerwacja')).toBeInTheDocument()
  })

  it('should render back navigation', () => {
    render(
      <PageHero
        accent={mockAccent}
        title="Szczegóły"
        icon={Calendar}
        backHref="/dashboard"
        backLabel="Lista"
      />
    )
    const link = screen.getByText('Lista')
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard')
  })

  describe('compact variant', () => {
    it('should hide subtitle when compact', () => {
      render(
        <PageHero
          accent={mockAccent}
          title="Dziennik Audytu"
          subtitle="Historia zmian"
          icon={Calendar}
          compact
        />
      )
      expect(screen.getByText('Dziennik Audytu')).toBeInTheDocument()
      expect(screen.queryByText('Historia zmian')).not.toBeInTheDocument()
    })

    it('should hide stats when compact', () => {
      render(
        <PageHero
          accent={mockAccent}
          title="Archiwum"
          icon={Calendar}
          compact
          stats={[{ icon: Users, label: 'Wpisy', value: 10 }]}
        />
      )
      expect(screen.queryByText('Wpisy')).not.toBeInTheDocument()
    })

    it('should still render action when compact', () => {
      render(
        <PageHero
          accent={mockAccent}
          title="Szablony"
          icon={Calendar}
          compact
          action={<button>Dodaj</button>}
        />
      )
      expect(screen.getByText('Dodaj')).toBeInTheDocument()
    })
  })
})
