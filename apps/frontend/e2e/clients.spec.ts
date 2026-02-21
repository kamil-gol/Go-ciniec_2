import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { generateRandomEmail, generateRandomPhone } from './fixtures/test-data';

/**
 * Client Management Tests
 *
 * Page: /dashboard/clients
 * Create form: inline, toggled via "Dodaj Klienta" button
 * Form fields: firstName, lastName, email, phone, notes
 * Required: firstName, lastName, phone (HTML required + JS validation)
 * Search: input with placeholder "Szukaj klientów..."
 * Stats: Wszyscy, Z emailem, Z telefonem, Ten miesiąc
 */

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Client List Page', () => {
    test('should load clients page', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await expect(
        page.getByRole('heading', { name: 'Klienci' })
      ).toBeVisible({ timeout: 10000 });
    });

    test('should display stats cards', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await expect(page.getByText('Wszyscy', { exact: true })).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Z emailem', { exact: true })).toBeVisible();
      await expect(page.getByText('Z telefonem', { exact: true })).toBeVisible();
      await expect(page.getByText('Ten miesiąc', { exact: true })).toBeVisible();
    });

    test('should have Dodaj Klienta button', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await expect(
        page.locator('button:has-text("Dodaj Klienta")')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should display Lista Klientów section', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await expect(
        page.getByText('Lista Klientów', { exact: true })
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have search input', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await expect(
        page.locator('input[placeholder="Szukaj klientów..."]')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Client Search', () => {
    test('should filter clients by search term', async ({ page }) => {
      await page.goto('/dashboard/clients');

      const searchInput = page.locator('input[placeholder="Szukaj klientów..."]');
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      // Type a search term
      await searchInput.fill('test-nonexistent-xyz');

      // Wait for client-side filtering
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(
        page.locator('text=Nie znaleziono klientów')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should clear search and show all clients again', async ({ page }) => {
      await page.goto('/dashboard/clients');

      const searchInput = page.locator('input[placeholder="Szukaj klientów..."]');
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      // Apply search
      await searchInput.fill('test-nonexistent-xyz');
      await page.waitForTimeout(500);

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);

      // Empty state should be gone (assuming clients exist)
      await expect(
        page.locator('text=Nie znaleziono klientów')
      ).toBeHidden({ timeout: 3000 });
    });
  });

  test.describe('Create Client Form', () => {
    test('should open create form when clicking Dodaj Klienta', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await page.click('button:has-text("Dodaj Klienta")');

      // Form header should appear
      await expect(
        page.locator('text=Dodaj Nowego Klienta')
      ).toBeVisible({ timeout: 3000 });

      // Form fields should be visible
      await expect(page.locator('#firstName')).toBeVisible();
      await expect(page.locator('#lastName')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#phone')).toBeVisible();
      await expect(page.locator('#notes')).toBeVisible();
    });

    test('should close form when clicking Anuluj', async ({ page }) => {
      await page.goto('/dashboard/clients');

      // Open form
      await page.click('button:has-text("Dodaj Klienta")');
      await expect(page.locator('text=Dodaj Nowego Klienta')).toBeVisible({ timeout: 3000 });

      // Cancel
      await page.locator('form').locator('button:has-text("Anuluj")').click();

      // Form should close
      await expect(page.locator('text=Dodaj Nowego Klienta')).toBeHidden({ timeout: 3000 });
    });

    test('should show form field labels with required markers', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await page.click('button:has-text("Dodaj Klienta")');

      // Section headers (scoped to form to avoid stat card duplicates)
      const form = page.locator('form');
      await expect(form.locator('text=Dane osobowe')).toBeVisible({ timeout: 3000 });
      await expect(form.locator('text=Dane kontaktowe')).toBeVisible();

      // Field labels with required markers
      await expect(page.locator('label[for="firstName"]')).toContainText('Imię');
      await expect(page.locator('label[for="lastName"]')).toContainText('Nazwisko');
      await expect(page.locator('label[for="phone"]')).toContainText('Telefon');

      // Required markers (*) should be present
      await expect(page.locator('label[for="firstName"] .text-red-500')).toBeVisible();
      await expect(page.locator('label[for="lastName"] .text-red-500')).toBeVisible();
      await expect(page.locator('label[for="phone"] .text-red-500')).toBeVisible();
    });

    test('should have required attribute on mandatory fields', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await page.click('button:has-text("Dodaj Klienta")');
      await expect(page.locator('text=Dodaj Nowego Klienta')).toBeVisible({ timeout: 3000 });

      // firstName, lastName, phone should have required attribute
      await expect(page.locator('#firstName')).toHaveAttribute('required', '');
      await expect(page.locator('#lastName')).toHaveAttribute('required', '');
      await expect(page.locator('#phone')).toHaveAttribute('required', '');

      // email and notes should NOT be required
      await expect(page.locator('#email')).not.toHaveAttribute('required', '');
      await expect(page.locator('#notes')).not.toHaveAttribute('required', '');
    });

    test('should create client successfully', async ({ page }) => {
      await page.goto('/dashboard/clients');

      await page.click('button:has-text("Dodaj Klienta")');
      await expect(page.locator('text=Dodaj Nowego Klienta')).toBeVisible({ timeout: 3000 });

      // Fill form
      const randomEmail = generateRandomEmail();
      const randomPhone = generateRandomPhone();

      await page.locator('#firstName').fill('E2E-Test');
      await page.locator('#lastName').fill('Klient');
      await page.locator('#email').fill(randomEmail);
      await page.locator('#phone').fill(randomPhone);
      await page.locator('#notes').fill('Klient testowy z E2E');

      // Submit via form button (scoped to form to avoid hero button match)
      await page.locator('form button[type="submit"]').click();

      // Success: form should close (onSuccess closes form)
      await expect(
        page.locator('text=Dodaj Nowego Klienta')
      ).toBeHidden({ timeout: 10000 });
    });

    test('should find newly created client in search', async ({ page }) => {
      await page.goto('/dashboard/clients');

      // Create a client with a unique name
      const uniqueName = `E2EFind${Date.now()}`;

      await page.click('button:has-text("Dodaj Klienta")');
      await expect(page.locator('text=Dodaj Nowego Klienta')).toBeVisible({ timeout: 3000 });

      await page.locator('#firstName').fill(uniqueName);
      await page.locator('#lastName').fill('Testowy');
      await page.locator('#phone').fill(generateRandomPhone());

      // Submit via form button
      await page.locator('form button[type="submit"]').click();

      // Wait for form to close (success)
      await expect(
        page.locator('text=Dodaj Nowego Klienta')
      ).toBeHidden({ timeout: 10000 });

      // Search for the client
      const searchInput = page.locator('input[placeholder="Szukaj klientów..."]');
      await searchInput.fill(uniqueName);
      await page.waitForTimeout(500);

      // Client should appear in results
      await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Client Detail Page', () => {
    test('should navigate to client detail via link', async ({ page }) => {
      await page.goto('/dashboard/clients');

      // Find any link to a client detail page
      const clientLink = page.locator('a[href*="/dashboard/clients/"]').first();

      if (await clientLink.isVisible({ timeout: 5000 })) {
        await clientLink.click();
        await expect(page).toHaveURL(/\/dashboard\/clients\//);
      }
    });
  });
});
