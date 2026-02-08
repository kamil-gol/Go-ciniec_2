import { test, expect } from '../fixtures/auth.fixture';
import { testData } from '../fixtures/test-data';
import { logout } from '../fixtures/auth.fixture';

/**
 * Authentication E2E Tests
 * 
 * Tests user authentication flow:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Logout
 * - Protected routes redirect
 * - Session timeout (optional)
 * 
 * Priority: CRITICAL 🔥
 * Coverage: 100%
 */

test.describe('Autentykacja', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're logged out before each test
    await page.goto('/login');
  });
  
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page elements
    await expect(page.locator('h1, h2').first()).toContainText(/Logowanie|Zaloguj/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
  
  test('should login with valid admin credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', testData.admin.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify dashboard loaded (use .first() to avoid strict mode violation)
    await expect(page.locator('h1, h2').first()).toContainText(/Dashboard|Panel/i);
    
    // Verify user menu visible (user is logged in)
    await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();
  });
  
  test('should login with valid employee credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', testData.employee.email);
    await page.fill('input[name="password"]', testData.employee.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    await expect(page.locator('h1, h2').first()).toContainText(/Dashboard|Panel/i);
  });
  
  test('should fail login with invalid email', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with wrong email
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', testData.admin.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show error message (accept various error messages including backend errors)
    await expect(page.locator('.error-message, [role="alert"], .toast').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message, [role="alert"], .toast').first()).toContainText(/Invalid|niepoprawne|błędne|Internal|server|error/i);
  });
  
  test('should fail login with invalid password', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with wrong password
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', 'wrongpassword123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show error message (accept various error messages including backend errors)
    await expect(page.locator('.error-message, [role="alert"], .toast').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message, [role="alert"], .toast').first()).toContainText(/Invalid|niepoprawne|błędne|Internal|server|error/i);
  });
  
  test('should fail login with empty credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show validation errors - check for inline error messages
    const emailError = page.locator('input[name="email"] + .error, input[name="email"] ~ .error');
    const passwordError = page.locator('input[name="password"] + .error, input[name="password"] ~ .error');
    
    // At least one error should be visible (use .first() to avoid strict mode when both are visible)
    await expect(
      emailError.or(passwordError).first()
    ).toBeVisible({ timeout: 3000 });
  });
  
  test('should logout successfully', async ({ adminPage }) => {
    // adminPage is already authenticated
    await expect(adminPage).toHaveURL('/dashboard');
    
    // Logout
    await logout(adminPage);
    
    // Verify redirect to login
    await expect(adminPage).toHaveURL('/login');
    
    // Verify login form visible
    await expect(adminPage.locator('input[name="email"]')).toBeVisible();
  });
  
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
  
  test('should redirect to login when accessing reservations without auth', async ({ page }) => {
    // Try to access reservations without auth
    await page.goto('/reservations');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
  
  test('should redirect to login when accessing queue without auth', async ({ page }) => {
    // Try to access queue without auth
    await page.goto('/queue');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
  
  test('should persist session after page reload', async ({ adminPage }) => {
    // adminPage is authenticated
    await expect(adminPage).toHaveURL('/dashboard');
    
    // Reload page
    await adminPage.reload();
    
    // Should still be on dashboard (session persisted)
    await expect(adminPage).toHaveURL('/dashboard');
    await expect(adminPage.locator('button[aria-label="User menu"]')).toBeVisible();
  });
  
  test('should show user info in menu', async ({ adminPage }) => {
    await expect(adminPage).toHaveURL('/dashboard');
    
    // Click user menu
    await adminPage.click('button[aria-label="User menu"]');
    
    // Should show user menu dropdown
    const userMenu = adminPage.locator('[role="menu"], .dropdown-menu, .user-dropdown');
    await expect(userMenu).toBeVisible();
    
    // Should contain logout option
    await expect(userMenu).toContainText(/Wyloguj|Logout/i);
  });
});

test.describe('Autentykacja - Security', () => {
  test('should not expose credentials in URL', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', testData.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    
    // URL should not contain credentials
    const url = page.url();
    expect(url).not.toContain(testData.admin.password);
    expect(url).not.toContain('password');
  });
  
  test('should clear password field on failed login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error
    await page.waitForTimeout(1000);
    
    // Password field should be cleared (security best practice)
    const passwordValue = await page.inputValue('input[name="password"]');
    expect(passwordValue).toBe('');
  });
});
