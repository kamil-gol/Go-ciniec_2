import { test, expect } from './fixtures/auth';
import { QueueHelper } from './fixtures/queue';
import { ReservationHelper } from './fixtures/reservation';
import { getFutureDate } from './fixtures/test-data';

test.describe('Queue - Promotion to Full Reservation', () => {
  let queueHelper: QueueHelper;
  let reservationHelper: ReservationHelper;
  const testDate = getFutureDate(20);

  test.beforeEach(async ({ authenticatedPage }) => {
    queueHelper = new QueueHelper(authenticatedPage);
    reservationHelper = new ReservationHelper(authenticatedPage);
  });

  test.describe('Basic Promotion', () => {
    test('should promote queue entry to full reservation', async ({ authenticatedPage }) => {
      // Add entry to queue
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 60,
        children: 15,
        babies: 5,
        notes: 'Queue entry to promote',
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Promote
      await queueHelper.promoteToReservation(
        entry.id,
        'hall-1',
        '18:00',
        '23:00'
      );

      // Verify success message
      await expect(
        authenticatedPage.locator('.toast-success')
      ).toContainText('Rezerwacja utworzona');

      // Verify entry removed from queue
      const stillInQueue = await queueHelper.entryExists(entry.id);
      expect(stillInQueue).toBe(false);

      // Verify appears in reservations list
      await reservationHelper.goToList();
      await expect(
        authenticatedPage.locator(`text=${entry.notes}`)
      ).toBeVisible();
    });

    test('should pre-fill form with queue entry data', async ({ authenticatedPage }) => {
      // Add entry with specific data
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 50,
        children: 10,
        babies: 3,
        eventTypeId: 'event-2', // Birthday
        birthdayAge: 18,
        notes: 'Birthday party',
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Click promote
      await authenticatedPage.click(
        `[data-queue-entry-id="${entry.id}"] button:has-text("Awansuj")`
      );

      // Wait for form
      await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();

      // Verify pre-filled data
      const adults = await authenticatedPage.inputValue('input[name="adults"]');
      expect(adults).toBe('50');

      const children = await authenticatedPage.inputValue('input[name="children"]');
      expect(children).toBe('10');

      const babies = await authenticatedPage.inputValue('input[name="babies"]');
      expect(babies).toBe('3');

      const birthdayAge = await authenticatedPage.inputValue('input[name="birthdayAge"]');
      expect(birthdayAge).toBe('18');

      const notes = await authenticatedPage.inputValue('textarea[name="notes"]');
      expect(notes).toContain('Birthday party');
    });

    test('should require additional fields for full reservation', async ({ authenticatedPage }) => {
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 60,
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Open promotion form
      await authenticatedPage.click(
        `[data-queue-entry-id="${entry.id}"] button:has-text("Awansuj")`
      );

      // Try to submit without filling required fields (hall, times)
      await authenticatedPage.click('button:has-text("Utwórz rezerwację")');

      // Should show validation errors
      await expect(
        authenticatedPage.locator('select[name="hallId"] + .error')
      ).toBeVisible();
      await expect(
        authenticatedPage.locator('input[name="startTime"] + .error')
      ).toBeVisible();
      await expect(
        authenticatedPage.locator('input[name="endTime"] + .error')
      ).toBeVisible();
    });
  });

  test.describe('Status Transition', () => {
    test('should change status from RESERVED to PENDING', async ({ authenticatedPage }) => {
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 60,
        notes: 'Status transition test',
      });

      // Verify initial status
      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      const initialStatus = await authenticatedPage
        .locator(`[data-queue-entry-id="${entry.id}"] [data-testid="status-badge"]`)
        .textContent();
      expect(initialStatus).toContain('RESERVED');

      // Promote
      await queueHelper.promoteToReservation(
        entry.id,
        'hall-1',
        '18:00',
        '23:00'
      );

      // Check new status in reservations
      await reservationHelper.goToList();
      
      // Find the created reservation
      const reservation = authenticatedPage.locator(
        `text=${entry.notes}`
      ).locator('..');
      
      const newStatus = await reservation
        .locator('[data-testid="status-badge"]')
        .textContent();
      
      expect(newStatus).toContain('PENDING');
    });

    test('should optionally set status to CONFIRMED on promotion', async ({ authenticatedPage }) => {
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 60,
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Open promotion form
      await authenticatedPage.click(
        `[data-queue-entry-id="${entry.id}"] button:has-text("Awansuj")`
      );

      // Fill required fields
      await authenticatedPage.selectOption('select[name="hallId"]', 'hall-1');
      await authenticatedPage.fill('input[name="startTime"]', '18:00');
      await authenticatedPage.fill('input[name="endTime"]', '23:00');

      // Select CONFIRMED status
      await authenticatedPage.selectOption('select[name="status"]', 'CONFIRMED');

      // Submit
      await authenticatedPage.click('button:has-text("Utwórz rezerwację")');

      // Verify CONFIRMED status
      await reservationHelper.goToList();
      await reservationHelper.applyFilters({ status: 'CONFIRMED' });

      const count = await reservationHelper.getCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Position Recalculation', () => {
    test('should recalculate positions after promotion', async ({ authenticatedPage }) => {
      // Create 3 entries
      const entry1 = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 50,
        notes: 'Entry 1',
      });
      await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 60,
        notes: 'Entry 2',
      });
      await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 70,
        notes: 'Entry 3',
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Verify initial positions [1, 2, 3]
      const initialPositions = await queueHelper.getAllPositions(testDate);
      expect(initialPositions).toEqual([1, 2, 3]);

      // Promote entry 1 (position 1)
      await queueHelper.promoteToReservation(
        entry1.id,
        'hall-1',
        '18:00',
        '23:00'
      );

      // Reload queue
      await queueHelper.getEntriesForDate(testDate);

      // Remaining entries should be [1, 2] (recalculated from [2, 3])
      const newPositions = await queueHelper.getAllPositions(testDate);
      expect(newPositions).toEqual([1, 2]);
    });

    test('should recalculate when promoting middle entry', async ({ authenticatedPage }) => {
      // Create 5 entries
      await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 40,
        notes: 'Entry 1',
      });
      const entry2 = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 50,
        notes: 'Entry 2',
      });
      const entry3 = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 60,
        notes: 'Entry 3',
      });
      await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 70,
        notes: 'Entry 4',
      });
      await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 80,
        notes: 'Entry 5',
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Promote entry 2 and 3 (positions 2 and 3)
      await queueHelper.promoteToReservation(entry2.id, 'hall-1', '18:00', '23:00');
      await queueHelper.promoteToReservation(entry3.id, 'hall-2', '15:00', '20:00');

      // Reload
      await queueHelper.getEntriesForDate(testDate);

      // Remaining should be [1, 2, 3] (recalculated from [1, 4, 5])
      const positions = await queueHelper.getAllPositions(testDate);
      expect(positions).toEqual([1, 2, 3]);
    });
  });

  test.describe('Data Preservation', () => {
    test('should preserve conditional fields during promotion', async ({ authenticatedPage }) => {
      // Create birthday entry
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 50,
        eventTypeId: 'event-2', // Birthday
        birthdayAge: 21,
        notes: '21st birthday party',
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Promote
      await queueHelper.promoteToReservation(
        entry.id,
        'hall-1',
        '20:00',
        '02:00'
      );

      // View in reservations
      await reservationHelper.goToList();
      await authenticatedPage.click(`text=${entry.notes}`);

      // Modal should show birthday age
      await expect(
        authenticatedPage.locator('[data-testid="birthday-age"]')
      ).toContainText('21');
    });

    test('should preserve guest breakdown', async ({ authenticatedPage }) => {
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 60,
        children: 20,
        babies: 10,
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Promote
      await queueHelper.promoteToReservation(
        entry.id,
        'hall-2',
        '18:00',
        '23:00'
      );

      // View details
      await reservationHelper.goToList();
      await authenticatedPage.click('[data-testid="reservation-item"]:first-child');

      // Verify guest breakdown
      await expect(
        authenticatedPage.locator('[data-testid="adults-count"]')
      ).toContainText('60');
      await expect(
        authenticatedPage.locator('[data-testid="children-count"]')
      ).toContainText('20');
      await expect(
        authenticatedPage.locator('[data-testid="babies-count"]')
      ).toContainText('10');
    });
  });

  test.describe('Price Calculation on Promotion', () => {
    test('should calculate price based on selected hall', async ({ authenticatedPage }) => {
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 80,
        children: 15,
        babies: 5,
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Open promotion form
      await authenticatedPage.click(
        `[data-queue-entry-id="${entry.id}"] button:has-text("Awansuj")`
      );

      // Select hall (50 PLN per person)
      await authenticatedPage.selectOption('select[name="hallId"]', 'hall-1');

      // Fill times
      await authenticatedPage.fill('input[name="startTime"]', '18:00');
      await authenticatedPage.fill('input[name="endTime"]', '23:00');

      // Price should calculate: (80 + 15 + 5) * 50 = 5000 PLN
      await expect(
        authenticatedPage.locator('[data-testid="calculated-price"]')
      ).toContainText('5000');
    });

    test('should add extra hours charge if > 6 hours', async ({ authenticatedPage }) => {
      const entry = await queueHelper.addEntryViaAPI({
        reservationQueueDate: testDate,
        adults: 100,
      });

      await queueHelper.goToQueue();
      await queueHelper.getEntriesForDate(testDate);

      // Open promotion form
      await authenticatedPage.click(
        `[data-queue-entry-id="${entry.id}"] button:has-text("Awansuj")`
      );

      // Select hall
      await authenticatedPage.selectOption('select[name="hallId"]', 'hall-1');

      // Set 8 hour duration (18:00 - 02:00)
      await authenticatedPage.fill('input[name="startTime"]', '18:00');
      await authenticatedPage.fill('input[name="endTime"]', '02:00');

      // Should show extra hours note
      await expect(
        authenticatedPage.locator('[data-testid="extra-hours-note"]')
      ).toContainText('2 godziny dodatkowe');

      // Base: 100 * 50 = 5000
      // Extra: 2 hours * (price_per_hour)
      // Total should be > 5000
      const priceText = await authenticatedPage
        .locator('[data-testid="calculated-price"]')
        .textContent();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
      expect(price).toBeGreaterThan(5000);
    });
  });
});
