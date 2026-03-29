/**
 * Dialog Component Tests
 *
 * Tests shadcn/ui Dialog (Radix-based):
 * - Renders dialog content when open
 * - DialogTitle and DialogDescription
 * - DialogHeader / DialogFooter
 * - Close button with sr-only text "Zamknij"
 *
 * Note: Uses radix-stub mock which renders all primitives as divs.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'

describe('Dialog', () => {
  it('should render dialog content when open', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Tytul dialogu</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Tytul dialogu')).toBeInTheDocument()
  })

  it('should render title and description', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowa rezerwacja</DialogTitle>
            <DialogDescription>Wypelnij formularz ponizej</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Nowa rezerwacja')).toBeInTheDocument()
    expect(screen.getByText('Wypelnij formularz ponizej')).toBeInTheDocument()
  })

  it('should render close button with sr-only text', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Zamknij')).toBeInTheDocument()
  })

  it('should render footer content', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Potwierdzenie</DialogTitle>
          <DialogFooter>
            <button>Anuluj</button>
            <button>Zapisz</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Anuluj')).toBeInTheDocument()
    expect(screen.getByText('Zapisz')).toBeInTheDocument()
  })

  it('should render trigger element', () => {
    render(
      <Dialog>
        <DialogTrigger>Otworz dialog</DialogTrigger>
      </Dialog>
    )
    expect(screen.getByText('Otworz dialog')).toBeInTheDocument()
  })

  it('should render DialogClose element', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
          <DialogClose>Zamknij okno</DialogClose>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Zamknij okno')).toBeInTheDocument()
  })
})
