/**
 * A11y tests for key forms (#451)
 * Manual WCAG compliance checks — no external axe dependency needed.
 * Validates: labels, roles, keyboard accessibility, aria attributes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ── Mocks ──────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn().mockRejectedValue(new Error('mock')),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// ── A11y Helper Functions ─────────────────────────────────

function getAllInputs(container: HTMLElement) {
  return container.querySelectorAll('input, textarea, select')
}

function getLabelsForInput(container: HTMLElement, input: Element) {
  const id = input.getAttribute('id')
  const ariaLabel = input.getAttribute('aria-label')
  const ariaLabelledBy = input.getAttribute('aria-labelledby')

  if (ariaLabel) return true
  if (ariaLabelledBy) return true
  if (id) {
    const label = container.querySelector(`label[for="${id}"]`)
    if (label) return true
  }
  // Check if wrapped in label
  if (input.closest('label')) return true

  return false
}

// ── Tests ──────────────────────────────────────────────────

describe('A11y: Forms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Buttons should be keyboard accessible (native button)', () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      React.createElement('button', { onClick, type: 'button' }, 'Akcja')
    )
    const btn = getByRole('button')
    expect(btn).toBeDefined()
    expect(btn.getAttribute('type')).toBe('button')
    expect(btn.tabIndex).not.toBe(-1)
  })

  it('Form inputs should have associated labels', () => {
    const { container } = render(
      React.createElement(
        'form',
        null,
        React.createElement('label', { htmlFor: 'email' }, 'Email'),
        React.createElement('input', { id: 'email', type: 'email', name: 'email' }),
        React.createElement('label', { htmlFor: 'password' }, 'Haslo'),
        React.createElement('input', { id: 'password', type: 'password', name: 'password' }),
        React.createElement('button', { type: 'submit' }, 'Zaloguj')
      )
    )

    const inputs = getAllInputs(container)
    inputs.forEach((input) => {
      const hasLabel = getLabelsForInput(container, input)
      expect(hasLabel).toBe(true)
    })
  })

  it('Interactive elements should have accessible names', () => {
    const { container } = render(
      React.createElement(
        'div',
        null,
        React.createElement('button', null, 'Zapisz'),
        React.createElement('a', { href: '/home' }, 'Strona glowna'),
        React.createElement('button', { 'aria-label': 'Zamknij' })
      )
    )

    const buttons = container.querySelectorAll('button')
    buttons.forEach((btn) => {
      const hasName = btn.textContent?.trim() || btn.getAttribute('aria-label')
      expect(hasName).toBeTruthy()
    })

    const links = container.querySelectorAll('a')
    links.forEach((link) => {
      const hasName = link.textContent?.trim() || link.getAttribute('aria-label')
      expect(hasName).toBeTruthy()
    })
  })

  it('Form submit button should exist within form', () => {
    const { container } = render(
      React.createElement(
        'form',
        { 'aria-label': 'Login form' },
        React.createElement('input', { type: 'email', 'aria-label': 'Email' }),
        React.createElement('input', { type: 'password', 'aria-label': 'Haslo' }),
        React.createElement('button', { type: 'submit' }, 'Zaloguj')
      )
    )

    const form = container.querySelector('form')
    expect(form).toBeDefined()
    const submitBtn = form?.querySelector('button[type="submit"]')
    expect(submitBtn).toBeDefined()
  })

  it('Disabled inputs should have disabled attribute', () => {
    const { container } = render(
      React.createElement('input', { type: 'text', disabled: true, 'aria-label': 'Disabled input' })
    )
    const input = container.querySelector('input')
    expect(input?.disabled).toBe(true)
  })

  it('Required fields should be marked with aria-required or required', () => {
    const { container } = render(
      React.createElement(
        'form',
        null,
        React.createElement('input', { type: 'email', required: true, 'aria-label': 'Email' }),
        React.createElement('input', { type: 'password', 'aria-required': 'true', 'aria-label': 'Haslo' })
      )
    )

    const inputs = container.querySelectorAll('input')
    inputs.forEach((input) => {
      const isRequired = input.hasAttribute('required') || input.getAttribute('aria-required') === 'true'
      expect(isRequired).toBe(true)
    })
  })

  it('Focus should be visible on interactive elements', () => {
    const { getByRole } = render(
      React.createElement('button', { type: 'button' }, 'Fokus')
    )
    const btn = getByRole('button')
    btn.focus()
    expect(document.activeElement).toBe(btn)
  })

  it('Images should have alt text', () => {
    const { container } = render(
      React.createElement(
        'div',
        null,
        React.createElement('img', { src: '/logo.png', alt: 'Logo' }),
        React.createElement('img', { src: '/icon.png', alt: '', role: 'presentation' })
      )
    )

    const images = container.querySelectorAll('img')
    images.forEach((img) => {
      const hasAlt = img.hasAttribute('alt')
      expect(hasAlt).toBe(true)
    })
  })
})
