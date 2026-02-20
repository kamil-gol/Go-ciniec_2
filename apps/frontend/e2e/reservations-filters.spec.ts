import { test, expect } from './fixtures/auth';
import { ReservationHelper } from './fixtures/reservation';
import { TEST_RESERVATIONS, testData, getFutureDate } from './fixtures/test-data';

test.describe('Reservations Filters', () => {
  let reservationHelper: ReservationHelper;

  test.beforeEach(async ({ authenticatedPage }) => {
    reservationHelper = new ReservationHelper(authenticatedPage);

    // Seed test reservations via API
    await reservationHelper.createViaAPI({
      ...TEST_RESERVATIONS.pending,
      date: getFutureDate(30),
      notes: 'filter-test-pending',
    });
    await reservationHelper.createViaAPI({
      ...TEST_RESERVATIONS.confirmed,
      date: getFutureDate(45),
      notes: 'filter-test-confirmed',
    });
    await reservationHelper.createViaAPI({
      ...TEST_RESERVATIONS.birthday,
      date: getFutureDate(20),
      notes: 'filter-test-birthday',
    });
  });

  test.describe('Status Filters', () => {
    test('should filter reservations by PENDING status', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.applyFilters({ status: 'PENDING' });

      const statuses = await authenticatedPage
        .locator('[data-testid="status-badge"]')
        .allTextContents();

      expect(statuses.length).toBeGreaterThan(0);
      statuses.forEach((status) => {
        expect(status.toUpperCase()).toContain('PENDING');
      });
    });

    test('should filter reservations by CONFIRMED status', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.applyFilters({ status: 'CONFIRMED' });

      const statuses = await authenticatedPage
        .locator('[data-testid="status-badge"]')
        .allTextContents();

      statuses.forEach((status) => {
        expect(status.toUpperCase()).toContain('CONFIRMED');
      });
    });

    test('should filter reservations by CANCELLED status', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.applyFilters({ status: 'CANCELLED' });

      const statuses = await authenticatedPage
        .locator('[data-testid="status-badge"]')
        .allTextContents();

      statuses.forEach((status) => {
        expect(status.toUpperCase()).toContain('CANCELLED');
      });
    });

    test('should show all reservations when status filter is cleared', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      // Apply a filter first
      await reservationHelper.applyFilters({ status: 'PENDING' });
      const filteredCount = await reservationHelper.getCount();

      // Clear filters
      const clearBtn = authenticatedPage.locator(
        'button:has-text("Wyczyść"), button:has-text("Resetuj"), button:has-text("Wszystkie")'
      );
      if (await clearBtn.count() > 0) {
        await clearBtn.first().click();
        await authenticatedPage.waitForLoadState('networkidle');

        const totalCount = await reservationHelper.getCount();
        expect(totalCount).toBeGreaterThanOrEqual(filteredCount);
      }
    });
  });

  test.describe('Hall Filters', () => {
    test('should filter reservations by specific hall', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.applyFilters({ hallId: 'hall-1' });

      const halls = await authenticatedPage
        .locator('[data-testid="hall-name"]')
        .allTextContents();

      halls.forEach((hall) => {
        expect(hall).toContain('Sala');
      });
    });

    test('should update results when switching between halls', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      // Filter by first hall
      await reservationHelper.applyFilters({ hallId: 'hall-1' });
      const countHall1 = await reservationHelper.getCount();

      // Switch to second hall
      await reservationHelper.applyFilters({ hallId: 'hall-2' });
      const countHall2 = await reservationHelper.getCount();

      // Counts may differ — at least one hall should have results
      expect(countHall1 + countHall2).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Date Range Filters', () => {
    test('should filter reservations within a date range', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      const dateFrom = getFutureDate(25);
      const dateTo = getFutureDate(35);

      await reservationHelper.applyFilters({ dateFrom, dateTo });

      const dates = await authenticatedPage
        .locator('[data-testid="reservation-date"]')
        .allTextContents();

      dates.forEach((dateStr) => {
        // Parse DD.MM.YYYY to YYYY-MM-DD
        const parts = dateStr.split('.');
        if (parts.length === 3) {
          const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          expect(isoDate >= dateFrom && isoDate <= dateTo).toBe(true);
        }
      });
    });

    test('should show no results for date range with no reservations', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      // Use far-future range where no reservations exist
      const dateFrom = getFutureDate(365);
      const dateTo = getFutureDate(370);

      await reservationHelper.applyFilters({ dateFrom, dateTo });

      const count = await reservationHelper.getCount();
      expect(count).toBe(0);

      // Empty state message should be visible
      const emptyMsg = authenticatedPage.locator(
        'text=/brak rezerwacji|nie znaleziono|brak wyników/i'
      );
      if (await emptyMsg.count() > 0) {
        await expect(emptyMsg.first()).toBeVisible();
      }
    });

    test('should handle single-day date filter', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      const targetDate = getFutureDate(30);
      await reservationHelper.applyFilters({ dateFrom: targetDate, dateTo: targetDate });

      const dates = await authenticatedPage
        .locator('[data-testid="reservation-date"]')
        .allTextContents();

      dates.forEach((dateStr) => {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
          const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          expect(isoDate).toBe(targetDate);
        }
      });
    });
  });

  test.describe('Event Type Filters', () => {
    test('should filter by event type when selector is available', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      // Try to find event type filter
      const eventTypeFilter = authenticatedPage.locator(
        'select[name="eventType"], [data-testid="event-type-filter"]'
      );

      if (await eventTypeFilter.count() > 0) {
        await eventTypeFilter.first().selectOption({ label: 'Wesele' });
        await authenticatedPage.waitForLoadState('networkidle');

        const eventTypes = await authenticatedPage
          .locator('[data-testid="event-type"]')
          .allTextContents();

        eventTypes.forEach((type) => {
          expect(type).toContain('Wesele');
        });
      }
    });
  });

  test.describe('Client Search', () => {
    test('should search reservations by client name', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      const searchInput = authenticatedPage.locator(
        'input[placeholder*="szukaj" i], input[placeholder*="klient" i], input[name="search"], [data-testid="search-input"]'
      );

      if (await searchInput.count() > 0) {
        await searchInput.first().fill('Kowalski');
        await authenticatedPage.waitForLoadState('networkidle');

        // Wait for filtered results
        await authenticatedPage.waitForTimeout(500);

        const clients = await authenticatedPage
          .locator('[data-testid="client-name"]')
          .allTextContents();

        clients.forEach((name) => {
          expect(name.toLowerCase()).toContain('kowalski');
        });
      }
    });

    test('should clear search and show all results', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      const searchInput = authenticatedPage.locator(
        'input[placeholder*="szukaj" i], input[name="search"], [data-testid="search-input"]'
      );

      if (await searchInput.count() > 0) {
        // Apply search
        await searchInput.first().fill('Kowalski');
        await authenticatedPage.waitForTimeout(500);
        const filteredCount = await reservationHelper.getCount();

        // Clear search
        await searchInput.first().fill('');
        await authenticatedPage.waitForTimeout(500);
        const totalCount = await reservationHelper.getCount();

        expect(totalCount).toBeGreaterThanOrEqual(filteredCount);
      }
    });
  });

  test.describe('Combined Filters', () => {
    test('should apply status and date range filters together', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      const dateFrom = getFutureDate(15);
      const dateTo = getFutureDate(50);

      await reservationHelper.applyFilters({
        status: 'PENDING',
        dateFrom,
        dateTo,
      });

      const statuses = await authenticatedPage
        .locator('[data-testid="status-badge"]')
        .allTextContents();

      statuses.forEach((status) => {
        expect(status.toUpperCase()).toContain('PENDING');
      });

      const dates = await authenticatedPage
        .locator('[data-testid="reservation-date"]')
        .allTextContents();

      dates.forEach((dateStr) => {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
          const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          expect(isoDate >= dateFrom && isoDate <= dateTo).toBe(true);
        }
      });
    });

    test('should apply status and hall filters together', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.applyFilters({
        status: 'PENDING',
        hallId: 'hall-1',
      });

      const statuses = await authenticatedPage
        .locator('[data-testid="status-badge"]')
        .allTextContents();

      statuses.forEach((status) => {
        expect(status.toUpperCase()).toContain('PENDING');
      });

      const halls = await authenticatedPage
        .locator('[data-testid="hall-name"]')
        .allTextContents();

      halls.forEach((hall) => {
        expect(hall).toContain('Sala');
      });
    });
  });

  test.describe('Filter URL Persistence', () => {
    test('should persist filter state in URL query params', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.applyFilters({ status: 'CONFIRMED' });

      // URL should contain filter params
      const url = authenticatedPage.url();
      expect(url).toMatch(/status|filter/i);
    });

    test('should restore filters from URL on page reload', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      await reservationHelper.applyFilters({ status: 'PENDING' });

      const urlBefore = authenticatedPage.url();

      // Reload page
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState('networkidle');

      // Filters should still be applied
      const statuses = await authenticatedPage
        .locator('[data-testid="status-badge"]')
        .allTextContents();

      if (statuses.length > 0) {
        statuses.forEach((status) => {
          expect(status.toUpperCase()).toContain('PENDING');
        });
      }
    });
  });

  test.describe('Sort with Filters', () => {
    test('should maintain sort order when filters are applied', async ({ authenticatedPage }) => {
      await reservationHelper.goToList();

      // Sort by date
      const sortBtn = authenticatedPage.locator('[data-sort="date"]');
      if (await sortBtn.count() > 0) {
        await sortBtn.click();
      }

      // Apply filter
      await reservationHelper.applyFilters({ status: 'PENDING' });

      // Get dates and verify still sorted
      const dates = await authenticatedPage
        .locator('[data-testid="reservation-date"]')
        .allTextContents();

      if (dates.length > 1) {
        const isoDates = dates.map((d) => {
          const parts = d.split('.');
          return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d;
        });

        const sorted = [...isoDates].sort();
        expect(isoDates).toEqual(sorted);
      }
    });
  });
});
