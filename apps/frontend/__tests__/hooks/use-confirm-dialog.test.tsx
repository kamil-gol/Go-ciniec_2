/**
 * useConfirmDialog Hook Tests
 * Issue: #246 — Frontend unit testy
 *
 * Tests:
 * - confirm() returns Promise<boolean>
 * - Confirm resolves to true
 * - Cancel resolves to false
 * - Dialog renders with correct title/description
 * - Different variants render correct styles
 * - Custom labels
 * - Default labels (Potwierdź / Anuluj)
 */
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import React, { useEffect } from 'react'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

// ── Import ───────────────────────────────────────────────────────────────────

import { useConfirmDialog } from '@/hooks/use-confirm-dialog'

// ── Test Harness ─────────────────────────────────────────────────────────────

function TestHarness({
  onResult,
  confirmOptions,
  autoOpen = true,
}: {
  onResult?: (v: boolean) => void
  confirmOptions?: Parameters<ReturnType<typeof useConfirmDialog>['confirm']>[0]
  autoOpen?: boolean
}) {
  const { confirm, ConfirmDialog } = useConfirmDialog()

  useEffect(() => {
    if (autoOpen) {
      confirm(
        confirmOptions || {
          title: 'Usunąć klienta?',
          description: 'Ta operacja jest nieodwracalna.',
        }
      ).then((result) => {
        onResult?.(result)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {!autoOpen && (
        <button
          onClick={() =>
            confirm(
              confirmOptions || {
                title: 'Ręczne otwarcie',
                description: 'Test',
              }
            ).then((r) => onResult?.(r))
          }
        >
          Open Dialog
        </button>
      )}
      {ConfirmDialog}
    </div>
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useConfirmDialog', () => {
  // ── Rendering ─────────────────────────────────────────────────────────

  describe('Dialog Rendering', () => {
    it('should render title and description', async () => {
      render(<TestHarness />)

      expect(await screen.findByText('Usunąć klienta?')).toBeInTheDocument()
      expect(screen.getByText('Ta operacja jest nieodwracalna.')).toBeInTheDocument()
    })

    it('should render default labels', async () => {
      render(<TestHarness />)

      expect(await screen.findByText('Potwierdź')).toBeInTheDocument()
      expect(screen.getByText('Anuluj')).toBeInTheDocument()
    })

    it('should render custom labels', async () => {
      render(
        <TestHarness
          confirmOptions={{
            title: 'Test',
            description: 'Test',
            confirmLabel: 'Tak, usuń',
            cancelLabel: 'Nie, wróć',
          }}
        />
      )

      expect(await screen.findByText('Tak, usuń')).toBeInTheDocument()
      expect(screen.getByText('Nie, wróć')).toBeInTheDocument()
    })
  })

  // ── Confirm / Cancel Actions ──────────────────────────────────────────

  describe('Actions', () => {
    it('should resolve true on confirm click', async () => {
      const user = userEvent.setup()
      const onResult = vi.fn()

      render(<TestHarness onResult={onResult} />)

      const confirmBtn = await screen.findByText('Potwierdź')
      await user.click(confirmBtn)

      expect(onResult).toHaveBeenCalledWith(true)
    })

    it('should resolve false on cancel click', async () => {
      const user = userEvent.setup()
      const onResult = vi.fn()

      render(<TestHarness onResult={onResult} />)

      const cancelBtn = await screen.findByText('Anuluj')
      await user.click(cancelBtn)

      expect(onResult).toHaveBeenCalledWith(false)
    })
  })

  // ── Variants ──────────────────────────────────────────────────────────

  describe('Variants', () => {
    it('should render destructive variant with red styling', async () => {
      render(
        <TestHarness
          confirmOptions={{
            title: 'Usuń',
            description: 'test',
            variant: 'destructive',
          }}
        />
      )

      const confirmBtn = await screen.findByText('Potwierdź')
      expect(confirmBtn.className).toContain('red')
    })

    it('should render warning variant with amber styling', async () => {
      render(
        <TestHarness
          confirmOptions={{
            title: 'Uwaga',
            description: 'test',
            variant: 'warning',
          }}
        />
      )

      const confirmBtn = await screen.findByText('Potwierdź')
      expect(confirmBtn.className).toContain('amber')
    })

    it('should render info variant with blue styling', async () => {
      render(
        <TestHarness
          confirmOptions={{
            title: 'Info',
            description: 'test',
            variant: 'info',
          }}
        />
      )

      const confirmBtn = await screen.findByText('Potwierdź')
      expect(confirmBtn.className).toContain('blue')
    })

    it('should render archive variant with orange styling', async () => {
      render(
        <TestHarness
          confirmOptions={{
            title: 'Archiwizuj',
            description: 'test',
            variant: 'archive',
          }}
        />
      )

      const confirmBtn = await screen.findByText('Potwierdź')
      expect(confirmBtn.className).toContain('orange')
    })
  })

  // ── Multiple Uses ─────────────────────────────────────────────────────

  describe('Multiple Uses', () => {
    it('should support sequential confirm calls', async () => {
      const user = userEvent.setup()
      const onResult = vi.fn()

      render(<TestHarness onResult={onResult} autoOpen={false} />)

      // First open
      await user.click(screen.getByText('Open Dialog'))
      const confirmBtn = await screen.findByText('Potwierdź')
      await user.click(confirmBtn)
      expect(onResult).toHaveBeenCalledWith(true)

      // Second open
      onResult.mockClear()
      await user.click(screen.getByText('Open Dialog'))
      const cancelBtn = await screen.findByText('Anuluj')
      await user.click(cancelBtn)
      expect(onResult).toHaveBeenCalledWith(false)
    })
  })
})
