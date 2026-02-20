import { test as base, Page } from '@playwright/test';

/**
 * Test users for E2E tests
 */
export const TEST_USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@gosciniecrodzinny.pl',
    password: process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#',
    role: 'ADMIN' as const,
  },
  employee: {
    email: process.env.E2E_EMPLOYEE_EMAIL || 'employee@test.com',
    password: process.env.E2E_EMPLOYEE_PASSWORD || 'TestEmployee123!',
    role: 'EMPLOYEE' as const,
  },
  client: {
    email: process.env.E2E_CLIENT_EMAIL || 'client@test.com',
    password: process.env.E2E_CLIENT_PASSWORD || 'TestClient123!',
    role: 'CLIENT' as const,
  },
};

/**
 * Auth helpers for E2E tests
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login via UI
   */
  async loginViaUI(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // App redirects to /dashboard after successful login
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  }

  /**
   * Login via API (faster for tests that don't test auth)
   */
  async loginViaAPI(email: string, password: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await this.page.request.post(
      `${apiUrl}/auth/login`,
      {
        data: { email, password },
      }
    );

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`);
    }

    const body = await response.json();
    // API returns { success: true, data: { token } }
    const token = body.data?.token || body.token;
    
    if (!token) {
      throw new Error('No token in login response');
    }

    // Navigate to login page first to have app origin context
    await this.page.goto('/login');
    
    // Store token with key the app expects: 'auth_token'
    await this.page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, token);
    
    // Navigate to dashboard and wait for app to load
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Logout via sidebar button
   */
  async logout() {
    // Sidebar logout button has aria-label="Wyloguj"
    await this.page.click('button[aria-label="Wyloguj"]');
    await this.page.waitForURL('**/login', { timeout: 5000 });
  }

  /**
   * Check if logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('auth_token');
    });
    return !!token;
  }
}

/**
 * Extended test with auth fixtures
 */
export const test = base.extend<{
  authHelper: AuthHelper;
  authenticatedPage: Page;
  adminPage: Page;
  employeePage: Page;
}>({
  authHelper: async ({ page }, use) => {
    const helper = new AuthHelper(page);
    await use(helper);
  },

  authenticatedPage: async ({ page, authHelper }, use) => {
    await authHelper.loginViaAPI(
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );
    await use(page);
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helper = new AuthHelper(page);
    
    await helper.loginViaAPI(
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );
    
    await use(page);
    await context.close();
  },

  employeePage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helper = new AuthHelper(page);
    
    await helper.loginViaAPI(
      TEST_USERS.employee.email,
      TEST_USERS.employee.password
    );
    
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';

/**
 * Simple login helper for test files that do:
 *   import { login } from './fixtures/auth';
 *   await login(page, email, password);
 */
export async function login(page: Page, email: string, password: string) {
  const helper = new AuthHelper(page);
  await helper.loginViaAPI(email, password);
}
