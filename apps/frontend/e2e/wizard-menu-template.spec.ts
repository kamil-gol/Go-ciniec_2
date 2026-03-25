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
 * templates / packages existing in the database are marked as placeholder
 * (.skip) with explanatory comments.
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

    // Step 0: Event type — open Radix Select and pick first available option
    await authenticatedPage.click('text=Wybierz typ wydarzenia...');
    const eventOption = authenticatedPage.locator('[role="option"]').first();
    await expect(eventOption).toBeVisible({ timeout: 3000 });
    await eventOption.click();
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

    // Navigate to next month to avoid "past date" issues, then select day 15
    await wizard.nextMonth();
    await wizard.selectDate(15);

    // Select the first available time slot
    const timeButton = authenticatedPage.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
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
    await wizard.fillInput('babies', '5');
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

  // ─── Tests that require specific menu templates/packages in the DB ──────
  // These tests depend on known menu template names (e.g. "Wesele", "Komunia")
  // and package names (e.g. "Standard") existing in the database.
  // They are skipped by default. To run them, ensure seed data includes:
  //   - At least two menu templates (e.g. "Wesele", "Komunia")
  //   - At least one package per template (e.g. "Standard")

  test.skip('should show package select after choosing template', async ({ authenticatedPage }) => {
    // Requires: menu template "Wesele" in DB
    await wizard.toggleSwitch('Gotowe menu');
    await wizard.selectByLabel('Szablon', 'Wesele');

    await expect(
      authenticatedPage.getByText(/Pakiet cenowy|Pakiet/i).first()
    ).toBeVisible();
  });

  test.skip('should display price card after selecting package', async ({ authenticatedPage }) => {
    // Requires: menu template "Wesele" + package "Standard" in DB
    await wizard.toggleSwitch('Gotowe menu');
    await wizard.selectByLabel('Szablon', 'Wesele');
    await authenticatedPage.waitForTimeout(500);
    await wizard.selectByLabel('Pakiet', 'Standard');

    await expect(
      authenticatedPage.getByText(/dorosły|Dorosły|PLN/i).first()
    ).toBeVisible();
  });

  test.skip('should clear package when template changes', async ({ authenticatedPage }) => {
    // Requires: menu templates "Wesele" + "Komunia", package "Standard" in DB
    await wizard.toggleSwitch('Gotowe menu');
    await wizard.selectByLabel('Szablon', 'Wesele');
    await authenticatedPage.waitForTimeout(500);
    await wizard.selectByLabel('Pakiet', 'Standard');

    // Change template — package should reset
    await wizard.selectByLabel('Szablon', 'Komunia');
    await authenticatedPage.waitForTimeout(300);

    const packageTrigger = authenticatedPage.locator('button[role="combobox"]').last();
    const triggerText = await packageTrigger.textContent();
    expect(triggerText).not.toContain('Standard');
  });

  test.skip('should show breadcrumb Szablon → Pakiet → Ceny', async ({ authenticatedPage }) => {
    // Requires: menu template "Wesele" in DB
    await wizard.toggleSwitch('Gotowe menu');

    await expect(
      authenticatedPage.getByText(/Szablon/i).first()
    ).toBeVisible();

    await wizard.selectByLabel('Szablon', 'Wesele');
    await expect(
      authenticatedPage.getByText(/Pakiet/i).first()
    ).toBeVisible();
  });

  test.skip('should show template → package path in summary (step 5)', async ({ authenticatedPage }) => {
    // Requires: menu template "Wesele" + package "Standard" + client "Jan Kowalski" in DB
    await wizard.toggleSwitch('Gotowe menu');
    await wizard.selectByLabel('Szablon', 'Wesele');
    await authenticatedPage.waitForTimeout(500);
    await wizard.selectByLabel('Pakiet', 'Standard');

    await wizard.nextStep(); // → Step 4: Klient
    await wizard.selectClient('Jan Kowalski');
    await wizard.nextStep(); // → Step 5: Podsumowanie

    await expect(
      authenticatedPage.getByText(/Wesele.*Standard|Standard/i).first()
    ).toBeVisible();
  });
});
