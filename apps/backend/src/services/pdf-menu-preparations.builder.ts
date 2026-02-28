// apps/backend/src/services/pdf-menu-preparations.builder.ts

/**
 * PDF builder for Menu Preparations Report (#160)
 * Premium design matching #159 preparations report:
 * - Dark charcoal header with purple accent badge
 * - Compact spacing (no wasted vertical space)
 * - Clean table layouts with proper alignment
 * - Professional footer with page numbers
 * FIX: Added Maluchy (toddlers) column to summary table
 */

import type { MenuPreparationsReport } from '@/types/reports.types';

export interface PDFContext {
  doc: PDFKit.PDFDocument;
  regularFont: string;
  boldFont: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantEmail: string;
}

const COLORS = {
  primary: '#1a2332',
  primaryLight: '#2c3e50',
  accent: '#8e44ad',       // purple accent (matching preparations)
  textDark: '#1a2332',
  textMuted: '#7f8c8d',
  textLight: '#bdc3c7',
  border: '#dce1e8',
  bgLight: '#f4f6f9',
  bgWhite: '#ffffff',
  courseBg: '#FFFBEB',
};

const PAGE_WIDTH = 595.28;
const LEFT = 40;
const RIGHT = PAGE_WIDTH - 40;
const W = RIGHT - LEFT;

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > 750) {
    doc.addPage();
    doc.y = 50;
  }
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.substring(0, 5);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function buildMenuPreparationsReportPDF(
  ctx: PDFContext,
  data: MenuPreparationsReport
): void {
  const { doc } = ctx;
  const { filters, summary } = data;
  const isDetailed = filters.view === 'detailed';

  // ── HEADER BANNER (matching #159) ──
  const bannerHeight = 65;
  doc.rect(0, 0, PAGE_WIDTH, bannerHeight).fill(COLORS.primary);
  doc.rect(0, bannerHeight - 3, PAGE_WIDTH, 3).fill(COLORS.accent);

  doc.fillColor('#ffffff').fontSize(18).font(ctx.boldFont);
  doc.text(ctx.restaurantName, LEFT, 14, { width: W - 150 });

  doc.fontSize(7).font(ctx.regularFont).fillColor(COLORS.textLight);
  const contactParts: string[] = [];
  if (ctx.restaurantPhone) contactParts.push(ctx.restaurantPhone);
  if (ctx.restaurantEmail) contactParts.push(ctx.restaurantEmail);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), LEFT, 38, { width: W - 150 });
  }

  // Badge
  const badgeWidth = 120;
  const badgeHeight = 22;
  const badgeX = PAGE_WIDTH - badgeWidth - LEFT;
  const badgeY = 20;
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4).fill(COLORS.accent);
  doc.fillColor('#ffffff').fontSize(9).font(ctx.boldFont);
  doc.text('MENU', badgeX, badgeY + 6, { width: badgeWidth, align: 'center' });

  // Title
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(16).font(ctx.boldFont);
  doc.text('RAPORT MENU — PRZYGOTOWANIA', LEFT, doc.y, { align: 'center', width: W });

  doc.moveDown(0.2);
  doc.fontSize(8).font(ctx.regularFont).fillColor(COLORS.textMuted);
  const viewLabel = isDetailed ? 'Widok szczegółowy' : 'Widok zbiorczy';
  const metaParts = [
    `Okres: ${filters.dateFrom} - ${filters.dateTo}`,
    viewLabel,
    `Wygenerowano: ${formatDate(new Date())}`,
  ];
  doc.text(metaParts.join('  |  '), LEFT, doc.y, { align: 'center', width: W });

  doc.moveDown(0.6);
  const sepY = doc.y;
  doc.strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(LEFT, sepY).lineTo(RIGHT, sepY).stroke();
  doc.moveDown(0.5);

  // ── KPI CARDS (compact spacing) ──
  const kpiGap = 8;
  const kpiW = (W - kpiGap * 3) / 4;
  const kpiStartY = doc.y;
  const kpis = [
    { label: 'Rezerwacje z menu', value: `${summary.totalMenus}` },
    { label: 'Łącznie gości', value: `${summary.totalGuests}` },
    { label: 'Top pakiet', value: summary.topPackage ? `${summary.topPackage.name} (${summary.topPackage.count})` : 'Brak' },
    { label: 'Goście (D / Dz / M)', value: `${summary.totalAdults} / ${summary.totalChildren} / ${summary.totalToddlers}` },
  ];

  kpis.forEach((kpi, i) => {
    const x = LEFT + i * (kpiW + kpiGap);
    doc.rect(x, kpiStartY, kpiW, 38).fill(COLORS.bgLight);
    doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
    doc.text(kpi.label, x + 6, kpiStartY + 6, { width: kpiW - 12 });
    doc.font(ctx.boldFont).fontSize(10).fillColor(COLORS.textDark);
    doc.text(kpi.value, x + 6, kpiStartY + 18, { width: kpiW - 12 });
  });

  doc.y = kpiStartY + 48;

  // ── DETAILED VIEW ──
  if (isDetailed && data.days) {
    for (const day of data.days) {
      ensureSpace(doc, 60);

      // Day header
      doc.rect(LEFT, doc.y, W, 22).fill(COLORS.primaryLight);
      doc.rect(LEFT, doc.y, 4, 22).fill(COLORS.accent);
      doc.font(ctx.boldFont).fontSize(10).fillColor('#ffffff');
      doc.text(day.dateLabel, LEFT + 14, doc.y + 5, { width: W * 0.6 });
      doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textLight);
      doc.text(
        `${day.totalReservations} rez.  |  ${day.totalGuests} gości`,
        LEFT + 14, doc.y + 5, { width: W - 28, align: 'right' }
      );
      doc.y += 26;

      for (const res of day.reservations) {
        ensureSpace(doc, 50);

        // Reservation card
        doc.rect(LEFT, doc.y, W, 18).fill(COLORS.bgLight);
        doc.font(ctx.boldFont).fontSize(8).fillColor(COLORS.textDark);
        doc.text(res.clientName, LEFT + 8, doc.y + 5, { width: W * 0.4 });

        const timePart = res.startTime
          ? `${formatTime(res.startTime)}${res.endTime ? ' – ' + formatTime(res.endTime) : ''}`
          : '';
        const guestPart = `${res.guests.total} os. (${res.guests.adults}D + ${res.guests.children}Dz + ${res.guests.toddlers}M)`;
        const metaParts = [res.hallName, timePart, guestPart].filter(Boolean).join('  |  ');

        doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
        doc.text(metaParts, LEFT + 8, doc.y + 5, { width: W - 16, align: 'right' });
        doc.y += 20;

        // Package line
        doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
        doc.text('Pakiet: ', LEFT + 8, doc.y + 2, { continued: true });
        doc.font(ctx.boldFont).fillColor(COLORS.textDark);
        doc.text(res.package.name);
        doc.y += 12;

        // Courses (removed redundant "Danie" header)
        for (const course of res.courses) {
          ensureSpace(doc, 24);
          doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.accent);
          doc.text(course.courseName.toUpperCase(), LEFT + 12, doc.y + 2);
          doc.y += 10;

          for (const dish of course.dishes) {
            ensureSpace(doc, 12);
            doc.font(ctx.regularFont).fontSize(8).fillColor(COLORS.textDark);
            const dishText = dish.description
              ? `• ${dish.name}  — ${dish.description}`
              : `• ${dish.name}`;
            const textHeight = doc.heightOfString(dishText, { width: W - 36 });
            doc.text(dishText, LEFT + 18, doc.y, { width: W - 36 });
            doc.y += textHeight + 2;
          }
          doc.y += 2;
        }

        if (res.courses.length === 0) {
          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
          doc.text('Brak dań w menu', LEFT + 18, doc.y);
          doc.y += 12;
        }

        // Separator
        doc.moveTo(LEFT + 10, doc.y).lineTo(RIGHT - 10, doc.y)
          .strokeColor(COLORS.border).lineWidth(0.5).stroke();
        doc.y += 6;
      }

      doc.y += 4;
    }
  }

  // ── SUMMARY VIEW (compact table with Maluchy column) ──
  if (!isDetailed && data.summaryDays) {
    for (const day of data.summaryDays) {
      ensureSpace(doc, 60);

      // Day header
      doc.rect(LEFT, doc.y, W, 22).fill(COLORS.primaryLight);
      doc.rect(LEFT, doc.y, 4, 22).fill(COLORS.accent);
      doc.font(ctx.boldFont).fontSize(10).fillColor('#ffffff');
      doc.text(day.dateLabel, LEFT + 14, doc.y + 5, { width: W * 0.6 });
      doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textLight);
      doc.text(
        `${day.totalReservations} rez.  |  ${day.totalGuests} gości`,
        LEFT + 14, doc.y + 5, { width: W - 28, align: 'right' }
      );
      doc.y += 26;

      for (const course of day.courses) {
        ensureSpace(doc, 44);

        // Course header (subtle)
        doc.rect(LEFT, doc.y, W, 16).fill(COLORS.bgLight);
        doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.accent);
        doc.text(course.courseName.toUpperCase(), LEFT + 8, doc.y + 5);
        doc.y += 18;

        // Table: Danie | Porcje | Dorosłe | Dziecięce | Maluchy | Klienci
        // Adjusted column widths to fit Maluchy column
        const colPct = [0.24, 0.09, 0.09, 0.09, 0.09, 0.40];
        const colW = colPct.map(p => W * p);
        const colX: number[] = [LEFT];
        for (let i = 1; i < colW.length; i++) colX.push(colX[i - 1] + colW[i - 1]);

        // Table header
        const headerY = doc.y;
        doc.rect(LEFT, headerY, W, 14).fill(COLORS.primaryLight);
        const headers = ['Danie', 'Porcje', 'Dorosłe', 'Dziecięce', 'Maluchy', 'Klienci'];
        doc.font(ctx.boldFont).fontSize(6).fillColor('#ffffff');
        headers.forEach((h, i) => {
          const align = (i >= 1 && i <= 4) ? 'right' as const : 'left' as const;
          doc.text(h, colX[i] + 4, headerY + 4, { width: colW[i] - 8, align });
        });
        doc.y = headerY + 16;

        // Dish rows (tight vertical spacing, prevent text wrapping by reducing line height)
        for (const dish of course.dishes) {
          ensureSpace(doc, 10);
          const rowY = doc.y;

          // All text on same baseline (rowY + 2)
          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textDark);
          doc.text(dish.dishName, colX[0] + 3, rowY + 2, { width: colW[0] - 6, lineBreak: false, ellipsis: true });

          doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.textDark);
          doc.text(`${dish.totalPortions}`, colX[1] + 3, rowY + 2, { width: colW[1] - 6, align: 'right' });

          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
          doc.text(`${dish.adultPortions}`, colX[2] + 3, rowY + 2, { width: colW[2] - 6, align: 'right' });
          doc.text(`${dish.childrenPortions}`, colX[3] + 3, rowY + 2, { width: colW[3] - 6, align: 'right' });
          doc.text(`${dish.toddlerPortions}`, colX[4] + 3, rowY + 2, { width: colW[4] - 6, align: 'right' });

          const clientStr = dish.reservations.map(r => `${r.clientName} (${r.guests})`).join(', ');
          doc.font(ctx.regularFont).fontSize(6).fillColor(COLORS.textMuted);
          doc.text(clientStr, colX[5] + 3, rowY + 2, { width: colW[5] - 6, lineBreak: false, ellipsis: true });

          doc.y = rowY + 10;
        }

        doc.y += 3;
      }

      doc.y += 6;
    }
  }

  // ── FOOTER (matching #159) ──
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const footerY = 810;
    const sepFooterY = footerY - 10;
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(LEFT, sepFooterY).lineTo(RIGHT, sepFooterY).stroke();

    doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
    const footerParts: string[] = [
      `Dziękujemy za wybór restauracji ${ctx.restaurantName}!`,
    ];
    const contactParts: string[] = [];
    if (ctx.restaurantPhone) contactParts.push(ctx.restaurantPhone);
    if (ctx.restaurantEmail) contactParts.push(ctx.restaurantEmail);
    if (contactParts.length > 0) {
      footerParts.push(`W razie pytań: ${contactParts.join(' | ')}`);
    }
    doc.text(footerParts.join('  |  '), LEFT, footerY, {
      align: 'center', width: W,
    });

    doc.fontSize(6).fillColor(COLORS.textLight);
    doc.text(
      `Dokument wygenerowany automatycznie przez system ${ctx.restaurantName}  |  Strona ${i + 1} z ${range.count}`,
      LEFT, footerY + 12,
      { align: 'center', width: W },
    );
  }
}
