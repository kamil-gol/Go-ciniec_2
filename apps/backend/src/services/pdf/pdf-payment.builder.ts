import type { PdfDrawContext } from './pdf.primitives';
import {
  drawHeaderBanner,
  drawInfoBox,
  calculateInfoBoxHeight,
  drawSeparator,
  drawInlineFooter,
} from './pdf.primitives';

import type { PaymentConfirmationData } from './pdf.types';
import { COLORS, PAYMENT_METHOD_LABELS } from './pdf.types';

import {
  formatDate,
  formatCurrency,
  getRegularFont,
  getBoldFont,
} from './pdf.utils';

// ═══════════════════════════════════════════════════════════════
// ██  PREMIUM PAYMENT CONFIRMATION — Zadanie 2
// ═══════════════════════════════════════════════════════════════

export function buildPaymentConfirmationPremium(
  doc: PDFKit.PDFDocument,
  data: PaymentConfirmationData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const left = 40;
  const pageWidth = doc.page.width - 80;

  // ── 1. HEADER BANNER with „OPŁACONA" badge ──
  drawHeaderBanner(doc, ctx, 'OPŁACONA', COLORS.success);

  // ── 2. TITLE + META ──
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(useCustomFonts));
  doc.text('POTWIERDZENIE WPŁATY ZALICZKI', left, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(0.2);
  doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text(`Nr: ${data.depositId}  |  Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
    align: 'center', width: pageWidth,
  });

  doc.moveDown(0.6);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);

  // ── 3. TWO-COLUMN: KLIENT | WPŁATA ──
  const colGap = 20;
  const colWidth = (pageWidth - colGap) / 2;
  const startY = doc.y;

  drawInfoBox(doc, ctx, 'KLIENT', left, startY, colWidth, [
    `${data.client.firstName} ${data.client.lastName}`,
    data.client.email || '',
    data.client.phone,
    data.client.address || '',
  ].filter(Boolean));

  /* istanbul ignore next */
  const methodLabel = PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod;
  const paymentLines: string[] = [
    formatCurrency(data.amount),
    `Data: ${formatDate(data.paidAt)}`,
    `Metoda: ${methodLabel}`,
  ];
  if (data.paymentReference) {
    paymentLines.push(`Ref: ${data.paymentReference}`);
  }

  drawInfoBox(doc, ctx, 'SZCZEGÓŁY WPŁATY', left + colWidth + colGap, startY, colWidth, paymentLines);

  const leftLines = [data.client.firstName, data.client.email, data.client.phone, data.client.address].filter(Boolean).length;
  const boxHeight = calculateInfoBoxHeight(Math.max(leftLines, paymentLines.length));
  doc.y = startY + boxHeight + 5;

  doc.moveDown(0.4);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.4);

  // ── 4. RESERVATION INFO BOX (full-width) ──
  const resLines: string[] = [
    `${data.reservation.date}  ${data.reservation.startTime} - ${data.reservation.endTime}`,
  ];
  if (data.reservation.eventType) resLines.push(`Typ: ${data.reservation.eventType}`);
  resLines.push(`Gości: ${data.reservation.guests}`);
  resLines.push(`Nr rezerwacji: ${data.reservation.id}`);

  drawInfoBox(doc, ctx, 'REZERWACJA', left, doc.y, pageWidth, resLines);
  const resBoxHeight = calculateInfoBoxHeight(resLines.length);
  doc.y = doc.y + resBoxHeight + 5;

  // ── 5. FOOTER (sekcja finansowa usunieta - #172) ──
  doc.moveDown(1);
  drawInlineFooter(doc, ctx, left, pageWidth);
}
