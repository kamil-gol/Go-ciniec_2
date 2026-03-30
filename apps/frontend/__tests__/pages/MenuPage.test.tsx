/**
 * Menu Page Tests
 *
 * The /dashboard/menu page redirects to /dashboard/menu/templates.
 */

import { describe, it, expect, vi } from 'vitest'

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

import MenuPage from '@/app/dashboard/menu/page'

describe('MenuPage', () => {
  it('redirects to /dashboard/menu/templates', () => {
    try {
      MenuPage()
    } catch {
      // redirect throws in test env
    }
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard/menu/templates')
  })
})
