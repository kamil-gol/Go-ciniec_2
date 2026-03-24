/**
 * Email Templates
 * Extracted from email.service.ts — HTML template builders
 */

import logger from '@utils/logger';
import documentTemplateService from '../document-template.service';
import { formatExtraPriceCell } from './email.helpers';
import type { ReservationConfirmationData } from '../email.service';

// ═══════════════════════════════════════════
// HTML Layout from DB (with fallback)
// ═══════════════════════════════════════════

export async function buildHtmlFromLayout(opts: {
  title: string;
  preheader: string;
  body: string;
  footer: string;
  companyName?: string;
}): Promise<string> {
  try {
    const layout = await documentTemplateService.getBySlug('email-layout-default');
    let html = layout.content;
    html = html.replace(/\{\{content\}\}/g, opts.body);
    html = html.replace(/\{\{title\}\}/g, opts.title);
    html = html.replace(/\{\{preheader\}\}/g, opts.preheader);
    html = html.replace(/\{\{companyName\}\}/g, opts.companyName || 'Go\u015bciniec');
    html = html.replace(/\{\{footer\}\}/g, opts.footer);
    return html;
  } catch {
    logger.debug('[Email] Layout template not found in DB, using fallback');
    return buildHtmlTemplate(opts);
  }
}

// ═══════════════════════════════════════════
// HTML Template Builder (hardcoded fallback)
// ═══════════════════════════════════════════

export function buildHtmlTemplate(opts: {
  title: string;
  preheader: string;
  body: string;
  footer: string;
  companyName?: string;
}): string {
  const displayName = opts.companyName || 'Go\u015bciniec';

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin:0; padding:0; background:#f3f4f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .wrapper { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; margin-top:32px; margin-bottom:32px; box-shadow:0 4px 6px rgba(0,0,0,0.07); }
    .header { background:linear-gradient(135deg,#e11d48,#f43f5e); padding:32px 40px; }
    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
    .content { padding:32px 40px; color:#374151; font-size:15px; line-height:1.7; }
    .footer { padding:24px 40px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center; color:#9ca3af; font-size:12px; }
  </style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</span>
  <div class="wrapper">
    <div class="header">
      <h1>\uD83C\uDFDB\uFE0F ${displayName}</h1>
    </div>
    <div class="content">
      ${opts.body}
    </div>
    <div class="footer">
      <p>${opts.footer}</p>
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════
// Reservation Confirmation Fallback
// ═══════════════════════════════════════════

/** Fallback HTML for reservation confirmation (original hardcoded version) */
export function buildReservationConfirmationFallback(data: ReservationConfirmationData, companyName: string): string {
  const priceTypeLabels: Record<string, string> = { FLAT: 'rycza\u0142t', PER_PERSON: 'za osob\u0119', PER_UNIT: 'za sztuk\u0119', FREE: 'gratis' };

  let extrasHtml = '';
  if (data.extras && data.extras.length > 0) {
    const extrasRows = data.extras.map(e => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #e9ecef;">${e.name}</td>
        <td style="padding:8px 12px;border:1px solid #e9ecef;color:#6b7280;font-size:13px;">${e.categoryName}</td>
        <td style="padding:8px 12px;border:1px solid #e9ecef;text-align:right;">${formatExtraPriceCell(e)}</td>
        <td style="padding:8px 12px;border:1px solid #e9ecef;font-size:13px;color:#6b7280;">${priceTypeLabels[e.priceType] || e.priceType}${e.note ? ` \u00b7 ${e.note}` : ''}</td>
      </tr>
    `).join('');
    extrasHtml = `<h3 style="margin:28px 0 12px;color:#7c3aed;font-size:16px;">\uD83C\uDF81 Us\u0142ugi dodatkowe</h3>
      <table style="width:100%;border-collapse:collapse;margin:0 0 12px;"><thead><tr style="background:#f5f3ff;">
        <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Us\u0142uga</th>
        <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Kategoria</th>
        <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:right;font-weight:600;color:#7c3aed;">Cena</th>
        <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Info</th>
      </tr></thead><tbody>${extrasRows}</tbody></table>
      ${data.extrasTotalPrice ? `<p style="text-align:right;font-weight:600;color:#7c3aed;">Razem us\u0142ugi dodatkowe: ${data.extrasTotalPrice} z\u0142</p>` : ''}`;
  }

  let depositHtml = '';
  if (data.depositAmount && data.depositDueDate) {
    depositHtml = `<tr><td style="padding:10px 16px;background:#fef3c7;border:1px solid #fde68a;font-weight:600;color:#d97706;">Zaliczka</td>
      <td style="padding:10px 16px;border:1px solid #fde68a;"><strong>${data.depositAmount} z\u0142</strong> do ${data.depositDueDate}</td></tr>`;
  }

  return `
    <p>Dzie\u0144 dobry, <strong>${data.clientName}</strong>,</p>
    <p>Potwierdzamy przyj\u0119cie rezerwacji:</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Wydarzenie</td><td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong>${data.eventType}</strong></td></tr>
      <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Data</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.reservationDate}</td></tr>
      <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Godziny</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.startTime} \u2014 ${data.endTime}</td></tr>
      <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td></tr>
      <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Go\u015bcie</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.guestCount} (doro\u015bli: ${data.adults}, dzieci: ${data.children}, maluchy: ${data.toddlers})</td></tr>
      ${data.menuPackageName ? `<tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Menu</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.menuPackageName}</td></tr>` : ''}
      ${data.venueSurcharge ? `<tr><td style="padding:10px 16px;background:#fff7ed;border:1px solid #fed7aa;font-weight:600;color:#ea580c;">Dop\u0142ata za obiekt</td><td style="padding:10px 16px;border:1px solid #fed7aa;"><strong style="color:#ea580c;">${data.venueSurcharge} z\u0142</strong></td></tr>` : ''}
      <tr><td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Kwota</td><td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong style="color:#16a34a;font-size:18px;">${data.totalPrice} z\u0142</strong></td></tr>
      ${depositHtml}
    </table>
    ${extrasHtml}
    ${data.notes ? `<p style="margin-top:16px;padding:12px 16px;background:#f9fafb;border-left:4px solid #e5e7eb;color:#6b7280;font-size:14px;"><strong>Uwagi:</strong> ${data.notes}</p>` : ''}
    <p>W razie pyta\u0144 lub zmian prosimy o kontakt.</p>`;
}
