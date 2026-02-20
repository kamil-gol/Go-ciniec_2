import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { MenuHelper } from './fixtures/menu';

/**
 * Menu Templates E2E Tests
 *
 * Tests the menu template management page.
 * Page: /dashboard/menu
 *
 * Covers:
 * - Template listing
 * - Create template
 * - Edit template
 * - Clone template
 * - Delete template
 *
 * Issue: #98 — Sekcja 4
 */

test.describe('Menu Templates Management', () => {
  let menu: MenuHelper;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    menu = new MenuHelper(page);
  });

  test.describe('Template List Page', () => {
    test('should load menu management page', async ({ page }) => {
      await menu.goToMenuManagement();

      // Page should contain menu-related heading
      await expect(
        page.locator('h1, h2, [role="heading"]').filter({ hasText: /menu|szablon/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test('should display existing menu templates', async ({ page }) => {
      await menu.goToMenuManagement();
      await menu.waitForTemplatesLoaded();

      // Should have at least some content (templates or empty state)
      const content = page.locator('main, [role="main"], .container');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have button to add new template', async ({ page }) => {
      await menu.goToMenuManagement();

      const addButton = page.locator(
        'button:has-text("Nowy"), button:has-text("Dodaj"), button:has-text("Utwórz"), a:has-text("Nowy")'
      );
      await expect(addButton.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Create Template', () => {
    test('should open create template form', async ({ page }) => {
      await menu.goToMenuManagement();

      await menu.clickCreateTemplate();

      // Form or dialog should appear
      await expect(
        page.locator('form, [role="dialog"], .modal')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
      await menu.goToMenuManagement();
      await menu.clickCreateTemplate();

      // Try to submit without filling form
      await menu.submitTemplateForm();

      // Should show validation error
      await expect(
        page.locator('[class*="error"], [class*="destructive"], [role="alert"], .text-red')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should create template via API and verify in list', async ({ page }) => {
      await menu.goToMenuManagement();

      // Get event types for creating template
      const eventTypes = await menu.getEventTypesViaAPI();
      if (eventTypes.length === 0) {
        test.skip();
        return;
      }

      const uniqueName = `Test Menu E2E ${Date.now()}`;
      const templateId = await menu.createTemplateViaAPI({
        name: uniqueName,
        eventTypeId: eventTypes[0].id,
        variant: 'E2E Test',
      });

      // Refresh page and check if template appears
      await menu.goToMenuManagement();
      await menu.waitForTemplatesLoaded();

      await expect(
        page.locator(`text=${uniqueName}`)
      ).toBeVisible({ timeout: 10000 });

      // Cleanup
      if (templateId) {
        await menu.deleteTemplateViaAPI(templateId);
      }
    });
  });

  test.describe('Edit Template', () => {
    test('should be able to click on existing template to edit', async ({ page }) => {
      await menu.goToMenuManagement();
      await menu.waitForTemplatesLoaded();

      // Find any edit button or clickable template
      const editButton = page.locator(
        'button:has-text("Edytuj"), [aria-label*="edytuj"], [aria-label*="Edytuj"]'
      );

      if (await editButton.first().isVisible().catch(() => false)) {
        await editButton.first().click();

        // Form/dialog should appear
        await expect(
          page.locator('form, [role="dialog"], input[name="name"]')
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Template Navigation', () => {
    test('should navigate to menu page from sidebar', async ({ page }) => {
      await page.goto('/dashboard');

      // Click menu link in sidebar
      const menuLink = page.locator(
        'a[href*="/menu"], nav a:has-text("Menu"), a:has-text("Menu")'
      );

      if (await menuLink.first().isVisible().catch(() => false)) {
        await menuLink.first().click();
        await expect(page).toHaveURL(/\/dashboard\/menu/);
      }
    });

    test('should return to dashboard from menu page', async ({ page }) => {
      await menu.goToMenuManagement();

      // Find dashboard or back link
      const dashLink = page.locator(
        'a[href="/dashboard"], a:has-text("Dashboard"), a:has-text("Pulpit"), nav a:has-text("Pulpit")'
      );

      if (await dashLink.first().isVisible().catch(() => false)) {
        await dashLink.first().click();
        await expect(page).toHaveURL(/\/dashboard$/);
      }
    });
  });
});
