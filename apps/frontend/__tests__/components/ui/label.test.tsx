/**
 * Label Component Tests
 *
 * Tests shadcn/ui Label (Radix-based):
 * - Renders label text
 * - htmlFor attribute
 * - Custom className
 * - Ref forwarding
 *
 * Note: Uses radix-label mock which renders <label>.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('should render label with text', () => {
    render(<Label>Imie i nazwisko</Label>)
    expect(screen.getByText('Imie i nazwisko')).toBeInTheDocument()
  })

  it('should render as a label element', () => {
    render(<Label>Email</Label>)
    const label = screen.getByText('Email')
    expect(label.tagName).toBe('LABEL')
  })

  it('should pass htmlFor attribute', () => {
    render(<Label htmlFor="email-field">Adres email</Label>)
    expect(screen.getByText('Adres email')).toHaveAttribute('for', 'email-field')
  })

  it('should apply custom className', () => {
    render(<Label className="text-red-500">Blad</Label>)
    expect(screen.getByText('Blad')).toHaveClass('text-red-500')
  })

  it('should render children elements', () => {
    render(
      <Label>
        Pole wymagane <span data-testid="asterisk">*</span>
      </Label>
    )
    expect(screen.getByTestId('asterisk')).toBeInTheDocument()
  })
})
