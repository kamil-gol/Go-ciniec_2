import { test as base, Page } from '@playwright/test';
import { testData } from './test-data';

/**
 * Authentication Fixtures
 * 
 * Provides pre-authenticated pages for different user roles:
 * - authenticatedPage: Generic authenticated user
 * - adminPage: Admin user with full permissions
 * - employeePage: Employee user with limited permissions
 */

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  employeePage: Page;
};

/**
 * Helper: robust login that works across all browser engines.
 * 
 * Webkit/mobile-safari often fail to fire the 'load' event after
 * client-side router.push('/dashboard'). We use 'domcontentloaded'
 * and a fallback goto('/dashboard') to handle this.
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  
  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for redirect — use 'domcontentloaded' instead of 'load' for webkit compat
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  } catch {
    // Fallback for webkit/safari: auth token stored but router.push didn't navigate.
    // Navigate directly — if auth succeeded we'll see dashboard, if not we'll be
    // redirected back to /login and subsequent assertions will fail (expected).
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  }
  
  // If somehow still on login (e.g. slow token storage), retry once
  if (page.url().includes('/login')) {
    await page.waitForTimeout(2000);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  }
  
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Extended test with auth fixtures
 */
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

/**
 * Helper: Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const url = page.url();
    return !url.includes('/login');
  } catch {
    return false;
  }
}

/**
 * Helper: Logout current user
 * 
 * Handles both desktop and mobile layouts:
 * - Desktop (lg+): sidebar is always visible, logout button accessible directly
 * - Mobile (<lg): sidebar is hidden behind hamburger menu, Sheet has a duplicate button
 * 
 * Uses .first() because both <aside> sidebar and mobile <Sheet> may render
 * a button[aria-label="Wyloguj"], causing strict mode violations.
 */
export async function logout(page: Page): Promise<void> {
  // On mobile viewports, open the hamburger menu to reveal the Sheet
  const hamburger = page.locator('button[aria-label="Otwórz menu nawigacji"]');
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(500);
  }
  
  // .first() avoids strict mode when sidebar + Sheet both have the button
  await page.locator('button[aria-label="Wyloguj"]').first().click({ timeout: 5000 });
  
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

/**
 * Helper: robust manual login for use in spec files that create their own browser contexts.
 * Same fallback logic as the fixture login.
 */
export async function manualLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  } catch {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  }
  
  if (page.url().includes('/login')) {
    await page.waitForTimeout(2000);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  }
  
  await page.waitForLoadState('domcontentloaded');
}
