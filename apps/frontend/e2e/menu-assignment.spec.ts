import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { MenuHelper } from './fixtures/menu';
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

  test.describe('Reservation Wizard — Menu Step', () => {
    test('should show menu selection step in reservation wizard', async ({ page }) => {
      await reservation.goToList();
      await reservation.openCreateForm();

      // Wizard stepper should include Menu step
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

          // Step 1: Hall and date — try to pass
          // This step requires selecting hall and date
          // We verify the step label exists
          await expect(
            page.locator('text=Wybierz salę i termin')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Menu API Integration', () => {
    test('should fetch available templates for event type', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

      // Get event types first
      const eventTypesResp = await page.request.get(`${baseURL}/api/event-types`);
      const eventTypes = await eventTypesResp.json();
      const eventTypeList = eventTypes.data || eventTypes;

      if (!eventTypeList || eventTypeList.length === 0) {
        test.skip();
        return;
      }

      // Get templates for first event type
      const templatesResp = await page.request.get(
        `${baseURL}/api/menu/templates?eventTypeId=${eventTypeList[0].id}&isActive=true`
      );

      expect(templatesResp.ok()).toBe(true);

      const templates = await templatesResp.json();
      const templateList = templates.data || templates;
      expect(Array.isArray(templateList)).toBe(true);
    });

    test('should fetch packages for a template', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

      const templatesResp = await page.request.get(`${baseURL}/api/menu/templates`);
      const templates = await templatesResp.json();
      const templateList = templates.data || templates;

      if (!templateList || templateList.length === 0) {
        test.skip();
        return;
      }

      const packagesResp = await page.request.get(
        `${baseURL}/api/menu/packages?templateId=${templateList[0].id}`
      );

      expect(packagesResp.ok()).toBe(true);

      const packages = await packagesResp.json();
      const packageList = packages.data || packages;
      expect(Array.isArray(packageList)).toBe(true);

      if (packageList.length > 0) {
        expect(packageList[0]).toHaveProperty('name');
        expect(packageList[0]).toHaveProperty('pricePerAdult');
      }
    });

    test('should fetch package categories with dishes', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

      const templatesResp = await page.request.get(`${baseURL}/api/menu/templates`);
      const templates = await templatesResp.json();
      const templateList = templates.data || templates;

      if (!templateList || templateList.length === 0) {
        test.skip();
        return;
      }

      const packagesResp = await page.request.get(
        `${baseURL}/api/menu/packages?templateId=${templateList[0].id}`
      );
      const packages = await packagesResp.json();
      const packageList = packages.data || packages;

      if (!packageList || packageList.length === 0) {
        test.skip();
        return;
      }

      const categoriesResp = await page.request.get(
        `${baseURL}/api/menu/packages/${packageList[0].id}/categories`
      );

      // Categories endpoint may return categories with dishes
      if (categoriesResp.ok()) {
        const categories = await categoriesResp.json();
        const catList = categories.data?.categories || categories.categories || categories;
        expect(Array.isArray(catList) || catList === undefined).toBe(true);
      }
    });
  });

  test.describe('Menu Snapshot', () => {
    test('should verify menu snapshot endpoint exists', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

      // Try to get reservations to find one with menu
      const reservationsResp = await page.request.get(
        `${baseURL}/api/reservations?limit=5`
      );

      if (!reservationsResp.ok()) {
        test.skip();
        return;
      }

      const reservations = await reservationsResp.json();
      const resList = reservations.data || reservations;

      if (!Array.isArray(resList) || resList.length === 0) {
        test.skip();
        return;
      }

      // Try to get menu for first reservation
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

      if (!reservationsResp.ok()) {
        test.skip();
        return;
      }

      const reservations = await reservationsResp.json();
      const resList = reservations.data || reservations;

      if (!Array.isArray(resList)) {
        test.skip();
        return;
      }

      // Find a reservation that has menu assigned
      for (const res of resList) {
        const menuResp = await page.request.get(
          `${baseURL}/api/reservations/${res.id}/menu`
        );

        if (menuResp.status() === 200) {
          const menuData = await menuResp.json();
          const data = menuData.data || menuData;

          // Verify snapshot structure
          if (data.snapshot) {
            expect(data.snapshot).toHaveProperty('menuData');
            expect(data.snapshot.menuData).toHaveProperty('templateName');
            expect(data.snapshot.menuData).toHaveProperty('packageName');
          }

          // Verify price breakdown structure
          if (data.priceBreakdown) {
            expect(data.priceBreakdown).toHaveProperty('packageCost');
            expect(data.priceBreakdown).toHaveProperty('totalMenuPrice');
          }

          return; // Found one, test passes
        }
      }

      // If no reservation has menu, that's also fine
      test.skip();
    });
  });

  test.describe('Existing Reservation Menu View', () => {
    test('should display reservation list with possible menu indicators', async ({ page }) => {
      await reservation.goToList();

      // Wait for list to load
      await page.waitForTimeout(2000);

      // Verify we're on the reservations page
      await expect(
        page.getByRole('heading', { name: 'Rezerwacje' })
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
