// apps/backend/src/services/pdf-menu-preparations.builder.ts

/**
 * PDF builder for Menu Preparations Report (#160)
 * Premium design with enhanced UX:
 * - Compact spacing (no wasted vertical space, no empty pages)
 * - Clear visual hierarchy
 * - Prominent reservation details in detailed view
 * - Clean table layouts with proper alignment
 * - Professional footer with page numbers
 * - Smart pagination with controlled page breaks
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
  accent: '#8e44ad',       // purple accent
  textDark: '#1a2332',
  textMuted: '#7f8c8d',
  textLight: '#bdc3c7',
  border: '#dce1e8',
  bgLight: '#f4f6f9',
  bgWhite: '#ffffff',
  reservationBg: '#EDE9FE',  // light purple for reservation cards
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;  // A4 height
const LEFT = 40;
const RIGHT = PAGE_WIDTH - 40;
const W = RIGHT - LEFT;
const FOOTER_Y = 800;  // footer separator line position
const TOP_MARGIN = 50; // top margin on new pages

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

/**
 * Smart page break — ensures minimum space remaining before continuing.
 * Adds new page and sets doc.y to TOP_MARGIN if not enough space.
 */
function ensureSpace(doc: PDFKit.PDFDocument, minSpace: number): void {
  if (doc.y + minSpace > FOOTER_Y) {
    doc.addPage();
    doc.y = TOP_MARGIN;
  }
}

/**
 * Measure text width for manual centering.
 * Sets font+size as side effect (caller renders immediately after).
 */
function measureTextWidth(
  doc: PDFKit.PDFDocument,
  text: string,
  fontSize: number,
  font: string
): number {
  doc.font(font).fontSize(fontSize);
  return doc.widthOfString(text);
}

export function buildMenuPreparationsReportPDF(
  ctx: PDFContext,
  data: MenuPreparationsReport
): void {
  const { doc } = ctx;
  const { filters, summary } = data;
  const isDetailed = filters.view === 'detailed';

  // ── HEADER BANNER ──
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
  doc.text('RAPORT MENU \u2014 PRZYGOTOWANIA', LEFT, doc.y, { align: 'center', width: W });

  doc.moveDown(0.2);
  doc.fontSize(8).font(ctx.regularFont).fillColor(COLORS.textMuted);
  const viewLabel = isDetailed ? 'Widok szczeg\u00f3\u0142owy' : 'Widok zbiorczy';
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

  // ── KPI CARDS ──
  const kpiGap = 8;
  const kpiW = (W - kpiGap * 3) / 4;
  const kpiStartY = doc.y;
  const kpis = [
    { label: 'Rezerwacje z menu', value: `${summary.totalMenus}` },
    { label: '\u0141\u0105cznie go\u015bci', value: `${summary.totalGuests}` },
    { label: 'Top pakiet', value: summary.topPackage ? `${summary.topPackage.name} (${summary.topPackage.count})` : 'Brak' },
    { label: 'Go\u015bcie (D / Dz / M)', value: `${summary.totalAdults} / ${summary.totalChildren} / ${summary.totalToddlers}` },
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

  // ══════════════════════════════════════════════════════════════
  // ── DETAILED VIEW (ultra-compact for single-page output) ──
  // ══════════════════════════════════════════════════════════════
  if (isDetailed && data.days) {
    for (const day of data.days) {
      ensureSpace(doc, 60);

      // Day header (compact: 16px)
      doc.rect(LEFT, doc.y, W, 16).fill(COLORS.primaryLight);
      doc.rect(LEFT, doc.y, 4, 16).fill(COLORS.accent);
      doc.font(ctx.boldFont).fontSize(9).fillColor('#ffffff');
      doc.text(day.dateLabel, LEFT + 12, doc.y + 4, { width: W - 24 });
      doc.y += 17;

      for (const res of day.reservations) {
        ensureSpace(doc, 50);

        // Reservation header (compact: 13px)
        const timePart = res.startTime
          ? `${formatTime(res.startTime)}${res.endTime ? ' \u2013 ' + formatTime(res.endTime) : ''}`
          : '';
        const guestPart = `${res.guests.total} os. (${res.guests.adults}D+${res.guests.children}Dz+${res.guests.toddlers}M)`;
        const headerParts = [res.hallName, timePart, guestPart].filter(Boolean);
        const fullHeader = `${res.clientName}  |  ${headerParts.join('  |  ')}`;

        doc.rect(LEFT, doc.y, W, 13).fill(COLORS.reservationBg);
        doc.font(ctx.boldFont).fontSize(7.5).fillColor(COLORS.textDark);
        doc.text(fullHeader, LEFT + 8, doc.y + 3, { width: W - 16 });
        doc.y += 14;

        // Package (inline, compact)
        doc.font(ctx.regularFont).fontSize(5.5).fillColor(COLORS.textMuted);
        doc.text(`Pakiet: ${res.package.name}`, LEFT + 8, doc.y, { width: W - 16 });
        doc.y += 7;

        for (const course of res.courses) {
          ensureSpace(doc, 18);

          // Course header — compact bold text with subtle left accent line
          doc.rect(LEFT + 8, doc.y, 2, 8).fill(COLORS.accent);
          doc.font(ctx.boldFont).fontSize(6.5).fillColor(COLORS.accent);
          doc.text(course.courseName.toUpperCase(), LEFT + 14, doc.y + 1);
          doc.y += 9;

          for (const dish of course.dishes) {
            ensureSpace(doc, 12);

            doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textDark);
            const dishText = `\u2022 ${dish.name}`;
            const textHeight = doc.heightOfString(dishText, { width: W - 36 });
            doc.text(dishText, LEFT + 18, doc.y, { width: W - 36 });
            doc.y += textHeight + 1;
          }
          doc.y += 1;
        }

        if (res.courses.length === 0) {
          doc.font(ctx.regularFont).fontSize(6).fillColor(COLORS.textMuted);
          doc.text('Brak da\u0144 w menu', LEFT + 18, doc.y);
          doc.y += 8;
        }

        // Thin separator between reservations
        doc.moveTo(LEFT + 8, doc.y).lineTo(RIGHT - 8, doc.y)
          .strokeColor(COLORS.border).lineWidth(0.3).stroke();
        doc.y += 3;
      }

      doc.y += 2;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ── SUMMARY VIEW (compact table with dynamic row heights) ──
  // ══════════════════════════════════════════════════════════════
  if (!isDetailed && data.summaryDays) {
    for (const day of data.summaryDays) {
      ensureSpace(doc, 60);

      doc.rect(LEFT, doc.y, W, 16).fill(COLORS.primaryLight);
      doc.rect(LEFT, doc.y, 4, 16).fill(COLORS.accent);
      doc.font(ctx.boldFont).fontSize(9).fillColor('#ffffff');
      doc.text(day.dateLabel, LEFT + 12, doc.y + 4, { width: W - 24 });
      doc.y += 17;

      for (const course of day.courses) {
        ensureSpace(doc, 35);

        // Category bar (compact: 11px)
        doc.rect(LEFT, doc.y, W, 11).fill(COLORS.bgLight);
        doc.font(ctx.boldFont).fontSize(6.5).fillColor(COLORS.accent);
        doc.text(course.courseName.toUpperCase(), LEFT + 8, doc.y + 3);
        doc.y += 13; // 11px bar + 2px minimal gap

        const colPct = [0.24, 0.09, 0.09, 0.09, 0.09, 0.40];
        const colW = colPct.map(p => W * p);
        const colX: number[] = [LEFT];
        for (let i = 1; i < colW.length; i++) colX.push(colX[i - 1] + colW[i - 1]);

        // Table header
        const headerY = doc.y;
        doc.rect(LEFT, headerY, W, 11).fill(COLORS.primaryLight);
        const headers = ['Danie', 'Porcje', 'Doros\u0142e', 'Dzieci\u0119ce', 'Maluchy', 'Klienci'];
        doc.font(ctx.boldFont).fontSize(6).fillColor('#ffffff');
        headers.forEach((h, i) => {
          const align = (i >= 1 && i <= 4) ? 'right' as const : 'left' as const;
          doc.text(h, colX[i] + 3, headerY + 3, { width: colW[i] - 6, align });
        });
        doc.y = headerY + 11;

        for (const dish of course.dishes) {
          // Measure dish name height to handle text wrapping
          doc.font(ctx.regularFont).fontSize(7);
          const dishNameHeight = doc.heightOfString(dish.dishName, { width: colW[0] - 6 });
          const rowHeight = Math.max(11, dishNameHeight + 4); // min 11px, or text + padding

          ensureSpace(doc, rowHeight);

          const rowY = doc.y;

          // Dish name (allows wrapping)
          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textDark);
          doc.text(dish.dishName, colX[0] + 3, rowY + 2, { width: colW[0] - 6 });

          // Numeric columns (vertically centered in row)
          const numY = rowY + 2;

          doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.textDark);
          doc.text(`${dish.totalPortions}`, colX[1] + 3, numY, { width: colW[1] - 6, align: 'right' });

          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
          doc.text(`${dish.adultPortions}`, colX[2] + 3, numY, { width: colW[2] - 6, align: 'right' });
          doc.text(`${dish.childrenPortions}`, colX[3] + 3, numY, { width: colW[3] - 6, align: 'right' });
          doc.text(`${dish.toddlerPortions}`, colX[4] + 3, numY, { width: colW[4] - 6, align: 'right' });

          const clientStr = dish.reservations.map(r => `${r.clientName} (${r.guests})`).join(', ');
          doc.font(ctx.regularFont).fontSize(6).fillColor(COLORS.textMuted);
          doc.text(clientStr, colX[5] + 3, numY, { width: colW[5] - 6, lineBreak: false, ellipsis: true });

          doc.y = rowY + rowHeight;
        }

        doc.y += 8; // breathing room before next category
      }

      doc.y += 4;
    }
  }

  // ── FOOTER (safe rendering without auto-pagination) ──
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);

    const footerTextY = 810;
    const sepFooterY = FOOTER_Y;

    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(LEFT, sepFooterY).lineTo(RIGHT, sepFooterY).stroke();

    // Footer line 1
    const footerParts: string[] = [
      `Dzi\u0119kujemy za wyb\u00f3r restauracji ${ctx.restaurantName}!`,
    ];
    const contactParts2: string[] = [];
    if (ctx.restaurantPhone) contactParts2.push(ctx.restaurantPhone);
    if (ctx.restaurantEmail) contactParts2.push(ctx.restaurantEmail);
    if (contactParts2.length > 0) {
      footerParts.push(`W razie pyta\u0144: ${contactParts2.join(' | ')}`);
    }
    const footerLine1 = footerParts.join('  |  ');

    const line1W = measureTextWidth(doc, footerLine1, 7, ctx.regularFont);
    doc.fillColor(COLORS.textMuted);
    const line1X = LEFT + (W - line1W) / 2;
    doc._fragment(footerLine1, line1X, footerTextY, { lineBreak: false });

    // Footer line 2
    const footerLine2 = `Dokument wygenerowany automatycznie przez system ${ctx.restaurantName}  |  Strona ${i + 1} z ${range.count}`;
    const line2W = measureTextWidth(doc, footerLine2, 6, ctx.regularFont);
    doc.fillColor(COLORS.textLight);
    const line2X = LEFT + (W - line2W) / 2;
    doc._fragment(footerLine2, line2X, footerTextY + 12, { lineBreak: false });
  }
}
