import { test, expect } from './fixtures/auth';
import { WizardHelper } from './fixtures/wizard';

/**
 * E2E tests for the new Szablon → Pakiet → Ceny flow in Step 3.
 * Tests the menu template selection, package selection, and auto-pricing.
 */
test.describe('Wizard Step 3: Szablon → Pakiet → Ceny', () => {
  let wizard: WizardHelper;

  test.beforeEach(async ({ authenticatedPage }) => {
    wizard = new WizardHelper(authenticatedPage);

    // Navigate to wizard and complete steps 0-2 to reach step 3
    await authenticatedPage.goto('/reservations/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Step 0: Event type
    await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
    await wizard.nextStep();

    // Step 1: Hall + date + time
    await wizard.selectByLabel('Sala', 'Sala Główna');
    await wizard.nextMonth();
    await wizard.selectDate(15);
    await wizard.selectTime('Godzina rozpoczęcia', '14:00');
    await authenticatedPage.waitForTimeout(1000);
    await wizard.nextStep();

    // Step 2: Guests
    await wizard.fillInput('adults', '50');
    await wizard.fillInput('children', '10');
    await wizard.fillInput('babies', '5');
    await wizard.nextStep();

    // Now on Step 3: Menu i ceny
  });

  test('should show toggle for "Gotowe menu"', async ({ authenticatedPage }) => {
    // The switch should be visible
    await expect(
      authenticatedPage.locator('button[role="switch"]').first()
    ).toBeVisible();

    // "Gotowe menu" text should be nearby
    await expect(
      authenticatedPage.getByText(/Gotowe menu/i).first()
    ).toBeVisible();
  });

  test('should show template select after enabling toggle', async ({ authenticatedPage }) => {
    // Enable "Gotowe menu"
    await wizard.toggleSwitch('Gotowe menu');

    // Step ① — Szablon menu should appear
    await expect(
      authenticatedPage.getByText(/Szablon menu/i).first()
    ).toBeVisible();

    // The select trigger should be visible
    await expect(
      authenticatedPage.locator('button[role="combobox"]').first()
    ).toBeVisible();
  });

  test('should show package select after choosing template', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    // Select a template
    await wizard.selectByLabel('Szablon', 'Wesele');

    // Step ② — Pakiet cenowy should appear
    await expect(
      authenticatedPage.getByText(/Pakiet cenowy|Pakiet/i).first()
    ).toBeVisible();
  });

  test('should display price card after selecting package', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    // Select template then package
    await wizard.selectByLabel('Szablon', 'Wesele');
    await authenticatedPage.waitForTimeout(500);
    await wizard.selectByLabel('Pakiet', 'Standard');

    // Price card should show prices for adult/child/toddler
    await expect(
      authenticatedPage.getByText(/dorosły|Dorosły|PLN/i).first()
    ).toBeVisible();
  });

  test('should clear package when template changes', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    // Select template + package
    await wizard.selectByLabel('Szablon', 'Wesele');
    await authenticatedPage.waitForTimeout(500);
    await wizard.selectByLabel('Pakiet', 'Standard');

    // Now change template — package should be cleared
    await wizard.selectByLabel('Szablon', 'Komunia');
    await authenticatedPage.waitForTimeout(300);

    // Price card from previous package should NOT be visible
    // (or package select should be reset)
    const packageTrigger = authenticatedPage.locator('button[role="combobox"]').last();
    const triggerText = await packageTrigger.textContent();
    expect(triggerText).not.toContain('Standard');
  });

  test('should show breadcrumb Szablon → Pakiet → Ceny', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');

    // Breadcrumb should be visible
    await expect(
      authenticatedPage.getByText(/Szablon/i).first()
    ).toBeVisible();

    // After selecting template
    await wizard.selectByLabel('Szablon', 'Wesele');
    await expect(
      authenticatedPage.getByText(/Pakiet/i).first()
    ).toBeVisible();
  });

  test('should switch between package and manual pricing', async ({ authenticatedPage }) => {
    // Enable package mode
    await wizard.toggleSwitch('Gotowe menu');
    await expect(
      authenticatedPage.getByText(/Szablon menu/i).first()
    ).toBeVisible();

    // Disable — should switch to manual pricing
    await wizard.toggleSwitch('Gotowe menu');

    // Manual price inputs should be visible
    await expect(
      authenticatedPage.locator('input[name="adultPrice"], input[name="pricePerAdult"]').first()
    ).toBeVisible();
  });

  test('should auto-calculate child=50% and toddler=25% in manual mode', async ({ authenticatedPage }) => {
    // In manual mode (toggle off), fill adult price
    const isOn = await wizard.isSwitchOn('Gotowe menu');
    if (isOn) await wizard.toggleSwitch('Gotowe menu');

    // Fill adult price = 200
    const adultPriceInput = authenticatedPage.locator('input[name="adultPrice"], input[name="pricePerAdult"]').first();
    await adultPriceInput.clear();
    await adultPriceInput.fill('200');

    // Wait for auto-calculation
    await authenticatedPage.waitForTimeout(500);

    // Child price should be 100 (50%)
    const childPrice = authenticatedPage.locator('input[name="childPrice"], input[name="pricePerChild"]').first();
    const childValue = await childPrice.inputValue();
    expect(parseFloat(childValue)).toBe(100);

    // Toddler price should be 50 (25%)
    const toddlerPrice = authenticatedPage.locator('input[name="toddlerPrice"], input[name="pricePerToddler"], input[name="babyPrice"]').first();
    const toddlerValue = await toddlerPrice.inputValue();
    expect(parseFloat(toddlerValue)).toBe(50);
  });

  test('should show template → package path in summary (step 5)', async ({ authenticatedPage }) => {
    await wizard.toggleSwitch('Gotowe menu');
    await wizard.selectByLabel('Szablon', 'Wesele');
    await authenticatedPage.waitForTimeout(500);
    await wizard.selectByLabel('Pakiet', 'Standard');

    // Advance through remaining steps
    await wizard.nextStep(); // → Step 4: Klient
    await wizard.selectClient('Jan Kowalski');
    await wizard.nextStep(); // → Step 5: Podsumowanie

    // Summary should show the template → package path
    await expect(
      authenticatedPage.getByText(/Wesele.*Standard|Standard/i).first()
    ).toBeVisible();
  });
});
