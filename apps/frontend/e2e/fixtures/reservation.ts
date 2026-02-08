import { Page, expect } from '@playwright/test';
import { TEST_RESERVATIONS, getFutureDate } from './test-data';

/**
 * Reservation helpers for E2E tests
 */
export class ReservationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to reservations list
   */
  async goToList() {
    await this.page.goto('/reservations');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create reservation via UI
   */
  async createViaUI(data: Partial<typeof TEST_RESERVATIONS.pending>) {
    await this.page.goto('/reservations/new');
    
    // Fill basic fields
    if (data.clientId) {
      await this.page.selectOption('select[name="clientId"]', data.clientId);
    }
    
    if (data.hallId) {
      await this.page.selectOption('select[name="hallId"]', data.hallId);
    }
    
    if (data.eventTypeId) {
      await this.page.selectOption('select[name="eventTypeId"]', data.eventTypeId);
    }
    
    if (data.date) {
      await this.page.fill('input[name="date"]', data.date);
    }
    
    if (data.startTime) {
      await this.page.fill('input[name="startTime"]', data.startTime);
    }
    
    if (data.endTime) {
      await this.page.fill('input[name="endTime"]', data.endTime);
    }
    
    // Fill guest numbers
    if (data.adults !== undefined) {
      await this.page.fill('input[name="adults"]', data.adults.toString());
    }
    
    if (data.children !== undefined) {
      await this.page.fill('input[name="children"]', data.children.toString());
    }
    
    if (data.babies !== undefined) {
      await this.page.fill('input[name="babies"]', data.babies.toString());
    }
    
    // Conditional fields
    if ('birthdayAge' in data && data.birthdayAge) {
      await this.page.fill('input[name="birthdayAge"]', data.birthdayAge.toString());
    }
    
    if ('anniversaryType' in data && data.anniversaryType) {
      await this.page.fill('input[name="anniversaryType"]', data.anniversaryType);
    }
    
    if ('anniversaryYears' in data && data.anniversaryYears) {
      await this.page.fill('input[name="anniversaryYears"]', data.anniversaryYears.toString());
    }
    
    if (data.notes) {
      await this.page.fill('textarea[name="notes"]', data.notes);
    }
    
    // Submit
    await this.page.click('button[type="submit"]');
    
    // Wait for success
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Create reservation via API
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
   * Edit reservation
   */
  async edit(reservationId: string, data: Partial<typeof TEST_RESERVATIONS.pending>, reason: string) {
    // Open edit modal
    await this.page.click(`[data-reservation-id="${reservationId}"] button:has-text("Edytuj")`);
    
    // Update fields
    if (data.adults !== undefined) {
      await this.page.fill('input[name="adults"]', data.adults.toString());
    }
    
    if (data.children !== undefined) {
      await this.page.fill('input[name="children"]', data.children.toString());
    }
    
    if (data.notes) {
      await this.page.fill('textarea[name="notes"]', data.notes);
    }
    
    // Fill reason (required for edit)
    await this.page.fill('textarea[name="reason"]', reason);
    
    // Submit
    await this.page.click('button[type="submit"]');
    
    // Wait for success
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Cancel reservation
   */
  async cancel(reservationId: string, reason: string) {
    await this.page.click(`[data-reservation-id="${reservationId}"] button:has-text("Anuluj")`);
    
    // Fill cancellation reason
    await this.page.fill('textarea[name="cancellationReason"]', reason);
    
    // Confirm
    await this.page.click('button:has-text("Potwierdź anulowanie")');
    
    // Wait for success
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  }

  /**
   * View reservation details
   */
  async viewDetails(reservationId: string) {
    await this.page.click(`[data-reservation-id="${reservationId}"]`);
    
    // Wait for modal to open
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
  }

  /**
   * Apply filters
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
   * Get reservation count from UI
   */
  async getCount(): Promise<number> {
    const countText = await this.page.textContent('[data-testid="reservation-count"]');
    return parseInt(countText || '0', 10);
  }

  /**
   * Check if reservation exists in list
   */
  async exists(reservationId: string): Promise<boolean> {
    return await this.page.locator(`[data-reservation-id="${reservationId}"]`).isVisible();
  }

  /**
   * Get reservation status from UI
   */
  async getStatus(reservationId: string): Promise<string> {
    const statusElement = this.page.locator(
      `[data-reservation-id="${reservationId}"] [data-testid="status-badge"]`
    );
    return await statusElement.textContent() || '';
  }

  /**
   * Verify price calculation
   */
  async verifyPriceCalculation(expectedPrice: number) {
    const priceText = await this.page.textContent('[data-testid="calculated-price"]');
    const actualPrice = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
    expect(actualPrice).toBe(expectedPrice);
  }
}
