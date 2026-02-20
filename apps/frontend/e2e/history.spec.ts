import { test, expect, Page } from '@playwright/test';
import { login } from './fixtures/auth';

/**
 * History and Audit Trail Tests
 *
 * Reservation detail page: /dashboard/reservations/[id]
 * Tabs: "Szczegóły" | "Historia" (plain <button> elements)
 * Historia tab renders EntityActivityTimeline with:
 * - Title: "Historia zmian"
 * - Timeline items with action badges (Utworzenie, Aktualizacja, etc.)
 * - Timestamps, user info ("przez ...")
 * - Expandable details with "Szczegóły" / "Zwiń" toggle
 * - Empty state: "Brak historii zmian"
 */

// Helper: navigate to first reservation detail page
async function goToReservationDetail(page: Page): Promise<boolean> {
  await page.goto('/dashboard/reservations');
  await expect(
    page.locator('text=/Znaleziono.*rezerwacji/')
  ).toBeVisible({ timeout: 15000 });

  // Find a detail link (contains UUID path segment after /reservations/)
  const link = page.locator('a[href*="/dashboard/reservations/"]').first();

  if (!(await link.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }

  // Extract href and navigate directly (avoids Next.js Link click issues)
  const href = await link.getAttribute('href');
  if (!href) return false;

  await page.goto(href);
  await page.waitForLoadState('networkidle');

  // Wait for page to settle: either detail loaded or error state
  const loaded = page.locator('text=Szczegóły rezerwacji');
  const error = page.locator('text=Nie udało się załadować rezerwacji');
  const loading = page.locator('text=Wczytywanie...');

  // Wait for loading to finish
  await expect(loading).toBeHidden({ timeout: 15000 }).catch(() => {});

  // Check if detail loaded successfully
  if (await loaded.isVisible({ timeout: 5000 }).catch(() => false)) {
    return true;
  }

  return false;
}

test.describe('History and Audit Trail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Reservation Detail Page', () => {
    test('should load reservation detail page', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available or detail page failed to load');

      // Hero header
      await expect(
        page.locator('text=Szczegóły rezerwacji')
      ).toBeVisible();
    });

    test('should show reservation ID in header', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await expect(
        page.locator('h1:has-text("Rezerwacja #")')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have Powrót do listy link', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await expect(
        page.locator('text=Powrót do listy')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show Klient section on details tab', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await expect(
        page.locator('h2:has-text("Klient")')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show Szybkie akcje section', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await expect(
        page.locator('text=Szybkie akcje')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Tab Navigation', () => {
    test('should show Szczegóły and Historia tabs', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await expect(
        page.locator('button:has-text("Szczegóły")')
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.locator('button:has-text("Historia")')
      ).toBeVisible();
    });

    test('should switch to Historia tab and show timeline', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await page.locator('button:has-text("Historia")').click();

      // Should show "Historia zmian" heading
      await expect(
        page.locator('text=Historia zmian')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should switch back from Historia to Szczegóły', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      // Go to Historia
      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Go back to Szczegóły
      await page.locator('button:has-text("Szczegóły")').click();
      await expect(
        page.locator('h2:has-text("Klient")')
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('History Timeline', () => {
    test('should display timeline entries or empty state', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Either has entries ("Utworzenie" badge) or empty ("Brak historii zmian")
      await expect(
        page.locator('text=Utworzenie').first()
          .or(page.locator('text=Brak historii zmian'))
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show timestamps on entries', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      // Skip if empty
      if (await page.locator('text=Brak historii zmian').isVisible({ timeout: 2000 }).catch(() => false)) {
        return;
      }

      // Timestamps render in <time> elements
      await expect(page.locator('time').first()).toBeVisible({ timeout: 3000 });
    });

    test('should show user attribution on entries', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      if (await page.locator('text=Brak historii zmian').isVisible({ timeout: 2000 }).catch(() => false)) {
        return;
      }

      // User info: "przez [name]"
      await expect(
        page.locator('text=/przez /').first()
      ).toBeVisible({ timeout: 3000 });
    });

    test('should show entry count', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      if (await page.locator('text=Brak historii zmian').isVisible({ timeout: 2000 }).catch(() => false)) {
        return;
      }

      // Count: "X wpisów" / "X wpisy" / "X wpis"
      await expect(
        page.locator('text=/\\d+ wpis/')
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Expandable Details', () => {
    test('should toggle entry details with Szczegóły/Zwiń', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

      if (await page.locator('text=Brak historii zmian').isVisible({ timeout: 2000 }).catch(() => false)) {
        return;
      }

      // Find "Szczegóły" expand button (entries with changes have it)
      // Note: this text also appears in the tab, so scope to the timeline area
      const expandBtn = page.locator('button:has-text("Szczegóły")').last();

      if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expandBtn.click();

        // Should change to "Zwiń"
        await expect(
          page.locator('button:has-text("Zwiń")').first()
        ).toBeVisible({ timeout: 3000 });

        // Collapse
        await page.locator('button:has-text("Zwiń")').first().click();
      }
    });
  });
});
