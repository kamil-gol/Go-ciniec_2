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

import type { OccupancyReportPDFData } from './pdf.types';
import { COLORS } from './pdf.types';

import {
  formatDate,
  translateDayOfWeek,
  getRegularFont,
  getBoldFont,
} from './pdf.utils';

// ═══════════════════════════════════════════════════════════════
// ██  PREMIUM OCCUPANCY REPORT PDF — Zadanie 4
// ═══════════════════════════════════════════════════════════════

export function buildOccupancyReportPDF(
  doc: PDFKit.PDFDocument,
  data: OccupancyReportPDFData,
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
  doc.text('RAPORT ZAJĘTOŚCI', left, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.2);
  doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text(
    `Okres: ${data.filters.dateFrom} - ${data.filters.dateTo}  |  Wygenerowano: ${formatDate(new Date())}`,
    left, doc.y, { align: 'center', width: pageWidth }
  );

  doc.moveDown(0.6);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);

  // ── 3. SUMMARY INFO BOX ──
  const summaryLines: string[] = [
    `Średnia zajętość: ${data.summary.avgOccupancy}%`,
    `Najpopularniejszy dzień: ${translateDayOfWeek(data.summary.peakDay)}`,
    `Najpopularniejsza sala: ${data.summary.peakHall || 'Brak danych'}`,
    `Liczba rezerwacji: ${data.summary.totalReservations}`,
    `Dni w okresie: ${data.summary.totalDaysInPeriod}`,
  ];

  drawInfoBox(doc, ctx, 'PODSUMOWANIE', left, doc.y, pageWidth, summaryLines);
  const summaryBoxHeight = calculateInfoBoxHeight(summaryLines.length);
  doc.y = doc.y + summaryBoxHeight + 5;

  doc.moveDown(0.4);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.4);

  // ── 4. HALLS RANKING ──
  if (data.halls.length > 0) {
    safePageBreak(doc, 100);
    drawSectionHeader(doc, ctx, 'ZAJĘTOŚĆ SAL', left, pageWidth);

    const hallRows = data.halls.slice(0, 20).map(hall => [
      hall.hallName,
      `${hall.occupancy}%`,
      `${hall.reservations}`,
      `${hall.avgGuestsPerReservation}`,
    ]);
    const hallCols = [
      Math.round(pageWidth * 0.30),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.25),
      Math.round(pageWidth * 0.25),
    ];
    drawCompactTable(doc, ctx, ['Sala', 'Zajętość %', 'Rezerwacje', 'Śr. gości'], hallRows, hallCols, left);

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 5. PEAK HOURS ──
  if (data.peakHours.length > 0) {
    safePageBreak(doc, 100);
    drawSectionHeader(doc, ctx, 'NAJPOPULARNIEJSZE GODZINY', left, pageWidth);

    const hourRows = data.peakHours.slice(0, 20).map(hour => [
      `${hour.hour}:00`,
      `${hour.count}`,
    ]);
    const hourCols = [
      Math.round(pageWidth * 0.50),
      Math.round(pageWidth * 0.50),
    ];
    drawCompactTable(doc, ctx, ['Godzina', 'Liczba rezerwacji'], hourRows, hourCols, left);

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 6. PEAK DAYS OF WEEK ──
  if (data.peakDaysOfWeek.length > 0) {
    safePageBreak(doc, 100);
    drawSectionHeader(doc, ctx, 'NAJPOPULARNIEJSZE DNI TYGODNIA', left, pageWidth);

    const dayRows = data.peakDaysOfWeek.map(day => [
      translateDayOfWeek(day.dayOfWeek),
      `${day.count}`,
    ]);
    const dayCols = [
      Math.round(pageWidth * 0.50),
      Math.round(pageWidth * 0.50),
    ];
    drawCompactTable(doc, ctx, ['Dzień tygodnia', 'Liczba rezerwacji'], dayRows, dayCols, left);

    doc.moveDown(0.4);
  }

  // ── 7. FOOTER ──
  doc.moveDown(0.5);
  drawInlineFooter(doc, ctx, left, pageWidth);
}
