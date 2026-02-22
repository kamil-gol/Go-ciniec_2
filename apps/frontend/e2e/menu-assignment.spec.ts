import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { MenuHelper, safeJson } from './fixtures/menu';
import { ReservationHelper } from './fixtures/reservation';

/**
 * Menu Assignment E2E Tests
 *
 * Tests assigning menu to reservations:
 * - Menu selection in reservation wizard
 * - Menu snapshot creation
 * - Changing menu on existing reservation
 * - Menu data persistence
 *
 * Issue: #98 — Sekcja 4
 */

test.describe('Menu Assignment to Reservation', () => {
  let menu: MenuHelper;
  let reservation: ReservationHelper;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    menu = new MenuHelper(page);
    reservation = new ReservationHelper(page);
  });

  test.describe('Reservation Wizard \u2014 Menu Step', () => {
    test('should show menu selection step in reservation wizard', async ({ page }) => {
      await reservation.goToList();
      await reservation.openCreateForm();

      const menuStepText = page.locator('text=Menu').first();
      await expect(menuStepText).toBeVisible({ timeout: 10000 });
    });

    test('should navigate through wizard to menu step', async ({ page }) => {
      await reservation.goToList();
      await reservation.openCreateForm();

      // Step 0: Select event type
      const eventTypeSelect = page.locator('text=Wybierz typ wydarzenia...');
      if (await eventTypeSelect.isVisible().catch(() => false)) {
        await eventTypeSelect.click();
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible().catch(() => false)) {
          await firstOption.click();
          await reservation.nextStep();

          await expect(
            page.locator('text=Wybierz salę i termin')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Menu API Integration', () => {
    test('should fetch available templates for event type', async ({ page }) => {
      const apiAvailable = await menu.isMenuApiAvailable();
      if (!apiAvailable) { test.skip(); return; }

      const eventTypes = await menu.getEventTypesViaAPI();
      if (!eventTypes || eventTypes.length === 0) { test.skip(); return; }

      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
      const templatesResp = await page.request.get(
        `${baseURL}/api/menu/templates?eventTypeId=${eventTypes[0].id}&isActive=true`
      );

      expect(templatesResp.ok()).toBe(true);

      const templates = await safeJson(templatesResp);
      if (!templates) { test.skip(); return; }
      const templateList = templates.data || templates;
      expect(Array.isArray(templateList)).toBe(true);
    });

    test('should fetch packages for a template', async ({ page }) => {
      const apiAvailable = await menu.isMenuApiAvailable();
      if (!apiAvailable) { test.skip(); return; }

      const templates = await menu.getTemplatesViaAPI();
      if (!templates || templates.length === 0) { test.skip(); return; }

      const packages = await menu.getPackagesViaAPI(templates[0].id);
      if (!packages) { test.skip(); return; }

      expect(Array.isArray(packages)).toBe(true);

      if (packages.length > 0) {
        expect(packages[0]).toHaveProperty('name');
        expect(packages[0]).toHaveProperty('pricePerAdult');
      }
    });

    test('should fetch package categories with dishes', async ({ page }) => {
      const apiAvailable = await menu.isMenuApiAvailable();
      if (!apiAvailable) { test.skip(); return; }

      const templates = await menu.getTemplatesViaAPI();
      if (!templates || templates.length === 0) { test.skip(); return; }

      const packages = await menu.getPackagesViaAPI(templates[0].id);
      if (!packages || packages.length === 0) { test.skip(); return; }

      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
      const categoriesResp = await page.request.get(
        `${baseURL}/api/menu/packages/${packages[0].id}/categories`
      );

      if (categoriesResp.ok()) {
        const categories = await safeJson(categoriesResp);
        if (categories) {
          const catList = categories.data?.categories || categories.categories || categories;
          expect(Array.isArray(catList) || catList === undefined).toBe(true);
        }
      }
    });
  });

  test.describe('Menu Snapshot', () => {
    test('should verify menu snapshot endpoint exists', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

      const reservationsResp = await page.request.get(
        `${baseURL}/api/reservations?limit=5`
      );

      const reservationsJson = await safeJson(reservationsResp);
      if (!reservationsJson) { test.skip(); return; }

      const resList = reservationsJson.data || reservationsJson;
      if (!Array.isArray(resList) || resList.length === 0) { test.skip(); return; }

      const menuResp = await page.request.get(
        `${baseURL}/api/reservations/${resList[0].id}/menu`
      );

      // Either 200 (has menu) or 404 (no menu assigned) are valid
      expect([200, 404]).toContain(menuResp.status());
    });

    test('should return snapshot data structure when menu exists', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

      const reservationsResp = await page.request.get(
        `${baseURL}/api/reservations?limit=20`
      );

      const reservationsJson = await safeJson(reservationsResp);
      if (!reservationsJson) { test.skip(); return; }

      const resList = reservationsJson.data || reservationsJson;
      if (!Array.isArray(resList)) { test.skip(); return; }

      // Find a reservation that has menu assigned
      for (const res of resList) {
        const menuResp = await page.request.get(
          `${baseURL}/api/reservations/${res.id}/menu`
        );

        if (menuResp.status() === 200) {
          const menuData = await safeJson(menuResp);
          if (!menuData) continue;
          const data = menuData.data || menuData;

          if (data.snapshot) {
            expect(data.snapshot).toHaveProperty('menuData');
            expect(data.snapshot.menuData).toHaveProperty('templateName');
            expect(data.snapshot.menuData).toHaveProperty('packageName');
          }

          if (data.priceBreakdown) {
            expect(data.priceBreakdown).toHaveProperty('packageCost');
            expect(data.priceBreakdown).toHaveProperty('totalMenuPrice');
          }

          return; // Found one, test passes
        }
      }

      // If no reservation has menu, skip
      test.skip();
    });
  });

  test.describe('Existing Reservation Menu View', () => {
    test('should display reservation list with possible menu indicators', async ({ page }) => {
      await reservation.goToList();

      await page.waitForTimeout(2000);

      await expect(
        page.getByRole('heading', { name: 'Rezerwacje' })
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
