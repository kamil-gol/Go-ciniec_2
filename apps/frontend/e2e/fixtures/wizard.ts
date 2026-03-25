import { Page, expect, Locator } from '@playwright/test';

/**
 * Helper for interacting with the 6-step reservation wizard.
 * Handles Radix Select, DatePicker, TimePicker, Combobox, and step navigation.
 */
export class WizardHelper {
  constructor(private page: Page) {}

  // ─── Step Navigation ───────────────────────────────────────────────

  /** Click "Dalej" to advance to next step */
  async nextStep() {
    await this.page.getByRole('button', { name: /Dalej/i }).click();
    // Wait for framer-motion animation to settle
    await this.page.waitForTimeout(400);
  }

  /** Click "Wstecz" to go back */
  async prevStep() {
    await this.page.getByRole('button', { name: /Wstecz/i }).click();
    await this.page.waitForTimeout(400);
  }

  /** Get current step index from the stepper component */
  async getCurrentStep(): Promise<number> {
    // The active step in the stepper has a primary/active style
    const activeStep = this.page.locator('[data-step-active="true"], .step-active, [aria-current="step"]');
    if (await activeStep.count() > 0) {
      const stepText = await activeStep.first().getAttribute('data-step-index');
      return stepText ? parseInt(stepText, 10) : 0;
    }
    return 0;
  }

  /** Navigate to a specific step by index (0-5) */
  async goToStep(targetStep: number) {
    // Click on the step indicator in the stepper (only completed steps are clickable)
    const stepButton = this.page.locator(`[data-step-index="${targetStep}"]`).first();
    if (await stepButton.isVisible()) {
      await stepButton.click();
      await this.page.waitForTimeout(400);
    }
  }

  // ─── Radix Select Helper ───────────────────────────────────────────

  /**
   * Select a value from a Radix Select component.
   * @param triggerSelector - CSS selector or test ID for the SelectTrigger button
   * @param optionText - The visible text of the option to select
   */
  async selectRadix(triggerSelector: string, optionText: string) {
    // Click the trigger to open the dropdown
    const trigger = this.page.locator(triggerSelector).first();
    await trigger.click();

    // Wait for the Radix Select content to appear
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 3000 });

    // Click the matching option
    const option = this.page.locator('[role="option"]').filter({ hasText: optionText });
    await option.first().click();

    // Wait for dropdown to close
    await this.page.waitForTimeout(200);
  }

  /**
   * Select by label proximity — finds a Select trigger near a label.
   */
  async selectByLabel(labelText: string, optionText: string) {
    // Find the label, then find the nearest select trigger
    const label = this.page.getByText(labelText, { exact: false }).first();
    const container = label.locator('xpath=ancestor::div[contains(@class, "space-y") or contains(@class, "flex")]').first();
    const trigger = container.locator('button[role="combobox"], [data-radix-select-trigger]').first();

    if (await trigger.isVisible()) {
      await trigger.click();
    } else {
      // Fallback: click any combobox button near the label
      await label.locator('..').locator('button').first().click();
    }

    await this.page.waitForSelector('[role="listbox"], [role="option"]', { state: 'visible', timeout: 3000 });
    await this.page.locator('[role="option"]').filter({ hasText: optionText }).first().click();
    await this.page.waitForTimeout(200);
  }

  // ─── Combobox (Client Picker) Helper ───────────────────────────────

  /**
   * Select a client from the Combobox component.
   * The combobox uses Command (cmdk) with a search input inside a Popover.
   */
  async selectClient(clientName: string) {
    // Open the combobox popover
    const comboboxTrigger = this.page.locator('button').filter({ hasText: /Wybierz klienta|Szukaj klienta/i }).first();
    await comboboxTrigger.click();

    // Wait for the Command input to appear
    await this.page.waitForSelector('[cmdk-input], input[placeholder*="Szukaj"]', { state: 'visible', timeout: 3000 });

    // Type to search
    const searchInput = this.page.locator('[cmdk-input], input[placeholder*="Szukaj"]').first();
    await searchInput.fill(clientName);
    await this.page.waitForTimeout(500); // Wait for filtering/API response

    // Click the matching result
    const result = this.page.locator('[cmdk-item], [role="option"]').filter({ hasText: clientName });
    await result.first().click();
    await this.page.waitForTimeout(200);
  }

  // ─── DatePicker Helper ─────────────────────────────────────────────

  /**
   * Select a date using the DatePicker component.
   * Opens the popover calendar and clicks the target day.
   */
  async selectDate(day: number) {
    // Click the date picker trigger button
    const dateTrigger = this.page.locator('button').filter({ hasText: /Wybierz datę|\d+ (stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)/i }).first();
    await dateTrigger.click();

    // Wait for calendar grid to appear
    await this.page.waitForSelector('[role="grid"]', { state: 'visible', timeout: 3000 });

    // Click the specific day number (only enabled, non-outside days)
    // rdp v8: day buttons have name="day", disabled days have [disabled] attribute,
    // outside days get custom "day-outside" class from calendar.tsx classNames
    const dayButton = this.page.locator('button[name="day"]:not([disabled])').filter({ hasText: new RegExp(`^${day}$`) }).first();
    await expect(dayButton).toBeVisible({ timeout: 5000 });
    await dayButton.click({ timeout: 10000 });
    await this.page.waitForTimeout(200);
  }

  /** Navigate to next month in the calendar */
  async nextMonth() {
    await this.page.locator('button[name="next-month"]').click();
    // Wait for calendar to re-render after month navigation
    await this.page.waitForTimeout(500);
  }

  // ─── TimePicker Helper ─────────────────────────────────────────────

  /**
   * Select a time slot from the TimePicker grid.
   * @param time - Time string like "14:00" or "14:30"
   */
  async selectTime(labelText: string, time: string) {
    // Find time picker near the label
    const section = this.page.getByText(labelText, { exact: false }).first().locator('xpath=ancestor::div[contains(@class, "space-y")]').first();
    const timeButton = section.locator('button').filter({ hasText: time }).first();

    if (await timeButton.isVisible()) {
      await timeButton.click();
    } else {
      // Fallback: find time button anywhere on the page
      await this.page.locator('button').filter({ hasText: new RegExp(`^${time}$`) }).first().click();
    }
    await this.page.waitForTimeout(200);
  }

  // ─── Switch/Toggle Helper ──────────────────────────────────────────

  /**
   * Toggle a switch component by its nearby label text.
   */
  async toggleSwitch(labelText: string) {
    const switchEl = this.page.getByText(labelText, { exact: false }).first()
      .locator('xpath=ancestor::div[contains(@class, "flex")]')
      .locator('button[role="switch"]').first();

    if (await switchEl.isVisible()) {
      await switchEl.click();
    } else {
      // Fallback: find switch near the label text
      const label = this.page.getByText(labelText, { exact: false }).first();
      await label.locator('..').locator('button[role="switch"]').first().click();
    }
    await this.page.waitForTimeout(200);
  }

  /** Check if a switch is currently on */
  async isSwitchOn(labelText: string): Promise<boolean> {
    const switchEl = this.page.getByText(labelText, { exact: false }).first()
      .locator('xpath=ancestor::div[contains(@class, "flex")]')
      .locator('button[role="switch"]').first();
    const state = await switchEl.getAttribute('data-state');
    return state === 'checked';
  }

  // ─── Input Helper ──────────────────────────────────────────────────

  /**
   * Fill a number input field by its name attribute.
   */
  async fillInput(name: string, value: string) {
    const input = this.page.locator(`input[name="${name}"]`).first();
    await input.clear();
    await input.fill(value);
  }

  /**
   * Fill a textarea by its name attribute.
   */
  async fillTextarea(name: string, value: string) {
    const textarea = this.page.locator(`textarea[name="${name}"]`).first();
    await textarea.clear();
    await textarea.fill(value);
  }

  // ─── Full Wizard Flow ──────────────────────────────────────────────

  /**
   * Complete the full wizard from step 0 to submit.
   * Pass data for each step.
   */
  async completeFullWizard(data: {
    eventType: string;
    hall: string;
    dateDay: number;
    startTime: string;
    adults: string;
    children?: string;
    babies?: string;
    useMenuPackage?: boolean;
    menuTemplate?: string;
    menuPackage?: string;
    clientName: string;
    notes?: string;
    birthdayAge?: string;
    anniversaryType?: string;
    anniversaryYears?: string;
  }) {
    // Step 0: Wydarzenie (Event Type)
    await this.selectByLabel('Typ wydarzenia', data.eventType);
    if (data.birthdayAge) {
      await this.fillInput('birthdayAge', data.birthdayAge);
    }
    if (data.anniversaryType) {
      await this.fillInput('anniversaryType', data.anniversaryType);
    }
    if (data.anniversaryYears) {
      await this.fillInput('anniversaryYears', data.anniversaryYears);
    }
    await this.nextStep();

    // Step 1: Sala i termin
    await this.selectByLabel('Sala', data.hall);
    await this.selectDate(data.dateDay);
    await this.selectTime('Godzina rozpoczęcia', data.startTime);
    // Wait for availability check
    await this.page.waitForTimeout(1000);
    await this.nextStep();

    // Step 2: Goście
    await this.fillInput('adults', data.adults);
    if (data.children) await this.fillInput('children', data.children);
    if (data.babies) await this.fillInput('babies', data.babies);
    await this.nextStep();

    // Step 3: Menu i ceny
    if (data.useMenuPackage && data.menuTemplate && data.menuPackage) {
      // Toggle "Gotowe menu" switch if not already on
      const isOn = await this.isSwitchOn('Gotowe menu');
      if (!isOn) await this.toggleSwitch('Gotowe menu');
      await this.selectByLabel('Szablon', data.menuTemplate);
      await this.page.waitForTimeout(500);
      await this.selectByLabel('Pakiet', data.menuPackage);
    }
    await this.nextStep();

    // Step 4: Klient
    await this.selectClient(data.clientName);
    if (data.notes) {
      await this.fillTextarea('notes', data.notes);
    }
    await this.nextStep();

    // Step 5: Podsumowanie — click submit
    await this.page.getByRole('button', { name: /Utwórz rezerwację|Zapisz|Potwierdź/i }).click();

    // Wait for success toast
    await this.page.waitForTimeout(1000);
  }
}
