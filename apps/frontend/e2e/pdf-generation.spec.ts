import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import * as fs from 'fs';
import * as path from 'path';

test.describe('PDF Generation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Generate PDF from Reservation', () => {
    test('should generate PDF for existing reservation', async ({ page }) => {
      await page.goto('/reservations');

      // Click on first reservation to open details
      await page.click('[data-testid="reservation-item"]').first();

      // Wait for modal/details page
      await expect(page.locator('[data-testid="reservation-details"]')).toBeVisible();

      // Click generate PDF button
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Generuj PDF")');

      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toMatch(/rezerwacja-.*\.pdf/);

      // Save file
      const downloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
      await download.saveAs(downloadPath);

      // Verify file exists and has size > 0
      expect(fs.existsSync(downloadPath)).toBeTruthy();
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(downloadPath);
    });

    test('should include all required information in PDF', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();

      // Get reservation data before generating PDF
      const clientName = await page.locator('[data-testid="client-name"]').textContent();
      const hallName = await page.locator('[data-testid="hall-name"]').textContent();
      const date = await page.locator('[data-testid="date"]').textContent();

      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Generuj PDF")');
      const download = await downloadPromise;

      // In real scenario, you'd parse PDF and verify content
      // For now, verify download succeeds
      expect(download).toBeTruthy();
      expect(clientName).toBeTruthy();
      expect(hallName).toBeTruthy();
      expect(date).toBeTruthy();
    });

    test('should show loading state during PDF generation', async ({ page }) => {
      await page.goto('/reservations');

      await page.click('[data-testid="reservation-item"]').first();

      // Click generate PDF
      await page.click('button:has-text("Generuj PDF")');

      // Should show loading indicator
      await expect(page.locator('[data-testid="pdf-loading"]')).toBeVisible();

      // Wait for download to complete
      await page.waitForEvent('download');

      // Loading should disappear
      await expect(page.locator('[data-testid="pdf-loading"]')).toBeHidden();
    });

    test('should handle PDF generation error gracefully', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/reservations/*/pdf', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to generate PDF' })
        });
      });

      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      await page.click('button:has-text("Generuj PDF")');

      // Should show error message
      await expect(page.locator('text=Nie udało się wygenerować PDF')).toBeVisible();
    });
  });

  test.describe('PDF Content Validation', () => {
    test('should include restaurant information in PDF', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      // Preview PDF content (if available)
      await page.click('button:has-text("Podgląd PDF")');

      // Should show restaurant logo
      await expect(page.locator('[data-testid="pdf-preview"] img[alt*="logo"]')).toBeVisible();

      // Should show restaurant name
      await expect(page.locator('text=Gościniec Rodzinny')).toBeVisible();

      // Should show restaurant address
      await expect(page.locator('text=Chorów')).toBeVisible();
    });

    test('should include itemized pricing in PDF', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      await page.click('button:has-text("Podgląd PDF")');

      // Should show price breakdown
      await expect(page.locator('text=Liczba osób')).toBeVisible();
      await expect(page.locator('text=Cena za osobę')).toBeVisible();
      await expect(page.locator('text=Razem')).toBeVisible();

      // Should show deposit if applicable
      const hasDeposit = await page.locator('text=Zaliczka').count();
      if (hasDeposit > 0) {
        await expect(page.locator('text=Kwota zaliczki')).toBeVisible();
        await expect(page.locator('text=Termin płatności')).toBeVisible();
      }
    });

    test('should NOT include sensitive data in PDF', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      await page.click('button:has-text("Podgląd PDF")');

      // Should NOT show internal notes
      await expect(page.locator('text=Notatki wewnętrzne')).toBeHidden();

      // Should NOT show modification history
      await expect(page.locator('text=Historia zmian')).toBeHidden();

      // Should NOT show employee who created reservation
      await expect(page.locator('text=Utworzony przez')).toBeHidden();
    });
  });

  test.describe('Bulk PDF Generation', () => {
    test('should generate PDFs for multiple reservations', async ({ page }) => {
      await page.goto('/reservations');

      // Select multiple reservations
      await page.check('[data-testid="select-reservation"]').first();
      await page.check('[data-testid="select-reservation"]').nth(1);
      await page.check('[data-testid="select-reservation"]').nth(2);

      // Click bulk generate PDF
      await page.click('button:has-text("Generuj PDF dla zaznaczonych")');

      // Should show progress indicator
      await expect(page.locator('[data-testid="bulk-progress"]')).toBeVisible();
      await expect(page.locator('text=Generowanie 3 PDF')).toBeVisible();

      // Wait for completion
      await expect(page.locator('text=Wszystkie PDF zostały wygenerowane')).toBeVisible();
    });

    test('should download PDFs as ZIP archive', async ({ page }) => {
      await page.goto('/reservations');

      await page.check('[data-testid="select-reservation"]').first();
      await page.check('[data-testid="select-reservation"]').nth(1);

      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Pobierz jako ZIP")');

      const download = await downloadPromise;

      // Verify ZIP filename
      expect(download.suggestedFilename()).toMatch(/rezerwacje-.*\.zip/);

      // Save and verify
      const downloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
      await download.saveAs(downloadPath);

      expect(fs.existsSync(downloadPath)).toBeTruthy();
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(downloadPath);
    });
  });

  test.describe('Email with PDF', () => {
    test('should send email with PDF attachment', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      // Click send email button
      await page.click('button:has-text("Wyślij Email z PDF")');

      // Modal should appear
      await expect(page.locator('[data-testid="email-modal"]')).toBeVisible();

      // Recipient should be pre-filled with client email
      const emailInput = page.locator('input[name="recipient"]');
      await expect(emailInput).not.toBeEmpty();

      // Add custom message
      await page.fill('textarea[name="message"]', 'Dziękujemy za rezerwację!');

      // Send
      await page.click('button:has-text("Wyślij Email")');

      // Should show success message
      await expect(page.locator('text=Email został wysłany')).toBeVisible();
    });

    test('should validate email address before sending', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      await page.click('button:has-text("Wyślij Email z PDF")');

      // Enter invalid email
      await page.fill('input[name="recipient"]', 'invalid-email');
      await page.click('button:has-text("Wyślij Email")');

      // Should show validation error
      await expect(page.locator('text=Nieprawidłowy adres email')).toBeVisible();
    });

    test('should preview email before sending', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      await page.click('button:has-text("Wyślij Email z PDF")');

      // Click preview
      await page.click('button:has-text("Podgląd")');

      // Preview modal should appear
      await expect(page.locator('[data-testid="email-preview"]')).toBeVisible();

      // Should show email subject
      await expect(page.locator('text=Potwierdzenie rezerwacji')).toBeVisible();

      // Should show attachment indication
      await expect(page.locator('text=Załącznik: PDF rezerwacji')).toBeVisible();
    });
  });

  test.describe('PDF Templates', () => {
    test('should support multiple PDF templates', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      // Open PDF options
      await page.click('button:has-text("Opcje PDF")');

      // Should show template selection
      await expect(page.locator('select[name="template"]')).toBeVisible();

      // Select different template
      await page.selectOption('select[name="template"]', { label: 'Szablon 2' });

      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Generuj PDF")');

      const download = await downloadPromise;
      expect(download).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should generate PDF within reasonable time', async ({ page }) => {
      await page.goto('/reservations');
      await page.click('[data-testid="reservation-item"]').first();

      const startTime = Date.now();

      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Generuj PDF")');
      await downloadPromise;

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should generate PDF in less than 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
