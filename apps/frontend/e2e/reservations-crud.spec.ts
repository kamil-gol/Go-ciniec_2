import { test, expect } from './fixtures/auth';
import { ReservationHelper } from './fixtures/reservation';
import { TEST_RESERVATIONS, TEST_HALLS, getFutureDate } from './fixtures/test-data';

test.describe('Reservations CRUD', () => {
  let reservationHelper: ReservationHelper;

  test.beforeEach(async ({ authenticatedPage }) => {
    reservationHelper = new ReservationHelper(authenticatedPage);
  });

  test.describe('Create Reservation', () => {
    test('should create basic reservation with all required fields', async ({ authenticatedPage }) => {
      const data = {
        ...TEST_RESERVATIONS.pending,
        date: getFutureDate(30),
      };

      await reservationHelper.createViaUI(data);

      // Verify redirect to list
      await expect(authenticatedPage).toHaveURL('/reservations');
      
      // Verify reservation appears in list
      await expect(
        authenticatedPage.locator(`text=${data.notes}`)
      ).toBeVisible();
    });

    test('should show conditional fields for Birthday event type', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      
      // Select Birthday event type
      await authenticatedPage.selectOption('select[name="eventTypeId"]', 'event-2');
      
      // Birthday age field should appear
      await expect(
        authenticatedPage.locator('input[name="birthdayAge"]')
      ).toBeVisible();
      
      // Fill and verify
      await authenticatedPage.fill('input[name="birthdayAge"]', '10');
      
      const value = await authenticatedPage.inputValue('input[name="birthdayAge"]');
      expect(value).toBe('10');
    });

    test('should show conditional fields for Anniversary event type', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      
      // Select Anniversary event type
      await authenticatedPage.selectOption('select[name="eventTypeId"]', 'event-3');
      
      // Anniversary fields should appear
      await expect(
        authenticatedPage.locator('input[name="anniversaryType"]')
      ).toBeVisible();
      await expect(
        authenticatedPage.locator('input[name="anniversaryYears"]')
      ).toBeVisible();
    });

    test('should calculate price in real-time', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      
      // Select hall (50 PLN per person)
      await authenticatedPage.selectOption('select[name="hallId"]', 'hall-1');
      
      // Fill guest numbers: 80 adults + 15 children + 5 babies = 100 guests
      await authenticatedPage.fill('input[name="adults"]', '80');
      await authenticatedPage.fill('input[name="children"]', '15');
      await authenticatedPage.fill('input[name="babies"]', '5');
      
      // Price should be: 100 guests * 50 PLN = 5000 PLN
      await reservationHelper.verifyPriceCalculation(5000);
    });

    test('should validate guest numbers against hall capacity', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      
      // Select hall with capacity 50
      await authenticatedPage.selectOption('select[name="hallId"]', 'hall-3');
      
      // Try to add more guests than capacity (51 adults)
      await authenticatedPage.fill('input[name="adults"]', '51');
      await authenticatedPage.fill('input[name="children"]', '0');
      await authenticatedPage.fill('input[name="babies"]', '0');
      
      // Submit
      await authenticatedPage.click('button[type="submit"]');
      
      // Should show error
      await expect(
        authenticatedPage.locator('.error-message')
      ).toContainText('przekracza pojemność sali');
    });

    test('should validate date is not in the past', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      
      // Fill with past date
      await authenticatedPage.fill('input[name="date"]', '2020-01-01');
      await authenticatedPage.click('button[type="submit"]');
      
      // Should show error
      await expect(
        authenticatedPage.locator('.error-message')
      ).toContainText('Data nie może być w przeszłości');
    });

    test('should validate required fields', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/reservations/new');
      
      // Try to submit without filling fields
      await authenticatedPage.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(authenticatedPage.locator('.field-error')).toHaveCount(7); // All required fields
    });
  });

  test.describe('Read/List Reservations', () => {
    test.beforeEach(async () => {
      // Create test reservations via API
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
      
      // Should have at least 2 reservations
      const count = await reservationHelper.getCount();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('should filter by status', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      // Filter by PENDING
      await reservationHelper.applyFilters({ status: 'PENDING' });
      
      // All visible reservations should have PENDING status
      const statuses = await authenticatedPage.locator('[data-testid="status-badge"]').allTextContents();
      statuses.forEach(status => {
        expect(status).toContain('PENDING');
      });
    });

    test('should filter by hall', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      // Filter by specific hall
      await reservationHelper.applyFilters({ hallId: 'hall-1' });
      
      // Verify filtered results
      const halls = await authenticatedPage.locator('[data-testid="hall-name"]').allTextContents();
      halls.forEach(hall => {
        expect(hall).toContain('Sala Główna');
      });
    });

    test('should filter by date range', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      const dateFrom = getFutureDate(25);
      const dateTo = getFutureDate(35);
      
      await reservationHelper.applyFilters({ dateFrom, dateTo });
      
      // Should show only reservations in range
      const dates = await authenticatedPage.locator('[data-testid="reservation-date"]').allTextContents();
      dates.forEach(dateStr => {
        const [day, month, year] = dateStr.split('.');
        const date = `${year}-${month}-${day}`;
        expect(date >= dateFrom && date <= dateTo).toBe(true);
      });
    });

    test('should paginate results', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      // Check if pagination controls exist
      await expect(authenticatedPage.locator('[data-testid="pagination"]')).toBeVisible();
      
      // Click next page
      await authenticatedPage.click('button:has-text("Następna")');
      
      // URL should include page param
      await expect(authenticatedPage).toHaveURL(/page=2/);
    });

    test('should sort by date', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      // Click sort by date
      await authenticatedPage.click('[data-sort="date"]');
      
      // Get all dates
      const dates = await authenticatedPage.locator('[data-testid="reservation-date"]').allTextContents();
      
      // Verify sorted
      const datesArray = dates.map(d => {
        const [day, month, year] = d.split('.');
        return `${year}-${month}-${day}`;
      });
      
      const sorted = [...datesArray].sort();
      expect(datesArray).toEqual(sorted);
    });

    test('should open details modal', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      // Click first reservation
      await authenticatedPage.click('[data-testid="reservation-item"]:first-child');
      
      // Modal should open
      await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();
      
      // Should show all details
      await expect(authenticatedPage.locator('[data-testid="client-name"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="hall-name"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="event-type"]')).toBeVisible();
    });
  });

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
      
      // Edit reservation
      await reservationHelper.edit(
        reservationId,
        {
          adults: 90,
          notes: 'Updated notes',
        },
        'Klient zmienił liczbę gości'
      );
      
      // Verify changes
      await reservationHelper.viewDetails(reservationId);
      await expect(
        authenticatedPage.locator('[data-testid="guest-count"]')
      ).toContainText('90');
    });

    test('should require reason for edits', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      // Open edit modal
      await authenticatedPage.click(`[data-reservation-id="${reservationId}"] button:has-text("Edytuj")`);
      
      // Change something
      await authenticatedPage.fill('input[name="adults"]', '90');
      
      // Try to submit without reason
      await authenticatedPage.click('button[type="submit"]');
      
      // Should show error
      await expect(
        authenticatedPage.locator('textarea[name="reason"] + .error')
      ).toContainText('Powód zmiany jest wymagany');
    });

    test('should preserve conditional fields when editing', async ({ authenticatedPage }) => {
      // Create birthday reservation
      const birthday = await reservationHelper.createViaAPI({
        ...TEST_RESERVATIONS.confirmed,
        date: getFutureDate(35),
      });
      
      await reservationHelper.goToList();
      
      // Open edit
      await authenticatedPage.click(`[data-reservation-id="${birthday.id}"] button:has-text("Edytuj")`);
      
      // Birthday age field should be visible and pre-filled
      await expect(
        authenticatedPage.locator('input[name="birthdayAge"]')
      ).toBeVisible();
      
      const value = await authenticatedPage.inputValue('input[name="birthdayAge"]');
      expect(value).toBe('10');
    });
  });

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
      
      // Cancel
      await reservationHelper.cancel(reservationId, 'Klient zrezygnował');
      
      // Verify status changed
      const status = await reservationHelper.getStatus(reservationId);
      expect(status).toContain('CANCELLED');
    });

    test('should require cancellation reason', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      // Open cancel modal
      await authenticatedPage.click(`[data-reservation-id="${reservationId}"] button:has-text("Anuluj")`);
      
      // Try to confirm without reason
      await authenticatedPage.click('button:has-text("Potwierdź anulowanie")');
      
      // Should show error
      await expect(
        authenticatedPage.locator('textarea[name="cancellationReason"] + .error')
      ).toContainText('Powód anulowania jest wymagany');
    });

    test('should save cancellation reason in history', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();
      
      const reason = 'Klient zmienił plany';
      await reservationHelper.cancel(reservationId, reason);
      
      // Open details
      await reservationHelper.viewDetails(reservationId);
      
      // Go to history tab
      await authenticatedPage.click('[data-tab="history"]');
      
      // Should show cancellation reason
      await expect(
        authenticatedPage.locator('[data-testid="history-item"]:first-child')
      ).toContainText(reason);
    });
  });
});
