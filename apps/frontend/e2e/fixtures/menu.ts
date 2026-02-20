import { Page, expect } from '@playwright/test';

/**
 * Menu helpers for E2E tests.
 *
 * Menu management: /dashboard/menu
 * Menu selection: Step 4 of reservation create wizard ("Menu i ceny")
 *
 * API endpoints:
 * - GET  /api/menu/templates
 * - POST /api/menu/templates
 * - GET  /api/menu/packages/:templateId
 * - GET  /api/menu/options
 * - POST /api/reservations/:id/menu
 */
export class MenuHelper {
  constructor(private page: Page) {}

  // ── Navigation ──────────────────────────────────────────────────────

  async goToMenuManagement() {
    await this.page.goto('/dashboard/menu');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async goToReservationsList() {
    await this.page.goto('/dashboard/reservations/list');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Menu Templates ────────────────────────────────────────────────

  async waitForTemplatesLoaded() {
    // Wait for any skeleton/loading to disappear or content to appear
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTemplateCards() {
    return this.page.locator('[data-testid^="template-card-"], .template-card, [class*="Card"]');
  }

  async clickCreateTemplate() {
    // Look for "Nowy szablon" or "Dodaj" button
    const createBtn = this.page.locator('button:has-text("Nowy szablon"), button:has-text("Dodaj szablon"), button:has-text("Dodaj")');
    await createBtn.first().click();
  }

  async fillTemplateForm(data: {
    name: string;
    description?: string;
    variant?: string;
  }) {
    await this.page.fill('input[name="name"], input[placeholder*="nazwa"], input[placeholder*="Nazwa"]', data.name);
    if (data.description) {
      await this.page.fill('textarea[name="description"], textarea[placeholder*="opis"], input[name="description"]', data.description);
    }
    if (data.variant) {
      await this.page.fill('input[name="variant"], input[placeholder*="wariant"]', data.variant);
    }
  }

  async submitTemplateForm() {
    await this.page.click('button[type="submit"], button:has-text("Zapisz"), button:has-text("Utwórz")');
  }

  // ── Menu Selection in Reservation Wizard ───────────────────────────

  async openReservationCreateForm() {
    await this.page.click('button:has-text("Nowa Rezerwacja")');
    await this.page.waitForTimeout(500);
  }

  async navigateToMenuStep() {
    // The reservation wizard is: Wydarzenie → Sala i termin → Goście → Menu i ceny → Klient → Podsumowanie
    // We need to navigate to step 4 (Menu i ceny)
    // Click on the step indicator if available
    const menuStep = this.page.locator('text=Menu i ceny, text=Menu');
    if (await menuStep.isVisible().catch(() => false)) {
      await menuStep.first().click();
    }
  }

  async selectTemplate(templateName: string) {
    await this.page.click(`text=${templateName}`);
    await this.page.waitForTimeout(300);
  }

  async selectPackage(packageName: string) {
    await this.page.click(`text=${packageName}`);
    await this.page.waitForTimeout(300);
  }

  async confirmDishes() {
    await this.page.click('button:has-text("Zatwierdź wybór")');
    await this.page.waitForTimeout(300);
  }

  async confirmOptions() {
    await this.page.click('button:has-text("Zatwierdź wybór")');
    await this.page.waitForTimeout(300);
  }

  // ── API Helpers ───────────────────────────────────────────────────

  async createTemplateViaAPI(data: {
    name: string;
    eventTypeId: string;
    variant?: string;
    validFrom?: string;
  }): Promise<string> {
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    const cookies = await this.page.context().cookies();
    const tokenCookie = cookies.find(c => c.name === 'token' || c.name === 'auth-token' || c.name === 'next-auth.session-token');

    const response = await this.page.request.post(`${baseURL}/api/menu/templates`, {
      data: {
        name: data.name,
        eventTypeId: data.eventTypeId,
        variant: data.variant || 'Standard',
        validFrom: data.validFrom || new Date().toISOString(),
        isActive: true,
        displayOrder: 1,
      },
    });

    const json = await response.json();
    return json.data?.id || json.id;
  }

  async deleteTemplateViaAPI(templateId: string) {
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    await this.page.request.delete(`${baseURL}/api/menu/templates/${templateId}`);
  }

  async getTemplatesViaAPI(): Promise<any[]> {
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    const response = await this.page.request.get(`${baseURL}/api/menu/templates`);
    const json = await response.json();
    return json.data || json || [];
  }

  async getEventTypesViaAPI(): Promise<any[]> {
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    const response = await this.page.request.get(`${baseURL}/api/event-types`);
    const json = await response.json();
    return json.data || json || [];
  }
}
