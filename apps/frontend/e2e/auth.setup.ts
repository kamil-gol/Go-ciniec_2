import { test as setup, expect } from '@playwright/test';
import { testData } from './fixtures/test-data';

const authFile = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill credentials
  await page.fill('input[name="email"]', testData.admin.email);
  await page.fill('input[name="password"]', testData.admin.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 30000, waitUntil: 'domcontentloaded' });

  // Save auth state (cookies + localStorage with JWT token)
  await page.context().storageState({ path: authFile });
});
