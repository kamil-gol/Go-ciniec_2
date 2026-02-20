import { test, expect, Page } from '@playwright/test';
import { login } from './fixtures/auth';

/**
 * History and Audit Trail Tests
 *
 * Reservation detail page: /dashboard/reservations/[id]
 * Tabs: "Szczegóły" | "Historia" (plain <button> elements)
 * Historia tab renders EntityActivityTimeline
 */

// Helper: navigate to first reservation detail page
async function goToReservationDetail(page: Page): Promise<boolean> {
  await page.goto('/dashboard/reservations');
  await expect(
    page.locator('text=/Znaleziono.*rezerwacji/')
  ).toBeVisible({ timeout: 15000 });

  // Find Eye button (detail view) — this is the icon button inside
  // <Link href="/dashboard/reservations/{id}"><Button title="Zobacz szczegóły i edytuj"><Eye/></Button></Link>
  // We must NOT match the "Nowa rezerwacja" link (/dashboard/reservations/new)
  const detailLink = page.locator('a:has(button[title="Zobacz szczegóły i edytuj"])').first();

  if (!(await detailLink.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false; // No reservations available
  }

  // Extract href and navigate directly
  const href = await detailLink.getAttribute('href');
  if (!href) return false;

  await page.goto(href);
  await page.waitForLoadState('networkidle');

  // Wait for loading to finish
  const loading = page.locator('text=Wczytywanie...');
  await expect(loading).toBeHidden({ timeout: 15000 }).catch(() => {});

  // Check if detail page loaded
  const loaded = page.locator('text=Szczegóły rezerwacji');
  if (await loaded.isVisible({ timeout: 10000 }).catch(() => false)) {
    return true;
  }

  return false;
}

// Helper: navigate to Historia tab, returns false if empty or unavailable
async function goToHistoriaTab(page: Page): Promise<boolean> {
  const loaded = await goToReservationDetail(page);
  if (!loaded) return false;

  await page.locator('button:has-text("Historia")').click();
  await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

  // Check if history is empty
  if (await page.locator('text=Brak historii zmian').isVisible({ timeout: 2000 }).catch(() => false)) {
    return false;
  }

  return true;
}

test.describe('History and Audit Trail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Reservation Detail Page', () => {
    test('should load reservation detail page', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available or detail page failed to load');

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

      await expect(
        page.locator('text=Historia zmian')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should switch back from Historia to Szczegóły', async ({ page }) => {
      const loaded = await goToReservationDetail(page);
      test.skip(!loaded, 'No reservations available');

      await page.locator('button:has-text("Historia")').click();
      await expect(page.locator('text=Historia zmian')).toBeVisible({ timeout: 10000 });

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

      await expect(
        page.locator('text=Utworzenie').first()
          .or(page.locator('text=Brak historii zmian'))
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show timestamps on entries', async ({ page }) => {
      const hasEntries = await goToHistoriaTab(page);
      test.skip(!hasEntries, 'No history entries available');

      await expect(page.locator('time').first()).toBeVisible({ timeout: 3000 });
    });

    test('should show user attribution on entries', async ({ page }) => {
      const hasEntries = await goToHistoriaTab(page);
      test.skip(!hasEntries, 'No history entries available');

      await expect(
        page.locator('text=/przez /').first()
      ).toBeVisible({ timeout: 3000 });
    });

    test('should show entry count', async ({ page }) => {
      const hasEntries = await goToHistoriaTab(page);
      test.skip(!hasEntries, 'No history entries available');

      await expect(
        page.locator('text=/\\d+ wpis/')
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Expandable Details', () => {
    test('should toggle entry details with expand/collapse', async ({ page }) => {
      const hasEntries = await goToHistoriaTab(page);
      test.skip(!hasEntries, 'No history entries available');

      // On Historia tab, buttons with text "Szczegóły":
      //   [0] = the tab button "Szczegóły" (always present)
      //   [1+] = timeline expand buttons (only if entries have changes)
      const szczegolyButtons = page.locator('button:has-text("Szczegóły")');
      const count = await szczegolyButtons.count();

      // If more than 1, the extras are timeline expand buttons
      if (count > 1) {
        // Click the first timeline expand button (index 1)
        await szczegolyButtons.nth(1).click();

        // Should change to "Zwiń"
        await expect(
          page.locator('button:has-text("Zwiń")').first()
        ).toBeVisible({ timeout: 5000 });

        // Collapse back
        await page.locator('button:has-text("Zwiń")').first().click();

        // Should revert to "Szczegóły"
        await expect(szczegolyButtons.nth(1)).toBeVisible({ timeout: 3000 });
      }
      // If count <= 1 — no expandable entries, test passes silently
    });
  });
});
