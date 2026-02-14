import { test, expect } from './fixtures/auth';
import { WizardHelper } from './fixtures/wizard';
import { ReservationHelper } from './fixtures/reservation';
import { TEST_RESERVATIONS, getFutureDate } from './fixtures/test-data';

/**
 * E2E tests for the check-availability feature in Step 1 (Sala i termin).
 * Tests that the wizard properly checks and displays hall availability.
 */
test.describe('Check Availability (Step 1)', () => {
  let wizard: WizardHelper;
  let reservationHelper: ReservationHelper;

  test.beforeEach(async ({ authenticatedPage }) => {
    wizard = new WizardHelper(authenticatedPage);
    reservationHelper = new ReservationHelper(authenticatedPage);
  });

  test('should show availability status after selecting hall + date + time', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reservations/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Step 0
    await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
    await wizard.nextStep();

    // Step 1: Select hall, date, and time
    await wizard.selectByLabel('Sala', 'Sala Główna');
    await wizard.nextMonth();
    await wizard.selectDate(20);
    await wizard.selectTime('Godzina rozpoczęcia', '14:00');

    // Wait for availability check API call
    await authenticatedPage.waitForTimeout(2000);

    // Should show some availability indicator (green = available, red = occupied)
    const availabilityIndicator = authenticatedPage.locator(
      '[data-testid="availability-status"], .text-green-600, .text-emerald-600, .text-red-500'
    ).first();

    await expect(availabilityIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should show occupied warning when date/time conflicts with existing reservation', async ({ authenticatedPage }) => {
    // First create a reservation for a known date via API
    const futureDate = getFutureDate(60);
    await reservationHelper.createViaAPI({
      ...TEST_RESERVATIONS.confirmed,
      date: futureDate,
      hallId: 'hall-1',
      startTime: '14:00',
      endTime: '20:00',
    });

    // Now try to create another reservation at the same time
    await authenticatedPage.goto('/reservations/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Step 0
    await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
    await wizard.nextStep();

    // Step 1: Same hall, same date, overlapping time
    await wizard.selectByLabel('Sala', 'Sala Główna');

    // Navigate to the month of the future date
    // This is approximate — we go forward 2 months to be safe
    await wizard.nextMonth();
    await wizard.nextMonth();
    await wizard.selectDate(parseInt(futureDate.split('-')[2], 10));
    await wizard.selectTime('Godzina rozpoczęcia', '14:00');

    // Wait for availability check
    await authenticatedPage.waitForTimeout(2000);

    // Should show a conflict/occupied warning
    await expect(
      authenticatedPage.getByText(/zajęt|niedostępn|konflikt|occupied/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show extra hours info when event exceeds 6h', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reservations/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Step 0
    await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
    await wizard.nextStep();

    // Step 1: Select hall, date, start at 12:00 (6h standard → ends at 18:00)
    await wizard.selectByLabel('Sala', 'Sala Główna');
    await wizard.nextMonth();
    await wizard.selectDate(20);
    await wizard.selectTime('Godzina rozpoczęcia', '12:00');

    // Auto-fill should set end to 18:00 (12:00 + 6h = standard, no extra)
    // The extra hours section should show 0 or not appear
    await authenticatedPage.waitForTimeout(1000);

    // Now manually extend end time to create extra hours
    // Try selecting a later end time if the field allows it
    const endTimeSection = authenticatedPage.getByText(/zakończenia|Koniec/i).first();
    if (await endTimeSection.isVisible()) {
      await wizard.selectTime('zakończenia', '22:00');
      await authenticatedPage.waitForTimeout(500);

      // Should show extra hours info (22:00 - 12:00 = 10h, standard 6h → 4 extra)
      await expect(
        authenticatedPage.getByText(/dodatkow|extra|godzin/i).first()
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should allow advancing only when date is available', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/reservations/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Step 0
    await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
    await wizard.nextStep();

    // Step 1: Select hall and date/time for an available slot
    await wizard.selectByLabel('Sala', 'Sala Główna');
    await wizard.nextMonth();
    await wizard.selectDate(25);
    await wizard.selectTime('Godzina rozpoczęcia', '10:00');

    // Wait for availability
    await authenticatedPage.waitForTimeout(2000);

    // Should be able to click "Dalej"
    await wizard.nextStep();

    // Should now be on Step 2 (Guests) — verify by checking for guest inputs
    await expect(
      authenticatedPage.locator('input[name="adults"]')
    ).toBeVisible({ timeout: 3000 });
  });
});
