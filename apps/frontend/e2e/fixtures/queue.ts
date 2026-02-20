import { Page, expect } from '@playwright/test';
import { TEST_QUEUE_ENTRIES, getFutureDate } from './test-data';

/**
 * Queue helpers for E2E tests
 */
export class QueueHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to queue page
   */
  async goToQueue() {
    await this.page.goto('/queue');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add entry to queue via UI
   */
  async addEntryViaUI(data: Partial<typeof TEST_QUEUE_ENTRIES[0]>) {
    await this.page.click('button:has-text("Dodaj do kolejki")');
    
    // Fill fields
    if (data.clientId) {
      await this.page.selectOption('select[name="clientId"]', data.clientId);
    }
    
    if (data.reservationQueueDate) {
      await this.page.fill('input[name="reservationQueueDate"]', data.reservationQueueDate);
    }
    
    if (data.eventTypeId) {
      await this.page.selectOption('select[name="eventTypeId"]', data.eventTypeId);
    }
    
    if (data.adults !== undefined) {
      await this.page.fill('input[name="adults"]', data.adults.toString());
    }
    
    if (data.children !== undefined) {
      await this.page.fill('input[name="children"]', data.children.toString());
    }
    
    if (data.toddlers !== undefined) {
      await this.page.fill('input[name="toddlers"]', data.toddlers.toString());
    }
    
    if (data.notes) {
      await this.page.fill('textarea[name="notes"]', data.notes);
    }
    
    // Conditional fields
    if ('birthdayAge' in data && data.birthdayAge) {
      await this.page.fill('input[name="birthdayAge"]', data.birthdayAge.toString());
    }
    
    // Submit
    await this.page.click('button[type="submit"]');
    
    // Wait for success
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Add entry to queue via API
   */
  async addEntryViaAPI(data: Partial<typeof TEST_QUEUE_ENTRIES[0]>) {
    const response = await this.page.request.post(
      `${process.env.NEXT_PUBLIC_API_URL}/queue`,
      {
        data: {
          ...TEST_QUEUE_ENTRIES[0],
          ...data,
          reservationQueueDate: data.reservationQueueDate || getFutureDate(15),
          status: 'RESERVED',
        },
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to add queue entry: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Get queue entries for a specific date
   */
  async getEntriesForDate(date: string) {
    await this.page.goto(`/queue?date=${date}`);
    await this.page.waitForLoadState('networkidle');
    
    const entries = await this.page.locator('[data-queue-entry]').all();
    return entries;
  }

  /**
   * Drag and drop to reorder
   */
  async dragAndDrop(sourceId: string, targetId: string) {
    const source = this.page.locator(`[data-queue-entry-id="${sourceId}"]`);
    const target = this.page.locator(`[data-queue-entry-id="${targetId}"]`);
    
    await source.dragTo(target);
    
    // Wait for API call to complete
    await this.page.waitForResponse(response => 
      response.url().includes('/queue/swap') && response.status() === 200
    );
  }

  /**
   * Verify loading state during drag & drop
   */
  async verifyLoadingState() {
    // Check loading overlay
    await expect(this.page.locator('.loading-overlay')).toBeVisible();
    
    // Check disabled state
    const entries = await this.page.locator('[data-queue-entry]').all();
    for (const entry of entries) {
      await expect(entry).toHaveAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Get position of queue entry
   */
  async getPosition(entryId: string): Promise<number> {
    const positionText = await this.page.textContent(
      `[data-queue-entry-id="${entryId}"] [data-testid="position"]`
    );
    return parseInt(positionText || '0', 10);
  }

  /**
   * Get all positions for a date (to verify no gaps/duplicates)
   */
  async getAllPositions(date: string): Promise<number[]> {
    await this.getEntriesForDate(date);
    
    const positions: number[] = [];
    const entries = await this.page.locator('[data-queue-entry]').all();
    
    for (const entry of entries) {
      const posText = await entry.locator('[data-testid="position"]').textContent();
      positions.push(parseInt(posText || '0', 10));
    }
    
    return positions.sort((a, b) => a - b);
  }

  /**
   * Promote queue entry to full reservation
   */
  async promoteToReservation(entryId: string, hallId: string, startTime: string, endTime: string) {
    // Click promote button
    await this.page.click(`[data-queue-entry-id="${entryId}"] button:has-text("Awansuj")`);
    
    // Wait for form to open with pre-filled data
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
    
    // Fill additional required fields
    await this.page.selectOption('select[name="hallId"]', hallId);
    await this.page.fill('input[name="startTime"]', startTime);
    await this.page.fill('input[name="endTime"]', endTime);
    
    // Submit
    await this.page.click('button:has-text("Utwórz rezerwację")');
    
    // Wait for success
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Edit queue entry
   */
  async editEntry(entryId: string, data: Partial<typeof TEST_QUEUE_ENTRIES[0]>) {
    await this.page.click(`[data-queue-entry-id="${entryId}"] button:has-text("Edytuj")`);
    
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
    
    // Submit
    await this.page.click('button[type="submit"]');
    
    // Wait for success
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Delete queue entry
   */
  async deleteEntry(entryId: string, reason: string) {
    await this.page.click(`[data-queue-entry-id="${entryId}"] button:has-text("Usuń")`);
    
    // Fill reason
    await this.page.fill('textarea[name="reason"]', reason);
    
    // Confirm
    await this.page.click('button:has-text("Potwierdź usunięcie")');
    
    // Wait for success
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get statistics for date
   */
  async getStatistics(date: string) {
    await this.getEntriesForDate(date);
    
    const totalEntries = await this.page.textContent('[data-testid="total-entries"]');
    const totalGuests = await this.page.textContent('[data-testid="total-guests"]');
    
    return {
      entries: parseInt(totalEntries || '0', 10),
      guests: parseInt(totalGuests || '0', 10),
    };
  }

  /**
   * Check if entry exists
   */
  async entryExists(entryId: string): Promise<boolean> {
    return await this.page.locator(`[data-queue-entry-id="${entryId}"]`).isVisible();
  }

  /**
   * Verify entry was auto-cancelled
   */
  async verifyAutoCancelled(entryId: string) {
    const entry = this.page.locator(`[data-queue-entry-id="${entryId}"]`);
    await expect(entry).toHaveClass(/cancelled/);
    
    const status = await entry.locator('[data-testid="status-badge"]').textContent();
    expect(status).toContain('CANCELLED');
  }
}
