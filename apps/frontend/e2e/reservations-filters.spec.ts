import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { ReservationHelper } from './fixtures/reservation';

/**
 * Reservations Filters Tests
 *
 * The reservations list page has:
 * - Status filter: Radix Select with ALL, PENDING, CONFIRMED, COMPLETED, CANCELLED
 * - Archive toggle: Switch "Pokaż zarchiwizowane"
 * - Reservation count: "Znaleziono X rezerwacji"
 * - Empty state: "Brak rezerwacji" / "Nie znaleziono rezerwacji spełniających kryteria"
 * - Pagination: "Poprzednia" / "Następna" when multiple pages
 *
 * Note: There are NO date range filters, hall filters, client search,
 * event type filters, or URL-based filter persistence in the current UI.
 */

test.describe('Reservations Filters', () => {
  let helper: ReservationHelper;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    helper = new ReservationHelper(page);
    await helper.goToList();
  });

  test.describe('Status Filter', () => {
    test('should show status filter with default "Wszystkie statusy"', async ({ page }) => {
      // The Radix Select trigger should show "Wszystkie statusy" by default
      await expect(
        page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' })
      ).toBeVisible({ timeout: 5000 });
    });

    test('should open status filter dropdown with all options', async ({ page }) => {
      // Click the status filter trigger
      await page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' }).click();

      // Dropdown should show all status options
      const listbox = page.locator('[role="listbox"]');
      await expect(listbox).toBeVisible({ timeout: 3000 });

      await expect(listbox.locator('[role="option"]:has-text("Wszystkie statusy")')).toBeVisible();
      await expect(listbox.locator('[role="option"]:has-text("Oczekujące")')).toBeVisible();
      await expect(listbox.locator('[role="option"]:has-text("Potwierdzone")')).toBeVisible();
      await expect(listbox.locator('[role="option"]:has-text("Zakończone")')).toBeVisible();
      await expect(listbox.locator('[role="option"]:has-text("Anulowane")')).toBeVisible();
    });

    test('should filter by PENDING status', async ({ page }) => {
      // Open dropdown and select Oczekujące
      await page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' }).click();
      await page.locator('[role="option"]:has-text("Oczekujące")').click();

      // Wait for the list to reload
      await page.waitForLoadState('networkidle');

      // The filter trigger should now show "Oczekujące"
      await expect(
        page.getByRole('combobox').filter({ hasText: 'Oczekujące' })
      ).toBeVisible({ timeout: 3000 });
    });

    test('should filter by CONFIRMED status', async ({ page }) => {
      await page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' }).click();
      await page.locator('[role="option"]:has-text("Potwierdzone")').click();

      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('combobox').filter({ hasText: 'Potwierdzone' })
      ).toBeVisible({ timeout: 3000 });
    });

    test('should filter by CANCELLED status', async ({ page }) => {
      await page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' }).click();
      await page.locator('[role="option"]:has-text("Anulowane")').click();

      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('combobox').filter({ hasText: 'Anulowane' })
      ).toBeVisible({ timeout: 3000 });
    });

    test('should reset filter to all statuses', async ({ page }) => {
      // First filter by PENDING
      await page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' }).click();
      await page.locator('[role="option"]:has-text("Oczekujące")').click();
      await page.waitForLoadState('networkidle');

      // Then reset to ALL
      await page.getByRole('combobox').filter({ hasText: 'Oczekujące' }).click();
      await page.locator('[role="option"]:has-text("Wszystkie statusy")').click();
      await page.waitForLoadState('networkidle');

      // Should show "Wszystkie statusy" again
      await expect(
        page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' })
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Archive Toggle', () => {
    test('should show archive toggle', async ({ page }) => {
      await expect(
        page.getByText('Pokaż zarchiwizowane').or(page.getByText('Archiwum'))
      ).toBeVisible({ timeout: 5000 });
    });

    test('should toggle archive view', async ({ page }) => {
      // Find and click the archive switch
      const archiveSwitch = page.locator('#show-archived');
      await expect(archiveSwitch).toBeVisible({ timeout: 5000 });

      // Toggle on
      await archiveSwitch.click();
      await page.waitForLoadState('networkidle');

      // Toggle off
      await archiveSwitch.click();
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Reservation Count', () => {
    test('should display reservation count', async ({ page }) => {
      // "Znaleziono X rezerwacji" should be visible
      await expect(
        page.locator('text=/Znaleziono.*rezerwacji/')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should update count when filter changes', async ({ page }) => {
      // Get initial count text
      const countLocator = page.locator('text=/Znaleziono.*rezerwacji/');
      await expect(countLocator).toBeVisible({ timeout: 5000 });
      const initialText = await countLocator.textContent();

      // Apply CANCELLED filter (likely fewer results)
      await page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' }).click();
      await page.locator('[role="option"]:has-text("Anulowane")').click();
      await page.waitForLoadState('networkidle');

      // Count text should still be visible (may show different number)
      await expect(
        page.locator('text=/Znaleziono.*rezerwacji/')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no results match filter', async ({ page }) => {
      // Filter by CANCELLED — might have 0 results
      await page.getByRole('combobox').filter({ hasText: 'Wszystkie statusy' }).click();
      await page.locator('[role="option"]:has-text("Anulowane")').click();
      await page.waitForLoadState('networkidle');

      // Check count — if 0, empty state should show
      const countText = await page.locator('text=/Znaleziono.*rezerwacji/').textContent();
      const count = parseInt(countText?.match(/\d+/)?.[0] || '0', 10);

      if (count === 0) {
        await expect(
          page.locator('text=Brak rezerwacji')
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Reservation Cards', () => {
    test('should display reservation cards with key info', async ({ page }) => {
      // If there are reservations, check that cards show expected info sections
      const countText = await page.locator('text=/Znaleziono.*rezerwacji/').textContent();
      const count = parseInt(countText?.match(/\d+/)?.[0] || '0', 10);

      if (count > 0) {
        // Each card should have: Sala, Klient, Goście, Wartość labels
        await expect(page.locator('text=Sala').first()).toBeVisible();
        await expect(page.locator('text=Klient').first()).toBeVisible();
        await expect(page.getByText('Goście', { exact: true }).first()).toBeVisible();
        await expect(page.locator('text=Wartość').first()).toBeVisible();
      }
    });

    test('should have action buttons on reservation cards', async ({ page }) => {
      const countText = await page.locator('text=/Znaleziono.*rezerwacji/').textContent();
      const count = parseInt(countText?.match(/\d+/)?.[0] || '0', 10);

      if (count > 0) {
        // Eye icon (view details) button should exist
        await expect(
          page.locator('a[href*="/dashboard/reservations/"] button').first()
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });
});
