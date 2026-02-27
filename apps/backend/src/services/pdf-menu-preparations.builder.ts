// apps/backend/src/services/pdf-menu-preparations.builder.ts

/**
 * PDF builder for Menu Preparations Report (#160)
 * Premium design: amber accent, course/dish layout, KPI cards.
 * Supports detailed (per-reservation) and summary (aggregated per dish) views.
 *
 * Same architectural pattern as pdf-preparations.builder.ts (#159).
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
  primary: '#D97706',
  primaryDark: '#92400E',
  primaryLight: '#FEF3C7',
  courseBg: '#FFFBEB',
  dark: '#1F2937',
  medium: '#6B7280',
  light: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB',
  headerBg: '#1F2937',
};

const PAGE_WIDTH = 595.28;
const LEFT = 40;
const RIGHT = PAGE_WIDTH - 40;
const W = RIGHT - LEFT;

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > 780) {
    doc.addPage();
    doc.y = 40;
  }
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.substring(0, 5);
}

export function buildMenuPreparationsReportPDF(
  ctx: PDFContext,
  data: MenuPreparationsReport
): void {
  const { doc } = ctx;
  const { filters, summary } = data;
  const isDetailed = filters.view === 'detailed';

  // ── HEADER BAR ──
  doc.rect(0, 0, PAGE_WIDTH, 80).fill(COLORS.primary);
  doc.font(ctx.boldFont).fontSize(20).fillColor(COLORS.white);
  doc.text('Raport Menu — Przygotowania', LEFT, 18, { width: W });
  doc.font(ctx.regularFont).fontSize(10).fillColor(COLORS.primaryLight);
  doc.text(
    `${ctx.restaurantName}  |  ${filters.dateFrom} — ${filters.dateTo}  |  ${isDetailed ? 'Widok szczegółowy' : 'Widok zbiorczy'}`,
    LEFT, 48, { width: W }
  );

  doc.y = 100;

  // ── KPI CARDS ──
  const kpiGap = 5;
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
    doc.rect(x, kpiStartY, kpiW, 44).fill(COLORS.light);
    doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.medium);
    doc.text(kpi.label, x + 6, kpiStartY + 6, { width: kpiW - 12 });
    doc.font(ctx.boldFont).fontSize(10).fillColor(COLORS.dark);
    doc.text(kpi.value, x + 6, kpiStartY + 20, { width: kpiW - 12 });
  });

  doc.y = kpiStartY + 58;

  // ── DETAILED VIEW ──
  if (isDetailed && data.days) {
    for (const day of data.days) {
      ensureSpace(doc, 60);

      // Day header
      doc.rect(LEFT, doc.y, W, 22).fill(COLORS.headerBg);
      doc.font(ctx.boldFont).fontSize(9).fillColor(COLORS.white);
      doc.text(day.dateLabel, LEFT + 8, doc.y + 6, { width: W * 0.6 });
      doc.font(ctx.regularFont).fontSize(7).fillColor('#D1D5DB');
      doc.text(
        `${day.totalReservations} rez.  |  ${day.totalGuests} gości`,
        LEFT + 8, doc.y + 6, { width: W - 16, align: 'right' }
      );
      doc.y += 26;

      for (const res of day.reservations) {
        ensureSpace(doc, 55);

        // Reservation header (amber)
        doc.rect(LEFT, doc.y, W, 20).fill(COLORS.primaryLight);
        doc.font(ctx.boldFont).fontSize(8).fillColor(COLORS.primaryDark);
        doc.text(res.clientName, LEFT + 8, doc.y + 5, { width: W * 0.35 });

        const timePart = res.startTime
          ? `${formatTime(res.startTime)}${res.endTime ? ' – ' + formatTime(res.endTime) : ''}`
          : '';
        const guestPart = `${res.guests.total} os. (${res.guests.adults}D + ${res.guests.children}Dz + ${res.guests.toddlers}M)`;
        const metaParts = [res.hallName, timePart, guestPart].filter(Boolean).join('  |  ');

        doc.font(ctx.regularFont).fontSize(7).fillColor('#B45309');
        doc.text(metaParts, LEFT + 8, doc.y + 5, { width: W - 16, align: 'right' });
        doc.y += 22;

        // Package line
        doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.medium);
        doc.text('Pakiet: ', LEFT + 8, doc.y + 2, { continued: true });
        doc.font(ctx.boldFont).fillColor(COLORS.dark);
        doc.text(res.package.name);
        doc.y += 14;

        // Courses
        for (const course of res.courses) {
          ensureSpace(doc, 26);
          doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.primary);
          doc.text(course.courseName.toUpperCase(), LEFT + 12, doc.y + 2);
          doc.y += 12;

          for (const dish of course.dishes) {
            ensureSpace(doc, 14);
            doc.font(ctx.regularFont).fontSize(8).fillColor(COLORS.dark);
            const dishText = dish.description
              ? `• ${dish.name}  — ${dish.description}`
              : `• ${dish.name}`;
            doc.text(dishText, LEFT + 18, doc.y, { width: W - 36 });
            doc.y += doc.heightOfString(dishText, { width: W - 36 }) + 3;
          }
        }

        if (res.courses.length === 0) {
          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.medium);
          doc.text('Brak dań w menu', LEFT + 18, doc.y);
          doc.y += 12;
        }

        // Separator
        doc.moveTo(LEFT + 10, doc.y).lineTo(RIGHT - 10, doc.y)
          .strokeColor(COLORS.border).lineWidth(0.5).stroke();
        doc.y += 6;
      }

      doc.y += 8;
    }
  }

  // ── SUMMARY VIEW ──
  if (!isDetailed && data.summaryDays) {
    for (const day of data.summaryDays) {
      ensureSpace(doc, 60);

      // Day header
      doc.rect(LEFT, doc.y, W, 22).fill(COLORS.headerBg);
      doc.font(ctx.boldFont).fontSize(9).fillColor(COLORS.white);
      doc.text(day.dateLabel, LEFT + 8, doc.y + 6, { width: W * 0.6 });
      doc.font(ctx.regularFont).fontSize(7).fillColor('#D1D5DB');
      doc.text(
        `${day.totalReservations} rez.  |  ${day.totalGuests} gości`,
        LEFT + 8, doc.y + 6, { width: W - 16, align: 'right' }
      );
      doc.y += 26;

      for (const course of day.courses) {
        ensureSpace(doc, 44);

        // Course header
        doc.rect(LEFT, doc.y, W, 18).fill(COLORS.courseBg);
        doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.primary);
        doc.text(course.courseName.toUpperCase(), LEFT + 8, doc.y + 5);
        doc.y += 20;

        // Table columns: Danie | Porcje | Dorosłe | Dziecięce | Klienci
        const colPct = [0.30, 0.12, 0.12, 0.12, 0.34];
        const colW = colPct.map(p => W * p);
        const colX: number[] = [LEFT];
        for (let i = 1; i < colW.length; i++) colX.push(colX[i - 1] + colW[i - 1]);

        // Table header
        doc.rect(LEFT, doc.y, W, 14).fill(COLORS.light);
        const headers = ['Danie', 'Porcje', 'Dorosłe', 'Dziecięce', 'Klienci'];
        doc.font(ctx.boldFont).fontSize(6).fillColor(COLORS.medium);
        headers.forEach((h, i) => {
          const align = (i >= 1 && i <= 3) ? 'right' as const : 'left' as const;
          doc.text(h, colX[i] + 4, doc.y + 4, { width: colW[i] - 8, align });
        });
        doc.y += 16;

        // Dish rows
        for (const dish of course.dishes) {
          ensureSpace(doc, 14);
          const rowY = doc.y + 2;

          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.dark);
          doc.text(dish.dishName, colX[0] + 4, rowY, { width: colW[0] - 8 });

          doc.font(ctx.boldFont).fontSize(7).fillColor(COLORS.dark);
          doc.text(`${dish.totalPortions}`, colX[1] + 4, rowY, { width: colW[1] - 8, align: 'right' });

          doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.medium);
          doc.text(`${dish.adultPortions}`, colX[2] + 4, rowY, { width: colW[2] - 8, align: 'right' });
          doc.text(`${dish.childrenPortions}`, colX[3] + 4, rowY, { width: colW[3] - 8, align: 'right' });

          const clientStr = dish.reservations.map(r => `${r.clientName} (${r.guests})`).join(', ');
          doc.font(ctx.regularFont).fontSize(6).fillColor(COLORS.medium);
          doc.text(clientStr, colX[4] + 4, rowY, { width: colW[4] - 8 });

          doc.y += 14;
        }

        doc.y += 4;
      }

      doc.y += 8;
    }
  }

  // ── FOOTER (page numbers) ──
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font(ctx.regularFont).fontSize(7).fillColor(COLORS.medium);
    doc.text(
      `${ctx.restaurantName}  |  Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}  |  Strona ${i + 1} z ${range.count}`,
      LEFT, 810, { width: W, align: 'center' }
    );
  }
}
