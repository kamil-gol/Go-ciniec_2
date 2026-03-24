/**
 * Email Helpers
 * Extracted from email.service.ts — company info, template rendering, formatting utils
 */

import { marked } from 'marked';
import logger from '@utils/logger';
import companySettingsService from '../company-settings.service';
import documentTemplateService from '../document-template.service';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface CompanyInfo {
  name: string;
  footerText: string;
}

// ═══════════════════════════════════════════
// Company Info Helper
// ═══════════════════════════════════════════

/**
 * Fetch company name from DB for email templates.
 * Falls back to 'Go\u015bciniec' if DB is unavailable.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const settings = await companySettingsService.getSettings();
    const name = settings.companyName || 'Go\u015bciniec';
    return {
      name,
      footerText: `Ta wiadomo\u015b\u0107 zosta\u0142a wys\u0142ana automatycznie z systemu rezerwacji ${name}.`,
    };
  } catch {
    return {
      name: 'Go\u015bciniec',
      footerText: 'Ta wiadomo\u015b\u0107 zosta\u0142a wys\u0142ana automatycznie z systemu rezerwacji Go\u015bciniec.',
    };
  }
}

// ═══════════════════════════════════════════
// Template Rendering
// ═══════════════════════════════════════════

/**
 * Try to render email body from DocumentTemplate (DB-editable).
 * Falls back to hardcoded HTML if template not found.
 */
export async function renderEmailTemplate(
  slug: string,
  variables: Record<string, string>,
  fallbackHtml: string
): Promise<string> {
  try {
    const result = await documentTemplateService.preview(slug, variables);
    // Remove unfilled optional variables (e.g. empty sections)
    const cleaned = result.content.replace(/\{\{\w+\}\}/g, '');
    return await marked.parse(cleaned);
  } catch {
    logger.debug(`[Email] Template "${slug}" not found in DB, using fallback`);
    return fallbackHtml;
  }
}

// ═══════════════════════════════════════════
// Formatting Helpers
// ═══════════════════════════════════════════

/**
 * #139: Format extras price cell per price type
 * - PER_UNIT:   "80 szt. \u00d7 15 z\u0142 = 1 200 z\u0142"
 * - PER_PERSON: "30 z\u0142/os."
 * - FLAT:       "2 000 z\u0142" or "2 \u00d7 1 000 z\u0142 = 2 000 z\u0142"
 * - FREE:       "Gratis"
 */
export function formatExtraPriceCell(e: { quantity: number; price: string; totalPrice: string; priceType: string }): string {
  switch (e.priceType) {
    case 'FREE':
      return 'Gratis';
    case 'PER_UNIT':
      return `${e.quantity} szt. \u00d7 ${e.price} z\u0142 = <strong>${e.totalPrice} z\u0142</strong>`;
    case 'PER_PERSON':
      return `${e.price} z\u0142/os. = <strong>${e.totalPrice} z\u0142</strong>`;
    case 'FLAT':
    default:
      if (e.quantity > 1) {
        return `${e.quantity} \u00d7 ${e.price} z\u0142 = <strong>${e.totalPrice} z\u0142</strong>`;
      }
      return `<strong>${e.totalPrice} z\u0142</strong>`;
  }
}
