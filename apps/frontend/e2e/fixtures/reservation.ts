import { Page, expect } from '@playwright/test';

/**
 * Reservation helpers for E2E tests.
 *
 * The reservations page is at /dashboard/reservations/list.
 * Create form opens inline via "Nowa Rezerwacja" button (no separate /new page).
 * Form is a 6-step wizard: Wydarzenie → Sala i termin → Go\u015bcie → Menu i ceny → Klient → Podsumowanie.
 * Navigation: "Dalej" / "Wstecz" buttons, final submit: "Utw\u00f3rz Rezerwacj\u0119".
 */
export class ReservationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to reservations list page
   */
  async goToList() {
    await this.page.goto('/dashboard/reservations/list');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open create reservation form (inline on list page)
   */
  async openCreateForm() {
    await this.page.click('button:has-text("Nowa Rezerwacja")');
    // Wait for stepper to appear (form animates in)
    await expect(
      this.page.locator('text=Nowa Rezerwacja').nth(1)
    ).toBeVisible({ timeout: 3000 });
  }

  /**
   * Close create form via cancel link
   */
  async cancelCreateForm() {
    await this.page.click('button:has-text("Anuluj tworzenie rezerwacji")');
  }

  /**
   * Click "Dalej" to go to next step
   */
  async nextStep() {
    await this.page.click('button:has-text("Dalej")');
  }

  /**
   * Click "Wstecz" to go to previous step
   */
  async prevStep() {
    await this.page.click('button:has-text("Wstecz")');
  }

  /**
   * Check if a specific step title is visible in stepper
   */
  async isStepVisible(stepTitle: string): Promise<boolean> {
    return await this.page.locator(`text=${stepTitle}`).first().isVisible();
  }

  /**
   * Get the number of stat cards on the page
   */
  async getStatsCount(): Promise<number> {
    // Stats are rendered as StatCard components in a grid
    // Each has a label like "Wszystkie", "Potwierdzone", "Oczekuj\u0105ce", "Ten miesi\u0105c"
    const statsGrid = this.page.locator('.grid.grid-cols-2');
    return await statsGrid.locator('> div').count();
  }

  /**
   * Check if view toggle exists (Lista / Kalendarz)
   */
  async hasViewToggle(): Promise<boolean> {
    const listaLink = this.page.locator('text=Lista');
    const kalendarLink = this.page.locator('a:has-text("Kalendarz")');
    return (await listaLink.isVisible()) && (await kalendarLink.isVisible());
  }
}
