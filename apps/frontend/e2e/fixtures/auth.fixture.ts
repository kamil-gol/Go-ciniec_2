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
 * Helper function to login
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  
  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard — use regex for flexible matching
  // and generous timeout for slower engines (webkit, mobile-safari)
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  
  // Wait for dashboard to fully load
  await page.waitForLoadState('networkidle');
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
 * - Mobile (<lg): sidebar is hidden, need to open hamburger menu first
 */
export async function logout(page: Page): Promise<void> {
  // On mobile viewports, the sidebar is hidden (class="hidden lg:flex").
  // We need to open the hamburger menu (Sheet) to access the logout button.
  const hamburger = page.locator('button[aria-label="Otwórz menu nawigacji"]');
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    // Wait for Sheet slide-in animation
    await page.waitForTimeout(500);
  }
  
  // Click the logout icon button identified by aria-label
  await page.click('button[aria-label="Wyloguj"]', { timeout: 5000 });
  
  // Wait for redirect to login
  await page.waitForURL(/\/login/, { timeout: 10000 });
}
