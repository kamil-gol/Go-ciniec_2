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
 * IMPORTANT: Do NOT use waitForLoadState('networkidle') here.
 * Mobile Safari often has persistent connections (WebSocket, polling)
 * that prevent networkidle from ever firing, causing the browser
 * to be killed by the test timeout.
 *
 * Strategy:
 * 1. Fill form and submit
 * 2. Wait for client-side redirect with generous timeout
 * 3. If redirect doesn't fire (webkit/safari), navigate directly
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for client-side router.push('/dashboard')
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 20000, waitUntil: 'domcontentloaded' });
    return;
  } catch {
    // Redirect didn't fire — common on webkit/mobile-safari
  }

  // Fallback: navigate directly (auth token should be stored by now)
  try {
    if (page.url().includes('/login')) {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
  } catch {
    // Navigation might be interrupted — continue anyway
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});
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
 * Uses :visible pseudo-class so we always click the button the user can see.
 */
export async function logout(page: Page): Promise<void> {
  const hamburger = page.locator('button[aria-label="Otwórz menu nawigacji"]');
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(500);
  }

  const visibleLogout = page.locator('button[aria-label="Wyloguj"]:visible');
  const count = await visibleLogout.count();

  if (count > 0) {
    await visibleLogout.first().click({ timeout: 5000 });
  } else {
    await page.locator('button[aria-label="Wyloguj"]').first().click({ force: true, timeout: 5000 });
  }

  await page.waitForURL(/\/login/, { timeout: 10000 });
}

/**
 * Manual login for spec files that create their own browser contexts.
 */
export async function manualLogin(page: Page, email: string, password: string): Promise<void> {
  await login(page, email, password);
}
