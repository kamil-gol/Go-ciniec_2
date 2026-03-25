import { Page, expect } from '@playwright/test';

/**
 * Menu helpers for E2E tests.
 *
 * Menu management: /dashboard/menu
 * Menu selection: Step 4 of reservation create wizard ("Menu i ceny")
 *
 * API endpoints:
 * - GET  /api/menu-templates
 * - POST /api/menu-templates
 * - GET  /api/menu-packages/template/:templateId
 * - GET  /api/service-extras/items
 * - POST /api/reservations/:id/select-menu
 */

/**
 * Safely parse JSON from a Playwright API response.
 * Returns null if the response is not JSON (e.g. HTML error page).
 */
export async function safeJson(response: { ok(): boolean; text(): Promise<string> }): Promise<any | null> {
  try {
    const text = await response.text();
    if (text.trimStart().startsWith('<')) return null; // HTML response
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTemplateCards() {
    return this.page.locator('[data-testid^="template-card-"], .template-card, [class*="Card"]');
  }

  async clickCreateTemplate() {
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

  private get baseURL() {
    return process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  }

  /** Returns true if the menu API is available (not returning HTML). */
  async isMenuApiAvailable(): Promise<boolean> {
    try {
      const resp = await this.page.request.get(`${this.baseURL}/api/menu-templates`);
      const json = await safeJson(resp);
      return json !== null;
    } catch {
      return false;
    }
  }

  async createTemplateViaAPI(data: {
    name: string;
    eventTypeId: string;
    variant?: string;
    validFrom?: string;
  }): Promise<string | null> {
    const response = await this.page.request.post(`${this.baseURL}/api/menu-templates`, {
      data: {
        name: data.name,
        eventTypeId: data.eventTypeId,
        variant: data.variant || 'Standard',
        validFrom: data.validFrom || new Date().toISOString(),
        isActive: true,
        displayOrder: 1,
      },
    });

    const json = await safeJson(response);
    if (!json) return null;
    return json.data?.id || json.id || null;
  }

  async deleteTemplateViaAPI(templateId: string) {
    await this.page.request.delete(`${this.baseURL}/api/menu-templates/${templateId}`);
  }

  async getTemplatesViaAPI(): Promise<any[] | null> {
    const response = await this.page.request.get(`${this.baseURL}/api/menu-templates`);
    const json = await safeJson(response);
    if (!json) return null;
    return json.data || json || [];
  }

  async getEventTypesViaAPI(): Promise<any[] | null> {
    const response = await this.page.request.get(`${this.baseURL}/api/event-types`);
    const json = await safeJson(response);
    if (!json) return null;
    return json.data || json || [];
  }

  async getPackagesViaAPI(templateId: string): Promise<any[] | null> {
    const response = await this.page.request.get(`${this.baseURL}/api/menu-packages/template/${templateId}`);
    const json = await safeJson(response);
    if (!json) return null;
    return json.data || json || [];
  }

  /**
   * Fetches service-extras items (replacement for old menu options).
   * Maps fields to the shape expected by calculator tests:
   *   name, priceType (PER_PERSON | FLAT | PER_UNIT), priceAmount (= unitPrice)
   */
  async getOptionsViaAPI(): Promise<any[] | null> {
    const response = await this.page.request.get(`${this.baseURL}/api/service-extras/items`);
    const json = await safeJson(response);
    if (!json) return null;
    const items = json.data || json || [];
    // Normalize: backend uses basePrice, tests expect priceAmount
    return items.map((item: any) => ({
      ...item,
      priceAmount: item.priceAmount ?? item.unitPrice ?? item.basePrice,
    }));
  }
}
