/**
 * SectionCard Component Tests
 *
 * Tests the unified section card component:
 * - Default variant: flat header with icon pill
 * - Gradient variant: gradient background header
 * - Badge and action slots
 * - Field, CountBadge, StatPill sub-components
 *
 * Issue: #537
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Receipt, Sparkles } from 'lucide-react'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { SectionCard, Field, CountBadge, StatPill } from '@/components/shared/SectionCard'

// ── SectionCard Tests ────────────────────────────────────────────────────────

describe('SectionCard', () => {
  describe('Default Variant', () => {
    it('should render title and children', () => {
      render(
        <SectionCard
          icon={Receipt}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Podsumowanie"
        >
          <p>Content here</p>
        </SectionCard>
      )
      expect(screen.getByText('Podsumowanie')).toBeInTheDocument()
      expect(screen.getByText('Content here')).toBeInTheDocument()
    })

    it('should render badge when provided', () => {
      render(
        <SectionCard
          icon={Receipt}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Test"
          badge={<span data-testid="badge">3 items</span>}
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(screen.getByTestId('badge')).toBeInTheDocument()
      expect(screen.getByText('3 items')).toBeInTheDocument()
    })

    it('should render action slot when provided', () => {
      render(
        <SectionCard
          icon={Receipt}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Test"
          action={<button data-testid="action-btn">Add</button>}
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(screen.getByTestId('action-btn')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <SectionCard
          icon={Receipt}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Test"
          className="custom-class"
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should render accent gradient stripe when provided', () => {
      const { container } = render(
        <SectionCard
          icon={Receipt}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Test"
          accentGradient="from-blue-500 to-cyan-500"
        >
          <p>Content</p>
        </SectionCard>
      )
      const stripe = container.querySelector('.h-1.bg-gradient-to-r')
      expect(stripe).toBeInTheDocument()
    })
  })

  describe('Gradient Variant', () => {
    it('should render title and children in gradient mode', () => {
      render(
        <SectionCard
          variant="gradient"
          title="Podsumowanie finansowe"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-emerald-500 to-teal-500"
          headerGradient="from-emerald-50 via-teal-50 to-cyan-50"
        >
          <p>Financial content</p>
        </SectionCard>
      )
      expect(screen.getByText('Podsumowanie finansowe')).toBeInTheDocument()
      expect(screen.getByText('Financial content')).toBeInTheDocument()
    })

    it('should apply shadow-soft class in gradient mode', () => {
      const { container } = render(
        <SectionCard
          variant="gradient"
          title="Test"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-cyan-500"
          headerGradient="from-blue-50 to-cyan-50"
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(container.firstChild).toHaveClass('shadow-soft')
    })

    it('should apply border-0 class in gradient mode', () => {
      const { container } = render(
        <SectionCard
          variant="gradient"
          title="Test"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-cyan-500"
          headerGradient="from-blue-50 to-cyan-50"
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(container.firstChild).toHaveClass('border-0')
    })

    it('should render badge in gradient mode', () => {
      render(
        <SectionCard
          variant="gradient"
          title="Test"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-cyan-500"
          headerGradient="from-blue-50 to-cyan-50"
          badge={<span data-testid="gradient-badge">5 pozycji</span>}
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(screen.getByTestId('gradient-badge')).toBeInTheDocument()
    })

    it('should render action in gradient mode', () => {
      render(
        <SectionCard
          variant="gradient"
          title="Test"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-cyan-500"
          headerGradient="from-blue-50 to-cyan-50"
          action={<button data-testid="gradient-action">Dodaj</button>}
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(screen.getByTestId('gradient-action')).toBeInTheDocument()
    })

    it('should apply headerSpacing mb-4', () => {
      const { container } = render(
        <SectionCard
          variant="gradient"
          title="Test"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-cyan-500"
          headerGradient="from-blue-50 to-cyan-50"
          headerSpacing="mb-4"
        >
          <p>Content</p>
        </SectionCard>
      )
      const headerRow = container.querySelector('.flex.items-center.gap-3')
      expect(headerRow).toHaveClass('mb-4')
    })

    it('should default headerSpacing to mb-6', () => {
      const { container } = render(
        <SectionCard
          variant="gradient"
          title="Test"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-cyan-500"
          headerGradient="from-blue-50 to-cyan-50"
        >
          <p>Content</p>
        </SectionCard>
      )
      const headerRow = container.querySelector('.flex.items-center.gap-3')
      expect(headerRow).toHaveClass('mb-6')
    })

    it('should apply custom className in gradient mode', () => {
      const { container } = render(
        <SectionCard
          variant="gradient"
          title="Test"
          icon={<Receipt className="h-5 w-5 text-white" />}
          iconGradient="from-blue-500 to-cyan-500"
          headerGradient="from-blue-50 to-cyan-50"
          className="md:col-span-2"
        >
          <p>Content</p>
        </SectionCard>
      )
      expect(container.firstChild).toHaveClass('md:col-span-2')
    })
  })
})

// ── Field Tests ──────────────────────────────────────────────────────────────

describe('Field', () => {
  it('should render label and value', () => {
    render(<Field label="Imię" value="Jan" />)
    expect(screen.getByText('Imię')).toBeInTheDocument()
    expect(screen.getByText('Jan')).toBeInTheDocument()
  })

  it('should render em dash when value is null', () => {
    render(<Field label="Email" value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should render em dash when value is undefined', () => {
    render(<Field label="Phone" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should apply col-span-2 when full is true', () => {
    const { container } = render(<Field label="Notes" value="Some text" full />)
    expect(container.firstChild).toHaveClass('col-span-2')
  })
})

// ── CountBadge Tests ─────────────────────────────────────────────────────────

describe('CountBadge', () => {
  it('should render the count', () => {
    render(<CountBadge count={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('should render zero count', () => {
    render(<CountBadge count={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

// ── StatPill Tests ───────────────────────────────────────────────────────────

describe('StatPill', () => {
  it('should render value', () => {
    render(<StatPill icon={Sparkles} value="42" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should render label when provided', () => {
    render(<StatPill icon={Sparkles} label="Total" value="100" />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should not render label when not provided', () => {
    render(<StatPill icon={Sparkles} value="50" />)
    expect(screen.queryByText('Total')).not.toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })
})
