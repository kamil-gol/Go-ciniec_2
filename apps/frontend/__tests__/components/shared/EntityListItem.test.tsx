import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...rest }: any) => (
      <div className={className} onClick={onClick} data-testid="motion-div" {...rest}>{children}</div>
    ),
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

import { EntityListItem } from '@/components/shared/EntityListItem'

describe('EntityListItem', () => {
  it('should render children', () => {
    render(<EntityListItem>List item content</EntityListItem>)
    expect(screen.getByText('List item content')).toBeInTheDocument()
  })

  it('should wrap in Link when href provided', () => {
    render(<EntityListItem href="/dashboard/clients/1">Client</EntityListItem>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/clients/1')
  })

  it('should add cursor-pointer when onClick provided', () => {
    render(<EntityListItem onClick={() => {}}>Content</EntityListItem>)
    expect(screen.getByTestId('motion-div').className).toContain('cursor-pointer')
  })

  it('should call onClick', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<EntityListItem onClick={handleClick}>Content</EntityListItem>)
    await user.click(screen.getByText('Content'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should show loading skeleton', () => {
    const { container } = render(<EntityListItem isLoading>Content</EntityListItem>)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should apply dimmed opacity', () => {
    render(<EntityListItem dimmed>Content</EntityListItem>)
    expect(screen.getByTestId('motion-div').className).toContain('opacity-60')
  })

  it('should pass through a11y attributes', () => {
    render(
      <EntityListItem role="listitem" tabIndex={0}>
        Content
      </EntityListItem>
    )
    const item = screen.getByTestId('motion-div')
    expect(item).toHaveAttribute('role', 'listitem')
    expect(item).toHaveAttribute('tabindex', '0')
  })
})
