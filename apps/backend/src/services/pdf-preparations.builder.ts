// apps/backend/src/services/pdf-preparations.builder.ts

/**
 * Preparations Report PDF Builder — #159
 *
 * Extracted from pdf.service.ts to keep files manageable.
 * Generates premium PDF for preparations report (service extras).
 *
 * Two views:
 * - detailed: daily timeline → per category → extras breakdown
 * - summary: aggregated table per day
 *
 * Aligned with actual API response structure (summary.totalExtras,
 * summary.totalReservationsWithExtras, days[], summaryDays[], etc.)
 *
 * FIX: Removed emoji/icons from PDF text — PDFKit cannot render emoji
 * in standard fonts, causing [] artifacts.
 * FIX: Added startTime to reservation labels in both views.
 * FIX: Removed (quantity) from Klienci column in summary — duplicates Łącznie szt.
 * FIX: Removed PODSUMOWANIE section and nearestEvent from PDF export.
 * FIX: Removed Wartość column — preparations report is for staff ops, prices in reservation form.
 * FIX: Applied footer pagination fix (mirrors #160 menu report fix).
 */

import type { PreparationsReport } from '@/types/reports.types';

// Re-use COLORS from pdf.service palette
const COLORS = {
  primary: '#1a2332',
  primaryLight: '#2c3e50',
  accent: '#c8a45a',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
  textDark: '#1a2332',
  textMuted: '#7f8c8d',
  textLight: '#bdc3c7',
  border: '#dce1e8',
  bgLight: '#f4f6f9',
  bgWhite: '#ffffff',
  purple: '#8e44ad',
};

const PAGE_HEIGHT = 841.89;  // A4
const FOOTER_AREA = 50;
const MAX_CONTENT_Y = PAGE_HEIGHT - FOOTER_AREA;

export interface PreparationsPDFContext {
  doc: PDFKit.PDFDocument;
  regularFont: string;
  boldFont: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantEmail: string;
}

/**
 * Calculate text dimensions without rendering.
 * Used for safe footer positioning.
 */
function measureText(
  doc: PDFKit.PDFDocument,
  text: string,
  fontSize: number,
  font: string,
  width: number
): { width: number; height: number } {
  const savedFont = doc._font;
  const savedFontSize = doc._fontSize;
  
  doc.font(font).fontSize(fontSize);
  const textWidth = doc.widthOfString(text, { width });
  const textHeight = doc.heightOfString(text, { width });
  
  doc.font(savedFont).fontSize(savedFontSize);
  
  return { width: textWidth, height: textHeight };
}

/**
 * Smart page break - ensures minimum space remaining.
 */
function ensureSpace(doc: PDFKit.PDFDocument, minSpace: number = 120): number {
  if (doc.y > MAX_CONTENT_Y - minSpace) {
    doc.addPage();
    return 50;
  }
  return doc.y;
}

export function buildPreparationsReportPDF(
  ctx: PreparationsPDFContext,
  data: PreparationsReport
): void {
  const { doc } = ctx;
  const left = 40;
  const pageWidth = doc.page.width - 80;
  let lastContentY = 0;

  // ── 1. HEADER BANNER ──
  drawHeaderBanner(ctx, 'PRZYGOTOWANIA', COLORS.purple);

  // ── 2. TITLE + META ──
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(16).font(ctx.boldFont);
  doc.text('RAPORT PRZYGOTOWAŃ', left, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.2);
  doc.fontSize(8).font(ctx.regularFont).fillColor(COLORS.textMuted);
  const viewLabel = data.filters.view === 'summary' ? 'Widok zbiorczy' : 'Widok szczegółowy';
  const metaParts = [
    `Okres: ${data.filters.dateFrom} - ${data.filters.dateTo}`,
    viewLabel,
    `Wygenerowano: ${formatDate(new Date())}`,
  ];
  doc.text(metaParts.join('  |  '), left, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.6);
  drawSeparator(ctx, left, pageWidth);
  doc.moveDown(0.5);
  lastContentY = doc.y;

  // ── 3. DETAILED VIEW — daily timeline ──
  // Columns: Usługa, Ilość, Rezerwacja, Uwagi (no Wartość)
  const days = (data as any).days;
  if (data.filters.view === 'detailed' && days && days.length > 0) {
    for (const day of days) {
      ensureSpace(doc, 120);

      // Day header bar
      const dayHeaderY = doc.y;
      doc.rect(left, dayHeaderY, pageWidth, 22).fill(COLORS.primaryLight);
      doc.rect(left, dayHeaderY, 4, 22).fill(COLORS.accent);
      doc.fillColor('#ffffff').fontSize(10).font(ctx.boldFont);
      doc.text(
        `${day.dateLabel}`,
        left + 14, dayHeaderY + 5,
        { width: pageWidth - 100 }
      );
      // Right-aligned count
      doc.text(
        `Usług: ${day.totalItems || 0}`,
        left + pageWidth - 100, dayHeaderY + 5,
        { width: 90, align: 'right' }
      );
      doc.y = dayHeaderY + 26;

      // Categories within the day
      for (const category of day.categories) {
        ensureSpace(doc, 80);

        doc.fontSize(9).font(ctx.boldFont).fillColor(COLORS.purple);
        doc.text(
          `${category.categoryName}`.toUpperCase(),
          left + 8, doc.y
        );
        doc.moveDown(0.2);

        // Build table for items in this category — no Wartość column
        const rows: string[][] = category.items.map((item: any) => {
          const timeStr = item.reservation?.startTime ? ` ${item.reservation.startTime}` : '';
          const reservationLabel = item.reservation
            ? `${item.reservation.clientName}${timeStr} (${item.reservation.hallName})`
            : (item.reservationLabel || '');
          return [
            item.serviceName,
            `${item.quantity}`,
            reservationLabel,
            item.note || '',
          ];
        });

        const colWidths = [
          Math.round(pageWidth * 0.25),
          Math.round(pageWidth * 0.10),
          Math.round(pageWidth * 0.40),
          Math.round(pageWidth * 0.25),
        ];

        drawCompactTable(
          ctx,
          ['Usługa', 'Ilość', 'Rezerwacja', 'Uwagi'],
          rows,
          colWidths,
          left
        );

        doc.moveDown(0.3);
      }

      doc.moveDown(0.3);
      drawSeparator(ctx, left, pageWidth);
      doc.moveDown(0.3);
      lastContentY = doc.y;
    }
  }

  // ── 4. SUMMARY VIEW — aggregated table per day ──
  // FIX: removed (quantity) from Klienci column — duplicates Łącznie szt. column
  const summaryDays = (data as any).summaryDays;
  if (data.filters.view === 'summary' && summaryDays && summaryDays.length > 0) {
    for (const day of summaryDays) {
      ensureSpace(doc, 100);

      // Day header bar
      const dayHeaderY = doc.y;
      doc.rect(left, dayHeaderY, pageWidth, 22).fill(COLORS.primaryLight);
      doc.rect(left, dayHeaderY, 4, 22).fill(COLORS.accent);
      doc.fillColor('#ffffff').fontSize(10).font(ctx.boldFont);
      doc.text(
        `${day.dateLabel}`,
        left + 14, dayHeaderY + 5,
        { width: pageWidth - 150 }
      );
      doc.text(
        `Usług: ${day.totalItems || 0}  |  Rez.: ${day.totalReservations || 0}`,
        left + pageWidth - 150, dayHeaderY + 5,
        { width: 140, align: 'right' }
      );
      doc.y = dayHeaderY + 26;

      doc.moveDown(0.2);

      const summaryRows = day.items.map((item: any) => {
        // Changed from: clientName startTime (quantity)
        // To: clientName startTime (no quantity — already in Łącznie szt. column)
        const clientNames = item.reservations
          ? item.reservations.map((r: any) => {
              const time = r.startTime ? ` ${r.startTime}` : '';
              return `${r.clientName}${time}`;
            }).join(', ')
          : '';
        return [
          item.serviceName,
          `${item.categoryName}`,
          `${item.totalQuantity}`,
          `${item.reservationCount}`,
          clientNames,
        ];
      });

      const summaryCols = [
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.12),
        Math.round(pageWidth * 0.13),
        Math.round(pageWidth * 0.30),
      ];

      drawCompactTable(
        ctx,
        ['Usługa', 'Kategoria', 'Łącznie szt.', 'Rezerwacji', 'Klienci'],
        summaryRows,
        summaryCols,
        left
      );

      doc.moveDown(0.3);
      drawSeparator(ctx, left, pageWidth);
      doc.moveDown(0.3);
      lastContentY = doc.y;
    }
  }

  // ── 5. FOOTER (safe rendering without auto-pagination) ──
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    
    // Skip footer on pages without content
    if (i > 0 && lastContentY < 80) {
      continue;
    }
    
    const footerY = 810;
    const sepFooterY = footerY - 10;
    
    // Draw separator line
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(left, sepFooterY).lineTo(left + pageWidth, sepFooterY).stroke();

    // ── Footer text line 1 (safe rendering) ──
    const footerParts: string[] = [
      `Dziękujemy za wybór restauracji ${ctx.restaurantName}!`,
    ];
    const contactParts: string[] = [];
    if (ctx.restaurantPhone) contactParts.push(ctx.restaurantPhone);
    if (ctx.restaurantEmail) contactParts.push(ctx.restaurantEmail);
    if (contactParts.length > 0) {
      footerParts.push(`W razie pytań: ${contactParts.join(' | ')}`);
    }
    const footerLine1 = footerParts.join('  |  ');

    doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
    
    const line1Dims = measureText(doc, footerLine1, 7, ctx.regularFont, pageWidth);
    const line1X = left + (pageWidth - line1Dims.width) / 2;
    
    doc._fragment(footerLine1, line1X, footerY, { width: pageWidth, align: 'left', lineBreak: false });

    // ── Footer text line 2 (safe rendering) ──
    const footerLine2 = `Dokument wygenerowany automatycznie przez system ${ctx.restaurantName}  |  Strona ${i + 1} z ${range.count}`;
    
    doc.fontSize(6).fillColor(COLORS.textLight);
    
    const line2Dims = measureText(doc, footerLine2, 6, ctx.regularFont, pageWidth);
    const line2X = left + (pageWidth - line2Dims.width) / 2;
    
    doc._fragment(footerLine2, line2X, footerY + 12, { width: pageWidth, align: 'left', lineBreak: false });
  }
}

// ═══════════════ SHARED HELPERS (mirror pdf.service.ts) ═══════════════

function drawHeaderBanner(ctx: PreparationsPDFContext, badgeLabel: string, badgeColor: string): void {
  const { doc } = ctx;
  const bannerHeight = 65;
  const pageWidth = doc.page.width;

  doc.rect(0, 0, pageWidth, bannerHeight).fill(COLORS.primary);
  doc.rect(0, bannerHeight - 3, pageWidth, 3).fill(COLORS.accent);

  doc.fillColor('#ffffff').fontSize(18).font(ctx.boldFont);
  doc.text(ctx.restaurantName, 40, 14, { width: pageWidth - 200 });

  doc.fontSize(7).font(ctx.regularFont).fillColor(COLORS.textLight);
  const contactParts: string[] = [];
  if (ctx.restaurantPhone) contactParts.push(ctx.restaurantPhone);
  if (ctx.restaurantEmail) contactParts.push(ctx.restaurantEmail);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), 40, 38, { width: pageWidth - 200 });
  }

  const badgeWidth = 120;
  const badgeHeight = 22;
  const badgeX = pageWidth - badgeWidth - 40;
  const badgeY = 20;
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4).fill(badgeColor);
  doc.fillColor('#ffffff').fontSize(9).font(ctx.boldFont);
  doc.text(badgeLabel, badgeX, badgeY + 6, { width: badgeWidth, align: 'center' });
}

function drawSeparator(ctx: PreparationsPDFContext, left: number, width: number): void {
  const { doc } = ctx;
  const y = doc.y;
  doc.strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(left, y).lineTo(left + width, y).stroke();
}

function drawCompactTable(
  ctx: PreparationsPDFContext,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startX: number
): void {
  const { doc } = ctx;
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
    doc.fillColor('#ffffff').fontSize(cellFontSize).font(ctx.boldFont);
    doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });
  y += headerHeight;

  // Data rows
  rows.forEach((row, rowIndex) => {
    if (y > MAX_CONTENT_Y - 80) {
      doc.addPage();
      y = 50;
    }

    let maxCellHeight = minRowHeight;
    row.forEach((cell, i) => {
      const isFirstCol = i === 0;
      doc.fontSize(cellFontSize)
         .font(isFirstCol ? ctx.boldFont : ctx.regularFont);
      const textHeight = doc.heightOfString(cell || '', { width: colWidths[i] - 10 });
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
         .font(isFirstCol ? ctx.boldFont : ctx.regularFont);
      doc.text(cell || '', x + 5, y + cellPadding, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });
    y += maxCellHeight;
  });

  doc.strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();
  doc.y = y + 3;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
