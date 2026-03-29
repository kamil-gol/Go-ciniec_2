/**
 * Textarea Component Tests
 *
 * Tests shadcn/ui Textarea:
 * - Renders textarea element
 * - Placeholder text
 * - onChange handler
 * - Disabled state
 * - Custom className
 * - Ref forwarding
 * - Rows prop
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('should render a textarea element', () => {
    render(<Textarea placeholder="Wpisz uwagi" />)
    expect(screen.getByPlaceholderText('Wpisz uwagi')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Wpisz uwagi').tagName).toBe('TEXTAREA')
  })

  it('should call onChange when text is entered', () => {
    const onChange = vi.fn()
    render(<Textarea onChange={onChange} placeholder="notatka" />)
    fireEvent.change(screen.getByPlaceholderText('notatka'), {
      target: { value: 'Nowa notatka' },
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled placeholder="disabled-ta" />)
    expect(screen.getByPlaceholderText('disabled-ta')).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<Textarea className="min-h-[200px]" placeholder="cls" />)
    expect(screen.getByPlaceholderText('cls')).toHaveClass('min-h-[200px]')
  })

  it('should accept rows prop', () => {
    render(<Textarea rows={10} placeholder="rows" />)
    expect(screen.getByPlaceholderText('rows')).toHaveAttribute('rows', '10')
  })

  it('should forward ref', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} placeholder="ref" />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('should render with default value', () => {
    render(<Textarea defaultValue="Domyslna wartosc" placeholder="val" />)
    expect(screen.getByPlaceholderText('val')).toHaveValue('Domyslna wartosc')
  })
})
