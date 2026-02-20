import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

/**
 * SMOKE TESTS
 * 
 * Quick tests to verify basic functionality works.
 * Run these before every deployment to catch critical regressions.
 * 
 * Routes are under /dashboard/* (Next.js App Router structure).
 * Auth token is stored as 'auth_token' in localStorage.
 */

test.describe('Smoke Tests - Critical Paths', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test('should load dashboard successfully', async ({ page }) => {
    await page.goto('/dashboard');

    // Header shows welcome message: "Witaj, Admin! 👋"
    // Page has 3 h1 elements so we use getByRole with name filter
    await expect(
      page.getByRole('heading', { name: /Witaj/ })
    ).toBeVisible({ timeout: 10000 });
    
    // Page loaded without crash
    await expect(page.locator('text=404')).toHaveCount(0);
  });

  test('should navigate to all main pages', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/dashboard/reservations',
      '/dashboard/queue',
      '/dashboard/clients',
      '/dashboard/halls',
    ];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // No 404 or error page
      await expect(page.locator('text=404')).toHaveCount(0);
    }
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Click "Rezerwacje" in sidebar
    await page.click('nav a:has-text("Rezerwacje")');
    await expect(page).toHaveURL(/\/dashboard\/reservations/);

    // Click "Klienci" in sidebar
    await page.click('nav a:has-text("Klienci")');
    await expect(page).toHaveURL(/\/dashboard\/clients/);

    // Click "Kolejka" in sidebar
    await page.click('nav a:has-text("Kolejka")');
    await expect(page).toHaveURL(/\/dashboard\/queue/);

    // Click "Dashboard" to go back
    await page.click('nav a:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/dashboard');

    // Sidebar has logout button with aria-label="Wyloguj"
    await page.click('button[aria-label="Wyloguj"]');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    
    // Should not be able to access dashboard after logout
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('Smoke Tests - API Health', () => {
  test('should have accessible backend API', async ({ request }) => {
    // Test that the API base is reachable (any non-5xx means server is up)
    const response = await request.get('http://localhost:3001/api');
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Smoke Tests - Performance', () => {
  test('should load dashboard in less than 5 seconds', async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForSelector('h1');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load reservations page in less than 5 seconds', async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

    const startTime = Date.now();
    await page.goto('/dashboard/reservations');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Smoke Tests - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should be usable on mobile', async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');

    // Dashboard should load
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: /Witaj/ })
    ).toBeVisible({ timeout: 10000 });

    // Hamburger menu should be visible on mobile
    const hamburger = page.locator('button[aria-label="Otwórz menu nawigacji"]');
    await expect(hamburger).toBeVisible();

    // Click hamburger to open mobile sidebar (Sheet)
    await hamburger.click();

    // Mobile sidebar should show navigation links
    await expect(page.locator('text=Rezerwacje').first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Smoke Tests - Accessibility', () => {
  test('should have keyboard navigation on login', async ({ page }) => {
    await page.goto('/login');

    // Tab to email field and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('admin@gosciniecrodzinny.pl');
    
    // Tab to password field and type
    await page.keyboard.press('Tab');
    await page.keyboard.type('Admin123!@#');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');

    // Should log in and redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should have labeled form inputs on login', async ({ page }) => {
    await page.goto('/login');

    // Form labels should exist
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);

    // Email and password inputs should have name attributes
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});
