/**
 * Switch Component Tests
 *
 * Tests shadcn/ui Switch (Radix-based):
 * - Renders as switch role
 * - Default unchecked state
 * - Checked state
 * - onCheckedChange callback
 * - Disabled state
 * - Custom className
 *
 * Note: Uses radix-switch mock with button[role=switch].
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Switch } from '@/components/ui/switch'

describe('Switch', () => {
  it('should render a switch element', () => {
    render(<Switch aria-label="tryb ciemny" />)
    expect(screen.getByRole('switch', { name: 'tryb ciemny' })).toBeInTheDocument()
  })

  it('should be unchecked by default', () => {
    render(<Switch aria-label="toggle" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('should be checked when checked prop is true', () => {
    render(<Switch checked aria-label="on" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('should call onCheckedChange when toggled', () => {
    const onCheckedChange = vi.fn()
    render(<Switch onCheckedChange={onCheckedChange} aria-label="toggle" />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled aria-label="disabled-sw" />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('should have data-state attribute', () => {
    render(<Switch aria-label="state" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')
  })

  it('should have data-state=checked when checked', () => {
    render(<Switch checked aria-label="state-on" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
  })
})
