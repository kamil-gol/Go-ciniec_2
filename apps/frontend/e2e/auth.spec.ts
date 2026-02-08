import { test, expect } from './fixtures/auth';
import { TEST_USERS } from './fixtures/auth';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page, authHelper }) => {
      await authHelper.loginViaUI(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should show user info
      await expect(page.locator('[data-testid="user-email"]')).toContainText(
        TEST_USERS.admin.email
      );
    });

    test('should show error with invalid credentials', async ({ page, authHelper }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'invalid@test.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page.locator('.error-message')).toContainText(
        'Nieprawidłowy email lub hasło'
      );
      
      // Should stay on login page
      await expect(page).toHaveURL('/login');
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login');
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('input[name="email"] + .error')).toBeVisible();
      await expect(page.locator('input[name="password"] + .error')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      // Should show email format error
      await expect(page.locator('input[name="email"] + .error')).toContainText(
        'Nieprawidłowy format email'
      );
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page, authHelper }) => {
      // Login first
      await authHelper.loginViaAPI(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );
      
      await page.goto('/dashboard');
      
      // Logout
      await authHelper.logout();
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
      
      // Should clear token
      const isLoggedIn = await authHelper.isLoggedIn();
      expect(isLoggedIn).toBe(false);
    });

    test('should not access protected routes after logout', async ({ page, authHelper }) => {
      // Login first
      await authHelper.loginViaAPI(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );
      
      // Logout
      await authHelper.logout();
      
      // Try to access protected route
      await page.goto('/reservations');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login');
      
      await page.goto('/reservations');
      await expect(page).toHaveURL('/login');
      
      await page.goto('/queue');
      await expect(page).toHaveURL('/login');
    });

    test('should preserve redirect URL after login', async ({ page, authHelper }) => {
      // Try to access protected route
      await page.goto('/reservations/new');
      
      // Should redirect to login with redirect param
      await expect(page).toHaveURL(/\/login\?redirect=/); 
      
      // Login
      await authHelper.loginViaUI(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );
      
      // Should redirect back to original URL
      await expect(page).toHaveURL('/reservations/new');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session after page reload', async ({ page, authHelper }) => {
      await authHelper.loginViaAPI(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );
      
      await page.goto('/dashboard');
      
      // Reload page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      const isLoggedIn = await authHelper.isLoggedIn();
      expect(isLoggedIn).toBe(true);
    });

    test('should handle expired token', async ({ page, authHelper }) => {
      // Login
      await authHelper.loginViaAPI(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );
      
      // Simulate expired token
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'expired-token');
      });
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Role-Based Access', () => {
    test('admin should access all routes', async ({ adminPage }) => {
      const routes = [
        '/dashboard',
        '/reservations',
        '/queue',
        '/clients',
        '/admin/settings',
      ];

      for (const route of routes) {
        await adminPage.goto(route);
        await expect(adminPage).toHaveURL(route);
      }
    });

    test('employee should access limited routes', async ({ employeePage }) => {
      // Can access
      await employeePage.goto('/dashboard');
      await expect(employeePage).toHaveURL('/dashboard');
      
      await employeePage.goto('/reservations');
      await expect(employeePage).toHaveURL('/reservations');
      
      // Cannot access admin routes
      await employeePage.goto('/admin/settings');
      await expect(employeePage).toHaveURL('/forbidden'); // or /dashboard with error
    });
  });
});
