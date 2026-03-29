/**
 * AlertDialog Component Tests
 *
 * Tests shadcn/ui AlertDialog (Radix-based):
 * - Renders content when open
 * - Title and description
 * - Action and Cancel buttons
 * - Header and Footer
 * - Trigger element
 *
 * Note: Uses radix-stub mock; all primitives render as divs.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

describe('AlertDialog', () => {
  it('should render content when open', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Potwierdzenie</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    )
    expect(screen.getByText('Potwierdzenie')).toBeInTheDocument()
  })

  it('should render title and description', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunac rezerwacje?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    )
    expect(screen.getByText('Usunac rezerwacje?')).toBeInTheDocument()
    expect(screen.getByText('Ta operacja jest nieodwracalna.')).toBeInTheDocument()
  })

  it('should render action and cancel buttons', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Usun</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction>Usun</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
    expect(screen.getByText('Anuluj')).toBeInTheDocument()
    // "Usun" appears in both title and action
    const usunElements = screen.getAllByText('Usun')
    expect(usunElements.length).toBeGreaterThanOrEqual(2)
  })

  it('should handle click on action button', () => {
    const onAction = vi.fn()
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Potwierdzenie</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onAction}>Potwierdz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
    fireEvent.click(screen.getByText('Potwierdz'))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('should handle click on cancel button', () => {
    const onCancel = vi.fn()
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Usun</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Wstecz</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
    fireEvent.click(screen.getByText('Wstecz'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should render trigger', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Otworz alert</AlertDialogTrigger>
      </AlertDialog>
    )
    expect(screen.getByText('Otworz alert')).toBeInTheDocument()
  })
})
