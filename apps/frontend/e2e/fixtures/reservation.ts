import { Page, expect } from '@playwright/test';
import { TEST_RESERVATIONS, getFutureDate } from './test-data';
import { WizardHelper } from './wizard';

/**
 * Reservation helpers for E2E tests.
 * Updated for the 6-step wizard with Radix UI components.
 */
export class ReservationHelper {
  public wizard: WizardHelper;

  constructor(private page: Page) {
    this.wizard = new WizardHelper(page);
  }

  /**
   * Navigate to reservations list
   */
  async goToList() {
    await this.page.goto('/reservations');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create reservation via the 6-step wizard UI.
   * This is the primary way to test the new form.
   */
  async createViaUI(data: {
    eventType?: string;
    hall?: string;
    dateDay?: number;
    startTime?: string;
    adults?: number;
    children?: number;
    babies?: number;
    useMenuPackage?: boolean;
    menuTemplate?: string;
    menuPackage?: string;
    clientName?: string;
    notes?: string;
    birthdayAge?: string;
    anniversaryType?: string;
    anniversaryYears?: string;
  }) {
    await this.page.goto('/reservations/new');
    await this.page.waitForLoadState('networkidle');

    await this.wizard.completeFullWizard({
      eventType: data.eventType || 'Wesele',
      hall: data.hall || 'Sala Główna',
      dateDay: data.dateDay || 20,
      startTime: data.startTime || '14:00',
      adults: (data.adults || 80).toString(),
      children: (data.children || 10).toString(),
      babies: (data.babies || 5).toString(),
      useMenuPackage: data.useMenuPackage,
      menuTemplate: data.menuTemplate,
      menuPackage: data.menuPackage,
      clientName: data.clientName || 'Jan Kowalski',
      notes: data.notes,
      birthdayAge: data.birthdayAge,
      anniversaryType: data.anniversaryType,
      anniversaryYears: data.anniversaryYears,
    });
  }

  /**
   * Create reservation via API (unchanged — doesn't depend on UI).
   */
  async createViaAPI(data: Partial<typeof TEST_RESERVATIONS.pending>) {
    const response = await this.page.request.post(
      `${process.env.NEXT_PUBLIC_API_URL}/reservations`,
      {
        data: {
          ...TEST_RESERVATIONS.pending,
          ...data,
          date: data.date || getFutureDate(30),
        },
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to create reservation: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Edit reservation.
   */
  async edit(reservationId: string, data: Partial<typeof TEST_RESERVATIONS.pending>, reason: string) {
    await this.page.click(`[data-reservation-id="${reservationId}"] button:has-text("Edytuj")`);

    if (data.adults !== undefined) {
      await this.page.fill('input[name="adults"]', data.adults.toString());
    }

    if (data.children !== undefined) {
      await this.page.fill('input[name="children"]', data.children.toString());
    }

    if (data.notes) {
      await this.page.fill('textarea[name="notes"]', data.notes);
    }

    await this.page.fill('textarea[name="reason"]', reason);
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator('.toast-success, [data-sonner-toast]')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Cancel reservation.
   */
  async cancel(reservationId: string, reason: string) {
    await this.page.click(`[data-reservation-id="${reservationId}"] button:has-text("Anuluj")`);
    await this.page.fill('textarea[name="cancellationReason"]', reason);
    await this.page.click('button:has-text("Potwierdź anulowanie")');
    await expect(this.page.locator('.toast-success, [data-sonner-toast]')).toBeVisible({ timeout: 5000 });
  }

  /**
   * View reservation details.
   */
  async viewDetails(reservationId: string) {
    await this.page.click(`[data-reservation-id="${reservationId}"]`);
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
  }

  /**
   * Apply filters on the reservation list page.
   */
  async applyFilters(filters: {
    status?: string;
    hallId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    if (filters.status) {
      await this.page.selectOption('select[name="statusFilter"]', filters.status);
    }

    if (filters.hallId) {
      await this.page.selectOption('select[name="hallFilter"]', filters.hallId);
    }

    if (filters.dateFrom) {
      await this.page.fill('input[name="dateFrom"]', filters.dateFrom);
    }

    if (filters.dateTo) {
      await this.page.fill('input[name="dateTo"]', filters.dateTo);
    }

    await this.page.click('button:has-text("Zastosuj filtry")');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get reservation count from UI.
   */
  async getCount(): Promise<number> {
    const countText = await this.page.textContent('[data-testid="reservation-count"]');
    return parseInt(countText || '0', 10);
  }

  /**
   * Check if reservation exists in list.
   */
  async exists(reservationId: string): Promise<boolean> {
    return await this.page.locator(`[data-reservation-id="${reservationId}"]`).isVisible();
  }

  /**
   * Get reservation status from UI.
   */
  async getStatus(reservationId: string): Promise<string> {
    const statusElement = this.page.locator(
      `[data-reservation-id="${reservationId}"] [data-testid="status-badge"]`
    );
    return await statusElement.textContent() || '';
  }

  /**
   * Verify price calculation in the wizard summary or financial summary.
   */
  async verifyPriceCalculation(expectedPrice: number) {
    const priceText = await this.page.textContent('[data-testid="calculated-price"], [data-testid="total-price"]');
    const actualPrice = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
    expect(actualPrice).toBe(expectedPrice);
  }
}
