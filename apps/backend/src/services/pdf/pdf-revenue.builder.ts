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
} from './pdf.primitives';

import type { RevenueReportPDFData } from './pdf.types';
import { COLORS } from './pdf.types';

import {
  formatDate,
  formatCurrency,
  getRegularFont,
  getBoldFont,
} from './pdf.utils';

// ═══════════════════════════════════════════════════════════════
// ██  PREMIUM REVENUE REPORT PDF — Zadanie 4
// ═══════════════════════════════════════════════════════════════

export function buildRevenueReportPDF(
  doc: PDFKit.PDFDocument,
  data: RevenueReportPDFData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const left = 40;
  const pageWidth = doc.page.width - 80;

  // ── 1. HEADER BANNER ──
  drawHeaderBanner(doc, ctx, 'RAPORT', COLORS.info);

  // ── 2. TITLE + META ──
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(useCustomFonts));
  doc.text('RAPORT PRZYCHODÓW', left, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.2);
  doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
  const metaParts: string[] = [`Okres: ${data.filters.dateFrom} - ${data.filters.dateTo}`];
  if (data.filters.groupBy) metaParts.push(`Grupowanie: ${data.filters.groupBy}`);
  metaParts.push(`Wygenerowano: ${formatDate(new Date())}`);
  doc.text(metaParts.join('  |  '), left, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.6);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);

  // ── 3. SUMMARY INFO BOX ──
  const summaryLines: string[] = [
    `Całkowity przychód: ${formatCurrency(data.summary.totalRevenue)}`,
    `Średni przychód na rezerwację: ${formatCurrency(data.summary.avgRevenuePerReservation)}`,
    `Liczba rezerwacji: ${data.summary.totalReservations}`,
    `Ukończone rezerwacje: ${data.summary.completedReservations}`,
    `Oczekujący przychód: ${formatCurrency(data.summary.pendingRevenue)}`,
    `Wzrost: ${data.summary.growthPercent}%`,
  ];
  if (data.summary.extrasRevenue !== undefined && data.summary.extrasRevenue > 0) {
    summaryLines.push(`Przychody z usług dodatkowych: ${formatCurrency(data.summary.extrasRevenue)}`);
  }
  if (data.summary.categoryExtrasRevenue !== undefined && data.summary.categoryExtrasRevenue > 0) {
    summaryLines.push(`Przychody z dodatkowo płatnych porcji: ${formatCurrency(data.summary.categoryExtrasRevenue)}`);
  }

  drawInfoBox(doc, ctx, 'PODSUMOWANIE', left, doc.y, pageWidth, summaryLines);
  const summaryBoxHeight = calculateInfoBoxHeight(summaryLines.length);
  doc.y = doc.y + summaryBoxHeight + 5;

  doc.moveDown(0.4);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.4);

  // ── 4. BREAKDOWN BY PERIOD ──
  if (data.breakdown.length > 0) {
    safePageBreak(doc, 100);
    drawSectionHeader(doc, ctx, 'ROZKŁAD WG OKRESU', left, pageWidth);

    const breakdownRows = data.breakdown.slice(0, 20).map(item => [
      item.period,
      formatCurrency(item.revenue),
      `${item.count}`,
      formatCurrency(item.avgRevenue),
    ]);
    const breakdownCols = [
      Math.round(pageWidth * 0.30),
      Math.round(pageWidth * 0.25),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.25),
    ];
    drawCompactTable(doc, ctx, ['Okres', 'Przychód', 'Liczba', 'Średnia'], breakdownRows, breakdownCols, left);

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 5. BY HALL ──
  if (data.byHall.length > 0) {
    safePageBreak(doc, 100);
    drawSectionHeader(doc, ctx, 'PRZYCHODY WG SAL', left, pageWidth);

    const hallRows = data.byHall.slice(0, 20).map(item => [
      item.hallName,
      formatCurrency(item.revenue),
      `${item.count}`,
      formatCurrency(item.avgRevenue),
    ]);
    const hallCols = [
      Math.round(pageWidth * 0.30),
      Math.round(pageWidth * 0.25),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.25),
    ];
    drawCompactTable(doc, ctx, ['Sala', 'Przychód', 'Liczba', 'Średnia'], hallRows, hallCols, left);

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 6. BY EVENT TYPE ──
  if (data.byEventType.length > 0) {
    safePageBreak(doc, 100);
    drawSectionHeader(doc, ctx, 'PRZYCHODY WG TYPU WYDARZENIA', left, pageWidth);

    const eventRows = data.byEventType.slice(0, 20).map(item => [
      item.eventTypeName,
      formatCurrency(item.revenue),
      `${item.count}`,
      formatCurrency(item.avgRevenue),
    ]);
    const eventCols = [
      Math.round(pageWidth * 0.30),
      Math.round(pageWidth * 0.25),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.25),
    ];
    drawCompactTable(doc, ctx, ['Typ wydarzenia', 'Przychód', 'Liczba', 'Średnia'], eventRows, eventCols, left);

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 7. BY SERVICE ITEM (extras) ──
  if (data.byServiceItem && data.byServiceItem.length > 0) {
    safePageBreak(doc, 100);

    doc.fontSize(11).font(getBoldFont(useCustomFonts)).fillColor(COLORS.purple);
    doc.text('USŁUGI DODATKOWE — PRZYCHODY', left, doc.y);
    doc.moveDown(0.3);

    const extrasRows = data.byServiceItem.slice(0, 20).map(item => [
      item.name,
      formatCurrency(item.revenue),
      `${item.count}`,
      formatCurrency(item.avgRevenue),
    ]);
    const extrasCols = [
      Math.round(pageWidth * 0.30),
      Math.round(pageWidth * 0.25),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.25),
    ];
    drawCompactTable(doc, ctx, ['Usługa', 'Przychód', 'Użyć', 'Śr. przychód'], extrasRows, extrasCols, left);

    // Total extras row
    if (data.summary.extrasRevenue && data.summary.extrasRevenue > 0) {
      doc.moveDown(0.2);
      doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.purple);
      doc.text(`Razem extras: ${formatCurrency(data.summary.extrasRevenue)}`, left, doc.y);
      doc.fillColor(COLORS.textDark);
    }

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 8. BY CATEGORY EXTRA (dodatkowo płatne porcje) #216 ──
  if (data.byCategoryExtra && data.byCategoryExtra.length > 0) {
    safePageBreak(doc, 100);

    doc.fontSize(11).font(getBoldFont(useCustomFonts)).fillColor('#D97706');
    doc.text('DODATKOWO PŁATNE PORCJE — PRZYCHODY', left, doc.y);
    doc.moveDown(0.3);

    const catExtrasRows = data.byCategoryExtra.slice(0, 20).map(item => [
      item.categoryName,
      formatCurrency(item.revenue),
      `${item.totalQuantity}`,
      formatCurrency(item.avgRevenue),
    ]);
    const catExtrasCols = [
      Math.round(pageWidth * 0.30),
      Math.round(pageWidth * 0.25),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.25),
    ];
    drawCompactTable(doc, ctx, ['Kategoria', 'Przychód', 'Porcje', 'Śr. przychód'], catExtrasRows, catExtrasCols, left);

    if (data.summary.categoryExtrasRevenue && data.summary.categoryExtrasRevenue > 0) {
      doc.moveDown(0.2);
      doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor('#D97706');
      doc.text(`Razem dodatkowo płatne porcje: ${formatCurrency(data.summary.categoryExtrasRevenue)}`, left, doc.y);
      doc.fillColor(COLORS.textDark);
    }

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 9. FOOTER ──
  doc.moveDown(0.5);
  drawInlineFooter(doc, ctx, left, pageWidth);
}
