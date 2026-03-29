/**
 * Checkbox Component Tests
 *
 * Tests custom Checkbox (native input-based):
 * - Renders checkbox input
 * - Checked / unchecked states
 * - onCheckedChange callback
 * - onChange callback
 * - Disabled state
 * - Ref forwarding
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox', () => {
  it('should render a checkbox input', () => {
    render(<Checkbox aria-label="zgoda" />)
    expect(screen.getByRole('checkbox', { name: 'zgoda' })).toBeInTheDocument()
  })

  it('should be unchecked by default', () => {
    render(<Checkbox aria-label="test" />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('should be checked when checked prop is true', () => {
    render(<Checkbox checked aria-label="test" onChange={() => {}} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('should call onCheckedChange when toggled', () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox onCheckedChange={onCheckedChange} aria-label="toggle" />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('should call onChange when toggled', () => {
    const onChange = vi.fn()
    render(<Checkbox onChange={onChange} aria-label="change" />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled aria-label="disabled-cb" />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('should forward ref', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Checkbox ref={ref} aria-label="ref-cb" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
