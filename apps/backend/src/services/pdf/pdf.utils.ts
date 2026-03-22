import documentTemplateService from '../document-template.service';
import type { MenuCardPackage, PdfLayoutConfig } from './pdf.types';
import { DAY_OF_WEEK_PL } from './pdf.types';

// ═══════════════ FONT HELPERS ═══════════════

export function getRegularFont(useCustomFonts: boolean): string {
  return useCustomFonts ? 'DejaVu' : 'Helvetica';
}

export function getBoldFont(useCustomFonts: boolean): string {
  return useCustomFonts ? 'DejaVu-Bold' : 'Helvetica-Bold';
}

// ═══════════════ FORMATTERS ═══════════════

export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/* istanbul ignore next */
export function formatDateTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatCurrency(amount: number | string): string {
  /* istanbul ignore next */
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(numAmount);
}

// ═══════════════ TRANSLATION HELPERS ═══════════════

/**
 * Translate English day-of-week name to Polish.
 * Shared helper used by report builders.
 */
export function translateDayOfWeek(day: string): string {
  return DAY_OF_WEEK_PL[day] || day;
}

// ═══════════════ DATA HELPERS ═══════════════

/**
 * Collect all allergens from all packages/courses into a single map.
 * Returns Map<allergenKey, Set<dishName>> for global deduplication.
 */
export function collectAllAllergens(packages: MenuCardPackage[]): Map<string, Set<string>> {
  const allergenToDishes = new Map<string, Set<string>>();

  for (const pkg of packages) {
    for (const course of pkg.courses) {
      for (const dish of course.dishes) {
        if (dish.allergens && dish.allergens.length > 0) {
          for (const allergen of dish.allergens) {
            if (!allergenToDishes.has(allergen)) {
              allergenToDishes.set(allergen, new Set());
            }
            allergenToDishes.get(allergen)!.add(dish.name);
          }
        }
      }
    }
  }

  return allergenToDishes;
}

// ═══════════════ CONFIG LOADER ═══════════════

/** Load PDF layout config from DB, returns null if not found */
export async function loadPdfConfig(slug: string): Promise<PdfLayoutConfig | null> {
  try {
    const template = await documentTemplateService.getBySlug(slug);
    return JSON.parse(template.content) as PdfLayoutConfig;
  } catch {
    return null;
  }
}
