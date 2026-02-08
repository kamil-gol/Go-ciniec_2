import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';
import {
  goToQueue,
  clickAddToQueue,
  fillQueueForm,
  submitQueueForm,
  createQueueEntry,
  getQueueItems,
  getQueueItemPosition,
  editQueueEntry,
  deleteQueueEntry,
  getQueueStats,
} from './fixtures/queue';
import {
  TEST_QUEUE_ENTRIES,
  getFutureDate,
} from './fixtures/test-data';

test.describe('Queue - Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('Create Queue Entry', () => {
    test('should add entry to queue', async ({ page }) => {
      const testData = {
        ...TEST_QUEUE_ENTRIES[0],
        date: getFutureDate(15),
      };

      await createQueueEntry(page, testData);

      // Verify success
      await expect(page.locator('.toast-success')).toContainText(/dodano/i);

      // Verify entry appears in queue
      await goToQueue(page);
      const items = await getQueueItems(page, testData.date);
      await expect(items.first()).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await goToQueue(page);
      await clickAddToQueue(page);

      // Try to submit without filling anything
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('select[name="clientId"]')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      await expect(page.locator('input[name="date"]')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      await expect(page.locator('input[name="guests"]')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
    });

    test('should auto-assign position', async ({ page }) => {
      const testDate = getFutureDate(20);

      // Create first entry
      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[0],
        date: testDate,
      });

      // Create second entry for same date
      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[1],
        date: testDate,
      });

      // Verify positions
      await goToQueue(page);
      const items = await getQueueItems(page, testDate);

      const count = await items.count();
      expect(count).toBe(2);

      // Verify sequential positions
      for (let i = 0; i < count; i++) {
        const position = await items.nth(i).locator('[data-testid="position"]').textContent();
        expect(parseInt(position || '0')).toBe(i + 1);
      }
    });

    test('should validate guests is positive number', async ({ page }) => {
      await goToQueue(page);
      await clickAddToQueue(page);

      await fillQueueForm(page, {
        clientId: 'test-client-1',
        date: getFutureDate(10),
        guests: -5, // Invalid
      });

      await page.click('button[type="submit"]');

      // Should show error
      await expect(page.locator('.error-message')).toContainText(/dodatnia|positive/i);
    });
  });

  test.describe('Read Queue', () => {
    test('should display queue grouped by dates', async ({ page }) => {
      await goToQueue(page);

      // Should show date sections
      await expect(page.locator('[data-testid="date-section"]').first()).toBeVisible();
    });

    test('should show queue statistics', async ({ page }) => {
      const testDate = getFutureDate(25);

      // Create some entries
      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[0],
        date: testDate,
        guests: 50,
      });

      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[1],
        date: testDate,
        guests: 40,
      });

      // Check stats
      await goToQueue(page);
      const stats = await getQueueStats(page, testDate);

      expect(stats.itemCount).toBe(2);
      expect(stats.guestCount).toBe(90); // 50 + 40
    });

    test('should show position badges', async ({ page }) => {
      const testDate = getFutureDate(30);

      // Create entries
      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[0],
        date: testDate,
      });

      await goToQueue(page);
      const items = await getQueueItems(page, testDate);

      // Should have position badge
      await expect(items.first().locator('[data-testid="position"]')).toBeVisible();
      await expect(items.first().locator('[data-testid="position"]')).toContainText('1');
    });

    test('should display client and guest info', async ({ page }) => {
      const testDate = getFutureDate(35);

      await createQueueEntry(page, {
        clientId: 'test-client-1',
        date: testDate,
        guests: 45,
      });

      await goToQueue(page);
      const item = (await getQueueItems(page, testDate)).first();

      // Should show client name
      await expect(item).toContainText('Kowalski');

      // Should show guest count
      await expect(item).toContainText('45');
    });
  });

  test.describe('Update Queue Entry', () => {
    test('should edit queue entry', async ({ page }) => {
      const testDate = getFutureDate(40);

      // Create entry
      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[0],
        date: testDate,
      });

      await goToQueue(page);
      const items = await getQueueItems(page, testDate);
      const itemId = await items.first().getAttribute('data-id');

      // Edit it
      await editQueueEntry(page, itemId!, {
        guests: 60,
        notes: 'Zaktualizowana liczba gości',
      });

      // Verify update
      await expect(page.locator('.toast-success')).toContainText(/zaktualizowano/i);
    });

    test('should change queue entry date', async ({ page }) => {
      const oldDate = getFutureDate(45);
      const newDate = getFutureDate(50);

      // Create entry
      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[0],
        date: oldDate,
      });

      await goToQueue(page);
      const items = await getQueueItems(page, oldDate);
      const itemId = await items.first().getAttribute('data-id');

      // Change date
      await editQueueEntry(page, itemId!, {
        date: newDate,
      });

      // Should appear in new date section
      await goToQueue(page);
      const newDateItems = await getQueueItems(page, newDate);
      await expect(newDateItems.first()).toBeVisible();

      // Should not appear in old date
      const oldDateItems = await getQueueItems(page, oldDate);
      expect(await oldDateItems.count()).toBe(0);
    });
  });

  test.describe('Delete Queue Entry', () => {
    test('should delete queue entry', async ({ page }) => {
      const testDate = getFutureDate(55);

      // Create entry
      await createQueueEntry(page, {
        ...TEST_QUEUE_ENTRIES[0],
        date: testDate,
      });

      await goToQueue(page);
      const items = await getQueueItems(page, testDate);
      const itemId = await items.first().getAttribute('data-id');

      // Delete it
      await deleteQueueEntry(page, itemId!);

      // Verify deletion
      await expect(page.locator('.toast-success')).toContainText(/usunięto/i);

      // Entry should be gone
      await goToQueue(page);
      const remainingItems = await getQueueItems(page, testDate);
      expect(await remainingItems.count()).toBe(0);
    });

    test('should reorder positions after deletion', async ({ page }) => {
      const testDate = getFutureDate(60);

      // Create 3 entries
      for (let i = 0; i < 3; i++) {
        await createQueueEntry(page, {
          ...TEST_QUEUE_ENTRIES[i],
          date: testDate,
        });
      }

      await goToQueue(page);
      let items = await getQueueItems(page, testDate);
      expect(await items.count()).toBe(3);

      // Delete middle one (position 2)
      const middleItemId = await items.nth(1).getAttribute('data-id');
      await deleteQueueEntry(page, middleItemId!);

      // Verify positions are recalculated
      await goToQueue(page);
      items = await getQueueItems(page, testDate);
      expect(await items.count()).toBe(2);

      // Positions should be 1 and 2 (not 1 and 3)
      const pos1 = await items.nth(0).locator('[data-testid="position"]').textContent();
      const pos2 = await items.nth(1).locator('[data-testid="position"]').textContent();

      expect(pos1).toBe('1');
      expect(pos2).toBe('2');
    });
  });
});
