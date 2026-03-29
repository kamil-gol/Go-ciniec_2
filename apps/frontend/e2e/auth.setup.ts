import { test as setup, expect } from '@playwright/test';
import { testData } from './fixtures/test-data';

const authFile = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  setup.setTimeout(60_000);

  // Navigate to login
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill credentials
  await page.fill('input[name="email"]', testData.admin.email);
  await page.fill('input[name="password"]', testData.admin.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard (with fallback like auth.fixture.ts)
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 20000, waitUntil: 'domcontentloaded' });
  } catch {
    // Redirect didn't fire — navigate manually
    if (page.url().includes('/login')) {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});

  // Verify we're on dashboard
  if (page.url().includes('/login')) {
    throw new Error(
      `Auth setup failed — still on login page. Check TEST_ADMIN_PASSWORD env var.\n` +
      `Email: ${testData.admin.email}\n` +
      `Password provided: ${testData.admin.password ? 'yes (' + testData.admin.password.length + ' chars)' : 'NO'}`
    );
  }

  // Save auth state (cookies + localStorage with JWT token)
  await page.context().storageState({ path: authFile });
});
