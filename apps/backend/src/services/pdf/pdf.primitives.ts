import type { RestaurantData } from './pdf.types';
import { ALLERGEN_LABELS, COLORS } from './pdf.types';
import { formatDate, formatCurrency, getBoldFont, getRegularFont } from './pdf.utils';

// ═══════════════ SHARED CONTEXT ═══════════════

/** Context passed to all primitive drawing functions */
export interface PdfDrawContext {
  useCustomFonts: boolean;
  restaurantData: RestaurantData;
}

// ═══════════════ SHARED PREMIUM HELPERS ═══════════════

/**
 * Premium header banner — navy background + gold accent + restaurant info.
 * Optionally shows a status badge in the top-right corner.
 * Used by: reservation, payment confirmation, menu card, reports.
 */
export function drawHeaderBanner(
  doc: PDFKit.PDFDocument,
  ctx: PdfDrawContext,
  badgeLabel?: string,
  badgeColor?: string
): void {
  const bannerHeight = 65;
  const pageWidth = doc.page.width;

  // Dark navy banner
  doc.rect(0, 0, pageWidth, bannerHeight).fill(COLORS.primary);

  // Gold accent line at bottom
  doc.rect(0, bannerHeight - 3, pageWidth, 3).fill(COLORS.accent);

  // Restaurant name
  doc.fillColor('#ffffff').fontSize(18).font(getBoldFont(ctx.useCustomFonts));
  doc.text(ctx.restaurantData.name, 40, 14, { width: pageWidth - 200 });

  // Contact info
  doc.fontSize(7).font(getRegularFont(ctx.useCustomFonts)).fillColor(COLORS.textLight);
  const contactParts: string[] = [];
  if (ctx.restaurantData.phone) contactParts.push(ctx.restaurantData.phone);
  if (ctx.restaurantData.email) contactParts.push(ctx.restaurantData.email);
  if (ctx.restaurantData.website) contactParts.push(ctx.restaurantData.website);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), 40, 38, { width: pageWidth - 200 });
  }
  if (ctx.restaurantData.nip) {
    doc.text(`NIP: ${ctx.restaurantData.nip}`, 40, 50, { width: pageWidth - 200 });
  }

  // Status badge (top-right) — optional
  if (badgeLabel) {
    const color = badgeColor || COLORS.textMuted;
    const badgeWidth = 120;
    const badgeHeight = 22;
    const badgeX = pageWidth - badgeWidth - 40;
    const badgeY = 20;

    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4).fill(color);
    doc.fillColor('#ffffff').fontSize(9).font(getBoldFont(ctx.useCustomFonts));
    doc.text(badgeLabel, badgeX, badgeY + 6, { width: badgeWidth, align: 'center' });
  }
}

/**
 * Premium section header — bold title.
 */
export function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  ctx: PdfDrawContext,
  title: string,
  left: number,
  _pageWidth: number
): void {
  doc.fontSize(11).font(getBoldFont(ctx.useCustomFonts)).fillColor(COLORS.textDark);
  doc.text(title, left, doc.y);
  doc.moveDown(0.3);
}

/**
 * Safe page break — adds a new page if remaining space is less than minSpace.
 * Returns the current Y position after potential page break.
 */
export function safePageBreak(doc: PDFKit.PDFDocument, minSpace: number = 100): number {
  if (doc.y > doc.page.height - minSpace) {
    doc.addPage();
    doc.y = 50;
  }
  return doc.y;
}

/**
 * Info box with title, accent bar, and content lines.
 */
export function drawInfoBox(
  doc: PDFKit.PDFDocument,
  ctx: PdfDrawContext,
  title: string,
  x: number,
  y: number,
  width: number,
  lines: string[]
): void {
  const boxHeight = calculateInfoBoxHeight(lines.length);

  doc.rect(x, y, width, boxHeight).fill(COLORS.bgLight);
  doc.rect(x, y, 3, boxHeight).fill(COLORS.accent);

  doc.fillColor(COLORS.textMuted).fontSize(7).font(getBoldFont(ctx.useCustomFonts));
  doc.text(title, x + 12, y + 8, { width: width - 20 });

  doc.fontSize(9).font(getRegularFont(ctx.useCustomFonts)).fillColor(COLORS.textDark);
  let lineY = y + 22;
  lines.forEach((line, i) => {
    if (i === 0) {
      doc.font(getBoldFont(ctx.useCustomFonts)).fontSize(10);
    } else {
      doc.font(getRegularFont(ctx.useCustomFonts)).fontSize(8);
    }
    doc.text(line, x + 12, lineY, { width: width - 20 });
    lineY += i === 0 ? 15 : 12;
  });
}

export function calculateInfoBoxHeight(lineCount: number): number {
  return Math.max(60, 28 + lineCount * 13);
}

/**
 * Thin horizontal separator line.
 */
export function drawSeparator(doc: PDFKit.PDFDocument, left: number, width: number): void {
  const y = doc.y;
  doc.strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(left, y).lineTo(left + width, y).stroke();
}

/**
 * Inline footer — sits in the flow (no absolute positioning).
 */
export function drawInlineFooter(
  doc: PDFKit.PDFDocument,
  ctx: PdfDrawContext,
  left: number,
  pageWidth: number
): void {
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.4);

  doc.fontSize(7).fillColor(COLORS.textMuted).font(getRegularFont(ctx.useCustomFonts));

  const footerParts: string[] = [
    `Dziękujemy za wybór restauracji ${ctx.restaurantData.name}!`,
  ];
  const contactParts: string[] = [];
  if (ctx.restaurantData.phone) contactParts.push(ctx.restaurantData.phone);
  if (ctx.restaurantData.email) contactParts.push(ctx.restaurantData.email);
  if (contactParts.length > 0) {
    footerParts.push(`W razie pytań: ${contactParts.join(' | ')}`);
  }
  doc.text(footerParts.join('  |  '), left, doc.y, {
    align: 'center', width: pageWidth,
  });

  doc.moveDown(0.2);
  doc.fontSize(6).fillColor(COLORS.textLight);
  doc.text(
    `Dokument wygenerowany automatycznie przez system ${ctx.restaurantData.name}`,
    left, doc.y,
    { align: 'center', width: pageWidth },
  );
}

/**
 * Compact table with header row, alternating backgrounds, page-break support.
 * Row height is calculated dynamically based on the tallest cell content.
 */
export function drawCompactTable(
  doc: PDFKit.PDFDocument,
  ctx: PdfDrawContext,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startX: number
): void {
  const minRowHeight = 16;
  const headerHeight = 18;
  const cellPadding = 4;
  const cellFontSize = 7;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  let y = doc.y;

  // Header row
  doc.rect(startX, y, totalWidth, headerHeight).fill(COLORS.primaryLight);
  let x = startX;
  headers.forEach((header, i) => {
    doc.fillColor('#ffffff').fontSize(cellFontSize).font(getBoldFont(ctx.useCustomFonts));
    doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });
  y += headerHeight;

  // Data rows — dynamic height based on text content
  rows.forEach((row, rowIndex) => {
    /* istanbul ignore next */
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }

    // Calculate the tallest cell in this row
    let maxCellHeight = minRowHeight;
    row.forEach((cell, i) => {
      const isFirstCol = i === 0;
      doc.fontSize(cellFontSize)
         .font(isFirstCol ? getBoldFont(ctx.useCustomFonts) : getRegularFont(ctx.useCustomFonts));
      const textHeight = doc.heightOfString(cell, { width: colWidths[i] - 10 });
      const cellHeight = textHeight + cellPadding * 2;
      if (cellHeight > maxCellHeight) maxCellHeight = cellHeight;
    });

    if (rowIndex % 2 === 0) {
      doc.rect(startX, y, totalWidth, maxCellHeight).fill(COLORS.bgLight);
    }

    x = startX;
    row.forEach((cell, i) => {
      const isFirstCol = i === 0;
      doc.fillColor(COLORS.textDark)
         .fontSize(cellFontSize)
         .font(isFirstCol ? getBoldFont(ctx.useCustomFonts) : getRegularFont(ctx.useCustomFonts));
      doc.text(cell, x + 5, y + cellPadding, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });
    y += maxCellHeight;
  });

  // Bottom border
  doc.strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();

  doc.y = y + 3;
}

/**
 * Draw a compact allergen summary section at the end of the menu card PDF.
 * Lists each allergen once with all dishes that contain it.
 */
export function drawAllergenSection(
  doc: PDFKit.PDFDocument,
  ctx: PdfDrawContext,
  allergenMap: Map<string, Set<string>>,
  left: number,
  pageWidth: number
): void {
  if (allergenMap.size === 0) return;

  safePageBreak(doc, 120);

  doc.moveDown(0.5);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);

  // Section header
  doc.fontSize(10).font(getBoldFont(ctx.useCustomFonts)).fillColor(COLORS.allergen);
  doc.text('INFORMACJA O ALERGENACH', left, doc.y);
  doc.moveDown(0.3);

  doc.fontSize(7).font(getRegularFont(ctx.useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text(
    'Poniżej znajduje się lista alergenów występujących w daniach z karty menu.',
    left, doc.y, { width: pageWidth }
  );
  doc.moveDown(0.4);

  // Build table rows: Allergen | Dishes
  const rows: string[][] = [];
  for (const [allergen, dishNames] of allergenMap) {
    const label = ALLERGEN_LABELS[allergen] || allergen;
    const dishes = Array.from(dishNames).join(', ');
    rows.push([label, dishes]);
  }

  const colWidths = [
    Math.round(pageWidth * 0.20),
    Math.round(pageWidth * 0.80),
  ];
  drawCompactTable(doc, ctx, ['Alergen', 'Występuje w daniach'], rows, colWidths, left);
}

/**
 * Draw "Ważne informacje" section — reservation terms and payment rules.
 * Displayed as a compact box with gold accent bar before the footer.
 * Accepts optional eventDate to calculate guest confirmation deadline dynamically.
 * Banner color: gold (>30d), orange (3-30d), red (<=3d).
 * For <30 days the deadline shown is today's date (reservation day).
 */
export function drawImportantInfoSection(
  doc: PDFKit.PDFDocument,
  ctx: PdfDrawContext,
  left: number,
  pageWidth: number,
  eventDate?: Date
): void {
  safePageBreak(doc, 200);

  doc.moveDown(0.5);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);

  // ── Calculate days until event for dynamic text ──
  const now = new Date();
  let daysUntilEvent: number | null = null;
  if (eventDate) {
    daysUntilEvent = Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // ── Highlighted banner with guest confirmation deadline ──
  if (eventDate && daysUntilEvent !== null) {
    let bannerText: string;
    let bannerColor: string;

    if (daysUntilEvent > 30) {
      const deadline = new Date(eventDate);
      deadline.setDate(deadline.getDate() - 30);
      bannerText = `TERMIN POTWIERDZENIA LICZBY GOŚCI: ${formatDate(deadline)}`;
      bannerColor = COLORS.accent;
    } else if (daysUntilEvent > 3) {
      bannerText = `TERMIN POTWIERDZENIA LICZBY GOŚCI: ${formatDate(now)}`;
      bannerColor = COLORS.warning;
    } else {
      bannerText = `TERMIN POTWIERDZENIA LICZBY GOŚCI: ${formatDate(now)}`;
      bannerColor = COLORS.danger;
    }

    const bannerHeight = 20;
    const bannerY = doc.y;
    doc.rect(left, bannerY, pageWidth, bannerHeight).fill(bannerColor);
    doc.fillColor('#ffffff').fontSize(8).font(getBoldFont(ctx.useCustomFonts));
    doc.text(bannerText, left + 10, bannerY + 5, { width: pageWidth - 20, align: 'center' });
    doc.y = bannerY + bannerHeight + 6;
  }

  // Section title with icon-like accent
  const titleY = doc.y;
  doc.rect(left, titleY, pageWidth, 18).fill(COLORS.primaryLight);
  doc.rect(left, titleY, 4, 18).fill(COLORS.accent);
  doc.fillColor('#ffffff').fontSize(9).font(getBoldFont(ctx.useCustomFonts));
  doc.text('WAŻNE INFORMACJE', left + 14, titleY + 4, { width: pageWidth - 20 });

  doc.y = titleY + 22;

  // ── Dynamic info items based on days until event ──

  // Point 1 — menu confirmation (with last-minute fallback)
  const menuItem = 'Ustalenie menu następuje nie później niż 30 dni przed przyjęciem. '
    + 'W przypadku rezerwacji złożonej w terminie krótszym niż 30 dni przed wydarzeniem '
    + '— menu należy ustalić niezwłocznie przy rezerwacji.';

  // Point 2 — guest count confirmation (3 variants based on daysUntilEvent)
  let guestItem: string;
  if (daysUntilEvent !== null && daysUntilEvent <= 3) {
    // Variant C: <= 3 days — no changes possible
    guestItem = 'Ostateczna liczba gości powinna zostać potwierdzona niezwłocznie '
      + 'przy rezerwacji. Ze względu na bliski termin wydarzenia, zmiana '
      + 'potwierdzonej liczby gości nie jest możliwa.';
  } else if (daysUntilEvent !== null && daysUntilEvent <= 30) {
    // Variant B: 3-30 days — immediate confirmation, but 10% reduction still possible
    guestItem = 'W przypadku rezerwacji złożonej w terminie krótszym niż 30 dni '
      + 'przed przyjęciem — potwierdzenie liczby gości wymagane jest niezwłocznie '
      + 'przy rezerwacji. Potwierdzoną liczbę można zmniejszyć maks. o 10% do 3 dni przed terminem.';
  } else {
    // Variant A: > 30 days (or no eventDate) — standard
    guestItem = 'Potwierdzoną liczbę gości można zmniejszyć maks. '
      + 'o 10% do 3 dni przed terminem.';
  }

  // Point 3 — payment terms (unchanged)
  const paymentItem = 'Warunki płatności: 500,00 zł przy rezerwacji terminu, 50% całości na 3 dni '
    + 'przed przyjęciem, pozostała kwota w dniu przyjęcia (przed rozpoczęciem lub do godz. 20:00).';

  const items = [menuItem, guestItem, paymentItem];

  // Info items — numbered list in a light box
  const boxY = doc.y;

  // Calculate box height
  doc.fontSize(7).font(getRegularFont(ctx.useCustomFonts));
  let totalTextHeight = 0;
  items.forEach((item) => {
    totalTextHeight += doc.heightOfString(`0.  ${item}`, { width: pageWidth - 36 }) + 5;
  });
  const boxHeight = totalTextHeight + 16;

  doc.rect(left, boxY, pageWidth, boxHeight).fill(COLORS.bgLight);
  doc.rect(left, boxY, 4, boxHeight).fill(COLORS.accent);

  let itemY = boxY + 8;
  items.forEach((item, idx) => {
    // Number circle
    const circleX = left + 16;
    const circleY = itemY + 3;
    doc.circle(circleX, circleY, 5).fill(COLORS.accent);
    doc.fillColor(COLORS.primary).fontSize(6).font(getBoldFont(ctx.useCustomFonts));
    doc.text(`${idx + 1}`, circleX - 3, circleY - 3, { width: 6, align: 'center' });

    // Item text
    doc.fillColor(COLORS.textDark).fontSize(7).font(getRegularFont(ctx.useCustomFonts));
    const textHeight = doc.heightOfString(item, { width: pageWidth - 36 });
    doc.text(item, left + 26, itemY, { width: pageWidth - 36 });
    itemY += textHeight + 5;
  });

  doc.y = boxY + boxHeight + 3;
}
