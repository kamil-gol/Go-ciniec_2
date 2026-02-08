import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

/**
 * SMOKE TESTS
 * 
 * Quick tests to verify basic functionality works.
 * Run these before every deployment to catch critical regressions.
 * 
 * Total time: ~5 minutes
 */

test.describe('Smoke Tests - Critical Paths', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test('should load dashboard successfully', async ({ page }) => {
    await page.goto('/');

    // Dashboard should load without errors
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // No error messages
    await expect(page.locator('[data-testid="error-message"]')).toHaveCount(0);
  });

  test('should navigate to all main pages', async ({ page }) => {
    const pages = [
      { path: '/', title: 'Dashboard' },
      { path: '/reservations', title: 'Rezerwacje' },
      { path: '/queue', title: 'Kolejka' },
      { path: '/clients', title: 'Klienci' },
      { path: '/halls', title: 'Sale' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await expect(page.locator('h1')).toContainText(p.title, { timeout: 5000 });
      
      // No 404 or error page
      await expect(page.locator('text=404')).toHaveCount(0);
      await expect(page.locator('text=Error')).toHaveCount(0);
    }
  });

  test('should create reservation', async ({ page }) => {
    await page.goto('/reservations/new');

    // Fill minimal required fields
    await page.selectOption('select[name="hallId"]', { index: 1 });
    await page.selectOption('select[name="clientId"]', { index: 1 });
    await page.selectOption('select[name="eventTypeId"]', { index: 1 });
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="date"]', dateStr);
    await page.fill('input[name="startTime"]', '18:00');
    await page.fill('input[name="endTime"]', '23:00');
    await page.fill('input[name="adultsCount"]', '20');

    await page.click('button:has-text("Utwórz Rezerwację")');

    // Should redirect to list and show success
    await expect(page).toHaveURL('/reservations');
    await expect(page.locator('text=Rezerwacja została utworzona')).toBeVisible({ timeout: 5000 });
  });

  test('should add to queue', async ({ page }) => {
    await page.goto('/queue/new');

    // Fill minimal required fields
    await page.selectOption('select[name="clientId"]', { index: 1 });
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="reservationQueueDate"]', dateStr);
    await page.fill('input[name="adultsCount"]', '15');

    await page.click('button:has-text("Dodaj do Kolejki")');

    // Should redirect and show success
    await expect(page).toHaveURL('/queue');
    await expect(page.locator('text=Dodano do kolejki')).toBeVisible({ timeout: 5000 });
  });

  test('should perform drag & drop in queue', async ({ page }) => {
    await page.goto('/queue');

    await page.waitForSelector('[data-testid="queue-list"]');

    const count = await page.locator('[data-testid="queue-item"]').count();
    
    if (count >= 2) {
      const item1Id = await page.locator('[data-testid="queue-item"]').first().getAttribute('data-id');
      const item2Id = await page.locator('[data-testid="queue-item"]').nth(1).getAttribute('data-id');

      // Perform drag & drop
      await page.dragAndDrop(`[data-id="${item1Id}"]`, `[data-id="${item2Id}"]`);

      // Should not crash
      await expect(page.locator('[data-testid="error-toast"]')).toHaveCount(0);
      
      // Positions should update
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="queue-list"]')).toBeVisible();
    }
  });

  test('should create client', async ({ page }) => {
    await page.goto('/clients/new');

    const timestamp = Date.now();
    await page.fill('input[name="firstName"]', 'Smoke');
    await page.fill('input[name="lastName"]', `Test${timestamp}`);
    await page.fill('input[name="phone"]', '+48 123 456 789');
    await page.fill('input[name="email"]', `smoke${timestamp}@example.com`);

    await page.click('button:has-text("Utwórz Klienta")');

    await expect(page).toHaveURL('/clients');
    await expect(page.locator('text=Klient został utworzony')).toBeVisible({ timeout: 5000 });
  });

  test('should generate PDF', async ({ page }) => {
    await page.goto('/reservations');

    const count = await page.locator('[data-testid="reservation-item"]').count();
    
    if (count > 0) {
      await page.click('[data-testid="reservation-item"]').first();

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await page.click('button:has-text("Generuj PDF")');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });

  test('should search and filter', async ({ page }) => {
    await page.goto('/reservations');

    // Search should work
    await page.fill('input[placeholder*="Szukaj"]', 'test');
    await page.waitForTimeout(500); // Debounce

    // No errors
    await expect(page.locator('[data-testid="error-message"]')).toHaveCount(0);

    // Filter should work
    await page.selectOption('select[name="status"]', { label: 'Potwierdzona' });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="error-message"]')).toHaveCount(0);
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/');

    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Wyloguj")');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Should not be able to access protected page
    await page.goto('/reservations');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Smoke Tests - API Health', () => {
  test('should have healthy backend API', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.status()).toBe(200);
  });

  test('should have healthy database connection', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health/db');
    expect(response.status()).toBe(200);
  });
});

test.describe('Smoke Tests - Performance', () => {
  test('should load dashboard in less than 3 seconds', async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('h1');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load reservation list in less than 2 seconds', async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

    const startTime = Date.now();
    await page.goto('/reservations');
    await page.waitForSelector('[data-testid="reservation-list"]');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(2000);
  });
});

test.describe('Smoke Tests - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should be usable on mobile', async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

    // Dashboard should load
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // Navigation should work
    await page.click('[data-testid="mobile-menu"]');
    await expect(page.locator('[data-testid="nav-menu"]')).toBeVisible();

    // Can navigate to reservations
    await page.click('a:has-text("Rezerwacje")');
    await expect(page.locator('h1')).toContainText('Rezerwacje');
  });
});

test.describe('Smoke Tests - Accessibility', () => {
  test('should have accessible forms', async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
    await page.goto('/reservations/new');

    // Form labels should be associated with inputs
    const labelCount = await page.locator('label').count();
    expect(labelCount).toBeGreaterThan(0);

    // Required fields should be marked
    const requiredCount = await page.locator('[required], [aria-required="true"]').count();
    expect(requiredCount).toBeGreaterThan(0);
  });

  test('should have keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Tab through form
    await page.keyboard.press('Tab');
    await page.keyboard.type('admin@gosciniecrodzinny.pl');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('Admin123!@#');
    
    await page.keyboard.press('Enter');

    // Should log in
    await expect(page).not.toHaveURL('/login', { timeout: 5000 });
  });
});
