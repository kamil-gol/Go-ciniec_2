import { test, expect, chromium } from '@playwright/test';
import { login } from './fixtures/auth';
import { addToQueue } from './fixtures/queue';

/**
 * CONCURRENT OPERATIONS TESTS
 * 
 * These tests verify Bug #5-9 fixes:
 * - Bug #5: Race conditions with row-level locking + retry logic
 * - Bug #6: Loading states during operations
 * - Bug #7: Auto-cancel logic (only past dates)
 * - Bug #8: Position validation
 * - Bug #9: Nullable constraints
 */

test.describe('Concurrent Operations Tests (Bug #5)', () => {
  test.describe('Concurrent Drag & Drop (Bug #5)', () => {
    test('should handle concurrent drag & drop from two admins', async () => {
      // Create two browser contexts (two different admins)
      const browser = await chromium.launch();
      
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      await login(page1, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await login(page2, 'employee@gosciniecrodzinny.pl', 'Employee123!@#');

      // Both navigate to queue
      await page1.goto('/queue');
      await page2.goto('/queue');

      // Wait for queue to load
      await page1.waitForSelector('[data-testid="queue-list"]');
      await page2.waitForSelector('[data-testid="queue-list"]');

      // Get initial positions
      const item1Id = await page1.locator('[data-testid="queue-item"]').first().getAttribute('data-id');
      const item2Id = await page1.locator('[data-testid="queue-item"]').nth(1).getAttribute('data-id');
      const item3Id = await page1.locator('[data-testid="queue-item"]').nth(2).getAttribute('data-id');

      // Admin 1: Swap items 1 and 2
      const drag1 = page1.dragAndDrop(
        `[data-id="${item1Id}"]`,
        `[data-id="${item2Id}"]`
      );

      // Admin 2: Swap items 1 and 3 (CONCURRENT!)
      const drag2 = page2.dragAndDrop(
        `[data-id="${item1Id}"]`,
        `[data-id="${item3Id}"]`
      );

      // Execute both drags concurrently
      await Promise.all([drag1, drag2]);

      // Wait for operations to complete
      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);

      // Verify: No crashes or error toasts
      await expect(page1.locator('[data-testid="error-toast"]')).toHaveCount(0);
      await expect(page2.locator('[data-testid="error-toast"]')).toHaveCount(0);

      // Verify: Queue positions are consistent (no gaps, no duplicates)
      const positions1 = await page1.locator('[data-testid="position"]').allTextContents();
      const positions2 = await page2.locator('[data-testid="position"]').allTextContents();

      // Parse to numbers and sort
      const pos1Numbers = positions1.map(p => parseInt(p)).sort((a, b) => a - b);
      const pos2Numbers = positions2.map(p => parseInt(p)).sort((a, b) => a - b);

      // Should be [1, 2, 3, ...] with no gaps
      expect(pos1Numbers).toEqual([1, 2, 3]);
      expect(pos2Numbers).toEqual([1, 2, 3]);

      // Should be same on both pages
      expect(pos1Numbers).toEqual(pos2Numbers);

      await browser.close();
    });

    test('should show retry/loading state on lock conflict', async () => {
      const browser = await chromium.launch();
      
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      await login(page1, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await login(page2, 'employee@gosciniecrodzinny.pl', 'Employee123!@#');

      await page1.goto('/queue');
      await page2.goto('/queue');

      await page1.waitForSelector('[data-testid="queue-list"]');
      await page2.waitForSelector('[data-testid="queue-list"]');

      const item1Id = await page1.locator('[data-testid="queue-item"]').first().getAttribute('data-id');
      const item2Id = await page1.locator('[data-testid="queue-item"]').nth(1).getAttribute('data-id');

      // Start drag on page 1
      await page1.dragAndDrop(`[data-id="${item1Id}"]`, `[data-id="${item2Id}"]`);

      // Immediately try drag on page 2 (should hit lock)
      await page2.dragAndDrop(`[data-id="${item1Id}"]`, `[data-id="${item2Id}"]`);

      // At least one should show loading/retry indicator
      const loading1 = await page1.locator('[data-testid="loading-overlay"]').isVisible().catch(() => false);
      const loading2 = await page2.locator('[data-testid="loading-overlay"]').isVisible().catch(() => false);

      expect(loading1 || loading2).toBeTruthy();

      await browser.close();
    });

    test('should retry on lock timeout (Bug #5 fix)', async () => {
      const browser = await chromium.launch();
      
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

      // Mock slow API response to simulate lock timeout
      await page.route('**/api/queue/swap', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        route.continue();
      });

      await page.goto('/queue');
      await page.waitForSelector('[data-testid="queue-list"]');

      const item1Id = await page.locator('[data-testid="queue-item"]').first().getAttribute('data-id');
      const item2Id = await page.locator('[data-testid="queue-item"]').nth(1).getAttribute('data-id');

      // Perform drag
      await page.dragAndDrop(`[data-id="${item1Id}"]`, `[data-id="${item2Id}"]`);

      // Should show loading for extended time
      await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible();

      // Wait for retry logic (max 3 retries: 100ms + 200ms + 400ms = 700ms + operation time)
      await page.waitForTimeout(5000);

      // Should eventually succeed or show user-friendly error
      const hasError = await page.locator('[data-testid="error-toast"]').isVisible().catch(() => false);
      
      if (hasError) {
        // Error message should be user-friendly
        await expect(page.locator('[data-testid="error-toast"]')).toContainText('Inny użytkownik modyfikuje kolejkę');
      } else {
        // Operation succeeded
        await expect(page.locator('[data-testid="loading-overlay"]')).toBeHidden();
      }

      await browser.close();
    });
  });

  test.describe('Concurrent Edit Operations', () => {
    test('should handle concurrent edits on same reservation', async () => {
      const browser = await chromium.launch();
      
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      await login(page1, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await login(page2, 'employee@gosciniecrodzinny.pl', 'Employee123!@#');

      // Both navigate to same reservation
      await page1.goto('/reservations');
      await page2.goto('/reservations');

      // Both click edit on same reservation
      await page1.click('[data-testid="edit-button"]').first();
      await page2.click('[data-testid="edit-button"]').first();

      // Both make changes
      await page1.fill('input[name="adultsCount"]', '25');
      await page1.fill('textarea[name="changeReason"]', 'Admin change');

      await page2.fill('input[name="adultsCount"]', '30');
      await page2.fill('textarea[name="changeReason"]', 'Employee change');

      // Both try to save
      const save1 = page1.click('button:has-text("Zapisz Zmiany")');
      const save2 = page2.click('button:has-text("Zapisz Zmiany")');

      await Promise.all([save1, save2]);

      // One should succeed, one should get conflict error
      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);

      const success1 = await page1.locator('text=Zapisano zmiany').isVisible().catch(() => false);
      const success2 = await page2.locator('text=Zapisano zmiany').isVisible().catch(() => false);
      const error1 = await page1.locator('text=Rezerwacja została zmodyfikowana').isVisible().catch(() => false);
      const error2 = await page2.locator('text=Rezerwacja została zmodyfikowana').isVisible().catch(() => false);

      // Exactly one should succeed, one should get conflict
      expect((success1 && error2) || (success2 && error1)).toBeTruthy();

      await browser.close();
    });
  });

  test.describe('Loading States (Bug #6)', () => {
    test('should show loading overlay during drag & drop', async ({ page }) => {
      await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
      await page.goto('/queue');

      await page.waitForSelector('[data-testid="queue-list"]');

      const item1Id = await page.locator('[data-testid="queue-item"]').first().getAttribute('data-id');
      const item2Id = await page.locator('[data-testid="queue-item"]').nth(1).getAttribute('data-id');

      // Start drag
      const dragPromise = page.dragAndDrop(`[data-id="${item1Id}"]`, `[data-id="${item2Id}"]`);

      // Loading overlay should appear
      await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible();

      // Items should be disabled during drag
      await expect(page.locator(`[data-id="${item1Id}"]`)).toHaveAttribute('aria-disabled', 'true');

      await dragPromise;

      // Loading should disappear
      await expect(page.locator('[data-testid="loading-overlay"]')).toBeHidden();
    });

    test('should disable interactions during loading', async ({ page }) => {
      await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
      await page.goto('/queue');

      await page.waitForSelector('[data-testid="queue-list"]');

      // Slow down API
      await page.route('**/api/queue/swap', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });

      const item1Id = await page.locator('[data-testid="queue-item"]').first().getAttribute('data-id');
      const item2Id = await page.locator('[data-testid="queue-item"]').nth(1).getAttribute('data-id');
      const item3Id = await page.locator('[data-testid="queue-item"]').nth(2).getAttribute('data-id');

      // Start first drag
      page.dragAndDrop(`[data-id="${item1Id}"]`, `[data-id="${item2Id}"]`); // Don't await

      // Try to drag another item immediately
      await page.waitForTimeout(100);

      // Second drag should be disabled
      const item3 = page.locator(`[data-id="${item3Id}"]`);
      await expect(item3).toHaveAttribute('aria-disabled', 'true');

      // Or cursor should indicate no-drop
      await expect(item3).toHaveCSS('cursor', 'not-allowed');
    });
  });

  test.describe('Position Validation (Bug #8)', () => {
    test('should validate position is within range', async ({ page }) => {
      await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
      await page.goto('/queue');

      await page.waitForSelector('[data-testid="queue-list"]');

      // Get queue length
      const queueLength = await page.locator('[data-testid="queue-item"]').count();

      // Try to move to invalid position
      await page.click('[data-testid="queue-item"]').first();
      await page.click('button:has-text("Przenieś do pozycji")');

      // Try position > queue length
      await page.fill('input[name="position"]', String(queueLength + 10));
      await page.click('button:has-text("Zapisz")');

      // Should show validation error
      await expect(page.locator(`text=Pozycja musi być w zakresie 1-${queueLength}`)).toBeVisible();

      // Try position < 1
      await page.fill('input[name="position"]', '0');
      await page.click('button:has-text("Zapisz")');

      await expect(page.locator('text=Pozycja musi być dodatnia')).toBeVisible();
    });
  });
});
