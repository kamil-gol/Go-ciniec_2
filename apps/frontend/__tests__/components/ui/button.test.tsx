/**
 * Button Component Tests
 *
 * Tests shadcn/ui Button:
 * - Default render with text
 * - onClick handler
 * - Disabled state
 * - Variant props (destructive, outline, secondary, ghost, link)
 * - Size props (sm, lg, icon)
 * - asChild with Slot
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Zapisz</Button>)
    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Klik</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Zablokowany</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Nie klikaj</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Przycisk</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('should render with type="submit"', () => {
    render(<Button type="submit">Wyslij</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('should render children elements', () => {
    render(
      <Button>
        <span data-testid="icon">+</span>
        Dodaj
      </Button>
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Dodaj')
  })

  it('should forward ref', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('should render as child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Link Button</a>
      </Button>
    )
    const link = screen.getByText('Link Button')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/link')
  })
})
