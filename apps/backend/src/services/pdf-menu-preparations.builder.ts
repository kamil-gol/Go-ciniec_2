// apps/backend/src/services/pdf-menu-preparations.builder.ts

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
  accent: '#8e44ad',
  textDark: '#1a2332',
  textMuted: '#7f8c8d',
  textLight: '#bdc3c7',
  border: '#dce1e8',
  bgLight: '#f4f6f9',
  bgWhite: '#ffffff',
  reservationBg: '#EDE9FE',
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 40;
const RIGHT = PAGE_WIDTH - 40;
const W = RIGHT - LEFT;
const FOOTER_Y = 800;
const TOP_MARGIN = 50;

const COL_GAP = 10;
const COL_W = (W - COL_GAP) / 2;
const COL_LEFT_X = LEFT;
const COL_RIGHT_X = LEFT + COL_W + COL_GAP;

function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.substring(0, 5);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ensureSpace(doc: PDFKit.PDFDocument, minSpace: number): void {
  if (doc.y + minSpace > FOOTER_Y) {
    doc.addPage();
    doc.y = TOP_MARGIN;
  }
}

function measureTextWidth(
  doc: PDFKit.PDFDocument,
  text: string,
  fontSize: number,
  font: string
): number {
  doc.font(font).fontSize(fontSize);
  return doc.widthOfString(text);
}

/**
 * Render a single reservation card at explicit (x, y) position.
 * 2-line header (both lines same bold 8pt dark style):
 *   Line 1: "13:00 \u2013 04:00  |  Marek Kowalski"
 *   Line 2: "99 os. (90D+5Dz+4M)  |  Sala Z\u0142ota"
 * Returns the final Y position after rendering.
 */
function renderReservationCard(
  ctx: PDFContext,
  res: any,
  x: number,
  y: number,
  colWidth: number
): number {
  const { doc } = ctx;
  const innerPad = 6;
  const textWidth = colWidth - innerPad * 2;

  // Build header parts
  const timePart = res.startTime
    ? `${formatTime(res.startTime)}${res.endTime ? ' \u2013 ' + formatTime(res.endTime) : ''}`
    : '';
  const guestPart = `${res.guests.total} os. (${res.guests.adults}D+${res.guests.children}Dz+${res.guests.toddlers}M)`;

  // Line 1: time | client name
  const line1Parts = [timePart, res.clientName].filter(Boolean);
  const headerLine1 = line1Parts.join('  |  ');

  // Line 2: guests | hall name
  const line2Parts = [guestPart, res.hallName].filter(Boolean);
  const headerLine2 = line2Parts.join('  |  ');

  // Measure both lines (same font for both)
  doc.font(ctx.boldFont).fontSize(8);
  const line1Height = doc.heightOfString(headerLine1, { width: textWidth });
  const line2Height = doc.heightOfString(headerLine2, { width: textWidth });
  const headerHeight = line1Height + line2Height + 7;

  // Draw background covering both lines
  doc.rect(x, y, colWidth, headerHeight).fill(COLORS.reservationBg);

  // Render line 1 (bold, dark)
  doc.font(ctx.boldFont).fontSize(8).fillColor(COLORS.textDark);
  doc.text(headerLine1, x + innerPad, y + 3, { width: textWidth });

  // Render line 2 (same style as line 1)
  doc.font(ctx.boldFont).fontSize(8).fillColor(COLORS.textDark);
  doc.text(headerLine2, x + innerPad, doc.y, { width: textWidth });

  y += headerHeight + 2;

  // Courses
  for (const course of res.courses) {
    doc.rect(x + innerPad, y, 2, 9).fill(COLORS.accent);
    doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.accent);
    doc.text(course.courseName.toUpperCase(), x + innerPad + 6, y + 1, { width: textWidth - 6 });
    y = doc.y + 2;

    for (const dish of course.dishes) {
      doc.font(ctx.regularFont).fontSize(7.5).fillColor(COLORS.textDark);

      let dishText = `\u2022 ${dish.name}`;
      if (dish.portionSize != null && dish.portionSize !== 1) {
        dishText += ` (\u00d7${dish.portionSize})`;
      }

      const textHeight = doc.heightOfString(dishText, { width: textWidth - 10 });
      doc.text(dishText, x + innerPad + 10, y, { width: textWidth - 10 });
      y += textHeight + 1;
    }
    y += 2;
  }

  if (res.courses.length === 0) {
    doc.font(ctx.regularFont).fontSize(6.5).fillColor(COLORS.textMuted);
    doc.text('Brak da\u0144 w menu', x + innerPad + 10, y);
    y += 10;
  }

  return y;
}

export function buildMenuPreparationsReportPDF(
  ctx: PDFContext,
  data: MenuPreparationsReport
): void {
  const { doc } = ctx;
  const { filters, summary } = data;
  const isDetailed = filters.view === 'detailed';

  // HEADER BANNER
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
    `Wygenerowano: ${formatDateTime(new Date())}`,
  ];
  doc.text(metaParts.join('  |  '), LEFT, doc.y, { align: 'center', width: W });

  doc.moveDown(0.6);
  const sepY = doc.y;
  doc.strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(LEFT, sepY).lineTo(RIGHT, sepY).stroke();
  doc.moveDown(0.5);

  // KPI CARDS (3 cards)
  const kpiGap = 8;
  const kpiW = (W - kpiGap * 2) / 3;
  const kpiStartY = doc.y;
  const kpis = [
    { label: 'Rezerwacje z menu', value: `${summary.totalMenus}` },
    { label: '\u0141\u0105cznie go\u015bci', value: `${summary.totalGuests}` },
    { label: 'Go\u015bcie (D / Dz / M)', value: `${summary.totalAdults} / ${summary.totalChildren} / ${summary.totalToddlers}` },
  ];

  kpis.forEach((kpi, i) => {
    const kx = LEFT + i * (kpiW + kpiGap);
    doc.rect(kx, kpiStartY, kpiW, 38).fill(COLORS.bgLight);
    doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
    doc.text(kpi.label, kx + 6, kpiStartY + 6, { width: kpiW - 12 });
    doc.font(ctx.boldFont).fontSize(10).fillColor(COLORS.textDark);
    doc.text(kpi.value, kx + 6, kpiStartY + 18, { width: kpiW - 12 });
  });

  doc.y = kpiStartY + 48;

  // DETAILED VIEW (2-column layout)
  if (isDetailed && data.days) {
    for (const day of data.days) {
      ensureSpace(doc, 60);

      doc.rect(LEFT, doc.y, W, 16).fill(COLORS.primaryLight);
      doc.rect(LEFT, doc.y, 4, 16).fill(COLORS.accent);
      doc.font(ctx.boldFont).fontSize(9).fillColor('#ffffff');
      doc.text(day.dateLabel, LEFT + 12, doc.y + 4, { width: W - 24 });
      doc.y += 17;

      const reservations = day.reservations;
      for (let i = 0; i < reservations.length; i += 2) {
        const leftRes = reservations[i];
        const rightRes = reservations[i + 1];

        ensureSpace(doc, 50);
        const startY = doc.y;

        const leftEndY = renderReservationCard(ctx, leftRes, COL_LEFT_X, startY, COL_W);

        let rightEndY = startY;
        if (rightRes) {
          rightEndY = renderReservationCard(ctx, rightRes, COL_RIGHT_X, startY, COL_W);
        }

        doc.y = Math.max(leftEndY, rightEndY);

        if (i + 2 < reservations.length) {
          doc.moveTo(LEFT + 8, doc.y).lineTo(RIGHT - 8, doc.y)
            .strokeColor(COLORS.border).lineWidth(0.3).stroke();
          doc.y += 3;
        }
      }

      doc.y += 2;
    }
  }

  // SUMMARY VIEW
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

        doc.rect(LEFT, doc.y, W, 11).fill(COLORS.bgLight);
        doc.font(ctx.boldFont).fontSize(6.5).fillColor(COLORS.accent);
        doc.text(course.courseName.toUpperCase(), LEFT + 8, doc.y + 3);
        doc.y += 13;

        const colPct = [0.24, 0.09, 0.09, 0.09, 0.09, 0.40];
        const colW = colPct.map(p => W * p);
        const colX: number[] = [LEFT];
        for (let ci = 1; ci < colW.length; ci++) colX.push(colX[ci - 1] + colW[ci - 1]);

        const headerY = doc.y;
        doc.rect(LEFT, headerY, W, 11).fill(COLORS.primaryLight);
        const headers = ['Danie', 'Porcje', 'Doros\u0142e', 'Dzieci\u0119ce', 'Maluchy', 'Klienci'];
        doc.font(ctx.boldFont).fontSize(6).fillColor('#ffffff');
        headers.forEach((h, hi) => {
          const align = (hi >= 1 && hi <= 4) ? 'right' as const : 'left' as const;
          doc.text(h, colX[hi] + 3, headerY + 3, { width: colW[hi] - 6, align });
        });
        doc.y = headerY + 11;

        for (const dish of course.dishes) {
          doc.font(ctx.regularFont).fontSize(7);
          const dishNameHeight = doc.heightOfString(dish.dishName, { width: colW[0] - 6 });
          const rowHeight = Math.max(11, dishNameHeight + 4);

          ensureSpace(doc, rowHeight);

          const rowY = doc.y;

          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textDark);
          doc.text(dish.dishName, colX[0] + 3, rowY + 2, { width: colW[0] - 6 });

          const numY = rowY + 2;

          doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.textDark);
          doc.text(`${dish.totalPortions}`, colX[1] + 3, numY, { width: colW[1] - 6, align: 'right' });

          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.textMuted);
          doc.text(`${dish.adultPortions}`, colX[2] + 3, numY, { width: colW[2] - 6, align: 'right' });
          doc.text(`${dish.childrenPortions}`, colX[3] + 3, numY, { width: colW[3] - 6, align: 'right' });
          doc.text(`${dish.toddlerPortions}`, colX[4] + 3, numY, { width: colW[4] - 6, align: 'right' });

          const clientStr = dish.reservations.map((r: any) => `${r.clientName} (${r.guests})`).join(', ');
          doc.font(ctx.regularFont).fontSize(6).fillColor(COLORS.textMuted);
          doc.text(clientStr, colX[5] + 3, numY, { width: colW[5] - 6, lineBreak: false, ellipsis: true });

          doc.y = rowY + rowHeight;
        }

        doc.y += 8;
      }

      doc.y += 4;
    }
  }

  // FOOTER
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);

    const footerTextY = 810;
    const sepFooterY = FOOTER_Y;

    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(LEFT, sepFooterY).lineTo(RIGHT, sepFooterY).stroke();

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

    const footerLine2 = `Dokument wygenerowany automatycznie przez system ${ctx.restaurantName}  |  Strona ${i + 1} z ${range.count}`;
    const line2W = measureTextWidth(doc, footerLine2, 6, ctx.regularFont);
    doc.fillColor(COLORS.textLight);
    const line2X = LEFT + (W - line2W) / 2;
    doc._fragment(footerLine2, line2X, footerTextY + 12, { lineBreak: false });
  }
}
