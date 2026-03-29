/**
 * Select Component Tests
 *
 * Tests shadcn/ui Select (Radix-based):
 * - Renders trigger with placeholder
 * - Renders select items
 * - Custom className on trigger
 * - SelectLabel and SelectSeparator
 *
 * Note: Uses radix-stub mock; all primitives render as divs.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select'

describe('Select', () => {
  it('should render trigger with placeholder', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Wybierz opcje" />
        </SelectTrigger>
      </Select>
    )
    // radix-stub renders Value as div with placeholder attribute
    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
    expect(trigger.querySelector('[placeholder="Wybierz opcje"]')).toBeInTheDocument()
  })

  it('should render select items when content is provided', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Sala" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sala-a">Sala A</SelectItem>
          <SelectItem value="sala-b">Sala B</SelectItem>
          <SelectItem value="sala-c">Sala C</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText('Sala A')).toBeInTheDocument()
    expect(screen.getByText('Sala B')).toBeInTheDocument()
    expect(screen.getByText('Sala C')).toBeInTheDocument()
  })

  it('should render SelectGroup with SelectLabel', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Typ" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Typy wydarzen</SelectLabel>
            <SelectItem value="wesele">Wesele</SelectItem>
            <SelectItem value="komunia">Komunia</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText('Typy wydarzen')).toBeInTheDocument()
    expect(screen.getByText('Wesele')).toBeInTheDocument()
    expect(screen.getByText('Komunia')).toBeInTheDocument()
  })

  it('should render SelectSeparator', () => {
    render(
      <Select>
        <SelectContent>
          <SelectItem value="a">Opcja A</SelectItem>
          <SelectSeparator data-testid="separator" />
          <SelectItem value="b">Opcja B</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByTestId('separator')).toBeInTheDocument()
  })

  it('should apply custom className to trigger', () => {
    render(
      <Select>
        <SelectTrigger className="w-full" data-testid="trigger">
          <SelectValue placeholder="Test" />
        </SelectTrigger>
      </Select>
    )
    expect(screen.getByTestId('trigger')).toHaveClass('w-full')
  })
})
