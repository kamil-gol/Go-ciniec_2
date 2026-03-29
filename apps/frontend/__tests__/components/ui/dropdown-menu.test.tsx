/**
 * DropdownMenu Component Tests
 *
 * Tests shadcn/ui DropdownMenu (Radix-based):
 * - Renders trigger
 * - Renders menu items
 * - DropdownMenuLabel and DropdownMenuSeparator
 * - DropdownMenuShortcut
 * - Custom className
 *
 * Note: Uses radix-stub mock; all primitives render as divs.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'

describe('DropdownMenu', () => {
  it('should render trigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Akcje</DropdownMenuTrigger>
      </DropdownMenu>
    )
    expect(screen.getByText('Akcje')).toBeInTheDocument()
  })

  it('should render menu items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edytuj</DropdownMenuItem>
          <DropdownMenuItem>Usun</DropdownMenuItem>
          <DropdownMenuItem>Kopiuj</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Edytuj')).toBeInTheDocument()
    expect(screen.getByText('Usun')).toBeInTheDocument()
    expect(screen.getByText('Kopiuj')).toBeInTheDocument()
  })

  it('should render label and separator', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuLabel>Operacje</DropdownMenuLabel>
          <DropdownMenuSeparator data-testid="sep" />
          <DropdownMenuItem>Opcja 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Operacje')).toBeInTheDocument()
    expect(screen.getByTestId('sep')).toBeInTheDocument()
  })

  it('should render shortcut text', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Zapisz <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument()
  })

  it('should handle click on menu item', () => {
    const onClick = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick}>Kliknij mnie</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    fireEvent.click(screen.getByText('Kliknij mnie'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className to DropdownMenuItem', () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuItem className="text-red-500" data-testid="item">
            Usun
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByTestId('item')).toHaveClass('text-red-500')
  })
})
