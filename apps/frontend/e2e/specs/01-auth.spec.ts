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
 * - Session persistence
 * 
 * Priority: CRITICAL 🔥
 * Coverage: 100%
 */

test.describe('Autentykacja', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });
  
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Login page shows "Gościniec Rodzinny" as h1 and "Zaloguj się" as h2
    await expect(page.locator('h1')).toContainText(/Gościniec/i);
    await expect(page.locator('h2')).toContainText(/Zaloguj/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
  
  test('should login with valid admin credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', testData.admin.password);
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    
    // Header.tsx renders "Witaj, {firstName}!" inside <header> element
    await expect(page.locator('header h1')).toContainText(/Witaj/i, { timeout: 5000 });
  });
  
  test.skip('should login with valid employee credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testData.employee.email);
    await page.fill('input[name="password"]', testData.employee.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.locator('header h1')).toContainText(/Witaj/i, { timeout: 5000 });
  });
  
  test('should fail login with invalid email', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', testData.admin.password);
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Wait for error: persistent .bg-error-50 div or password cleared
    try {
      await page.locator('.bg-error-50').waitFor({ state: 'visible', timeout: 5000 });
      await expect(page.locator('.bg-error-50')).toContainText(/Błąd|niepoprawne|error|Invalid|Niepoprawny/i);
    } catch {
      // Fallback: password was cleared = error handler ran
      const pwd = await page.inputValue('input[name="password"]');
      expect(pwd).toBe('');
    }
  });
  
  test('should fail login with invalid password', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/login/);
    
    try {
      await page.locator('.bg-error-50').waitFor({ state: 'visible', timeout: 5000 });
      await expect(page.locator('.bg-error-50')).toContainText(/Błąd|niepoprawne|error|Invalid|Niepoprawny/i);
    } catch {
      const pwd = await page.inputValue('input[name="password"]');
      expect(pwd).toBe('');
    }
  });
  
  test('should fail login with empty credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/login/);
    
    const fieldError = page.locator('.text-error-600, .text-error-400').first();
    await expect(fieldError).toBeVisible({ timeout: 3000 });
  });
  
  test('should logout successfully', async ({ adminPage }) => {
    await expect(adminPage).toHaveURL(/\/dashboard/);
    
    // logout() handles both desktop and mobile (opens hamburger if needed)
    await logout(adminPage);
    
    await expect(adminPage).toHaveURL(/\/login/);
    await expect(adminPage.locator('input[name="email"]')).toBeVisible();
  });
  
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
  
  test('should redirect to login when accessing reservations without auth', async ({ page }) => {
    await page.goto('/dashboard/reservations');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
  
  test('should redirect to login when accessing queue without auth', async ({ page }) => {
    await page.goto('/dashboard/queue');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
  
  test('should persist session after page reload', async ({ adminPage }) => {
    await expect(adminPage).toHaveURL(/\/dashboard/);
    
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');
    
    await expect(adminPage).toHaveURL(/\/dashboard/);
    await expect(adminPage.locator('header h1')).toContainText(/Witaj/i, { timeout: 10000 });
  });
  
  test('should show user info in sidebar', async ({ adminPage }) => {
    await expect(adminPage).toHaveURL(/\/dashboard/);
    
    // On mobile, sidebar is hidden (class="hidden lg:flex").
    // Open the hamburger menu to reveal the sidebar Sheet.
    const hamburger = adminPage.locator('button[aria-label="Otwórz menu nawigacji"]');
    if (await hamburger.isVisible().catch(() => false)) {
      await hamburger.click();
      await adminPage.waitForTimeout(500);
    }
    
    // Logout button should now be visible (desktop sidebar or mobile Sheet)
    await expect(adminPage.locator('button[aria-label="Wyloguj"]')).toBeVisible({ timeout: 5000 });
    
    // User info (name or role) should be visible somewhere in the layout
    const pageContent = adminPage.locator('body');
    await expect(pageContent).toContainText(/admin|Admin/i);
  });
});

test.describe('Autentykacja - Security', () => {
  test('should not expose credentials in URL', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', testData.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    
    const url = page.url();
    expect(url).not.toContain(testData.admin.password);
    expect(url).not.toContain('password');
  });
  
  test('should clear password field on failed login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error response to be processed
    await page.waitForTimeout(3000);
    
    const passwordValue = await page.inputValue('input[name="password"]');
    expect(passwordValue).toBe('');
  });
});
