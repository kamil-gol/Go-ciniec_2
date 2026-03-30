import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...rest }: any) => (
      <div className={className} onClick={onClick} data-testid="motion-div">{children}</div>
    ),
  },
}))

import { EntityCard } from '@/components/shared/EntityCard'

describe('EntityCard', () => {
  it('should render children', () => {
    render(<EntityCard>Card content</EntityCard>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should show accent bar with gradient', () => {
    const { container } = render(
      <EntityCard accentGradient="from-blue-500 to-indigo-500">Content</EntityCard>
    )
    const bar = container.querySelector('.h-1.bg-gradient-to-r')
    expect(bar).toBeInTheDocument()
  })

  it('should show accent bar with inline color', () => {
    const { container } = render(
      <EntityCard accentColor="#ff0000">Content</EntityCard>
    )
    const bar = container.querySelector('.h-1')
    expect(bar).toHaveStyle({ backgroundColor: '#ff0000' })
  })

  it('should not show accent bar when neither prop given', () => {
    const { container } = render(<EntityCard>Content</EntityCard>)
    expect(container.querySelector('.h-1')).not.toBeInTheDocument()
  })

  it('should add cursor-pointer when onClick provided', () => {
    render(<EntityCard onClick={() => {}}>Content</EntityCard>)
    expect(screen.getByTestId('motion-div').className).toContain('cursor-pointer')
  })

  it('should call onClick', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<EntityCard onClick={handleClick}>Content</EntityCard>)
    await user.click(screen.getByText('Content'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should show loading skeleton', () => {
    const { container } = render(<EntityCard isLoading>Content</EntityCard>)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should apply dimmed opacity', () => {
    render(<EntityCard dimmed>Content</EntityCard>)
    expect(screen.getByTestId('motion-div').className).toContain('opacity-60')
  })

  it('should skip padding when noPadding', () => {
    const { container } = render(
      <EntityCard noPadding><span data-testid="child">Content</span></EntityCard>
    )
    const child = screen.getByTestId('child')
    expect(child.parentElement?.className).not.toContain('p-5')
  })
})
