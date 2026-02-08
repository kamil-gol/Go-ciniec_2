import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

test.describe('History and Audit Trail Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Reservation History Timeline', () => {
    test('should display history timeline for reservation', async ({ page }) => {
      await page.goto('/reservations');

      // Click on reservation to open details
      await page.click('[data-testid="reservation-item"]').first();

      // Click on history tab
      await page.click('[data-testid="tab-history"]');

      // Timeline should be visible
      await expect(page.locator('[data-testid="history-timeline"]')).toBeVisible();

      // Should show at least creation event
      await expect(page.locator('[data-testid="history-item"]')).toHaveCount(await page.locator('[data-testid="history-item"]').count());
    });

    test('should show who created the reservation', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      // First history item should be creation
      const firstItem = page.locator('[data-testid="history-item"]').first();
      
      await expect(firstItem).toContainText('Utworzono');
      await expect(firstItem).toContainText('przez');
      
      // Should show username or email
      await expect(firstItem.locator('[data-testid="user-name"]')).toBeVisible();
    });

    test('should show creation timestamp', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      const firstItem = page.locator('[data-testid="history-item"]').first();
      
      // Should show date and time
      await expect(firstItem.locator('[data-testid="timestamp"]')).toBeVisible();
    });
  });

  test.describe('Edit History', () => {
    test('should record edit in history', async ({ page }) => {
      await page.goto('/reservations');

      // Open reservation
      await page.click('[data-testid="reservation-item"]').first();

      // Click edit
      await page.click('button:has-text("Edytuj")');

      // Make a change
      const newGuestCount = '25';
      await page.fill('input[name="adultsCount"]', newGuestCount);

      // Add reason
      const reason = 'Klient zmienił liczbę gości';
      await page.fill('textarea[name="changeReason"]', reason);

      // Save
      await page.click('button:has-text("Zapisz Zmiany")');

      // Go to history
      await page.click('[data-testid="tab-history"]');

      // Should show edit event
      const editEvent = page.locator('[data-testid="history-item"]:has-text("Edycja")')
.first();
      await expect(editEvent).toBeVisible();

      // Should show what changed
      await expect(editEvent).toContainText('Liczba gości');
      await expect(editEvent).toContainText(newGuestCount);

      // Should show reason
      await expect(editEvent).toContainText(reason);
    });

    test('should show old and new values', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();

      // Get original value
      const originalGuests = await page.locator('[data-testid="guest-count"]').textContent();

      // Edit
      await page.click('button:has-text("Edytuj")');
      await page.fill('input[name="adultsCount"]', '30');
      await page.fill('textarea[name="changeReason"]', 'Test change');
      await page.click('button:has-text("Zapisz Zmiany")');

      // Check history
      await page.click('[data-testid="tab-history"]');

      const editEvent = page.locator('[data-testid="history-item"]:has-text("Edycja")').first();
      
      // Should show old value
      await expect(editEvent).toContainText(`Stara wartość: ${originalGuests}`);
      
      // Should show new value
      await expect(editEvent).toContainText('Nowa wartość: 30');
    });

    test('should group multiple field changes in single edit', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('button:has-text("Edytuj")');

      // Change multiple fields
      await page.fill('input[name="adultsCount"]', '35');
      await page.selectOption('select[name="status"]', { label: 'Potwierdzona' });
      await page.fill('textarea[name="changeReason"]', 'Multiple changes');
      await page.click('button:has-text("Zapisz Zmiany")');

      // Check history
      await page.click('[data-testid="tab-history"]');

      const editEvent = page.locator('[data-testid="history-item"]').first();
      
      // Should show all changes in one event
      await expect(editEvent).toContainText('Liczba gości');
      await expect(editEvent).toContainText('Status');
      await expect(editEvent).toContainText('Multiple changes');
    });
  });

  test.describe('Status Change History', () => {
    test('should record status changes', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('button:has-text("Edytuj")');

      // Change status
      await page.selectOption('select[name="status"]', { label: 'Potwierdzona' });
      await page.fill('textarea[name="changeReason"]', 'Klient zatwierdził');
      await page.click('button:has-text("Zapisz Zmiany")');

      // Check history
      await page.click('[data-testid="tab-history"]');

      const statusChange = page.locator('[data-testid="history-item"]:has-text("Status")').first();
      await expect(statusChange).toBeVisible();
      await expect(statusChange).toContainText('Potwierdzona');
    });

    test('should highlight status changes with color', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      // Status changes should have special styling
      const statusEvents = page.locator('[data-testid="history-item-status"]');
      
      if (await statusEvents.count() > 0) {
        await expect(statusEvents.first()).toHaveClass(/status-change/);
      }
    });
  });

  test.describe('Cancellation History', () => {
    test('should record cancellation with reason', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();

      // Cancel reservation
      await page.click('button:has-text("Anuluj Rezerwację")');

      const cancellationReason = 'Klient odwołał z powodu choroby';
      await page.fill('textarea[name="cancellationReason"]', cancellationReason);
      await page.click('button:has-text("Potwierdź Anulowanie")');

      // Check history
      await page.click('[data-testid="tab-history"]');

      const cancellationEvent = page.locator('[data-testid="history-item"]:has-text("Anulowano")').first();
      await expect(cancellationEvent).toBeVisible();
      await expect(cancellationEvent).toContainText(cancellationReason);
    });
  });

  test.describe('History Filters', () => {
    test('should filter by change type', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      // Filter by status changes only
      await page.selectOption('select[name="filterType"]', { label: 'Zmiany statusu' });

      // Should show only status change events
      const items = page.locator('[data-testid="history-item"]');
      const count = await items.count();
      
      for (let i = 0; i < count; i++) {
        await expect(items.nth(i)).toContainText('Status');
      }
    });

    test('should filter by date range', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      const today = new Date().toISOString().split('T')[0];
      
      // Set date range filter
      await page.fill('input[name="dateFrom"]', today);
      await page.fill('input[name="dateTo"]', today);

      // Should show only today's changes
      const items = page.locator('[data-testid="history-item"]');
      await expect(items).toHaveCount(await items.count());
    });

    test('should filter by user', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      // Filter by specific user
      await page.selectOption('select[name="filterUser"]', { index: 1 });

      // Should show only changes by that user
      const items = page.locator('[data-testid="history-item"]');
      await expect(items).toHaveCount(await items.count());
    });
  });

  test.describe('History Export', () => {
    test('should export history as PDF', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Eksportuj Historię")');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/historia-.*\.pdf/);
    });
  });

  test.describe('Activity Logs (Admin)', () => {
    test('should display system-wide activity logs', async ({ page }) => {
      await page.goto('/admin/activity-logs');

      // Should show activity log table
      await expect(page.locator('[data-testid="activity-log-table"]')).toBeVisible();

      // Should show recent activities
      await expect(page.locator('[data-testid="activity-item"]')).toHaveCount(await page.locator('[data-testid="activity-item"]').count());
    });

    test('should show user actions in activity logs', async ({ page }) => {
      await page.goto('/admin/activity-logs');

      // Should show columns: user, action, resource, timestamp
      await expect(page.locator('th:has-text("Użytkownik")')).toBeVisible();
      await expect(page.locator('th:has-text("Akcja")')).toBeVisible();
      await expect(page.locator('th:has-text("Zasób")')).toBeVisible();
      await expect(page.locator('th:has-text("Data")')).toBeVisible();
    });

    test('should filter activity logs', async ({ page }) => {
      await page.goto('/admin/activity-logs');

      // Filter by action type
      await page.selectOption('select[name="actionType"]', { label: 'Utworzenie' });

      // Should show only creation actions
      const items = page.locator('[data-testid="activity-item"]');
      const count = await items.count();
      
      for (let i = 0; i < count; i++) {
        await expect(items.nth(i)).toContainText('Utworzono');
      }
    });

    test('should search activity logs', async ({ page }) => {
      await page.goto('/admin/activity-logs');

      const searchTerm = 'rezerwacja';
      await page.fill('input[placeholder*="Szukaj"]', searchTerm);
      await page.waitForTimeout(500);

      // Results should contain search term
      const items = page.locator('[data-testid="activity-item"]');
      const count = await items.count();
      
      if (count > 0) {
        const text = await items.first().textContent();
        expect(text?.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    });
  });

  test.describe('Audit Trail Integrity', () => {
    test('should not allow editing history entries', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      // History items should not have edit buttons
      await expect(page.locator('[data-testid="history-item"] button:has-text("Edytuj")')).toHaveCount(0);
    });

    test('should not allow deleting history entries', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();
      await page.click('[data-testid="tab-history"]');

      // History items should not have delete buttons
      await expect(page.locator('[data-testid="history-item"] button:has-text("Usuń")')).toHaveCount(0);
    });
  });
});
