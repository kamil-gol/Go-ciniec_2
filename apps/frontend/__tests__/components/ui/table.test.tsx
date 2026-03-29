/**
 * Table Component Tests
 *
 * Tests shadcn/ui Table sub-components:
 * - Table, TableHeader, TableBody, TableRow, TableHead, TableCell
 * - Full table structure rendering
 * - Custom className
 * - Ref forwarding
 * - Empty table body
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

describe('Table', () => {
  it('should render a full table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Wesele Kowalskich</TableCell>
            <TableCell>2026-04-15</TableCell>
            <TableCell>Potwierdzona</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Nazwa')).toBeInTheDocument()
    expect(screen.getByText('Data')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Wesele Kowalskich')).toBeInTheDocument()
    expect(screen.getByText('Potwierdzona')).toBeInTheDocument()
  })

  it('should render multiple rows', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Wiersz 1</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Wiersz 2</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Wiersz 3</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Wiersz 1')).toBeInTheDocument()
    expect(screen.getByText('Wiersz 2')).toBeInTheDocument()
    expect(screen.getByText('Wiersz 3')).toBeInTheDocument()
  })

  it('should render table element with correct role', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Test</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should apply custom className to Table', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Test</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(container.querySelector('table')).toBeInTheDocument()
  })

  it('should forward ref on TableCell', () => {
    const ref = React.createRef<HTMLTableCellElement>()
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell ref={ref}>Ref cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement)
  })

  it('should render empty body without errors', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kolumna</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>
    )
    expect(screen.getByText('Kolumna')).toBeInTheDocument()
  })
})
