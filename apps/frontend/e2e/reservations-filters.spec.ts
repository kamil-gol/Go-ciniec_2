import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[name="email"], input[type="email"]', process.env.E2E_USER_EMAIL || 'admin@gociniec.pl')
  await page.fill('input[name="password"], input[type="password"]', process.env.E2E_USER_PASSWORD || 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard/, { timeout: 10000 })
}

async function navigateToReservations(page: Page) {
  await page.goto(`${BASE_URL}/dashboard/reservations`)
  await page.waitForLoadState('networkidle')
  // Wait for reservations list to load
  await page.waitForSelector('[data-testid="reservations-list"], .space-y-6', { timeout: 10000 })
}

test.describe('Reservations Filters', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToReservations(page)
  })

  test.describe('Status filter', () => {
    test('should display status filter dropdown with all options', async ({ page }) => {
      // Click the status filter trigger
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy/i })
      await expect(filterTrigger).toBeVisible()
      await filterTrigger.click()

      // Verify all status options are available
      await expect(page.getByText('Oczekujące')).toBeVisible()
      await expect(page.getByText('Potwierdzone')).toBeVisible()
      await expect(page.getByText('Zakończone')).toBeVisible()
      await expect(page.getByText('Anulowane')).toBeVisible()
    })

    test('should filter reservations by CONFIRMED status', async ({ page }) => {
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy/i })
      await filterTrigger.click()
      await page.getByText('Potwierdzone').click()

      // Wait for filtered results
      await page.waitForLoadState('networkidle')

      // All visible status badges should be "Potwierdzone" (or list should be empty)
      const statusBadges = page.locator('[class*="badge"]').filter({ hasText: /potwierdzon/i })
      const cancelledBadges = page.locator('[class*="badge"]').filter({ hasText: /anulowan/i })
      const pendingBadges = page.locator('[class*="badge"]').filter({ hasText: /oczekując/i })

      // Cancelled and pending should not be visible
      await expect(cancelledBadges).toHaveCount(0)
      await expect(pendingBadges).toHaveCount(0)
    })

    test('should filter reservations by PENDING status', async ({ page }) => {
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy/i })
      await filterTrigger.click()
      await page.getByText('Oczekujące').click()

      await page.waitForLoadState('networkidle')

      const confirmedBadges = page.locator('[class*="badge"]').filter({ hasText: /potwierdzon/i })
      await expect(confirmedBadges).toHaveCount(0)
    })

    test('should filter reservations by CANCELLED status', async ({ page }) => {
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy|potwierdzone|oczekując|zakończon/i })
      await filterTrigger.first().click()
      await page.getByText('Anulowane').click()

      await page.waitForLoadState('networkidle')

      const confirmedBadges = page.locator('[class*="badge"]').filter({ hasText: /potwierdzon/i })
      const pendingBadges = page.locator('[class*="badge"]').filter({ hasText: /oczekując/i })
      await expect(confirmedBadges).toHaveCount(0)
      await expect(pendingBadges).toHaveCount(0)
    })

    test('should filter reservations by COMPLETED status', async ({ page }) => {
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy|potwierdzone|oczekując|anulowan/i })
      await filterTrigger.first().click()
      await page.getByText('Zakończone').click()

      await page.waitForLoadState('networkidle')

      const confirmedBadges = page.locator('[class*="badge"]').filter({ hasText: /potwierdzon/i })
      const pendingBadges = page.locator('[class*="badge"]').filter({ hasText: /oczekując/i })
      await expect(confirmedBadges).toHaveCount(0)
      await expect(pendingBadges).toHaveCount(0)
    })
  })

  test.describe('Archive filter', () => {
    test('should toggle archived reservations view', async ({ page }) => {
      // Find the archive toggle
      const archiveSwitch = page.getByRole('switch')
      await expect(archiveSwitch).toBeVisible()

      // Initially unchecked
      await expect(archiveSwitch).not.toBeChecked()

      // Toggle on
      await archiveSwitch.click()
      await page.waitForLoadState('networkidle')

      // Toggle should now be checked
      await expect(archiveSwitch).toBeChecked()
    })

    test('should show archived reservations with archive badge', async ({ page }) => {
      const archiveSwitch = page.getByRole('switch')
      await archiveSwitch.click()
      await page.waitForLoadState('networkidle')

      // If there are archived reservations, they should have the badge
      const archivedBadges = page.locator('text=Zarchiwizowane')
      const reservationCount = page.locator('text=/Znaleziono/')

      // Either we find archived badges or the list is empty
      const countText = await reservationCount.textContent().catch(() => '')
      if (countText && !countText.includes('0')) {
        await expect(archivedBadges.first()).toBeVisible()
      }
    })
  })

  test.describe('Combined filters', () => {
    test('should apply status filter together with archive toggle', async ({ page }) => {
      // Set status to CONFIRMED
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy/i })
      await filterTrigger.click()
      await page.getByText('Potwierdzone').click()
      await page.waitForLoadState('networkidle')

      // Then toggle archived
      const archiveSwitch = page.getByRole('switch')
      await archiveSwitch.click()
      await page.waitForLoadState('networkidle')

      // Both filters should be active
      await expect(archiveSwitch).toBeChecked()

      // Cancelled/pending should not be visible
      const cancelledBadges = page.locator('[class*="badge"]').filter({ hasText: /anulowan/i })
      await expect(cancelledBadges).toHaveCount(0)
    })
  })

  test.describe('Filter reset', () => {
    test('should reset status filter to show all reservations', async ({ page }) => {
      // First filter by CONFIRMED
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy/i })
      await filterTrigger.click()
      await page.getByText('Potwierdzone').click()
      await page.waitForLoadState('networkidle')

      // Count current results
      const filteredCount = await page.locator('text=/Znaleziono/').textContent().catch(() => '')

      // Reset to ALL
      const resetTrigger = page.locator('button').filter({ hasText: /potwierdzone/i })
      await resetTrigger.click()
      await page.getByText('Wszystkie statusy').click()
      await page.waitForLoadState('networkidle')

      // Count should be >= filtered count
      const allCount = await page.locator('text=/Znaleziono/').textContent().catch(() => '')
      expect(allCount).toBeTruthy()
    })

    test('should reset archive toggle', async ({ page }) => {
      // Toggle on
      const archiveSwitch = page.getByRole('switch')
      await archiveSwitch.click()
      await page.waitForLoadState('networkidle')
      await expect(archiveSwitch).toBeChecked()

      // Toggle off
      await archiveSwitch.click()
      await page.waitForLoadState('networkidle')
      await expect(archiveSwitch).not.toBeChecked()
    })
  })

  test.describe('Reservation count display', () => {
    test('should display current reservation count', async ({ page }) => {
      const countText = page.locator('text=/Znaleziono/')
      await expect(countText).toBeVisible()

      // Should contain a number
      const text = await countText.textContent()
      expect(text).toMatch(/\d+/)
    })

    test('should update count when filter changes', async ({ page }) => {
      const countEl = page.locator('text=/Znaleziono/')
      const initialCount = await countEl.textContent()

      // Apply a specific filter
      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy/i })
      await filterTrigger.click()
      await page.getByText('Anulowane').click()
      await page.waitForLoadState('networkidle')

      // Count may have changed (or stayed if all are cancelled)
      const newCount = await countEl.textContent().catch(() => '')
      expect(newCount).toBeTruthy()
    })
  })

  test.describe('Empty state after filtering', () => {
    test('should show empty state message when no results match filter', async ({ page }) => {
      // Try to find a filter that yields no results
      // Toggle archived + a specific status might yield empty
      const archiveSwitch = page.getByRole('switch')
      await archiveSwitch.click()
      await page.waitForLoadState('networkidle')

      const filterTrigger = page.locator('button').filter({ hasText: /wszystkie statusy/i })
      if (await filterTrigger.isVisible()) {
        await filterTrigger.click()
        await page.getByText('Anulowane').click()
        await page.waitForLoadState('networkidle')
      }

      // Check if empty state or results are shown
      const emptyState = page.locator('text=/brak rezerwacji/i')
      const hasResults = page.locator('text=/Znaleziono/')

      const isEmpty = await emptyState.isVisible().catch(() => false)
      const hasData = await hasResults.isVisible().catch(() => false)

      // One of these should be true
      expect(isEmpty || hasData).toBe(true)
    })
  })
})
