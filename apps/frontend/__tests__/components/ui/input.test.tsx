/**
 * Input Component Tests
 *
 * Tests custom Input with label and error support:
 * - Default render
 * - Placeholder text
 * - Label rendering
 * - Error message display
 * - Disabled state
 * - onChange handler
 * - Type variants (text, email, password, number)
 * - Ref forwarding
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('should render an input element', () => {
    render(<Input placeholder="Wpisz tekst" />)
    expect(screen.getByPlaceholderText('Wpisz tekst')).toBeInTheDocument()
  })

  it('should render label when label prop is provided', () => {
    render(<Input label="Imie" />)
    expect(screen.getByText('Imie')).toBeInTheDocument()
  })

  it('should render error message when error prop is provided', () => {
    render(<Input error="Pole wymagane" />)
    expect(screen.getByText('Pole wymagane')).toBeInTheDocument()
  })

  it('should call onChange when value changes', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} placeholder="input" />)
    fireEvent.change(screen.getByPlaceholderText('input'), {
      target: { value: 'test' },
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="disabled" />)
    expect(screen.getByPlaceholderText('disabled')).toBeDisabled()
  })

  it('should accept type prop', () => {
    render(<Input type="email" placeholder="email" />)
    expect(screen.getByPlaceholderText('email')).toHaveAttribute('type', 'email')
  })

  it('should accept type="password"', () => {
    render(<Input type="password" placeholder="haslo" />)
    expect(screen.getByPlaceholderText('haslo')).toHaveAttribute('type', 'password')
  })

  it('should forward ref', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="ref-test" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('should apply custom className', () => {
    render(<Input className="extra-class" placeholder="cls" />)
    expect(screen.getByPlaceholderText('cls')).toHaveClass('extra-class')
  })

  it('should show label and error together', () => {
    render(<Input label="Email" error="Nieprawidlowy email" placeholder="em" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Nieprawidlowy email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('em')).toBeInTheDocument()
  })
})
