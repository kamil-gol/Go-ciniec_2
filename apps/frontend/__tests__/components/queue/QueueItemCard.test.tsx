/**
 * QueueItemCard Component Tests
 *
 * Tests queue item display:
 * - Client name, phone, email rendering
 * - Position badge display
 * - Guest count and date formatting
 * - Notes rendering (conditional)
 * - Action buttons (promote, edit, move up/down)
 * - Conditional visibility of move buttons (isFirst/isLast)
 *
 * Issue: #101
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@/lib/design-tokens', () => ({
  moduleAccents: {
    queue: { iconBg: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
  },
}))

// ── Test Data ────────────────────────────────────────────────────────────────

const mockQueueItem = {
  id: 'q-1',
  position: 1,
  queueDate: '2026-06-15T00:00:00Z',
  guests: 80,
  client: {
    id: 'c-1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    phone: '500100200',
    email: 'jan@test.pl',
  },
  isManualOrder: false,
  notes: 'Preferuje salę główną',
  createdAt: '2026-03-01T10:00:00Z',
  createdBy: {
    id: 'u-1',
    firstName: 'Anna',
    lastName: 'Nowak',
  },
}

const mockQueueItemNoEmail = {
  ...mockQueueItem,
  id: 'q-2',
  client: {
    id: 'c-2',
    firstName: 'Piotr',
    lastName: 'Wiśniewski',
    phone: '600300400',
  },
  notes: undefined,
}

// ── Import ───────────────────────────────────────────────────────────────────

import { QueueItemCard } from '@/components/queue/queue-item-card'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('QueueItemCard', () => {
  const defaultProps = {
    item: mockQueueItem,
    isFirst: false,
    isLast: false,
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onPromote: vi.fn(),
    onEdit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Core Rendering ──────────────────────────────────────────────────────

  describe('Core Rendering', () => {
    it('should render client full name', () => {
      render(<QueueItemCard {...defaultProps} />)
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument()
    })

    it('should render position badge', () => {
      render(<QueueItemCard {...defaultProps} />)
      expect(screen.getByText('#1')).toBeInTheDocument()
    })

    it('should render phone number', () => {
      render(<QueueItemCard {...defaultProps} />)
      expect(screen.getByText('500100200')).toBeInTheDocument()
    })

    it('should render email when provided', () => {
      render(<QueueItemCard {...defaultProps} />)
      expect(screen.getByText('jan@test.pl')).toBeInTheDocument()
    })

    it('should not render email when not provided', () => {
      render(<QueueItemCard {...defaultProps} item={mockQueueItemNoEmail as any} />)
      expect(screen.queryByText('jan@test.pl')).not.toBeInTheDocument()
    })

    it('should render guest count', () => {
      render(<QueueItemCard {...defaultProps} />)
      expect(screen.getByText('80 osób')).toBeInTheDocument()
    })

    it('should render formatted date', () => {
      render(<QueueItemCard {...defaultProps} />)
      // date-fns formats with pl locale
      expect(screen.getByText(/15 czerwca 2026/)).toBeInTheDocument()
    })
  })

  // ── Notes ───────────────────────────────────────────────────────────────

  describe('Notes', () => {
    it('should render notes when provided', () => {
      render(<QueueItemCard {...defaultProps} />)
      expect(screen.getByText('Preferuje salę główną')).toBeInTheDocument()
    })

    it('should not render notes when not provided', () => {
      render(<QueueItemCard {...defaultProps} item={mockQueueItemNoEmail as any} />)
      expect(screen.queryByText('Preferuje salę główną')).not.toBeInTheDocument()
    })
  })

  // ── Created By ──────────────────────────────────────────────────────────

  describe('Created By', () => {
    it('should show who added the item', () => {
      render(<QueueItemCard {...defaultProps} />)
      expect(screen.getByText(/Anna Nowak/)).toBeInTheDocument()
    })
  })

  // ── Action Buttons ──────────────────────────────────────────────────────

  describe('Action Buttons', () => {
    it('should render promote button and call onPromote on click', async () => {
      const user = userEvent.setup()
      render(<QueueItemCard {...defaultProps} />)

      const promoteBtn = screen.getByText('Awansuj')
      expect(promoteBtn).toBeInTheDocument()

      await user.click(promoteBtn)
      expect(defaultProps.onPromote).toHaveBeenCalledWith('q-1')
    })

    it('should render edit button and call onEdit on click', async () => {
      const user = userEvent.setup()
      render(<QueueItemCard {...defaultProps} />)

      const editBtn = screen.getByText('Edytuj')
      expect(editBtn).toBeInTheDocument()

      await user.click(editBtn)
      expect(defaultProps.onEdit).toHaveBeenCalledWith('q-1')
    })

    it('should render move up button when not first', async () => {
      const user = userEvent.setup()
      render(<QueueItemCard {...defaultProps} />)

      const moveUpBtn = screen.getByTitle('Przesuń w górę')
      expect(moveUpBtn).toBeInTheDocument()

      await user.click(moveUpBtn)
      expect(defaultProps.onMoveUp).toHaveBeenCalledWith('q-1')
    })

    it('should render move down button when not last', async () => {
      const user = userEvent.setup()
      render(<QueueItemCard {...defaultProps} />)

      const moveDownBtn = screen.getByTitle('Przesuń w dół')
      expect(moveDownBtn).toBeInTheDocument()

      await user.click(moveDownBtn)
      expect(defaultProps.onMoveDown).toHaveBeenCalledWith('q-1')
    })

    it('should hide move up button when isFirst', () => {
      render(<QueueItemCard {...defaultProps} isFirst={true} />)
      expect(screen.queryByTitle('Przesuń w górę')).not.toBeInTheDocument()
    })

    it('should hide move down button when isLast', () => {
      render(<QueueItemCard {...defaultProps} isLast={true} />)
      expect(screen.queryByTitle('Przesuń w dół')).not.toBeInTheDocument()
    })

    it('should not render promote button when onPromote is not provided', () => {
      render(<QueueItemCard {...defaultProps} onPromote={undefined} />)
      expect(screen.queryByText('Awansuj')).not.toBeInTheDocument()
    })

    it('should not render edit button when onEdit is not provided', () => {
      render(<QueueItemCard {...defaultProps} onEdit={undefined} />)
      expect(screen.queryByText('Edytuj')).not.toBeInTheDocument()
    })
  })
})
