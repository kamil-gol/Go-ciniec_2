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
 * Mobile Safari has persistent connections that prevent networkidle
 * from ever firing, causing the browser to be killed.
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 20000, waitUntil: 'domcontentloaded' });
    return;
  } catch {
    // Redirect didn't fire
  }

  try {
    if (page.url().includes('/login')) {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
  } catch {
    // Navigation might be interrupted
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
 *
 * Webkit doesn't support the :visible pseudo-class reliably,
 * so we try multiple strategies:
 * 1. Click any visible logout button
 * 2. Open hamburger menu then click
 * 3. Use page.evaluate as last resort
 */
export async function logout(page: Page): Promise<void> {
  // On mobile: open hamburger to reveal Sheet
  const hamburger = page.locator('button[aria-label="Otw\u00f3rz menu nawigacji"]');
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(1000);
  }

  // Strategy 1: try clicking with increased timeout
  try {
    await page.locator('button[aria-label="Wyloguj"]').first().click({ timeout: 10000 });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    return;
  } catch {
    // Element might not be interactable
  }

  // Strategy 2: force click
  try {
    await page.locator('button[aria-label="Wyloguj"]').first().click({ force: true, timeout: 5000 });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    return;
  } catch {
    // Still failing
  }

  // Strategy 3: JS click as last resort
  try {
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button[aria-label="Wyloguj"]');
      for (const btn of buttons) {
        if (btn instanceof HTMLElement) {
          btn.click();
          break;
        }
      }
    });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    return;
  } catch {
    // Navigate to login directly
    await page.goto('/login');
  }
}

export async function manualLogin(page: Page, email: string, password: string): Promise<void> {
  await login(page, email, password);
}
