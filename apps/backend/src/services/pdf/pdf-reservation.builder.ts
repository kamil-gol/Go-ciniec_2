import type { PdfDrawContext } from './pdf.primitives';
import {
  drawHeaderBanner,
  drawSectionHeader,
  safePageBreak,
  drawInfoBox,
  calculateInfoBoxHeight,
  drawSeparator,
  drawInlineFooter,
  drawCompactTable,
  drawImportantInfoSection,
} from './pdf.primitives';

import type {
  CategorySelection,
  MenuData,
  MenuSnapshot,
  ReservationPDFData,
  ReservationExtraForPDF,
  CategoryExtraForPDF,
  PdfLayoutConfig,
} from './pdf.types';

import {
  ALLERGEN_LABELS,
  COLORS,
  DEFAULT_COLORS,
  setColors,
  resetColors,
  STATUS_MAP,
} from './pdf.types';

import {
  formatDate,
  formatTime,
  formatCurrency,
  loadPdfConfig,
  getRegularFont,
  getBoldFont,
} from './pdf.utils';

// ═══════════════════════════════════════════════════════════════
// ██  PREMIUM RESERVATION PDF — #157 Redesign
// ═══════════════════════════════════════════════════════════════

export async function buildReservationPDF(
  doc: PDFKit.PDFDocument,
  r: ReservationPDFData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): Promise<void> {
  // Load layout config from DB (colors, section order/visibility)
  const config = await loadPdfConfig('pdf-layout-reservation');
  if (config?.colors) {
    setColors({ ...DEFAULT_COLORS, ...config.colors });
  }

  try {
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // Build section renderers
    const sectionRenderers: Record<string, () => void> = {
      header: () => {
        /* istanbul ignore next */
        const statusInfo = STATUS_MAP[r.status] || { label: r.status, color: COLORS.textMuted };
        drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);
      },
      title_meta: () => {
        doc.y = 80;
        doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(useCustomFonts));
        doc.text('POTWIERDZENIE REZERWACJI', left, doc.y, { align: 'center', width: pageWidth });
        doc.moveDown(0.2);
        doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
        doc.text(`Nr: ${r.id}  |  Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
          align: 'center', width: pageWidth,
        });
        doc.moveDown(0.6);
        drawSeparator(doc, left, pageWidth);
        doc.moveDown(0.5);
      },
      client_event: () => {
        drawClientAndEventColumns(doc, r, left, pageWidth, ctx, useCustomFonts);
        doc.moveDown(0.4);
        drawSeparator(doc, left, pageWidth);
        doc.moveDown(0.4);
      },
      menu: () => {
        const menuSnapshot = r.menuSnapshot;
        if (menuSnapshot && menuSnapshot.menuData) {
          drawMenuTable(doc, menuSnapshot, left, pageWidth, ctx, useCustomFonts);
          doc.moveDown(0.3);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.4);
        } else if (r.menuData?.dishSelections && r.menuData.dishSelections.length > 0) {
          drawMenuTableLegacy(doc, r.menuData, left, pageWidth, ctx, useCustomFonts);
          doc.moveDown(0.3);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.4);
        }
      },
      extras: () => {
        if (r.reservationExtras && r.reservationExtras.length > 0) {
          drawExtrasInline(doc, r.reservationExtras, left, pageWidth, ctx, useCustomFonts);
          doc.moveDown(0.3);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.4);
        }
      },
      category_extras: () => {
        if (r.categoryExtras && r.categoryExtras.length > 0) {
          drawCategoryExtras(doc, r.categoryExtras, left, pageWidth, ctx, useCustomFonts);
          doc.moveDown(0.3);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.4);
        }
      },
      financial_summary: () => {
        drawFinancialSummary(doc, r, left, pageWidth, ctx, useCustomFonts);
      },
      notes: () => {
        if (r.notes) {
          doc.moveDown(0.4);
          const noteIndent = 10;
          doc.fontSize(8).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
          doc.text('Uwagi:', left, doc.y);
          doc.moveDown(0.15);
          const noteLines = r.notes.split('\n').filter(line => line.trim() !== '');
          doc.font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
          noteLines.forEach((line) => {
            doc.text(line.trim(), left + noteIndent, doc.y, { width: pageWidth - noteIndent });
          });
        }
      },
      important_info: () => {
        const eventDate = r.startDateTime
          ? new Date(r.startDateTime)
          : r.date
            ? new Date(r.date)
            : undefined;
        drawImportantInfoSection(doc, ctx, left, pageWidth, eventDate);
      },
      footer: () => {
        doc.moveDown(1);
        drawInlineFooter(doc, ctx, left, pageWidth);
      },
    };

    // Get section order from config or use default
    const sections = config?.sections
      ? [...config.sections].sort((a, b) => a.order - b.order)
      : Object.keys(sectionRenderers).map((id, i) => ({ id, enabled: true, order: i + 1 }));

    for (const section of sections) {
      if (section.enabled && sectionRenderers[section.id]) {
        sectionRenderers[section.id]();
      }
    }
  } finally {
    // Restore default colors
    resetColors();
  }
}

// ── TWO-COLUMN: CLIENT | EVENT ──
function drawClientAndEventColumns(
  doc: PDFKit.PDFDocument,
  r: ReservationPDFData,
  left: number,
  pageWidth: number,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const colGap = 20;
  const colWidth = (pageWidth - colGap) / 2;
  const startY = doc.y;

  drawInfoBox(doc, ctx, 'KLIENT', left, startY, colWidth, [
    `${r.client.firstName} ${r.client.lastName}`,
    r.client.email || '',
    r.client.phone,
    r.client.address || '',
  ].filter(Boolean));

  /* istanbul ignore next */
  const eventTypeName = r.customEventType || r.eventType?.name || 'Nie określono';
  let dateStr = '';
  let timeStr = '';
  if (r.startDateTime && r.endDateTime) {
    dateStr = formatDate(r.startDateTime);
    timeStr = `${formatTime(r.startDateTime)} - ${formatTime(r.endDateTime)}`;
  } else if (r.date && r.startTime && r.endTime) {
    dateStr = r.date;
    timeStr = `${r.startTime} - ${r.endTime}`;
  }

  const guestParts: string[] = [];
  if (r.adults > 0) guestParts.push(`${r.adults} dor.`);
  if (r.children > 0) guestParts.push(`${r.children} dz.`);
  if (r.toddlers > 0) guestParts.push(`${r.toddlers} mał.`);
  const guestLine = `${r.guests} osób (${guestParts.join(', ')})`;

  const eventDetails: string[] = [
    eventTypeName,
    dateStr && timeStr ? `${dateStr}  ${timeStr}` : dateStr || timeStr,
    guestLine,
  ];

  // #176: Duration with extra hours info
  if (r.startDateTime && r.endDateTime) {
    const durationMs = new Date(r.endDateTime).getTime() - new Date(r.startDateTime).getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
    const standardHours = r.eventType?.standardHours;
    if (standardHours && durationHours > standardHours) {
      const extraHours = Math.round((durationHours - standardHours) * 10) / 10;
      eventDetails.push(`Czas: ${durationHours}h (${standardHours}h + ${extraHours}h extra)`);
    } else {
      eventDetails.push(`Czas trwania: ${durationHours}h`);
    }
  }

  /* istanbul ignore next */
  if (r.birthdayAge) eventDetails.push(`Wiek jubilata: ${r.birthdayAge} lat`);
  /* istanbul ignore next */
  if (r.anniversaryYear) {
    eventDetails.push(`Rocznica: ${r.anniversaryYear} lat${r.anniversaryOccasion ? ` (${r.anniversaryOccasion})` : ''}`);
  }

  drawInfoBox(doc, ctx, 'WYDARZENIE', left + colWidth + colGap, startY, colWidth,
    eventDetails.filter(Boolean)
  );

  const boxHeight = calculateInfoBoxHeight(Math.max(
    [r.client.firstName, r.client.email, r.client.phone, r.client.address].filter(Boolean).length,
    eventDetails.filter(Boolean).length
  ));
  doc.y = startY + boxHeight + 5;
}

// ── MENU TABLE (reservation) ──
function drawMenuTable(
  doc: PDFKit.PDFDocument,
  menuSnapshot: MenuSnapshot,
  left: number,
  pageWidth: number,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  /* istanbul ignore next */
  const packageName = menuSnapshot.menuData?.packageName || menuSnapshot.menuData?.package?.name || '';
  drawSectionHeader(doc, ctx, 'WYBRANE MENU', left, pageWidth);
  if (packageName) {
    doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(`Pakiet: ${packageName}  |  Cena menu: ${formatCurrency(menuSnapshot.totalMenuPrice)}`, left, doc.y);
  }
  doc.moveDown(0.3);

  /* istanbul ignore next */
  const dishSelections: CategorySelection[] = menuSnapshot.menuData?.dishSelections || [];
  if (dishSelections.length === 0) {
    doc.fontSize(9).fillColor(COLORS.textMuted).text('Brak wybranych dań', left);
    return;
  }

  const allAllergens = new Set<string>();
  const tableRows: string[][] = [];

  dishSelections.forEach((category) => {
    const dishNames = category.dishes.map((d) => {
      if (d.allergens) d.allergens.forEach((a) => allAllergens.add(a));
      const qty = d.quantity > 1 ? `${d.quantity}x ` : '';
      return `${qty}${d.dishName}`;
    });

    const dishText = dishNames.join(', ');

    tableRows.push([category.categoryName, `${category.dishes.length}`, dishText]);
  });

  const colWidths = [Math.round(pageWidth * 0.22), Math.round(pageWidth * 0.08), Math.round(pageWidth * 0.70)];
  drawCompactTable(doc, ctx, ['Kategoria', 'Ilość', 'Wybrane dania'], tableRows, colWidths, left);

  if (allAllergens.size > 0) {
    doc.moveDown(0.2);
    const labels = Array.from(allAllergens).map((a) => ALLERGEN_LABELS[a] || a).join(', ');
    doc.fontSize(7).fillColor(COLORS.allergen);
    doc.text(`Alergeny: ${labels}`, left);
    doc.fillColor(COLORS.textDark);
  }
}

function drawMenuTableLegacy(
  doc: PDFKit.PDFDocument,
  menuData: MenuData,
  left: number,
  pageWidth: number,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  drawSectionHeader(doc, ctx, 'WYBRANE DANIA', left, pageWidth);
  if (menuData.packageName) {
    doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(`Pakiet: ${menuData.packageName}`, left, doc.y);
  }
  doc.moveDown(0.3);

  if (!menuData.dishSelections || menuData.dishSelections.length === 0) {
    doc.fontSize(9).fillColor(COLORS.textMuted).text('Brak wybranych dań', left);
    return;
  }

  const allAllergens = new Set<string>();
  const tableRows: string[][] = [];

  menuData.dishSelections.forEach((category) => {
    const dishNames = category.dishes.map((d) => {
      if (d.allergens) d.allergens.forEach((a) => allAllergens.add(a));
      const qty = d.quantity > 1 ? `${d.quantity}x ` : '';
      return `${qty}${d.dishName}`;
    });
    const dishText = dishNames.join(', ');
    tableRows.push([category.categoryName, `${category.dishes.length}`, dishText]);
  });

  const colWidths = [Math.round(pageWidth * 0.22), Math.round(pageWidth * 0.08), Math.round(pageWidth * 0.70)];
  drawCompactTable(doc, ctx, ['Kategoria', 'Ilość', 'Wybrane dania'], tableRows, colWidths, left);

  if (allAllergens.size > 0) {
    doc.moveDown(0.2);
    const labels = Array.from(allAllergens).map((a) => ALLERGEN_LABELS[a] || a).join(', ');
    doc.fontSize(7).fillColor(COLORS.allergen);
    doc.text(`Alergeny: ${labels}`, left);
    doc.fillColor(COLORS.textDark);
  }
}

// ── EXTRAS INLINE ──
function drawExtrasInline(
  doc: PDFKit.PDFDocument,
  extras: ReservationExtraForPDF[],
  left: number,
  pageWidth: number,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  drawSectionHeader(doc, ctx, 'USŁUGI DODATKOWE', left, pageWidth);

  const grouped = new Map<string, ReservationExtraForPDF[]>();
  for (const extra of extras) {
    const catName = extra.serviceItem.category?.name || 'Inne';
    if (!grouped.has(catName)) grouped.set(catName, []);
    grouped.get(catName)!.push(extra);
  }

  for (const [categoryName, items] of grouped) {
    doc.fontSize(8).font(getBoldFont(useCustomFonts)).fillColor(COLORS.primaryLight);
    doc.text(`${categoryName}:`, left, doc.y);
    doc.moveDown(0.1);

    for (const item of items) {
      doc.font(getRegularFont(useCustomFonts)).fontSize(8).fillColor(COLORS.textDark);

      const itemTotal = Number(item.totalPrice);
      let chipText: string;
      switch (item.priceType) {
        case 'FREE':
          chipText = `${item.serviceItem.name} (Gratis)`;
          break;
        case 'PER_PERSON':
          chipText = `${item.serviceItem.name} (${formatCurrency(itemTotal)})`;
          break;
        case 'PER_UNIT':
          chipText = `${item.serviceItem.name} ${item.quantity}szt. (${formatCurrency(itemTotal)})`;
          break;
        case 'FLAT':
        default:
          chipText = `${item.serviceItem.name} (${formatCurrency(itemTotal)})`;
          break;
      }

      if (item.note) {
        doc.font(getBoldFont(useCustomFonts)).text(`${chipText}`, left + 10, doc.y, { continued: true });
        doc.font(getRegularFont(useCustomFonts)).fontSize(7).fillColor(COLORS.textMuted);
        doc.text(`  — Uwaga: ${item.note}`, { width: pageWidth - 20 });
      } else {
        doc.text(`${chipText}`, left + 10, doc.y, { width: pageWidth - 20 });
      }
    }
    doc.moveDown(0.2);
  }
}

// ── #216: CATEGORY EXTRAS TABLE ──
function drawCategoryExtras(
  doc: PDFKit.PDFDocument,
  categoryExtras: CategoryExtraForPDF[],
  left: number,
  pageWidth: number,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const PORTION_LABELS: Record<string, string> = {
    ALL: 'wszyscy',
    ADULTS_ONLY: 'dorośli',
    CHILDREN_ONLY: 'dzieci',
  };

  safePageBreak(doc, 60);

  doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.primaryLight);
  doc.text('DODATKOWO PŁATNE PORCJE', left, doc.y);
  doc.moveDown(0.3);

  // Table header
  const col1 = left;        // Kategoria
  const col2 = left + 180;  // Ilość
  const col3 = left + 230;  // Cena/szt.
  const col4 = left + 310;  // Osoby
  const rightEdge = left + pageWidth;

  doc.fontSize(7).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text('Kategoria', col1, doc.y);
  doc.text('Ilość', col2, doc.y - doc.currentLineHeight(), { width: 50 });
  doc.text('Cena/szt.', col3, doc.y - doc.currentLineHeight(), { width: 70 });
  doc.text('Osoby', col4, doc.y - doc.currentLineHeight(), { width: 50 });
  doc.text('Suma', rightEdge - 80, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
  doc.moveDown(0.3);

  // Thin separator
  doc.strokeColor(COLORS.border).lineWidth(0.3)
     .moveTo(col1, doc.y).lineTo(rightEdge, doc.y).stroke();
  doc.moveDown(0.2);

  // Rows
  doc.font(getRegularFont(useCustomFonts)).fontSize(8).fillColor(COLORS.textDark);
  for (const extra of categoryExtras) {
    const y = doc.y;
    const portionLabel = PORTION_LABELS[extra.portionTarget] || extra.portionTarget;
    doc.text(extra.categoryName, col1, y, { width: 170 });
    doc.text(String(extra.quantity), col2, y, { width: 50 });
    doc.text(formatCurrency(extra.pricePerItem), col3, y, { width: 70 });
    doc.text(`${extra.guestCount} (${portionLabel})`, col4, y, { width: 80 });
    doc.text(formatCurrency(extra.totalPrice), rightEdge - 80, y, { width: 80, align: 'right' });
    doc.moveDown(0.15);
  }

  // Total row
  const totalCategoryExtras = categoryExtras.reduce((sum, e) => sum + e.totalPrice, 0);
  doc.moveDown(0.1);
  doc.strokeColor(COLORS.border).lineWidth(0.3)
     .moveTo(col1, doc.y).lineTo(rightEdge, doc.y).stroke();
  doc.moveDown(0.2);
  doc.font(getBoldFont(useCustomFonts)).fontSize(8);
  doc.text('Razem dodatkowo płatne porcje:', col1, doc.y);
  doc.text(formatCurrency(totalCategoryExtras), rightEdge - 80, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
  doc.moveDown(0.3);
}

// ── FINANCIAL SUMMARY BOX (compact) ──
function drawFinancialSummary(
  doc: PDFKit.PDFDocument,
  r: ReservationPDFData,
  left: number,
  pageWidth: number,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const extrasTotalCalc = (r.reservationExtras || [])
    .reduce((sum, e) => sum + Number(e.totalPrice), 0);
  const categoryExtrasTotalCalc = (r.categoryExtras || [])
    .reduce((sum, e) => sum + Number(e.totalPrice), 0);
  const venueSurchargeAmount = Number(r.venueSurcharge) || 0;
  const extraHoursCostAmt = Number(r.extraHoursCost) || 0;
  const discountAmount = Number(r.discountAmount) || 0;
  const hasDiscount = discountAmount > 0 && !!r.discountType;
  // totalPrice from DB already includes extras, surcharge, extraHours, and discount
  // (see recalculate-price.ts formula). Do NOT add extras again.
  const displayTotal = Number(r.totalPrice);

  // #deposits-fix (2/5): Secondary guard — filter CANCELLED deposits in the PDF renderer.
  // Primary guard lives in reservation.controller.ts downloadPDF().
  // Using both guards ensures robustness even if the controller path changes.
  const activeDeposits = (r.deposits || []).filter((d: any) => d.status !== 'CANCELLED');
  // Legacy fallback: if no deposits array, fall back to the single deposit field
  const depositsForDisplay: Array<{ amount: number | string; dueDate: Date | string; status: string; paid: boolean }> =
    activeDeposits.length > 0
      ? activeDeposits
      : r.deposit
        ? [r.deposit]
        : [];

  let rowCount = 0;
  if (r.adults > 0 && r.pricePerAdult > 0) rowCount++;
  if (r.children > 0 && r.pricePerChild > 0) rowCount++;
  if (r.toddlers > 0 && r.pricePerToddler > 0) rowCount++;
  if (extrasTotalCalc > 0) rowCount++;
  if (categoryExtrasTotalCalc > 0) rowCount++;
  if (venueSurchargeAmount > 0) rowCount++;
  if (extraHoursCostAmt > 0) rowCount++;
  if (hasDiscount) rowCount += 2; // "Suma przed rabatem" + "Rabat" rows
  rowCount++; // RAZEM
  // Each active deposit gets its own row + one final DO ZAPŁATY row
  if (depositsForDisplay.length > 0) rowCount += depositsForDisplay.length + 1;
  const boxHeight = 22 + rowCount * 13 + (depositsForDisplay.length > 0 ? 14 : 0);

  safePageBreak(doc, boxHeight + 15);
  const boxY = doc.y;

  doc.rect(left, boxY, pageWidth, boxHeight).fill(COLORS.bgLight);
  doc.rect(left, boxY, 3, boxHeight).fill(COLORS.accent);

  doc.fillColor(COLORS.textDark).fontSize(9).font(getBoldFont(useCustomFonts));
  doc.text('PODSUMOWANIE', left + 12, boxY + 7);

  let y = boxY + 22;
  const labelX = left + 12;
  const rightEdge = left + pageWidth - 12;
  const valueWidth = 100;
  const valueX = rightEdge - valueWidth;

  doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textDark);

  if (r.adults > 0 && r.pricePerAdult > 0) {
    const adultTotal = r.adults * Number(r.pricePerAdult);
    doc.text(`Dorośli: ${r.adults} os. x ${formatCurrency(r.pricePerAdult)}`, labelX, y);
    doc.text(formatCurrency(adultTotal), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
  }
  /* istanbul ignore next */
  if (r.children > 0 && r.pricePerChild > 0) {
    const childTotal = r.children * Number(r.pricePerChild);
    doc.text(`Dzieci (4-12 lat): ${r.children} os. x ${formatCurrency(r.pricePerChild)}`, labelX, y);
    doc.text(formatCurrency(childTotal), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
  }
  /* istanbul ignore next */
  if (r.toddlers > 0 && r.pricePerToddler > 0) {
    const toddlerTotal = r.toddlers * Number(r.pricePerToddler);
    doc.text(`Maluchy (0-3 lata): ${r.toddlers} os. x ${formatCurrency(r.pricePerToddler)}`, labelX, y);
    doc.text(formatCurrency(toddlerTotal), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
  }
  if (extrasTotalCalc > 0) {
    doc.text('Usługi dodatkowe', labelX, y);
    doc.text(formatCurrency(extrasTotalCalc), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
  }
  if (categoryExtrasTotalCalc > 0) {
    doc.text('Dodatkowo płatne porcje', labelX, y);
    doc.text(formatCurrency(categoryExtrasTotalCalc), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
  }
  if (venueSurchargeAmount > 0) {
    const surchargeLabel = r.venueSurchargeLabel || 'Dopłata za cały obiekt';
    doc.text(surchargeLabel, labelX, y);
    doc.text(formatCurrency(venueSurchargeAmount), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
  }
  if (extraHoursCostAmt > 0) {
    const extraHourRate = Number(r.eventType?.extraHourRate) || 0;
    const extraHoursCount = extraHourRate > 0
      ? Math.round(extraHoursCostAmt / extraHourRate * 10) / 10
      : 0;
    const extraLabel = extraHourRate > 0
      ? `Dodatkowe godziny: ${extraHoursCount}h \u00d7 ${formatCurrency(extraHourRate)}/h`
      : 'Dodatkowe godziny';
    doc.text(extraLabel, labelX, y);
    doc.text(formatCurrency(extraHoursCostAmt), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
  }

  // #216: Discount row
  if (hasDiscount) {
    const priceBeforeDiscount = Number(r.priceBeforeDiscount) || (displayTotal + discountAmount);
    doc.text('Suma przed rabatem', labelX, y);
    doc.text(formatCurrency(priceBeforeDiscount), valueX, y, { width: valueWidth, align: 'right' });
    y += 13;

    const discountLabel = r.discountType === 'PERCENTAGE'
      ? `Rabat (${Number(r.discountValue)}%)`
      : 'Rabat';
    doc.fillColor('#c0392b');
    doc.text(discountLabel, labelX, y);
    doc.text(`-${formatCurrency(discountAmount)}`, valueX, y, { width: valueWidth, align: 'right' });
    y += 13;
    doc.fillColor(COLORS.textDark);
  }

  y += 2;
  doc.strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
  y += 5;

  doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text('RAZEM', labelX, y);
  doc.text(formatCurrency(displayTotal), valueX, y, { width: valueWidth, align: 'right' });
  y += 14;

  if (depositsForDisplay.length > 0) {
    const depositBadgeWidth = 32;
    const depositBadgeGap = 4;
    const depositValueWidth = valueWidth - depositBadgeWidth - depositBadgeGap;
    const depositValueX = valueX;

    for (let i = 0; i < depositsForDisplay.length; i++) {
      const dep = depositsForDisplay[i];
      /* istanbul ignore next */
      const dueDate = dep.dueDate instanceof Date
        ? formatDate(dep.dueDate)
        : dep.dueDate;
      // Use numbered prefix only when there are multiple deposits
      const labelPrefix = depositsForDisplay.length > 1 ? `Zaliczka ${i + 1}` : 'Zaliczka';
      const depositLabel = dep.paid
        ? `${labelPrefix} (opłacona)`
        : `${labelPrefix} (termin: ${dueDate})`;

      doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.success);
      doc.text(depositLabel, labelX, y);

      if (dep.paid) {
        // Paid: full-width amount aligned with RAZEM/DO ZAPŁATY
        doc.text(`-${formatCurrency(Number(dep.amount))}`, valueX, y, { width: valueWidth, align: 'right' });
      } else {
        // Unpaid: narrower amount to leave room for badge
        doc.text(`-${formatCurrency(Number(dep.amount))}`, depositValueX, y, { width: depositValueWidth, align: 'right' });
        const depositBadgeX = depositValueX + depositValueWidth + depositBadgeGap;
        doc.roundedRect(depositBadgeX, y - 1, depositBadgeWidth, 11, 3).fill(COLORS.warning);
        doc.fillColor('#ffffff').fontSize(5.5).font(getBoldFont(useCustomFonts));
        doc.text('OCZEK.', depositBadgeX, y + 1, { width: depositBadgeWidth, align: 'center' });
      }

      y += 14;
    }

    doc.strokeColor(COLORS.accent).lineWidth(0.8)
       .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
    y += 5;

    // DO ZAPŁATY = totalPrice minus sum of ALL active deposits
    const totalDeposited = depositsForDisplay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const remaining = displayTotal - totalDeposited;
    doc.fontSize(10).font(getBoldFont(useCustomFonts)).fillColor(COLORS.primary);
    doc.text('DO ZAPŁATY', labelX, y);
    doc.text(formatCurrency(remaining), valueX, y, { width: valueWidth, align: 'right' });
  }

  doc.y = boxY + boxHeight + 3;
}
