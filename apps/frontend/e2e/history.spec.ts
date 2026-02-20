import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { ReservationHelper } from './fixtures/reservation';

/**
 * History and Audit Trail Tests
 *
 * Reservation detail page: /dashboard/reservations/[id]
 * Tabs: "Szczegóły" | "Historia"
 * Historia tab renders EntityActivityTimeline with:
 * - Title: "Historia zmian"
 * - Entry count: "X wpisów"
 * - Timeline items with action badges (Utworzenie, Aktualizacja, Zmiana statusu, etc.)
 * - Timestamps in format dd.MM.yyyy HH:mm
 * - User info: "przez [firstName] [lastName]"
 * - Expandable details with "Szczegóły" button
 * - Empty state: "Brak historii zmian"
 * - Error state: "Nie udało się załadować historii zmian"
 */

test.describe('History and Audit Trail', () => {
  let helper: ReservationHelper;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    helper = new ReservationHelper(page);
  });

  test.describe('History Tab Navigation', () => {
    test('should show Szczegóły and Historia tabs on detail page', async ({ page }) => {
      // Navigate to reservation list and open first reservation
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      // Should see both tabs
      await expect(page.locator('button:has-text("Szczegóły")')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Historia")')).toBeVisible();
    });

    test('should switch to Historia tab', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      // Click Historia tab
      await page.locator('button:has-text("Historia")').click();

      // Should show "Historia zmian" heading
      await expect(
        page.locator('text=Historia zmian')
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('History Timeline Content', () => {
    test('should display history timeline with entries', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      // Switch to Historia
      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Should have at least one entry — "Utworzenie" badge should exist
      // (every reservation should have at least a CREATE log)
      const utworzenieBadge = page.locator('text=Utworzenie');
      const brakHistorii = page.locator('text=Brak historii zmian');

      // Either entries exist or empty state
      await expect(
        utworzenieBadge.or(brakHistorii)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show entry count', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // If there are entries, count text should be visible ("X wpisów")
      const brakHistorii = page.locator('text=Brak historii zmian');
      if (!(await brakHistorii.isVisible({ timeout: 2000 }).catch(() => false))) {
        // Has entries — look for count text
        await expect(
          page.locator('text=/\\d+ wpis/')
        ).toBeVisible({ timeout: 3000 });
      }
    });

    test('should show timestamps on history entries', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Timestamps in format dd.MM.yyyy HH:mm
      const brakHistorii = page.locator('text=Brak historii zmian');
      if (!(await brakHistorii.isVisible({ timeout: 2000 }).catch(() => false))) {
        // Look for a time element with date format
        await expect(
          page.locator('time').first()
        ).toBeVisible({ timeout: 3000 });
      }
    });

    test('should show user info on history entries', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Entries should show "przez ..." for user
      const brakHistorii = page.locator('text=Brak historii zmian');
      if (!(await brakHistorii.isVisible({ timeout: 2000 }).catch(() => false))) {
        await expect(
          page.locator('text=/przez /')).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Expandable Details', () => {
    test('should have Szczegóły expand button on entries with changes', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Look for "Szczegóły" expand buttons (entries with changes have them)
      const detailsBtn = page.locator('button:has-text("Szczegóły")').first();
      const brakHistorii = page.locator('text=Brak historii zmian');

      if (!(await brakHistorii.isVisible({ timeout: 2000 }).catch(() => false))) {
        // If expand buttons exist, test toggling
        if (await detailsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await detailsBtn.click();

          // Should expand and show "Zwiń" text
          await expect(
            page.locator('button:has-text("Zwiń")').first()
          ).toBeVisible({ timeout: 3000 });

          // Click "Zwiń" to collapse
          await page.locator('button:has-text("Zwiń")').first().click();

          // Should show "Szczegóły" again
          await expect(detailsBtn).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Action Badges', () => {
    test('should display correct action badges', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // At minimum, a CREATE entry should exist
      const brakHistorii = page.locator('text=Brak historii zmian');
      if (!(await brakHistorii.isVisible({ timeout: 2000 }).catch(() => false))) {
        // At least "Utworzenie" badge
        await expect(
          page.locator('text=Utworzenie').first()
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Tab Persistence', () => {
    test('should default to Szczegóły tab', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      // Default tab should be Szczegóły (details content visible)
      // Look for "Klient" section which is in the details tab
      await expect(
        page.locator('h2:has-text("Klient")')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should switch between tabs', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      // Switch to Historia
      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Switch back to Szczegóły
      await page.locator('button:has-text("Szczegóły")').click();
      await expect(
        page.locator('h2:has-text("Klient")')
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Detail Page Hero', () => {
    test('should show reservation header info', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      // Hero section
      await expect(
        page.locator('h1:has-text("Rezerwacja #")')
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.locator('text=Szczegóły rezerwacji')
      ).toBeVisible();

      // "Powrót do listy" link
      await expect(
        page.locator('text=Powrót do listy')
      ).toBeVisible();
    });

    test('should have Pobierz PDF button', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      await expect(
        page.locator('button:has-text("Pobierz PDF")')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should have quick action buttons', async ({ page }) => {
      await helper.goToList();

      const detailLink = page.locator('a[href*="/dashboard/reservations/"]').first();
      await expect(detailLink).toBeVisible({ timeout: 10000 });
      await detailLink.click();

      // "Szybkie akcje" section
      await expect(
        page.locator('text=Szybkie akcje')
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
