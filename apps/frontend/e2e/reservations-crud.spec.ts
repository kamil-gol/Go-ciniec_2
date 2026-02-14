import { test, expect } from './fixtures/auth';
import { ReservationHelper } from './fixtures/reservation';
import { TEST_RESERVATIONS, TEST_HALLS, getFutureDate } from './fixtures/test-data';

test.describe('Reservations CRUD (Wizard)', () => {
  let reservationHelper: ReservationHelper;

  test.beforeEach(async ({ authenticatedPage }) => {
    reservationHelper = new ReservationHelper(authenticatedPage);
  });

  // ═══════════════════════════════════════════════════════════════════
  // CREATE — via 6-step wizard
  // ═══════════════════════════════════════════════════════════════════

  test.describe('Create Reservation (Wizard)', () => {
    test('should complete full wizard and create reservation', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      await authenticatedPage.waitForLoadState('networkidle');

      const wizard = reservationHelper.wizard;

      // Step 0: Event type
      await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
      await wizard.nextStep();

      // Step 1: Hall + date + time
      await wizard.selectByLabel('Sala', 'Sala Główna');
      await wizard.nextMonth(); // Go to next month for safe future date
      await wizard.selectDate(15);
      await wizard.selectTime('Godzina rozpoczęcia', '14:00');
      await authenticatedPage.waitForTimeout(1000); // availability check
      await wizard.nextStep();

      // Step 2: Guests
      await wizard.fillInput('adults', '80');
      await wizard.fillInput('children', '15');
      await wizard.fillInput('babies', '5');
      await wizard.nextStep();

      // Step 3: Menu — skip (manual pricing)
      await wizard.nextStep();

      // Step 4: Client
      await wizard.selectClient('Jan Kowalski');
      await wizard.fillTextarea('notes', 'Test reservation via E2E wizard');
      await wizard.nextStep();

      // Step 5: Summary — submit
      await authenticatedPage.getByRole('button', { name: /Utwórz rezerwację|Zapisz|Potwierdź/i }).click();

      // Verify success
      await expect(authenticatedPage.locator('[data-sonner-toast], .toast-success')).toBeVisible({ timeout: 10000 });
    });

    test('should show conditional fields for Birthday event type', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      await authenticatedPage.waitForLoadState('networkidle');

      const wizard = reservationHelper.wizard;

      // Select Birthday event type via Radix Select
      await wizard.selectByLabel('Typ wydarzenia', 'Urodziny');

      // Birthday age field should appear
      await expect(authenticatedPage.locator('input[name="birthdayAge"]')).toBeVisible();

      // Fill and verify
      await wizard.fillInput('birthdayAge', '10');
      const value = await authenticatedPage.inputValue('input[name="birthdayAge"]');
      expect(value).toBe('10');
    });

    test('should show conditional fields for Anniversary event type', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      await authenticatedPage.waitForLoadState('networkidle');

      const wizard = reservationHelper.wizard;

      // Select Anniversary event type
      await wizard.selectByLabel('Typ wydarzenia', 'Rocznica');

      // Anniversary fields should appear
      await expect(authenticatedPage.locator('input[name="anniversaryType"]')).toBeVisible();
      await expect(authenticatedPage.locator('input[name="anniversaryYears"]')).toBeVisible();
    });

    test('should validate per-step — cannot advance without required fields', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      await authenticatedPage.waitForLoadState('networkidle');

      // Try to click "Dalej" without selecting event type
      await authenticatedPage.getByRole('button', { name: /Dalej/i }).click();

      // Should show validation error, not advance to step 1
      // The step should remain at 0 (event type is required)
      await expect(authenticatedPage.getByText(/Typ wydarzenia/i).first()).toBeVisible();

      // Error indicator should be present
      await expect(
        authenticatedPage.locator('.text-red-500, .text-destructive, [role="alert"]').first()
      ).toBeVisible({ timeout: 3000 });
    });

    test('should navigate back and forth between steps', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      await authenticatedPage.waitForLoadState('networkidle');

      const wizard = reservationHelper.wizard;

      // Step 0 → select event type
      await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
      await wizard.nextStep();

      // Now on Step 1 — "Sala" should be visible
      await expect(authenticatedPage.getByText(/Sala/i).first()).toBeVisible();

      // Go back to Step 0
      await wizard.prevStep();

      // "Typ wydarzenia" should still be visible with selection preserved
      await expect(authenticatedPage.getByText(/Typ wydarzenia/i).first()).toBeVisible();
    });

    test('should auto-fill end time (start + 6h)', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      await authenticatedPage.waitForLoadState('networkidle');

      const wizard = reservationHelper.wizard;

      // Complete step 0
      await wizard.selectByLabel('Typ wydarzenia', 'Wesele');
      await wizard.nextStep();

      // Select hall and time
      await wizard.selectByLabel('Sala', 'Sala Główna');
      await wizard.nextMonth();
      await wizard.selectDate(15);
      await wizard.selectTime('Godzina rozpoczęcia', '14:00');

      // End time should auto-fill to 20:00 (14:00 + 6h)
      await expect(authenticatedPage.getByText('20:00')).toBeVisible({ timeout: 3000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // READ/LIST — unchanged (list page not affected by wizard redesign)
  // ═══════════════════════════════════════════════════════════════════

  test.describe('Read/List Reservations', () => {
    test.beforeEach(async () => {
      await reservationHelper.createViaAPI({
        ...TEST_RESERVATIONS.pending,
        date: getFutureDate(30),
      });
      await reservationHelper.createViaAPI({
        ...TEST_RESERVATIONS.confirmed,
        date: getFutureDate(45),
      });
    });

    test('should display list of reservations', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      const count = await reservationHelper.getCount();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('should filter by status', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      await reservationHelper.applyFilters({ status: 'PENDING' });

      const statuses = await authenticatedPage.locator('[data-testid="status-badge"]').allTextContents();
      statuses.forEach(status => {
        expect(status).toContain('PENDING');
      });
    });

    test('should open details modal', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      await authenticatedPage.click('[data-testid="reservation-item"]:first-child');
      await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════

  test.describe('Update Reservation', () => {
    let reservationId: string;

    test.beforeEach(async () => {
      const reservation = await reservationHelper.createViaAPI({
        ...TEST_RESERVATIONS.pending,
        date: getFutureDate(30),
      });
      reservationId = reservation.id;
    });

    test('should edit reservation with reason', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.edit(
        reservationId,
        { adults: 90, notes: 'Updated notes' },
        'Klient zmienił liczbę gości'
      );

      await reservationHelper.viewDetails(reservationId);
      await expect(
        authenticatedPage.locator('[data-testid="guest-count"]')
      ).toContainText('90');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE/CANCEL
  // ═══════════════════════════════════════════════════════════════════

  test.describe('Delete/Cancel Reservation', () => {
    let reservationId: string;

    test.beforeEach(async () => {
      const reservation = await reservationHelper.createViaAPI({
        ...TEST_RESERVATIONS.pending,
        date: getFutureDate(30),
      });
      reservationId = reservation.id;
    });

    test('should cancel reservation with reason', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      await reservationHelper.cancel(reservationId, 'Klient zrezygnował');

      const status = await reservationHelper.getStatus(reservationId);
      expect(status).toContain('CANCELLED');
    });
  });
});
