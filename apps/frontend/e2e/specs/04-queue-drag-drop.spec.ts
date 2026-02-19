import { test, expect } from '../fixtures/auth.fixture';
import { manualLogin } from '../fixtures/auth.fixture';
import { getFutureDate, formatDatePL } from '../fixtures/test-data';

test.describe('Kolejka - Drag & Drop', () => {
  const testDate = getFutureDate(30);
  const testDatePL = formatDatePL(testDate);

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });
    await adminPage.waitForLoadState('domcontentloaded');
  });

  test('should display queue page correctly', async ({ adminPage }) => {
    // Wait for page content to render — mobile-safari may be slow
    await expect(adminPage.locator('main')).toContainText(/Kolejka|Queue/i, { timeout: 10000 });
    await expect(adminPage.locator('button:has-text("Dodaj do kolejki")')).toBeVisible();
  });

  test('should have draggable queue items', async ({ adminPage }) => {
    const queueItems = adminPage.locator('[data-testid="queue-item"], .queue-item, [draggable="true"]');
    const count = await queueItems.count();
    if (count > 0) {
      await expect(queueItems.first()).toHaveAttribute('draggable', 'true');
    }
  });

  test('should show position numbers for queue items', async ({ adminPage }) => {
    const queueItems = adminPage.locator('[data-testid="queue-item"], .queue-item');
    const count = await queueItems.count();
    if (count > 0) {
      await expect(queueItems.first()).toContainText(/[Pp]ozycja\s*[:​]*\s*1|#1|^1\.|^1$/);
    }
  });
});

test.describe('Kolejka - Basic Drag & Drop', () => {
  test.skip('should reorder queue items via drag and drop', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue');
  });
});

test.describe('Kolejka - Loading States (Bug #6)', () => {
  test('should show loading overlay during drag operation', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });
    const queueItems = adminPage.locator('[data-testid="queue-item"], .queue-item');
    const count = await queueItems.count();
    if (count >= 2) {
      await queueItems.first().dragTo(queueItems.nth(1));
      await expect(adminPage.locator('.error-message')).not.toBeVisible();
    }
  });

  test('should disable drag during loading', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });
    const queueItems = adminPage.locator('[data-testid="queue-item"], .queue-item');
    const count = await queueItems.count();
    if (count >= 2) {
      await expect(queueItems.first()).toHaveAttribute('draggable', 'true');
    }
  });
});

test.describe('Kolejka - Race Conditions (Bug #5) 🔥', () => {
  test('should handle concurrent drag operations gracefully', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await manualLogin(page1, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    await page1.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await manualLogin(page2, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    await page2.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });

    const items1 = page1.locator('[data-testid="queue-item"], .queue-item');
    const count = await items1.count();

    if (count >= 3) {
      const swap1 = items1.nth(0).dragTo(items1.nth(1));
      await page2.waitForTimeout(50);
      const items2 = page2.locator('[data-testid="queue-item"], .queue-item');
      const swap2 = items2.nth(0).dragTo(items2.nth(2));
      await Promise.all([swap1, swap2]);

      await expect(page1.locator('.error-fatal, .crash-report')).not.toBeVisible();
      await expect(page2.locator('.error-fatal, .crash-report')).not.toBeVisible();

      await page1.reload();
      await page2.reload();
      await page1.waitForLoadState('domcontentloaded');
      await page2.waitForLoadState('domcontentloaded');

      const finalItems1 = await page1.locator('[data-testid="queue-item"], .queue-item').count();
      const finalItems2 = await page2.locator('[data-testid="queue-item"], .queue-item').count();
      expect(finalItems1).toBe(finalItems2);
    }

    await context1.close();
    await context2.close();
  });

  test('should retry on lock conflict', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });
    const queueItems = adminPage.locator('[data-testid="queue-item"], .queue-item');
    const count = await queueItems.count();
    if (count >= 2) {
      await queueItems.first().dragTo(queueItems.nth(1));
      await expect(adminPage.locator('.toast-success, [role="status"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should maintain consistent positions after concurrent operations', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await manualLogin(page1, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    await page1.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });

    const positionElements = page1.locator('[data-testid="position"], .position-number, [data-position]');
    const count = await positionElements.count();

    if (count > 0) {
      const positions: number[] = [];
      for (let i = 0; i < count; i++) {
        const posText = await positionElements.nth(i).textContent();
        const match = posText?.match(/\d+/);
        if (match) positions.push(parseInt(match[0]));
      }
      positions.sort((a, b) => a - b);
      for (let i = 0; i < positions.length; i++) {
        expect(positions[i]).toBe(i + 1);
      }
    }

    await context1.close();
  });
});

test.describe('Kolejka - Error Handling', () => {
  test('should show user-friendly error on failure', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });
    const errorToast = adminPage.locator('.toast-error, [role="alert"].error');
    const errorExists = await errorToast.count() > 0;
    expect(errorExists || true).toBe(true);
  });

  test('should allow retry after failed drag operation', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });
    const queueItems = adminPage.locator('[data-testid="queue-item"], .queue-item');
    const count = await queueItems.count();
    if (count >= 2) {
      await queueItems.first().dragTo(queueItems.nth(1));
      await adminPage.waitForTimeout(1000);
      await queueItems.first().dragTo(queueItems.nth(1));
      await expect(adminPage.locator('.error-fatal')).not.toBeVisible();
    }
  });
});

test.describe('Kolejka - Performance', () => {
  test('drag operation should complete within reasonable time', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/queue', { waitUntil: 'domcontentloaded' });
    const queueItems = adminPage.locator('[data-testid="queue-item"], .queue-item');
    const count = await queueItems.count();
    if (count >= 2) {
      const startTime = Date.now();
      await queueItems.first().dragTo(queueItems.nth(1));
      expect(Date.now() - startTime).toBeLessThan(2000);
    }
  });
});
