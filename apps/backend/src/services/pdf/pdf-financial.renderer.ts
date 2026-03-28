// apps/backend/src/services/pdf/pdf-financial.renderer.ts

/**
 * Financial Summary renderer — extracted from pdf-reservation.builder.ts
 * Renders the PODSUMOWANIE box with price breakdown, deposits, discounts.
 */

import type { PdfDrawContext } from './pdf.primitives';
import { safePageBreak } from './pdf.primitives';
import type { ReservationPDFData } from './pdf.types';
import { COLORS } from './pdf.types';
import { formatDate, formatCurrency, getRegularFont, getBoldFont } from './pdf.utils';

export function drawFinancialSummary(
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
  const activeDeposits = (r.deposits || []).filter((d: { status: string }) => d.status !== 'CANCELLED');
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
      ? `Dodatkowe godziny: ${extraHoursCount}h × ${formatCurrency(extraHourRate)}/h`
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
    const totalDeposited = depositsForDisplay.reduce((sum: number, d) => sum + Number(d.amount), 0);
    const remaining = displayTotal - totalDeposited;
    doc.fontSize(10).font(getBoldFont(useCustomFonts)).fillColor(COLORS.primary);
    doc.text('DO ZAPŁATY', labelX, y);
    doc.text(formatCurrency(remaining), valueX, y, { width: valueWidth, align: 'right' });
  }

  doc.y = boxY + boxHeight + 3;
}
