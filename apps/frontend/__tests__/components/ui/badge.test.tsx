/**
 * Badge Component Tests
 *
 * Tests shadcn/ui Badge:
 * - Default render
 * - Variant props (default, secondary, destructive, outline)
 * - Custom className
 * - onClick handler
 * - Children rendering
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('should render with text', () => {
    render(<Badge>Aktywna</Badge>)
    expect(screen.getByText('Aktywna')).toBeInTheDocument()
  })

  it('should render with default variant', () => {
    render(<Badge data-testid="badge">Status</Badge>)
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive" data-testid="badge">Anulowana</Badge>)
    expect(screen.getByTestId('badge')).toHaveTextContent('Anulowana')
  })

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary">Wersja robocza</Badge>)
    expect(screen.getByText('Wersja robocza')).toBeInTheDocument()
  })

  it('should render with outline variant', () => {
    render(<Badge variant="outline">Zarys</Badge>)
    expect(screen.getByText('Zarys')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Badge className="ml-2" data-testid="badge">Test</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('ml-2')
  })

  it('should handle onClick', () => {
    const onClick = vi.fn()
    render(<Badge onClick={onClick}>Kliknij</Badge>)
    fireEvent.click(screen.getByText('Kliknij'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should render complex children', () => {
    render(
      <Badge>
        <span data-testid="dot" /> Potwierdzona
      </Badge>
    )
    expect(screen.getByTestId('dot')).toBeInTheDocument()
    expect(screen.getByText('Potwierdzona')).toBeInTheDocument()
  })
})
