import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/status-colors', () => ({
  getStatusConfig: (type: string, status: string) => ({
    label: `${status}-label`,
    icon: ({ className }: any) => <span className={className} data-testid="status-icon">icon</span>,
    bg: 'bg-test',
    text: 'text-test',
    border: 'border-test',
    dot: 'bg-dot-test',
    solid: 'bg-solid-test text-white',
  }),
}))

import { StatusBadge } from '@/components/shared/StatusBadge'

describe('StatusBadge', () => {
  it('should render default variant with icon and label', () => {
    render(<StatusBadge type="reservation" status="CONFIRMED" />)
    expect(screen.getByText('CONFIRMED-label')).toBeInTheDocument()
    expect(screen.getByTestId('status-icon')).toBeInTheDocument()
  })

  it('should render solid variant', () => {
    render(<StatusBadge type="reservation" status="CONFIRMED" variant="solid" />)
    expect(screen.getByText('CONFIRMED-label')).toBeInTheDocument()
  })

  it('should render dot variant with dot element', () => {
    render(<StatusBadge type="reservation" status="CONFIRMED" variant="dot" />)
    expect(screen.getByText('CONFIRMED-label')).toBeInTheDocument()
  })

  it('should show ping animation on active statuses in dot variant', () => {
    const { container } = render(
      <StatusBadge type="reservation" status="PENDING" variant="dot" />
    )
    const pingEl = container.querySelector('.animate-ping')
    expect(pingEl).toBeInTheDocument()
  })

  it('should not show ping animation on inactive statuses in dot variant', () => {
    const { container } = render(
      <StatusBadge type="reservation" status="COMPLETED" variant="dot" />
    )
    const pingEl = container.querySelector('.animate-ping')
    expect(pingEl).not.toBeInTheDocument()
  })

  it('should not show ping when ping prop is false', () => {
    const { container } = render(
      <StatusBadge type="reservation" status="PENDING" variant="dot" ping={false} />
    )
    const pingEl = container.querySelector('.animate-ping')
    expect(pingEl).not.toBeInTheDocument()
  })

  it('should hide icon in dot variant by default', () => {
    render(<StatusBadge type="reservation" status="CONFIRMED" variant="dot" />)
    expect(screen.queryByTestId('status-icon')).not.toBeInTheDocument()
  })

  it('should hide label when showLabel is false', () => {
    render(<StatusBadge type="reservation" status="CONFIRMED" showLabel={false} />)
    expect(screen.queryByText('CONFIRMED-label')).not.toBeInTheDocument()
  })

  it('should render dot element in dot variant', () => {
    const { container } = render(
      <StatusBadge type="reservation" status="COMPLETED" variant="dot" />
    )
    const dotEl = container.querySelector('.bg-dot-test')
    expect(dotEl).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <StatusBadge type="reservation" status="CONFIRMED" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should show ping for all active statuses', () => {
    const activeStatuses = ['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'WAITING', 'DRAFT', 'INQUIRY', 'QUOTED']
    for (const status of activeStatuses) {
      const { container, unmount } = render(
        <StatusBadge type="reservation" status={status} variant="dot" />
      )
      expect(container.querySelector('.animate-ping')).toBeInTheDocument()
      unmount()
    }
  })
})
