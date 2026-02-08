import { test as base, Page } from '@playwright/test';

/**
 * Test users for E2E tests
 */
export const TEST_USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin123!',
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
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
  }

  /**
   * Login via API (faster for tests that don't test auth)
   */
  async loginViaAPI(email: string, password: string) {
    const response = await this.page.request.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/login`,
      {
        data: { email, password },
      }
    );

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`);
    }

    const { token } = await response.json();
    
    // Store token in localStorage
    await this.page.goto('/');
    await this.page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, token);
    
    // Reload to apply auth
    await this.page.reload();
  }

  /**
   * Logout
   */
  async logout() {
    await this.page.click('button[aria-label="User menu"]');
    await this.page.click('button:has-text("Wyloguj")');
    await this.page.waitForURL('/login', { timeout: 5000 });
  }

  /**
   * Check if logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
    return !!token;
  }

  /**
   * Get current user from UI
   */
  async getCurrentUser() {
    // Open user menu
    await this.page.click('button[aria-label="User menu"]');
    
    // Get user info from menu
    const email = await this.page.textContent('[data-testid="user-email"]');
    const role = await this.page.textContent('[data-testid="user-role"]');
    
    // Close menu
    await this.page.keyboard.press('Escape');
    
    return { email, role };
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
