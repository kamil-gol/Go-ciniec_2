import { test, expect } from '@playwright/test';

/**
 * VISUAL REGRESSION TESTS
 *
 * Porownuje screenshoty kluczowych widokow z baseline (golden files).
 * Przy pierwszym uruchomieniu Playwright automatycznie tworzy pliki referencyjne.
 * Kolejne uruchomienia porownuja z baseline i raportuja roznice.
 *
 * Aby zaktualizowac baseline:
 *   npx playwright test specs/12-visual-regression.spec.ts --update-snapshots
 *
 * UWAGA: Nie uzywamy waitForLoadState('networkidle') — moze wisiec
 * na mobilnym Safari (patrz auth.fixture.ts).
 */

const SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.05,
  fullPage: true,
};

/**
 * Czeka az strona sie ustabilizuje po nawigacji.
 * Uzywa domcontentloaded + dodatkowy timeout na animacje/renderowanie.
 */
async function waitForPageStable(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  // Daj czas na renderowanie komponentow i zakonczenie animacji CSS
  await page.waitForTimeout(1000);
}

test.describe('Visual Regression - Strona logowania', () => {
  test('strona logowania renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/login');
    await waitForPageStable(page);

    await expect(page).toHaveScreenshot('login-page.png', SNAPSHOT_OPTIONS);
  });
});

test.describe('Visual Regression - Dashboard', () => {
  test('dashboard renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageStable(page);

    // Poczekaj na zaladowanie naglowka powitalnego
    await expect(
      page.getByRole('heading', { name: /Witaj/ })
    ).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('dashboard.png', SNAPSHOT_OPTIONS);
  });

  test('dashboard dark mode renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageStable(page);

    await expect(
      page.getByRole('heading', { name: /Witaj/ })
    ).toBeVisible({ timeout: 10000 });

    // Przelacz na dark mode — szukamy przycisku toggle motywu
    const themeToggle = page.locator(
      'button[aria-label*="motyw"], button[aria-label*="theme"], button[aria-label*="tryb"], [data-testid="theme-toggle"]'
    );

    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    } else {
      // Fallback: wymus dark mode przez CSS prefers-color-scheme
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('dashboard-dark.png', SNAPSHOT_OPTIONS);
  });
});

test.describe('Visual Regression - Rezerwacje', () => {
  test('kalendarz rezerwacji renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/dashboard/reservations/calendar');
    await waitForPageStable(page);

    // Poczekaj na kalendarz
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('reservations-calendar.png', SNAPSHOT_OPTIONS);
  });

  test('lista rezerwacji renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/dashboard/reservations/list');
    await waitForPageStable(page);

    await expect(page).toHaveScreenshot('reservations-list.png', SNAPSHOT_OPTIONS);
  });

  test('formularz nowej rezerwacji renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/dashboard/reservations');
    await waitForPageStable(page);

    // Szukaj przycisku "Nowa rezerwacja" / "Dodaj" i kliknij
    const newReservationBtn = page.locator(
      'a:has-text("Nowa rezerwacja"), button:has-text("Nowa rezerwacja"), a:has-text("Dodaj"), button:has-text("Dodaj rezerwacj")'
    );

    if (await newReservationBtn.first().isVisible().catch(() => false)) {
      await newReservationBtn.first().click();
      await waitForPageStable(page);
    }

    await expect(page).toHaveScreenshot('reservation-form.png', SNAPSHOT_OPTIONS);
  });
});

test.describe('Visual Regression - Klienci', () => {
  test('lista klientow renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await waitForPageStable(page);

    await expect(page).toHaveScreenshot('clients-list.png', SNAPSHOT_OPTIONS);
  });
});

test.describe('Visual Regression - Ustawienia', () => {
  test('panel ustawien - zakladka uzytkownicy', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageStable(page);

    // Domyslnie otwarta jest zakladka "users"
    await expect(page).toHaveScreenshot('settings-users.png', SNAPSHOT_OPTIONS);
  });

  test('panel ustawien - zakladka role', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageStable(page);

    // Kliknij zakladke "Role i uprawnienia"
    const rolesTab = page.locator('[value="roles"]');
    await rolesTab.click();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('settings-roles.png', SNAPSHOT_OPTIONS);
  });
});

test.describe('Visual Regression - Kolejka', () => {
  test('widok kolejki renderuje sie poprawnie', async ({ page }) => {
    await page.goto('/dashboard/queue');
    await waitForPageStable(page);

    await expect(page).toHaveScreenshot('queue.png', SNAPSHOT_OPTIONS);
  });
});
