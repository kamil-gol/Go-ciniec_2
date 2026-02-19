import { test as base, Page } from '@playwright/test';
import { testData } from './test-data';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  employeePage: Page;
};

/**
 * Robust login that works across all browser engines.
 *
 * Strategy:
 * 1. Fill form and submit
 * 2. Wait for client-side redirect (domcontentloaded)
 * 3. If redirect doesn't fire (webkit/safari), wait for API to finish (networkidle)
 *    then navigate directly to /dashboard
 * 4. If still on /login (auth truly failed), retry the entire login once
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Primary: wait for client-side router.push('/dashboard')
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000, waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    return;
  } catch {
    // Redirect didn't fire — common on webkit/mobile-safari
  }

  // Let the login API call finish before navigating away
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  // Navigate directly — if token was stored, we'll see dashboard
  if (page.url().includes('/login')) {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }

  // If redirected back to /login, the first attempt truly failed — retry once
  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 20000, waitUntil: 'domcontentloaded' });
    } catch {
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1000);
      if (page.url().includes('/login')) {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      }
    }
  }

  await page.waitForLoadState('domcontentloaded');
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await login(page, testData.admin.email, testData.admin.password);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await login(page, testData.admin.email, testData.admin.password);
    await use(page);
  },
  employeePage: async ({ page }, use) => {
    await login(page, testData.employee.email, testData.employee.password);
    await use(page);
  },
});

export { expect } from '@playwright/test';

export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    return !page.url().includes('/login');
  } catch {
    return false;
  }
}

/**
 * Logout — handles desktop sidebar and mobile Sheet.
 * Uses :visible pseudo-class so we always click the button the user can see,
 * not the hidden one inside the collapsed sidebar.
 */
export async function logout(page: Page): Promise<void> {
  // On mobile: open hamburger to reveal the Sheet with logout button
  const hamburger = page.locator('button[aria-label="Otwórz menu nawigacji"]');
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(500);
  }

  // :visible ensures we click the one the user can actually see
  const visibleLogout = page.locator('button[aria-label="Wyloguj"]:visible');
  const count = await visibleLogout.count();

  if (count > 0) {
    await visibleLogout.first().click({ timeout: 5000 });
  } else {
    // Fallback: force-click the first one (shouldn't normally reach here)
    await page.locator('button[aria-label="Wyloguj"]').first().click({ force: true, timeout: 5000 });
  }

  await page.waitForURL(/\/login/, { timeout: 10000 });
}

/**
 * Manual login for spec files that create their own browser contexts.
 * Same robust fallback logic as the fixture login.
 */
export async function manualLogin(page: Page, email: string, password: string): Promise<void> {
  await login(page, email, password);
}
