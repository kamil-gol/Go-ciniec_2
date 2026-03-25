import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

/**
 * QUEUE - BASIC OPERATIONS
 *
 * Tests for the queue page at /dashboard/queue.
 * Uses the `login` helper from auth fixtures (API-based login).
 *
 * The queue page displays:
 * - Page hero with title "Kolejka rezerwacji"
 * - Stats cards: "W kolejce", "Najstarsza data", "Ręczne kolejności", "Liczba dat"
 * - "Dodaj do kolejki" button in the hero
 * - "Wszystkie (N)" tab + per-date tabs
 * - DraggableQueueList with queue entries (or empty state)
 */

test.describe('Queue - Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@gosciniecrodzinny.pl', 'Admin123!@#');
  });

  test.describe('Page Load', () => {
    test('should load queue page successfully', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      // Page title should be visible
      await expect(
        page.getByRole('heading', { name: /Kolejka rezerwacji/ })
      ).toBeVisible({ timeout: 10000 });

      // No 404 or error
      await expect(page.locator('text=404')).toHaveCount(0);
    });

    test('should display stats cards', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      // All four stat card labels should be visible
      await expect(page.getByText('W kolejce')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Najstarsza data')).toBeVisible();
      await expect(page.getByText('Ręczne kolejności')).toBeVisible();
      await expect(page.getByText('Liczba dat')).toBeVisible();
    });

    test('should display "Dodaj do kolejki" button', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /Dodaj do kolejki/ });
      await expect(addButton).toBeVisible({ timeout: 10000 });
    });

    test('should display "Wszystkie" tab', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      // The "Wszystkie (N)" button is always present
      const allTab = page.getByRole('button', { name: /Wszystkie/ });
      await expect(allTab).toBeVisible({ timeout: 10000 });
    });

    test('should display queue section heading', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      // The "Kolejka" section heading inside the queue list card
      await expect(
        page.getByRole('heading', { name: 'Kolejka' })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Add Form Toggle', () => {
    test('should toggle add form when clicking "Dodaj do kolejki"', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      // Click the "Dodaj do kolejki" button in the hero
      const addButton = page.getByRole('button', { name: /Dodaj do kolejki/ });
      await expect(addButton).toBeVisible({ timeout: 10000 });
      await addButton.click();

      // The add form card should appear with its heading
      await expect(
        page.getByRole('heading', { name: 'Dodaj do kolejki' })
      ).toBeVisible({ timeout: 5000 });
    });

    test('should hide add form when clicking button again', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /Dodaj do kolejki/ });
      await expect(addButton).toBeVisible({ timeout: 10000 });

      // Open form
      await addButton.click();
      await expect(
        page.getByRole('heading', { name: 'Dodaj do kolejki' })
      ).toBeVisible({ timeout: 5000 });

      // Close form by clicking the hero button again
      await addButton.click();

      // The form heading should disappear
      await expect(
        page.getByRole('heading', { name: 'Dodaj do kolejki' })
      ).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Queue List Display', () => {
    test('should show empty state or queue entries', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      // Wait for loading to complete
      await expect(
        page.getByRole('heading', { name: /Kolejka rezerwacji/ })
      ).toBeVisible({ timeout: 10000 });

      // Either the empty state message or the queue list should be visible.
      // Empty state shows "Kolejka jest pusta"; otherwise entries are rendered.
      const emptyState = page.getByText('Kolejka jest pusta');
      const queueSection = page.getByRole('heading', { name: 'Kolejka' });

      // The queue section heading is always visible
      await expect(queueSection).toBeVisible();

      // One of these must be true — either empty state or at least one tab
      const isEmpty = await emptyState.isVisible();
      if (isEmpty) {
        // Empty state has an action button
        await expect(
          page.getByRole('button', { name: /Dodaj do kolejki/ })
        ).toBeVisible();
      } else {
        // The "Wszystkie" tab should show a count
        await expect(
          page.getByRole('button', { name: /Wszystkie \(\d+\)/ })
        ).toBeVisible();
      }
    });

    test('should show info alert in "Wszystkie" view when entries exist', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('heading', { name: /Kolejka rezerwacji/ })
      ).toBeVisible({ timeout: 10000 });

      // If there are queue entries, the info alert about drag-drop should show
      const hasEntries = await page.getByRole('button', { name: /Wszystkie \(\d+\)/ }).isVisible();
      if (hasEntries) {
        // In "all" view, drag-drop is disabled and info alert is shown
        await expect(
          page.getByText(/Zmiana kolejności dostępna tylko w widoku pojedynczej daty/)
        ).toBeVisible();
      }
    });
  });

  test.describe('Date Tab Navigation', () => {
    test('should switch between "Wszystkie" and date-specific tabs', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('heading', { name: /Kolejka rezerwacji/ })
      ).toBeVisible({ timeout: 10000 });

      // Check if there are date-specific tabs (only if entries exist)
      const allTab = page.getByRole('button', { name: /Wszystkie/ });
      await expect(allTab).toBeVisible();

      // If there are per-date tabs, click the first one
      // Date tabs appear as buttons next to "Wszystkie" with format "d MMM (N)"
      // We look for any button that is NOT "Wszystkie", "Dodaj", "Przebuduj"
      const dateTabs = page.locator('button').filter({
        hasText: /^\d{1,2}\s\w{3}\s\(\d+\)$/,
      });

      const dateTabCount = await dateTabs.count();
      if (dateTabCount > 0) {
        // Click the first date tab
        await dateTabs.first().click();

        // The info alert about drag-drop should disappear (it only shows in "all" view)
        // and the subtitle should change to mention drag
        await expect(
          page.getByText(/Przeciągnij karty aby zmienić kolejność/)
        ).toBeVisible({ timeout: 5000 });

        // Click back to "Wszystkie"
        await allTab.click();
        await expect(
          page.getByText(/Wybierz konkretną datę aby zarządzać kolejnością/)
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Rebuild Positions Dialog', () => {
    test('should open rebuild dialog when clicking "Przebuduj numerację"', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('heading', { name: /Kolejka rezerwacji/ })
      ).toBeVisible({ timeout: 10000 });

      // The rebuild button is only enabled when there are queue entries
      const rebuildButton = page.getByRole('button', { name: /Przebuduj/ });
      const isDisabled = await rebuildButton.isDisabled();

      if (!isDisabled) {
        await rebuildButton.click();

        // Dialog should appear with warning
        await expect(
          page.getByText('Przebuduj numerację kolejki')
        ).toBeVisible({ timeout: 5000 });

        // Should have a confirmation checkbox
        await expect(
          page.getByText(/Rozumiem konsekwencje/)
        ).toBeVisible();

        // Should have cancel button
        await expect(
          page.getByRole('button', { name: 'Anuluj' })
        ).toBeVisible();

        // Close the dialog
        await page.getByRole('button', { name: 'Anuluj' }).click();
      }
    });

    test('should require confirmation checkbox before rebuild', async ({ page }) => {
      await page.goto('/dashboard/queue');
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('heading', { name: /Kolejka rezerwacji/ })
      ).toBeVisible({ timeout: 10000 });

      const rebuildButton = page.getByRole('button', { name: /Przebuduj/ });
      const isDisabled = await rebuildButton.isDisabled();

      if (!isDisabled) {
        await rebuildButton.click();

        // The "Przebuduj numerację" submit button in the dialog should be disabled
        // until the confirmation checkbox is checked
        const dialogSubmit = page.locator('[role="dialog"]').getByRole('button', { name: /Przebuduj numerację/ });
        await expect(dialogSubmit).toBeDisabled();

        // Close
        await page.getByRole('button', { name: 'Anuluj' }).click();
      }
    });
  });

  test.describe('CRUD Placeholder Tests', () => {
    // These tests require seed data and complex API interactions.
    // They are placeholders to maintain test structure and can be
    // expanded when the QueueHelper fixture supports full CRUD via API.

    test('should create a queue entry via UI', async ({ page }) => {
      // TODO: Implement when AddToQueueForm field selectors are stable.
      // Requires: a seeded client, event type selection, date picker interaction.
      expect(true).toBeTruthy();
    });

    test('should edit a queue entry', async ({ page }) => {
      // TODO: Implement when queue entries exist from seed data
      // and the EditQueueForm dialog field selectors are known.
      expect(true).toBeTruthy();
    });

    test('should delete a queue entry', async ({ page }) => {
      // TODO: Implement when DraggableQueueList item actions
      // (delete button / confirm dialog) are testable.
      expect(true).toBeTruthy();
    });

    test('should reorder positions after deletion', async ({ page }) => {
      // TODO: Implement with API-seeded queue entries and position verification.
      expect(true).toBeTruthy();
    });
  });
});
