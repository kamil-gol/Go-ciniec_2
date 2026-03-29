/**
 * Card Component Tests
 *
 * Tests shadcn/ui Card sub-components:
 * - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 * - Custom className
 * - Ref forwarding
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

describe('Card', () => {
  it('should render Card with children', () => {
    render(<Card data-testid="card">Tresc karty</Card>)
    expect(screen.getByTestId('card')).toHaveTextContent('Tresc karty')
  })

  it('should render full card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Rezerwacja</CardTitle>
          <CardDescription>Szczegoly rezerwacji</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Gosc: Jan Kowalski</p>
        </CardContent>
        <CardFooter>
          <button>Edytuj</button>
        </CardFooter>
      </Card>
    )
    expect(screen.getByText('Rezerwacja')).toBeInTheDocument()
    expect(screen.getByText('Szczegoly rezerwacji')).toBeInTheDocument()
    expect(screen.getByText('Gosc: Jan Kowalski')).toBeInTheDocument()
    expect(screen.getByText('Edytuj')).toBeInTheDocument()
  })

  it('should apply custom className to Card', () => {
    render(<Card className="bg-red-500" data-testid="card">Test</Card>)
    expect(screen.getByTestId('card')).toHaveClass('bg-red-500')
  })

  it('should apply custom className to CardHeader', () => {
    render(<CardHeader className="p-8" data-testid="header">Header</CardHeader>)
    expect(screen.getByTestId('header')).toHaveClass('p-8')
  })

  it('should forward ref on Card', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Card ref={ref}>Ref test</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('should forward ref on CardContent', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<CardContent ref={ref}>Content ref</CardContent>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
