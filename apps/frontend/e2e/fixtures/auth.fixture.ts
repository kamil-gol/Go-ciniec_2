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
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
}

/**
 * Extended test with auth fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Generic authenticated page
   * Uses admin credentials by default
   */
  authenticatedPage: async ({ page }, use) => {
    await login(page, testData.admin.email, testData.admin.password);
    await use(page);
  },
  
  /**
   * Admin user page
   * Full permissions
   */
  adminPage: async ({ page }, use) => {
    await login(page, testData.admin.email, testData.admin.password);
    await use(page);
  },
  
  /**
   * Employee user page
   * Limited permissions
   */
  employeePage: async ({ page }, use) => {
    await login(page, testData.employee.email, testData.employee.password);
    await use(page);
  },
});

/**
 * Export expect from @playwright/test
 */
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
 * In Gościniec UI the logout button is an icon-only button
 * with aria-label="Wyloguj" (no visible text).
 */
export async function logout(page: Page): Promise<void> {
  // Click the logout icon button identified by aria-label
  await page.click('button[aria-label="Wyloguj"]', { timeout: 5000 });
  
  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 });
}
