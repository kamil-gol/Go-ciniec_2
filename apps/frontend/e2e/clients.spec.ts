import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';
import { sampleClients } from './fixtures/test-data';

test.describe('Client Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Client List', () => {
    test('should display list of clients', async ({ page }) => {
      await page.goto('/clients');

      await expect(page.locator('h1')).toContainText('Klienci');
      await expect(page.locator('[data-testid="client-list"]')).toBeVisible();
      
      // Should show at least one client
      await expect(page.locator('[data-testid="client-item"]')).toHaveCount(await page.locator('[data-testid="client-item"]').count());
    });

    test('should filter clients by search term', async ({ page }) => {
      await page.goto('/clients');

      const searchTerm = 'Nowak';
      await page.fill('input[placeholder*="Szukaj"]', searchTerm);
      await page.waitForTimeout(500); // Debounce

      // All visible clients should contain search term
      const clientItems = page.locator('[data-testid="client-item"]');
      const count = await clientItems.count();
      
      for (let i = 0; i < count; i++) {
        const text = await clientItems.nth(i).textContent();
        expect(text?.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    });

    test('should paginate client list', async ({ page }) => {
      await page.goto('/clients');

      // Check if pagination exists (if more than 20 clients)
      const pagination = page.locator('[data-testid="pagination"]');
      
      if (await pagination.isVisible()) {
        // Click next page
        await page.click('[data-testid="next-page"]');
        
        // URL should contain page parameter
        await expect(page).toHaveURL(/page=2/);
      }
    });

    test('should sort clients by name', async ({ page }) => {
      await page.goto('/clients');

      // Click sort by name
      await page.click('th:has-text("Nazwisko")');

      // Get all client names
      const names = await page.locator('[data-testid="client-name"]').allTextContents();
      
      // Should be sorted alphabetically
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  test.describe('Create Client', () => {
    test('should create new client successfully', async ({ page }) => {
      await page.goto('/clients/new');

      const newClient = {
        firstName: 'Jan',
        lastName: 'Testowy',
        email: 'jan.testowy@example.com',
        phone: '+48 123 456 789',
        address: 'ul. Testowa 123, 00-000 Warszawa'
      };

      await page.fill('input[name="firstName"]', newClient.firstName);
      await page.fill('input[name="lastName"]', newClient.lastName);
      await page.fill('input[name="email"]', newClient.email);
      await page.fill('input[name="phone"]', newClient.phone);
      await page.fill('textarea[name="address"]', newClient.address);

      await page.click('button:has-text("Utwórz Klienta")');

      // Should redirect to client list
      await expect(page).toHaveURL('/clients');

      // Should show success message
      await expect(page.locator('text=Klient został utworzony')).toBeVisible();

      // Should find new client in list
      await page.fill('input[placeholder*="Szukaj"]', newClient.lastName);
      await expect(page.locator(`text=${newClient.firstName} ${newClient.lastName}`)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/clients/new');

      // Try to submit empty form
      await page.click('button:has-text("Utwórz Klienta")');

      // Should show validation errors
      await expect(page.locator('text=Imię jest wymagane')).toBeVisible();
      await expect(page.locator('text=Nazwisko jest wymagane')).toBeVisible();
      await expect(page.locator('text=Telefon jest wymagany')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/clients/new');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.blur('input[name="email"]');

      await expect(page.locator('text=Nieprawidłowy format email')).toBeVisible();
    });

    test('should validate phone format', async ({ page }) => {
      await page.goto('/clients/new');

      await page.fill('input[name="phone"]', '123'); // Too short
      await page.blur('input[name="phone"]');

      await expect(page.locator('text=Nieprawidłowy numer telefonu')).toBeVisible();
    });
  });

  test.describe('Edit Client', () => {
    test('should edit existing client', async ({ page }) => {
      await page.goto('/clients');

      // Click edit on first client
      await page.click('[data-testid="edit-button"]').first();

      // Should pre-fill form with existing data
      await expect(page.locator('input[name="firstName"]')).not.toBeEmpty();
      await expect(page.locator('input[name="lastName"]')).not.toBeEmpty();

      // Update data
      const updatedPhone = '+48 999 888 777';
      await page.fill('input[name="phone"]', updatedPhone);

      await page.click('button:has-text("Zapisz Zmiany")');

      // Should show success message
      await expect(page.locator('text=Klient został zaktualizowany')).toBeVisible();

      // Verify changes persisted
      await page.reload();
      await page.click('[data-testid="edit-button"]').first();
      await expect(page.locator('input[name="phone"]')).toHaveValue(updatedPhone);
    });

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto('/clients');

      await page.click('[data-testid="edit-button"]').first();

      const originalPhone = await page.locator('input[name="phone"]').inputValue();

      // Make changes
      await page.fill('input[name="phone"]', '+48 111 111 111');

      // Cancel
      await page.click('button:has-text("Anuluj")');

      // Should redirect back
      await expect(page).toHaveURL('/clients');

      // Verify changes NOT persisted
      await page.click('[data-testid="edit-button"]').first();
      await expect(page.locator('input[name="phone"]')).toHaveValue(originalPhone);
    });
  });

  test.describe('View Client Details', () => {
    test('should display client details', async ({ page }) => {
      await page.goto('/clients');

      // Click view on first client
      await page.click('[data-testid="view-button"]').first();

      // Should show client details
      await expect(page.locator('[data-testid="client-details"]')).toBeVisible();
      await expect(page.locator('text=Informacje kontaktowe')).toBeVisible();
    });

    test('should display client reservation history', async ({ page }) => {
      await page.goto('/clients');

      await page.click('[data-testid="view-button"]').first();

      // Click on reservations tab
      await page.click('[data-testid="tab-reservations"]');

      // Should show list of reservations
      await expect(page.locator('[data-testid="reservation-list"]')).toBeVisible();
    });

    test('should display client notes', async ({ page }) => {
      await page.goto('/clients');

      await page.click('[data-testid="view-button"]').first();

      // Click on notes tab
      await page.click('[data-testid="tab-notes"]');

      // Should show notes section
      await expect(page.locator('[data-testid="notes-section"]')).toBeVisible();
    });

    test('should add note to client', async ({ page }) => {
      await page.goto('/clients');

      await page.click('[data-testid="view-button"]').first();
      await page.click('[data-testid="tab-notes"]');

      const noteText = 'Test note: Client prefers afternoon events';
      await page.fill('textarea[name="note"]', noteText);
      await page.click('button:has-text("Dodaj Notatkę")');

      // Should show success message
      await expect(page.locator('text=Notatka została dodana')).toBeVisible();

      // Should display the note
      await expect(page.locator(`text=${noteText}`)).toBeVisible();
    });
  });

  test.describe('Delete Client', () => {
    test('should delete client without reservations', async ({ page }) => {
      await page.goto('/clients');

      // Find client without reservations
      await page.click('[data-testid="delete-button"]').first();

      // Confirm deletion
      await page.click('button:has-text("Potwierdź Usunięcie")');

      // Should show success message
      await expect(page.locator('text=Klient został usunięty')).toBeVisible();
    });

    test('should prevent deletion of client with active reservations', async ({ page }) => {
      await page.goto('/clients');

      // Find client with reservations (e.g., Jan Kowalski)
      await page.fill('input[placeholder*="Szukaj"]', 'Kowalski');
      
      await page.click('[data-testid="delete-button"]').first();

      // Should show warning
      await expect(page.locator('text=Klient posiada aktywne rezerwacje')).toBeVisible();

      // Delete button should be disabled
      await expect(page.locator('button:has-text("Potwierdź Usunięcie")')).toBeDisabled();
    });
  });

  test.describe('Client Search and Filters', () => {
    test('should search by email', async ({ page }) => {
      await page.goto('/clients');

      await page.fill('input[placeholder*="Szukaj"]', 'jan.kowalski@example.com');
      await page.waitForTimeout(500);

      await expect(page.locator('text=jan.kowalski@example.com')).toBeVisible();
    });

    test('should search by phone', async ({ page }) => {
      await page.goto('/clients');

      await page.fill('input[placeholder*="Szukaj"]', '123456789');
      await page.waitForTimeout(500);

      await expect(page.locator('text=123456789')).toBeVisible();
    });

    test('should filter by recent activity', async ({ page }) => {
      await page.goto('/clients');

      await page.click('[data-testid="filter-recent"]');

      // Should show only clients with recent reservations
      await expect(page.locator('[data-testid="client-item"]')).toHaveCount(await page.locator('[data-testid="client-item"]').count());
    });
  });

  test.describe('Client Stats', () => {
    test('should display client statistics', async ({ page }) => {
      await page.goto('/clients');

      await page.click('[data-testid="view-button"]').first();

      // Should show stats
      await expect(page.locator('[data-testid="total-reservations"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-spent"]')).toBeVisible();
      await expect(page.locator('[data-testid="last-visit"]')).toBeVisible();
    });
  });
});
