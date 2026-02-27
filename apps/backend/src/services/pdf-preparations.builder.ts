// apps/backend/src/services/pdf-preparations.builder.ts

/**
 * Preparations Report PDF Builder — #159
 *
 * Extracted from pdf.service.ts to keep files manageable.
 * Generates premium PDF for preparations report (service extras).
 *
 * Two views:
 * - detailed: daily timeline → per reservation → extras breakdown
 * - summary: aggregated table per service item
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

export interface PreparationsPDFContext {
  doc: PDFKit.PDFDocument;
  regularFont: string;
  boldFont: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantEmail: string;
}

export function buildPreparationsReportPDF(
  ctx: PreparationsPDFContext,
  data: PreparationsReport
): void {
  const { doc } = ctx;
  const left = 40;
  const pageWidth = doc.page.width - 80;

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

  // ── 3. KPI SUMMARY INFO BOX ──
  const summaryLines: string[] = [
    `Łączna liczba usług: ${data.summary.totalItems}`,
    `Łączna wartość: ${formatCurrency(data.summary.totalValue)}`,
    `Liczba rezerwacji: ${data.summary.totalReservations}`,
    `Dni z wydarzeniami: ${data.summary.daysWithEvents}`,
  ];
  if (data.summary.topCategory) {
    summaryLines.push(`Top kategoria: ${data.summary.topCategory}`);
  }
  if (data.summary.nearestEvent) {
    summaryLines.push(`Najbliższe wydarzenie: ${data.summary.nearestEvent}`);
  }

  drawInfoBox(ctx, 'PODSUMOWANIE', left, doc.y, pageWidth, summaryLines);
  const summaryBoxHeight = calculateInfoBoxHeight(summaryLines.length);
  doc.y = doc.y + summaryBoxHeight + 5;

  doc.moveDown(0.4);
  drawSeparator(ctx, left, pageWidth);
  doc.moveDown(0.4);

  // ── 4. DETAILED VIEW — daily timeline ──
  if (data.filters.view === 'detailed' && data.detailed && data.detailed.length > 0) {
    for (const dayGroup of data.detailed) {
      safePageBreak(doc, 120);

      // Day header bar
      const dayHeaderY = doc.y;
      doc.rect(left, dayHeaderY, pageWidth, 22).fill(COLORS.primaryLight);
      doc.rect(left, dayHeaderY, 4, 22).fill(COLORS.accent);
      doc.fillColor('#ffffff').fontSize(10).font(ctx.boldFont);
      doc.text(
        `📅  ${dayGroup.dateLabel}`,
        left + 14, dayHeaderY + 5,
        { width: pageWidth - 30 }
      );
      doc.y = dayHeaderY + 26;

      // Categories within the day
      for (const category of dayGroup.categories) {
        safePageBreak(doc, 80);

        doc.fontSize(9).font(ctx.boldFont).fillColor(COLORS.purple);
        doc.text(category.categoryName.toUpperCase(), left + 8, doc.y);
        doc.moveDown(0.2);

        // Build table for items in this category
        const rows: string[][] = category.items.map(item => [
          item.serviceName,
          `${item.quantity}`,
          formatCurrency(item.totalPrice),
          item.reservationLabel || '',
          item.note || '',
        ]);

        const colWidths = [
          Math.round(pageWidth * 0.22),
          Math.round(pageWidth * 0.08),
          Math.round(pageWidth * 0.15),
          Math.round(pageWidth * 0.30),
          Math.round(pageWidth * 0.25),
        ];

        drawCompactTable(
          ctx,
          ['Usługa', 'Ilość', 'Wartość', 'Rezerwacja', 'Uwagi'],
          rows,
          colWidths,
          left
        );

        doc.moveDown(0.3);
      }

      // Day subtotal
      if (dayGroup.dayTotal !== undefined) {
        doc.fontSize(8).font(ctx.boldFont).fillColor(COLORS.textDark);
        doc.text(
          `Razem ${dayGroup.dateLabel}: ${dayGroup.dayItemCount || 0} usług, ${formatCurrency(dayGroup.dayTotal)}`,
          left + 8, doc.y
        );
        doc.moveDown(0.2);
      }

      doc.moveDown(0.3);
      drawSeparator(ctx, left, pageWidth);
      doc.moveDown(0.3);
    }
  }

  // ── 5. SUMMARY VIEW — aggregated table ──
  if (data.filters.view === 'summary' && data.summaryTable && data.summaryTable.length > 0) {
    safePageBreak(doc, 100);

    doc.fontSize(11).font(ctx.boldFont).fillColor(COLORS.purple);
    doc.text('ZESTAWIENIE ZBIORCZE USŁUG', left, doc.y);
    doc.moveDown(0.3);

    const summaryRows = data.summaryTable.map(item => [
      item.serviceName,
      item.categoryName,
      `${item.totalQuantity}`,
      formatCurrency(item.totalValue),
      `${item.reservationCount}`,
    ]);

    const summaryCols = [
      Math.round(pageWidth * 0.25),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.12),
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.23),
    ];

    drawCompactTable(
      ctx,
      ['Usługa', 'Kategoria', 'Łącznie szt.', 'Wartość', 'Rezerwacji'],
      summaryRows,
      summaryCols,
      left
    );

    doc.moveDown(0.4);
    drawSeparator(ctx, left, pageWidth);
    doc.moveDown(0.4);
  }

  // ── 6. FOOTER ──
  doc.moveDown(0.5);
  drawInlineFooter(ctx, left, pageWidth);
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

function drawInfoBox(
  ctx: PreparationsPDFContext, title: string,
  x: number, y: number, width: number, lines: string[]
): void {
  const { doc } = ctx;
  const boxHeight = calculateInfoBoxHeight(lines.length);

  doc.rect(x, y, width, boxHeight).fill(COLORS.bgLight);
  doc.rect(x, y, 3, boxHeight).fill(COLORS.accent);

  doc.fillColor(COLORS.textMuted).fontSize(7).font(ctx.boldFont);
  doc.text(title, x + 12, y + 8, { width: width - 20 });

  doc.fontSize(9).font(ctx.regularFont).fillColor(COLORS.textDark);
  let lineY = y + 22;
  lines.forEach((line, i) => {
    if (i === 0) {
      doc.font(ctx.boldFont).fontSize(10);
    } else {
      doc.font(ctx.regularFont).fontSize(8);
    }
    doc.text(line, x + 12, lineY, { width: width - 20 });
    lineY += i === 0 ? 15 : 12;
  });
}

function calculateInfoBoxHeight(lineCount: number): number {
  return Math.max(60, 28 + lineCount * 13);
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
    if (y > doc.page.height - 80) {
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

function drawInlineFooter(ctx: PreparationsPDFContext, left: number, pageWidth: number): void {
  const { doc } = ctx;
  drawSeparator(ctx, left, pageWidth);
  doc.moveDown(0.4);

  doc.fontSize(7).fillColor(COLORS.textMuted).font(ctx.regularFont);
  const footerParts: string[] = [
    `Dziękujemy za wybór restauracji ${ctx.restaurantName}!`,
  ];
  const contactParts: string[] = [];
  if (ctx.restaurantPhone) contactParts.push(ctx.restaurantPhone);
  if (ctx.restaurantEmail) contactParts.push(ctx.restaurantEmail);
  if (contactParts.length > 0) {
    footerParts.push(`W razie pytań: ${contactParts.join(' | ')}`);
  }
  doc.text(footerParts.join('  |  '), left, doc.y, {
    align: 'center', width: pageWidth,
  });

  doc.moveDown(0.2);
  doc.fontSize(6).fillColor(COLORS.textLight);
  doc.text(
    `Dokument wygenerowany automatycznie przez system ${ctx.restaurantName}`,
    left, doc.y,
    { align: 'center', width: pageWidth },
  );
}

function safePageBreak(doc: PDFKit.PDFDocument, minSpace: number = 100): number {
  if (doc.y > doc.page.height - minSpace) {
    doc.addPage();
    doc.y = 50;
  }
  return doc.y;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(numAmount);
}
