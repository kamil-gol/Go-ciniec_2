import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { createReservation } from './fixtures/reservation';
import { addToQueue } from './fixtures/queue';

test.describe('Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Reservation Validations', () => {
    test('should validate required fields in create form', async ({ page }) => {
      await page.goto('/reservations/new');

      // Try to submit without filling fields
      await page.click('button:has-text("Utwórz Rezerwację")');

      // Check validation messages
      await expect(page.locator('text=Pole wymagane').first()).toBeVisible();
      await expect(page.locator('text=Wybierz salę')).toBeVisible();
      await expect(page.locator('text=Wybierz klienta')).toBeVisible();
      await expect(page.locator('text=Wybierz typ wydarzenia')).toBeVisible();
    });

    test('should validate date is not in past', async ({ page }) => {
      await page.goto('/reservations/new');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await page.fill('input[name="date"]', yesterdayStr);
      await page.blur('input[name="date"]');

      await expect(page.locator('text=Data nie może być w przeszłości')).toBeVisible();
    });

    test('should validate guest count does not exceed hall capacity', async ({ page }) => {
      await page.goto('/reservations/new');

      // Select hall with capacity 40
      await page.selectOption('select[name="hallId"]', { label: 'Sala Kryształowa' });

      // Try to enter 50 guests (exceeds capacity)
      await page.fill('input[name="totalGuests"]', '50');
      await page.blur('input[name="totalGuests"]');

      await expect(page.locator('text=Liczba gości przekracza pojemność sali')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/clients/new');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.blur('input[name="email"]');

      await expect(page.locator('text=Nieprawidłowy format email')).toBeVisible();
    });

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/clients/new');

      await page.fill('input[name="phone"]', '123'); // Too short
      await page.blur('input[name="phone"]');

      await expect(page.locator('text=Nieprawidłowy numer telefonu')).toBeVisible();
    });

    test('should validate deposit amount range', async ({ page }) => {
      await page.goto('/reservations/new');

      // Enable deposit
      await page.check('input[name="hasDeposit"]');

      // Try negative amount
      await page.fill('input[name="depositAmount"]', '-100');
      await page.blur('input[name="depositAmount"]');

      await expect(page.locator('text=Kwota musi być dodatnia')).toBeVisible();

      // Try amount > 100%
      await page.fill('input[name="depositAmount"]', '150');
      await page.blur('input[name="depositAmount"]');

      await expect(page.locator('text=Kwota nie może przekraczać 100%')).toBeVisible();
    });

    test('should validate deposit due date is before reservation date', async ({ page }) => {
      await page.goto('/reservations/new');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dayAfterStr = dayAfterTomorrow.toISOString().split('T')[0];

      // Set reservation date to tomorrow
      await page.fill('input[name="date"]', tomorrowStr);

      // Enable deposit
      await page.check('input[name="hasDeposit"]');

      // Set due date to day after reservation
      await page.fill('input[name="depositDueDate"]', dayAfterStr);
      await page.blur('input[name="depositDueDate"]');

      await expect(page.locator('text=Termin zapłaty musi być przed datą rezerwacji')).toBeVisible();
    });
  });

  test.describe('Queue Validations', () => {
    test('should validate required fields in queue form', async ({ page }) => {
      await page.goto('/queue/new');

      // Try to submit without filling
      await page.click('button:has-text("Dodaj do Kolejki")');

      await expect(page.locator('text=Pole wymagane').first()).toBeVisible();
      await expect(page.locator('text=Wybierz klienta')).toBeVisible();
      await expect(page.locator('text=Wybierz datę')).toBeVisible();
    });

    test('should validate position is within valid range', async ({ page }) => {
      await page.goto('/queue');

      // Assume 3 items in queue
      await page.click('[data-testid="queue-item-1"]');
      await page.click('button:has-text("Przenieś do pozycji")');

      // Try invalid position
      await page.fill('input[name="position"]', '999');
      await page.click('button:has-text("Zapisz")');

      await expect(page.locator('text=Pozycja musi być w zakresie')).toBeVisible();
    });

    test('should validate queue date is not in past', async ({ page }) => {
      await page.goto('/queue/new');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await page.fill('input[name="reservationQueueDate"]', yesterdayStr);
      await page.blur('input[name="reservationQueueDate"]');

      await expect(page.locator('text=Data nie może być w przeszłości')).toBeVisible();
    });
  });

  test.describe('Conditional Field Validations', () => {
    test('should show birthday age field for Urodziny event type', async ({ page }) => {
      await page.goto('/reservations/new');

      // Select Urodziny
      await page.selectOption('select[name="eventTypeId"]', { label: 'Urodziny' });

      // Birthday age field should appear and be required
      await expect(page.locator('input[name="birthdayAge"]')).toBeVisible();

      // Try to submit without filling
      await page.click('button:has-text("Utwórz Rezerwację")');
      await expect(page.locator('text=Pole wymagane')).toBeVisible();
    });

    test('should show anniversary fields for Rocznica event type', async ({ page }) => {
      await page.goto('/reservations/new');

      // Select Rocznica
      await page.selectOption('select[name="eventTypeId"]', { label: 'Rocznica' });

      // Anniversary fields should appear
      await expect(page.locator('input[name="anniversaryYears"]')).toBeVisible();
      await expect(page.locator('input[name="anniversaryType"]')).toBeVisible();
    });

    test('should show custom event field for Inne event type', async ({ page }) => {
      await page.goto('/reservations/new');

      // Select Inne
      await page.selectOption('select[name="eventTypeId"]', { label: 'Inne' });

      // Custom event field should appear and be required
      await expect(page.locator('input[name="customEventName"]')).toBeVisible();

      // Try to submit without filling
      await page.click('button:has-text("Utwórz Rezerwację")');
      await expect(page.locator('text=Pole wymagane')).toBeVisible();
    });
  });

  test.describe('Price Calculation Validations', () => {
    test('should calculate price correctly', async ({ page }) => {
      await page.goto('/reservations/new');

      // Select hall with price 250 PLN per person
      await page.selectOption('select[name="hallId"]', { label: 'Sala Kryształowa' });

      // Enter 10 guests
      await page.fill('input[name="adultsCount"]', '10');

      // Price should be 10 * 250 = 2500 PLN
      await expect(page.locator('[data-testid="calculated-price"]')).toContainText('2500');
    });

    test('should add extra hours charge', async ({ page }) => {
      await page.goto('/reservations/new');

      // Select hall
      await page.selectOption('select[name="hallId"]', { label: 'Sala Kryształowa' });
      await page.fill('input[name="adultsCount"]', '10');

      // Set duration > 6 hours
      await page.fill('input[name="startTime"]', '18:00');
      await page.fill('input[name="endTime"]', '02:00'); // 8 hours

      // Should show extra hours note
      await expect(page.locator('text=2 godziny dodatkowe')).toBeVisible();
    });
  });

  test.describe('Guest Count Split Validations', () => {
    test('should validate total guests matches sum of age groups', async ({ page }) => {
      await page.goto('/reservations/new');

      await page.fill('input[name="adultsCount"]', '10');
      await page.fill('input[name="children4to12Count"]', '5');
      await page.fill('input[name="children0to3Count"]', '3');

      // Total should be 18
      await expect(page.locator('[data-testid="total-guests"]')).toContainText('18');
    });

    test('should not allow negative guest counts', async ({ page }) => {
      await page.goto('/reservations/new');

      await page.fill('input[name="adultsCount"]', '-5');
      await page.blur('input[name="adultsCount"]');

      await expect(page.locator('text=Wartość musi być dodatnia')).toBeVisible();
    });
  });

  test.describe('Edit Reason Validations', () => {
    test('should require reason when editing reservation', async ({ page }) => {
      await page.goto('/reservations');

      // Click edit on first reservation
      await page.click('[data-testid="edit-button"]').first();

      // Change something
      await page.fill('input[name="adultsCount"]', '20');

      // Try to save without reason
      await page.click('button:has-text("Zapisz Zmiany")');

      await expect(page.locator('text=Powód zmiany jest wymagany')).toBeVisible();
    });

    test('should require reason when cancelling reservation', async ({ page }) => {
      await page.goto('/reservations');

      // Click cancel on first reservation
      await page.click('[data-testid="cancel-button"]').first();

      // Try to confirm without reason
      await page.click('button:has-text("Potwierdź Anulowanie")');

      await expect(page.locator('text=Powód anulowania jest wymagany')).toBeVisible();
    });
  });
});
