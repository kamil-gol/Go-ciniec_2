import type { PdfDrawContext } from './pdf.primitives';
import {
  drawHeaderBanner,
  safePageBreak,
  drawSeparator,
  drawInlineFooter,
  drawCompactTable,
  drawAllergenSection,
} from './pdf.primitives';

import type { MenuCardPDFData } from './pdf.types';
import { COLORS } from './pdf.types';

import {
  formatDate,
  formatCurrency,
  collectAllAllergens,
  getRegularFont,
  getBoldFont,
} from './pdf.utils';

// ═══════════════════════════════════════════════════════════════
// ██  PREMIUM MENU CARD — Zadanie 3
// ═══════════════════════════════════════════════════════════════

export function buildMenuCardPremium(
  doc: PDFKit.PDFDocument,
  data: MenuCardPDFData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const left = 40;
  const pageWidth = doc.page.width - 80;

  // ── 1. HEADER BANNER with „KARTA MENU" badge ──
  drawHeaderBanner(doc, ctx, 'KARTA MENU', COLORS.accent);

  // ── 2. TITLE + META ──
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(useCustomFonts));
  doc.text(data.templateName.toUpperCase(), left, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.2);
  const subtitleParts: string[] = [data.eventTypeName];
  if (data.variant) subtitleParts.push(data.variant);
  doc.fontSize(9).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text(subtitleParts.join('  |  '), left, doc.y, { align: 'center', width: pageWidth });

  if (data.templateDescription) {
    doc.moveDown(0.3);
    doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(data.templateDescription, left, doc.y, { align: 'center', width: pageWidth });
  }

  doc.moveDown(0.2);
  doc.fontSize(7).fillColor(COLORS.textLight);
  doc.text(`Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
    align: 'center', width: pageWidth,
  });

  doc.moveDown(0.6);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);

  // ── 3. PACKAGES ──
  data.packages.forEach((pkg, pkgIndex) => {
    if (pkgIndex > 0) {
      doc.moveDown(0.5);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.5);
    }

    safePageBreak(doc, 200);

    // Package header box — navy background + gold accent
    const pkgHeaderY = doc.y;
    const headerHeight = 55;
    doc.rect(left, pkgHeaderY, pageWidth, headerHeight).fill(COLORS.primary);
    doc.rect(left, pkgHeaderY + headerHeight - 3, pageWidth, 3).fill(COLORS.accent);

    // Badge (custom badgeText only)
    if (pkg.badgeText) {
      const pkgBadgeWidth = 90;
      const pkgBadgeX = left + pageWidth - pkgBadgeWidth - 10;
      doc.roundedRect(pkgBadgeX, pkgHeaderY + 8, pkgBadgeWidth, 18, 4).fill(COLORS.accent);
      doc.fillColor(COLORS.primary).fontSize(7).font(getBoldFont(useCustomFonts));
      doc.text(pkg.badgeText, pkgBadgeX, pkgHeaderY + 12, { width: pkgBadgeWidth, align: 'center' });
    }

    // Package name
    doc.fillColor('#ffffff').fontSize(14).font(getBoldFont(useCustomFonts));
    doc.text(pkg.name, left + 15, pkgHeaderY + 10, { width: pageWidth - 130 });

    // Prices
    doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textLight);
    const priceParts = [`${formatCurrency(pkg.pricePerAdult)}/os. dorosła`];
    if (pkg.pricePerChild > 0) priceParts.push(`${formatCurrency(pkg.pricePerChild)}/dziecko`);
    if (pkg.pricePerToddler > 0) priceParts.push(`${formatCurrency(pkg.pricePerToddler)}/maluch`);
    doc.text(priceParts.join('  |  '), left + 15, pkgHeaderY + 32, { width: pageWidth - 40 });

    doc.y = pkgHeaderY + headerHeight + 8;

    // Description
    if (pkg.description) {
      doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
      doc.text(pkg.description, left, doc.y, { width: pageWidth });
      doc.moveDown(0.3);
    }

    // Included items — info box style
    if (pkg.includedItems && pkg.includedItems.length > 0) {
      doc.fontSize(8).font(getBoldFont(useCustomFonts)).fillColor(COLORS.success);
      doc.text('W cenie: ', left, doc.y, { continued: true });
      doc.font(getRegularFont(useCustomFonts)).fillColor(COLORS.textDark);
      doc.text(pkg.includedItems.join(', '), { width: pageWidth - 60 });
      doc.moveDown(0.3);
    }

    // ── COURSES — 2-column tables (no allergens per course) ──
    if (pkg.courses.length > 0) {
      pkg.courses.forEach((course) => {
        safePageBreak(doc, 120);
        doc.moveDown(0.4);

        // Course header
        const selectText = course.minSelect === course.maxSelect
          ? `wybierz ${course.minSelect}`
          : `wybierz ${course.minSelect}-${course.maxSelect}`;

        doc.fontSize(10).font(getBoldFont(useCustomFonts)).fillColor(COLORS.primaryLight);
        doc.text(course.name, left, doc.y, { continued: true });
        doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
        doc.text(`  (${selectText} z ${course.dishes.length})`);

        /* istanbul ignore next */
        if (course.description) {
          doc.fontSize(7).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
          doc.text(course.description, left, doc.y);
        }

        doc.moveDown(0.2);

        // Build dish table rows — 2 columns: name, description
        const dishRows: string[][] = [];

        course.dishes.forEach((dish) => {
          const descText = dish.description || '';
          dishRows.push([
            dish.name,
            descText,
          ]);
        });

        // Dish table — 2 columns: name (35%), description (65%)
        const dishColWidths = [
          Math.round(pageWidth * 0.35),
          Math.round(pageWidth * 0.65),
        ];
        drawCompactTable(
          doc,
          ctx,
          ['Danie', 'Opis'],
          dishRows,
          dishColWidths,
          left
        );

        // No per-course allergen summary — moved to end of document
      });
    }

    // ── OPTIONS ──
    const requiredOptions = pkg.options.filter(o => o.isRequired);
    const activeOptions = pkg.options.filter(o => !o.isRequired);

    if (requiredOptions.length > 0) {
      safePageBreak(doc, 80);
      doc.moveDown(0.5);

      doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.success);
      doc.text('W PAKIECIE', left, doc.y);
      doc.moveDown(0.2);

      const reqRows = requiredOptions.map(opt => [
        `+ ${opt.name}`,
        opt.description || '',
      ]);
      const reqColWidths = [Math.round(pageWidth * 0.40), Math.round(pageWidth * 0.60)];
      drawCompactTable(doc, ctx, ['Opcja', 'Opis'], reqRows, reqColWidths, left);
    }

    if (activeOptions.length > 0) {
      safePageBreak(doc, 80);
      doc.moveDown(0.5);

      doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.purple);
      doc.text('OPCJE DODATKOWE', left, doc.y);
      doc.moveDown(0.2);

      const optRows = activeOptions.map(opt => {
        const priceLabel = opt.priceType === 'PER_PERSON'
          ? `+${formatCurrency(opt.priceAmount)}/os.`
          : `+${formatCurrency(opt.priceAmount)}`;
        return [
          opt.name,
          opt.description || '',
          priceLabel,
        ];
      });
      const optColWidths = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.45),
        Math.round(pageWidth * 0.25),
      ];
      drawCompactTable(doc, ctx, ['Opcja', 'Opis', 'Cena'], optRows, optColWidths, left);
    }
  });

  // ── 4. GLOBAL ALLERGEN SECTION (at the end, before footer) ──
  const allergenMap = collectAllAllergens(data.packages);
  drawAllergenSection(doc, ctx, allergenMap, left, pageWidth);

  // ── 5. FOOTER ──
  doc.moveDown(1);
  drawInlineFooter(doc, ctx, left, pageWidth);
}
