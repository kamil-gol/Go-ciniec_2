import { test, expect } from './fixtures/auth';
import { WizardHelper } from './fixtures/wizard';

/**
 * E2E tests for the Szablon → Pakiet → Ceny flow in Step 3 (Menu i ceny).
 *
 * The wizard is opened inline on /dashboard/reservations/list by clicking
 * "Nowa Rezerwacja". To reach Step 3 we must complete Steps 0-2 with valid
 * data, which requires halls, event types, and time-slots to exist in the DB.
 *
 * Tests that only need to verify Step 3 UI elements still must navigate
 * through the earlier steps first. Tests that depend on specific menu
 * templates / packages require seed data with templates "Wesele" and
 * "Komunia", package "Standard", and client "Jan Kowalski".
 */
test.describe('Wizard Step 3: Szablon → Pakiet → Ceny', () => {
  let wizard: WizardHelper;

  /**
   * Navigate to the reservations list, open the wizard, and advance
   * through Steps 0-2 so we land on Step 3 (Menu i ceny).
   */
  test.beforeEach(async ({ authenticatedPage }) => {
    wizard = new WizardHelper(authenticatedPage);

    // Go to the reservations list page
    await authenticatedPage.goto('/dashboard/reservations/list');
    await authenticatedPage.waitForLoadState('networkidle');

    // Open the inline wizard
    await authenticatedPage.locator('button:has-text("Nowa Rezerwacja")').click();
    // Wait for wizard to render
    await expect(
      authenticatedPage.locator('text=Jaki typ wydarzenia?')
    ).toBeVisible({ timeout: 5000 });

    // Step 0: Event type — select "Wesele" so menu templates match in Step 3
    await authenticatedPage.click('text=Wybierz typ wydarzenia...');
    const weselleOption = authenticatedPage.locator('[role="option"]:has-text("Wesele")');
    const firstOption = authenticatedPage.locator('[role="option"]').first();
    // Try "Wesele" first (needed for template matching), fall back to first available
    if (await weselleOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weselleOption.click();
    } else {
      await expect(firstOption).toBeVisible({ timeout: 3000 });
      await firstOption.click();
    }
    await wizard.nextStep();

    // Step 1: Hall + Date + Time
    // Wait for step 1 content
    await expect(
      authenticatedPage.locator('text=Wybierz salę i termin')
    ).toBeVisible({ timeout: 5000 });

    // Select first available hall via Radix Select
    const hallTrigger = authenticatedPage.locator('button[role="combobox"]').first();
    await hallTrigger.click();
    await authenticatedPage.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 3000 });
    await authenticatedPage.locator('[role="option"]').first().click();
    await authenticatedPage.waitForTimeout(300);

    // Select a future date in the current month — wizard.selectDate() opens the popover itself
    // Avoid nextMonth() which causes popover instability with Radix UI + React re-renders
    await wizard.selectDate(28);

    // Open START time picker popover (time slots are inside a Popover)
    const startTimeTrigger = authenticatedPage.locator('button:has-text("Wybierz godzinę")').first();
    await expect(startTimeTrigger).toBeVisible({ timeout: 3000 });
    await startTimeTrigger.click();
    await authenticatedPage.waitForTimeout(300);

    // Select the first available time slot from the popover
    const timeButton = authenticatedPage.locator('[data-radix-popper-content-wrapper] button, [role="dialog"] button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(timeButton).toBeVisible({ timeout: 3000 });
    await timeButton.click();

    await authenticatedPage.waitForTimeout(500);
    await wizard.nextStep();

    // Step 2: Guests
    await expect(
      authenticatedPage.locator('input[name="adults"]')
    ).toBeVisible({ timeout: 5000 });
    await wizard.fillInput('adults', '50');
    await wizard.fillInput('children', '10');
    await wizard.fillInput('toddlers', '5');
    await wizard.nextStep();

    // Now on Step 3: Menu i ceny — wait for it to render
    await authenticatedPage.waitForTimeout(500);
  });

  // ─── Tests that verify Step 3 UI structure (no specific DB menu data) ───

  test('should show toggle for "Gotowe menu"', async ({ authenticatedPage }) => {
    // The switch should be visible
    await expect(
      authenticatedPage.locator('button[role="switch"]').first()
    ).toBeVisible({ timeout: 5000 });

    // "Gotowe menu" text should be nearby
    await expect(
      authenticatedPage.getByText(/Gotowe menu/i).first()
    ).toBeVisible();
  });

  test('should show template select after enabling toggle', async ({ authenticatedPage }) => {
    // Enable "Gotowe menu"
    await wizard.toggleSwitch('Gotowe menu');

    // "Szablon menu" label should appear
    await expect(
      authenticatedPage.getByText(/Szablon menu/i).first()
    ).toBeVisible({ timeout: 3000 });

    // A combobox trigger for template selection should be visible
    await expect(
      authenticatedPage.locator('button[role="combobox"]').first()
    ).toBeVisible();
  });

  test('should switch between package and manual pricing', async ({ authenticatedPage }) => {
    // Enable package mode
    await wizard.toggleSwitch('Gotowe menu');
    await expect(
      authenticatedPage.getByText(/Szablon menu/i).first()
    ).toBeVisible({ timeout: 3000 });

    // Disable — should switch back to manual pricing inputs
    await wizard.toggleSwitch('Gotowe menu');

    // Manual price inputs should be visible
    await expect(
      authenticatedPage.locator('input[name="adultPrice"], input[name="pricePerAdult"]').first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('should auto-calculate child=50% and toddler=25% in manual mode', async ({ authenticatedPage }) => {
    // Ensure toggle is off (manual mode)
    const isOn = await wizard.isSwitchOn('Gotowe menu');
    if (isOn) await wizard.toggleSwitch('Gotowe menu');

    // Fill adult price = 200
    const adultPriceInput = authenticatedPage
      .locator('input[name="adultPrice"], input[name="pricePerAdult"]')
      .first();
    await expect(adultPriceInput).toBeVisible({ timeout: 3000 });
    await adultPriceInput.clear();
    await adultPriceInput.fill('200');

    // Wait for auto-calculation
    await authenticatedPage.waitForTimeout(500);

    // Child price should be 100 (50%)
    const childPrice = authenticatedPage
      .locator('input[name="childPrice"], input[name="pricePerChild"]')
      .first();
    const childValue = await childPrice.inputValue();
    expect(parseFloat(childValue)).toBe(100);

    // Toddler price should be 50 (25%)
    const toddlerPrice = authenticatedPage
      .locator('input[name="toddlerPrice"], input[name="pricePerToddler"], input[name="babyPrice"]')
      .first();
    const toddlerValue = await toddlerPrice.inputValue();
    expect(parseFloat(toddlerValue)).toBe(50);
  });

  // ─── Tests that require wizard event type ↔ menu template matching ──────
  // These tests need the wizard step 0 event type to match a seeded template.
  // The beforeEach now selects "Wesele" explicitly so templates appear in step 3.

  test('should show package select after choosing template', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    // Check if "Wesele" template is available (requires seed data + matching event type)
    const templateTrigger = authenticatedPage.locator('button[role="combobox"]').first();
    await templateTrigger.click();
    const weselleOpt = authenticatedPage.locator('[role="option"]:has-text("Wesele")');
    const hasTemplate = await weselleOpt.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasTemplate) {
      // Close dropdown
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Template "Wesele" not found — seed data or event type mismatch');
    }
    await weselleOpt.click();
    await authenticatedPage.waitForTimeout(500);

    await expect(
      authenticatedPage.getByText(/Pakiet cenowy|Pakiet/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display price card after selecting package', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    const templateTrigger = authenticatedPage.locator('button[role="combobox"]').first();
    await templateTrigger.click();
    const weselleOpt = authenticatedPage.locator('[role="option"]:has-text("Wesele")');
    const hasTemplate = await weselleOpt.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasTemplate) {
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Template "Wesele" not found');
    }
    await weselleOpt.click();
    await authenticatedPage.waitForTimeout(500);

    // Select package
    const packageTrigger = authenticatedPage.locator('button[role="combobox"]').last();
    await packageTrigger.click();
    const standardOpt = authenticatedPage.locator('[role="option"]:has-text("Standard")');
    const hasPkg = await standardOpt.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasPkg) {
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Package "Standard" not found');
    }
    await standardOpt.click();

    await expect(
      authenticatedPage.getByText(/dorosły|Dorosły|PLN/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should clear package when template changes', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    const templateTrigger = authenticatedPage.locator('button[role="combobox"]').first();
    await templateTrigger.click();
    const weselleOpt = authenticatedPage.locator('[role="option"]:has-text("Wesele")');
    const hasTemplate = await weselleOpt.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasTemplate) {
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Template "Wesele" not found');
    }
    await weselleOpt.click();
    await authenticatedPage.waitForTimeout(500);

    // Select package
    const pkgTrigger = authenticatedPage.locator('button[role="combobox"]').last();
    await pkgTrigger.click();
    const standardOpt = authenticatedPage.locator('[role="option"]:has-text("Standard")');
    if (!(await standardOpt.isVisible({ timeout: 3000 }).catch(() => false))) {
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Package "Standard" not found');
    }
    await standardOpt.click();
    await authenticatedPage.waitForTimeout(300);

    // Change template — need to check if "Komunia" is available
    // Note: Komunia is linked to a different event type, so it may NOT appear
    // when "Wesele" event type was selected in step 0
    const tmplTrigger2 = authenticatedPage.locator('button[role="combobox"]').first();
    await tmplTrigger2.click();
    const komuniaOpt = authenticatedPage.locator('[role="option"]:has-text("Komunia")');
    const hasKomunia = await komuniaOpt.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasKomunia) {
      await authenticatedPage.keyboard.press('Escape');
      // Templates are filtered by event type — Komunia won't appear under Wesele
      test.skip(true, 'Template "Komunia" not available under selected event type');
    }
    await komuniaOpt.click();
    await authenticatedPage.waitForTimeout(300);

    const packageTrigger2 = authenticatedPage.locator('button[role="combobox"]').last();
    const triggerText = await packageTrigger2.textContent();
    expect(triggerText).not.toContain('Standard');
  });

  test('should show breadcrumb Szablon → Pakiet → Ceny', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    await expect(
      authenticatedPage.getByText(/Szablon/i).first()
    ).toBeVisible();

    const templateTrigger = authenticatedPage.locator('button[role="combobox"]').first();
    await templateTrigger.click();
    const weselleOpt = authenticatedPage.locator('[role="option"]:has-text("Wesele")');
    const hasTemplate = await weselleOpt.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasTemplate) {
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Template "Wesele" not found');
    }
    await weselleOpt.click();

    await expect(
      authenticatedPage.getByText(/Pakiet/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show template → package path in summary (step 5)', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    const templateTrigger = authenticatedPage.locator('button[role="combobox"]').first();
    await templateTrigger.click();
    const weselleOpt = authenticatedPage.locator('[role="option"]:has-text("Wesele")');
    const hasTemplate = await weselleOpt.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasTemplate) {
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Template "Wesele" not found');
    }
    await weselleOpt.click();
    await authenticatedPage.waitForTimeout(500);

    const pkgTrigger = authenticatedPage.locator('button[role="combobox"]').last();
    await pkgTrigger.click();
    const standardOpt = authenticatedPage.locator('[role="option"]:has-text("Standard")');
    if (!(await standardOpt.isVisible({ timeout: 3000 }).catch(() => false))) {
      await authenticatedPage.keyboard.press('Escape');
      test.skip(true, 'Package "Standard" not found');
    }
    await standardOpt.click();

    await wizard.nextStep(); // → Step 4: Klient
    await wizard.selectClient('Jan Kowalski');
    await wizard.nextStep(); // → Step 5: Podsumowanie

    await expect(
      authenticatedPage.getByText(/Wesele.*Standard|Standard/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
