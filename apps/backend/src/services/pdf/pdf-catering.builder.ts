import type { PdfDrawContext } from './pdf.primitives';
import {
  drawHeaderBanner,
  safePageBreak,
  drawInfoBox,
  calculateInfoBoxHeight,
  drawSeparator,
  drawInlineFooter,
  drawCompactTable,
} from './pdf.primitives';

import type {
  CateringQuotePDFData,
  CateringKitchenPrintData,
  CateringInvoicePDFData,
  CateringOrderPDFData,
  CateringExtraItemForPDF,
} from './pdf.types';

import {
  COLORS,
  DEFAULT_COLORS,
  setColors,
  resetColors,
  STATUS_MAP,
  DELIVERY_TYPE_LABELS,
} from './pdf.types';

import {
  formatDate,
  formatCurrency,
  loadPdfConfig,
  getRegularFont,
  getBoldFont,
} from './pdf.utils';

// ═══════════════ CATERING PDF BUILDERS ═══════════════

export async function buildCateringQuotePDF(
  doc: PDFKit.PDFDocument,
  data: CateringQuotePDFData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): Promise<void> {
  const config = await loadPdfConfig('pdf-layout-catering');
  if (config?.colors) {
    setColors({ ...DEFAULT_COLORS, ...config.colors });
  }

  try {
    const left = 40;
    const pageWidth = doc.page.width - 80;

    const sectionRenderers: Record<string, () => void> = {
      header: () => {
        const statusInfo = STATUS_MAP[data.status] || { label: data.status, color: COLORS.textMuted };
        drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);
      },
      title_meta: () => {
        doc.y = 80;
        doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(useCustomFonts));
        doc.text('WYCENA CATERING', left, doc.y, { align: 'center', width: pageWidth });
        doc.moveDown(0.2);
        doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
        doc.text(`Nr: ${data.orderNumber} | Data wygenerowania: ${formatDate(new Date())}`, left, doc.y, { align: 'center', width: pageWidth });
        doc.moveDown(0.6);
        drawSeparator(doc, left, pageWidth);
        doc.moveDown(0.5);
      },
      client_info: () => {
        const clientLines = [data.client.firstName + ' ' + data.client.lastName, data.client.phone];
        if (data.client.companyName) clientLines.push(data.client.companyName);
        if (data.client.email) clientLines.push(data.client.email);
        if (data.client.address) clientLines.push(data.client.address);
        drawInfoBox(doc, ctx, 'KLIENT', left, doc.y, pageWidth, clientLines);
        const boxHeight = calculateInfoBoxHeight(clientLines.length);
        doc.y += boxHeight + 5;
        doc.moveDown(0.4);
      },
      event_info: () => {
        doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
        doc.text(`Data wydarzenia: ${formatDate(data.eventDate)}`, left, doc.y);
        doc.text(`Typ dostawy: ${DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType}`, left, doc.y);
        if (data.deliveryAddress) doc.text(`Adres: ${data.deliveryAddress}`, left, doc.y);
        doc.text(`Liczba osób: ${(data as any).guestsCount ?? data.guests ?? '—'}`, left, doc.y);
        doc.moveDown(0.4);
        drawSeparator(doc, left, pageWidth);
        doc.moveDown(0.4);
      },
      items_table: () => {
        doc.fontSize(11).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
        doc.text('POZYCJE ZAMÓWIENIA', left, doc.y);
        doc.moveDown(0.3);
        const itemRows = data.items.map(item => [
          (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
          `${item.quantity}`,
          formatCurrency(item.unitPrice),
          formatCurrency(item.totalPrice),
        ]);
        const colWidths = [Math.round(pageWidth * 0.50), Math.round(pageWidth * 0.15), Math.round(pageWidth * 0.17), Math.round(pageWidth * 0.18)];
        drawCompactTable(doc, ctx, ['Danie', 'Ilość', 'Cena jedn.', 'Razem'], itemRows, colWidths, left);
        doc.moveDown(0.4);
      },
      totals: () => {
        doc.fontSize(10).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
        doc.text(`Suma częściowa: ${formatCurrency(data.subtotal)}`, left, doc.y, { align: 'right', width: pageWidth });
        if (data.discountAmount && data.discountAmount > 0) doc.text(`Rabat: -${formatCurrency(data.discountAmount)}`, left, doc.y, { align: 'right', width: pageWidth });
        doc.text(`DO ZAPŁATY: ${formatCurrency(data.totalPrice)}`, left, doc.y, { align: 'right', width: pageWidth });
      },
      notes: () => {
        if (data.notes) {
          doc.moveDown(0.4);
          doc.fontSize(8).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
          doc.text('Uwagi:', left, doc.y);
          doc.font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
          doc.text(data.notes, left, doc.y);
        }
      },
      footer: () => {
        doc.moveDown(1);
        drawInlineFooter(doc, ctx, left, pageWidth);
      },
    };

    const sections = config?.sections
      ? [...config.sections].sort((a, b) => a.order - b.order)
      : Object.keys(sectionRenderers).map((id, i) => ({ id, enabled: true, order: i + 1 }));

    for (const section of sections) {
      if (section.enabled && sectionRenderers[section.id]) {
        sectionRenderers[section.id]();
      }
    }
  } finally {
    resetColors();
  }
}

export function buildCateringKitchenPDF(
  doc: PDFKit.PDFDocument,
  data: CateringKitchenPrintData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const left = 40;
  const pageWidth = doc.page.width - 80;
  drawHeaderBanner(doc, ctx, 'DRUK KUCHENNY', COLORS.primary);
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(18).font(getBoldFont(useCustomFonts));
  doc.text('DRUK KUCHENNY', left, doc.y, { align: 'center', width: pageWidth });
  doc.moveDown(0.2);
  doc.fontSize(9).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text(`Nr zamówienia: ${data.orderNumber}`, left, doc.y, { align: 'center', width: pageWidth });
  doc.moveDown(0.6);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);
  doc.fontSize(10).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text(`Data wydarzenia: ${formatDate(data.eventDate)}`, left, doc.y);
  doc.text(`Typ dostawy: ${DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType}`, left, doc.y);
  if (data.deliveryAddress) doc.text(`Adres dostawy: ${data.deliveryAddress}`, left, doc.y);
  doc.text(`Liczba gości: ${(data as any).guestsCount ?? data.guests ?? '—'}`, left, doc.y);
  doc.moveDown(0.5);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);
  doc.fontSize(12).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text('DO PRZYGOTOWANIA', left, doc.y);
  doc.moveDown(0.3);
  const itemRows = data.items.map(item => [
    (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
    `${item.quantity}`,
  ]);
  const colWidths = [Math.round(pageWidth * 0.75), Math.round(pageWidth * 0.25)];
  drawCompactTable(doc, ctx, ['Danie', 'Ilość'], itemRows, colWidths, left);
  if (data.notes) {
    doc.moveDown(0.5);
    doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
    doc.text('Uwagi klienta:', left, doc.y);
    doc.font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(data.notes, left, doc.y);
  }
  doc.moveDown(1);
  drawInlineFooter(doc, ctx, left, pageWidth);
}

export function buildCateringOrderPDF(
  doc: PDFKit.PDFDocument,
  data: CateringOrderPDFData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const left = 40;
  const pageWidth = doc.page.width - 80;

  // Header banner with status
  const statusInfo = STATUS_MAP[data.status] || { label: data.status, color: COLORS.textMuted };
  drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);

  // Title + metadata
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(useCustomFonts));
  doc.text('SZCZEGÓŁY ZAMÓWIENIA CATERING', left, doc.y, { align: 'center', width: pageWidth });
  doc.moveDown(0.2);
  doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text(`Nr: ${data.orderNumber} | Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
    align: 'center',
    width: pageWidth,
  });
  doc.moveDown(0.6);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);

  // Client + Event info (two columns)
  const colGap = 20;
  const colWidth = (pageWidth - colGap) / 2;
  const startY = doc.y;

  const clientLines = [data.client.firstName + ' ' + data.client.lastName, data.client.phone];
  if (data.client.companyName) clientLines.push(data.client.companyName);
  if (data.client.email) clientLines.push(data.client.email);
  if (data.client.address) clientLines.push(data.client.address);
  drawInfoBox(doc, ctx, 'KLIENT', left, startY, colWidth, clientLines);

  const deliveryLabel = DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType;
  const eventLines = [
    formatDate(data.eventDate),
    `Typ dostawy: ${deliveryLabel}`,
    `Liczba osób: ${data.guestsCount ?? data.guests ?? '—'}`,
  ];
  if (data.deliveryAddress) eventLines.push(`Adres: ${data.deliveryAddress}`);
  drawInfoBox(doc, ctx, 'WYDARZENIE', left + colWidth + colGap, startY, colWidth, eventLines);

  const boxHeight = calculateInfoBoxHeight(Math.max(clientLines.length, eventLines.length));
  doc.y = startY + boxHeight + 5;
  doc.moveDown(0.4);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.4);

  // Items table
  doc.fontSize(11).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text('POZYCJE ZAMÓWIENIA', left, doc.y);
  doc.moveDown(0.3);

  const itemRows = data.items.map(item => [
    (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
    `${item.quantity}`,
    formatCurrency(item.unitPrice),
    formatCurrency(item.totalPrice),
  ]);
  const colWidths = [Math.round(pageWidth * 0.50), Math.round(pageWidth * 0.15), Math.round(pageWidth * 0.17), Math.round(pageWidth * 0.18)];
  drawCompactTable(doc, ctx, ['Danie', 'Ilość', 'Cena jedn.', 'Razem'], itemRows, colWidths, left);

  doc.moveDown(0.4);

  // Extras table
  const extras: CateringExtraItemForPDF[] = (data.extras ?? []).map(e => ({
    name: e.name,
    description: (e as any).description,
    quantity: Number(e.quantity),
    unitPrice: Number(e.unitPrice),
    totalPrice: Number(e.totalPrice),
  }));
  if (extras.length > 0) {
    doc.fontSize(11).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
    doc.text('USŁUGI DODATKOWE', left, doc.y);
    doc.moveDown(0.3);
    const extraRows = extras.map(e => [
      e.name + (e.description ? ` (${e.description})` : ''),
      `${e.quantity}`,
      formatCurrency(e.unitPrice),
      formatCurrency(e.totalPrice),
    ]);
    drawCompactTable(doc, ctx, ['Usługa', 'Ilość', 'Cena jedn.', 'Razem'], extraRows, colWidths, left);
    doc.moveDown(0.4);
  }

  // Financial summary
  doc.fontSize(10).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text(`Suma częściowa: ${formatCurrency(data.subtotal)}`, left, doc.y, { align: 'right', width: pageWidth });
  if (data.extrasTotalPrice && data.extrasTotalPrice > 0)
    doc.text(`Usługi dodatkowe: ${formatCurrency(data.extrasTotalPrice)}`, left, doc.y, { align: 'right', width: pageWidth });
  if (data.discountAmount && data.discountAmount > 0)
    doc.text(`Rabat: -${formatCurrency(data.discountAmount)}`, left, doc.y, { align: 'right', width: pageWidth });
  doc.text(`DO ZAPŁATY: ${formatCurrency(data.totalPrice)}`, left, doc.y, { align: 'right', width: pageWidth });

  // Notes
  if (data.notes) {
    doc.moveDown(0.4);
    doc.fontSize(8).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
    doc.text('Uwagi:', left, doc.y);
    doc.font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(data.notes, left, doc.y);
  }

  // Footer
  doc.moveDown(1);
  drawInlineFooter(doc, ctx, left, pageWidth);
}

export function buildCateringInvoicePDF(
  doc: PDFKit.PDFDocument,
  data: CateringInvoicePDFData,
  ctx: PdfDrawContext,
  useCustomFonts: boolean,
): void {
  const left = 40;
  const pageWidth = doc.page.width - 80;
  const statusInfo = STATUS_MAP[data.status] || { label: data.status, color: COLORS.textMuted };
  drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);
  doc.y = 80;
  doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(useCustomFonts));
  doc.text('FAKTURA PRO FORMA', left, doc.y, { align: 'center', width: pageWidth });
  doc.moveDown(0.2);
  doc.fontSize(8).font(getRegularFont(useCustomFonts)).fillColor(COLORS.textMuted);
  doc.text(`Nr: ${data.orderNumber} | Data wystawienia: ${formatDate(new Date())}`, left, doc.y, { align: 'center', width: pageWidth });
  doc.moveDown(0.6);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.5);
  const clientLines = [data.client.firstName + ' ' + data.client.lastName, data.client.phone];
  if (data.client.companyName) clientLines.push(data.client.companyName);
  if (data.client.nip) clientLines.push(`NIP: ${data.client.nip}`);
  if (data.client.email) clientLines.push(data.client.email);
  if (data.client.address) clientLines.push(data.client.address);
  drawInfoBox(doc, ctx, 'NABYWCA', left, doc.y, pageWidth, clientLines);
  const boxHeight = calculateInfoBoxHeight(clientLines.length);
  doc.y += boxHeight + 5;
  doc.moveDown(0.4);
  doc.fontSize(9).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text(`Data wydarzenia: ${formatDate(data.eventDate)}`, left, doc.y);
  doc.text(`Typ dostawy: ${DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType}`, left, doc.y);
  drawSeparator(doc, left, pageWidth);
  doc.moveDown(0.4);
  doc.fontSize(11).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text('POZYCJE', left, doc.y);
  doc.moveDown(0.3);
  const itemRows = data.items.map(item => [
    (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
    `${item.quantity}`,
    formatCurrency(item.unitPrice),
    formatCurrency(item.totalPrice),
  ]);
  const colWidths = [Math.round(pageWidth * 0.50), Math.round(pageWidth * 0.15), Math.round(pageWidth * 0.17), Math.round(pageWidth * 0.18)];
  drawCompactTable(doc, ctx, ['Nazwa', 'Ilość', 'Cena jedn.', 'Wartość'], itemRows, colWidths, left);
  doc.moveDown(0.4);
  doc.fontSize(10).font(getBoldFont(useCustomFonts)).fillColor(COLORS.textDark);
  doc.text(`Netto: ${formatCurrency(data.subtotal)}`, left, doc.y, { align: 'right', width: pageWidth });
  if (data.discountAmount && data.discountAmount > 0) doc.text(`Rabat: -${formatCurrency(data.discountAmount)}`, left, doc.y, { align: 'right', width: pageWidth });
  doc.text(`DO ZAPŁATY: ${formatCurrency(data.totalPrice)}`, left, doc.y, { align: 'right', width: pageWidth });
  doc.moveDown(1);
  drawInlineFooter(doc, ctx, left, pageWidth);
}
