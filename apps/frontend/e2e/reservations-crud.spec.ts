import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { ReservationHelper } from './fixtures/reservation';

/**
 * Reservations CRUD Tests
 *
 * Tests the reservations list page and create form wizard.
 * Page: /dashboard/reservations/list
 * Create form: inline 6-step wizard opened via "Nowa Rezerwacja" button.
 *
 * Note: Full end-to-end CRUD (create with real data, edit, delete) requires
 * known database IDs for halls, event types, and clients. These tests focus
 * on UI structure and validation that works without specific DB state.
 */

test.describe('Reservations Page', () => {
  let helper: ReservationHelper;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    helper = new ReservationHelper(page);
  });

  test.describe('List Page', () => {
    test('should load reservations list page', async ({ page }) => {
      await helper.goToList();

      // Page hero should show "Rezerwacje"
      await expect(
        page.getByRole('heading', { name: 'Rezerwacje' })
      ).toBeVisible({ timeout: 10000 });
    });

    test('should display stats cards', async ({ page }) => {
      await helper.goToList();

      // 4 stat cards: Wszystkie, Potwierdzone, Oczekuj\u0105ce, Ten miesi\u0105c
      await expect(page.locator('text=Wszystkie')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Potwierdzone')).toBeVisible();
      await expect(page.locator('text=Oczekuj\u0105ce')).toBeVisible();
      await expect(page.locator('text=Ten miesi\u0105c')).toBeVisible();
    });

    test('should have view toggle (Lista / Kalendarz)', async ({ page }) => {
      await helper.goToList();

      // View toggle: Lista (active) and Kalendarz (link)
      await expect(page.locator('text=Lista').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('a:has-text("Kalendarz")')).toBeVisible();
    });

    test('should have Nowa Rezerwacja button', async ({ page }) => {
      await helper.goToList();

      await expect(
        page.locator('button:has-text("Nowa Rezerwacja")')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to calendar view', async ({ page }) => {
      await helper.goToList();

      await page.click('a:has-text("Kalendarz")');
      await expect(page).toHaveURL(/\/dashboard\/reservations\/calendar/);
    });
  });

  test.describe('Create Form', () => {
    test('should open create form when clicking Nowa Rezerwacja', async ({ page }) => {
      await helper.goToList();
      await helper.openCreateForm();

      // Stepper should be visible with step titles
      await expect(page.locator('text=Wydarzenie').first()).toBeVisible();
      await expect(page.locator('text=Sala i termin').first()).toBeVisible();
      await expect(page.locator('text=Go\u015bcie').first()).toBeVisible();
    });

    test('should close form when clicking cancel', async ({ page }) => {
      await helper.goToList();
      await helper.openCreateForm();

      // Form should be visible
      await expect(
        page.locator('text=Jaki typ wydarzenia?')
      ).toBeVisible({ timeout: 3000 });

      // Cancel
      await helper.cancelCreateForm();

      // Form should be hidden
      await expect(
        page.locator('text=Jaki typ wydarzenia?')
      ).toBeHidden({ timeout: 3000 });
    });

    test('should show step 0 (event type) content', async ({ page }) => {
      await helper.goToList();
      await helper.openCreateForm();

      // Step 0 content
      await expect(page.locator('text=Jaki typ wydarzenia?')).toBeVisible();
      await expect(page.locator('text=Typ wydarzenia')).toBeVisible();

      // Select trigger should show placeholder
      await expect(
        page.locator('text=Wybierz typ wydarzenia...')
      ).toBeVisible();
    });

    test('should validate event type on step 0', async ({ page }) => {
      await helper.goToList();
      await helper.openCreateForm();

      // Try to go next without selecting event type
      await helper.nextStep();

      // Should show validation error
      await expect(
        page.locator('text=Wybierz typ wydarzenia')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should show event type options in dropdown', async ({ page }) => {
      await helper.goToList();
      await helper.openCreateForm();

      // Click the Select trigger to open dropdown
      await page.click('text=Wybierz typ wydarzenia...');

      // Dropdown should show event types from the database
      // At minimum, the select content should be visible
      const selectContent = page.locator('[role="listbox"]');
      await expect(selectContent).toBeVisible({ timeout: 3000 });

      // Should have at least one option
      const options = selectContent.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should navigate to step 1 after selecting event type', async ({ page }) => {
      await helper.goToList();
      await helper.openCreateForm();

      // Open event type dropdown and select first option
      await page.click('text=Wybierz typ wydarzenia...');
      const firstOption = page.locator('[role="option"]').first();
      await firstOption.click();

      // Click Dalej
      await helper.nextStep();

      // Step 1 content should appear
      await expect(
        page.locator('text=Wybierz sal\u0119 i termin')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should navigate back with Wstecz button', async ({ page }) => {
      await helper.goToList();
      await helper.openCreateForm();

      // Select event type and go to step 1
      await page.click('text=Wybierz typ wydarzenia...');
      await page.locator('[role="option"]').first().click();
      await helper.nextStep();

      // Verify we're on step 1
      await expect(
        page.locator('text=Wybierz sal\u0119 i termin')
      ).toBeVisible({ timeout: 3000 });

      // Go back
      await helper.prevStep();

      // Should be back on step 0
      await expect(
        page.locator('text=Jaki typ wydarzenia?')
      ).toBeVisible({ timeout: 3000 });
    });
  });
});
