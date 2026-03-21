/**
 * Email Service
 * Nodemailer-based email sending with HTML templates
 *
 * Company name & footer text are loaded dynamically from CompanySettings DB.
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Example .env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=noreply@gosciniec.pl
 *   SMTP_PASS=your-app-password
 *   SMTP_FROM="Gościniec <noreply@gosciniec.pl>"
 *
 * Updated: #137 — Venue surcharge in reservation confirmation email
 * Updated: #139 — PER_UNIT label + per-type formatting in extras table
 */

import nodemailer from 'nodemailer';
import { marked } from 'marked';
import logger from '@utils/logger';
import companySettingsService from './company-settings.service';
import documentTemplateService from './document-template.service';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface DepositReminderData {
  clientName: string;
  depositAmount: string;
  dueDate: string;
  daysLeft: number;
  reservationDate: string;
  hallName: string;
  eventType: string;
  guestCount: number;
}

export interface DepositOverdueData {
  clientName: string;
  depositAmount: string;
  dueDate: string;
  daysOverdue: number;
  reservationDate: string;
  hallName: string;
  eventType: string;
}

export interface ReservationConfirmationData {
  clientName: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  hallName: string;
  eventType: string;
  guestCount: number;
  adults: number;
  children: number;
  toddlers: number;
  totalPrice: string;
  menuPackageName?: string;
  extras?: Array<{
    name: string;
    categoryName: string;
    quantity: number;
    price: string;
    totalPrice: string;
    priceType: string;
    note?: string;
  }>;
  extrasTotalPrice?: string;
  // #137: Venue surcharge for "Cały Obiekt" bookings
  venueSurcharge?: string;
  venueSurchargeLabel?: string;
  depositAmount?: string;
  depositDueDate?: string;
  notes?: string;
}

export interface PasswordResetEmailData {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

// ═══════════════════════════════════════════
// Company Info Helper
// ═══════════════════════════════════════════

interface CompanyInfo {
  name: string;
  footerText: string;
}

/**
 * Fetch company name from DB for email templates.
 * Falls back to 'Gościniec' if DB is unavailable.
 */
async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const settings = await companySettingsService.getSettings();
    const name = settings.companyName || 'Gościniec';
    return {
      name,
      footerText: `Ta wiadomość została wysłana automatycznie z systemu rezerwacji ${name}.`,
    };
  } catch {
    return {
      name: 'Gościniec',
      footerText: 'Ta wiadomość została wysłana automatycznie z systemu rezerwacji Gościniec.',
    };
  }
}

// ═══════════════════════════════════════════
// Template Rendering
// ═══════════════════════════════════════════

/**
 * Try to render email body from DocumentTemplate (DB-editable).
 * Falls back to hardcoded HTML if template not found.
 */
async function renderEmailTemplate(
  slug: string,
  variables: Record<string, string>,
  fallbackHtml: string
): Promise<string> {
  try {
    const result = await documentTemplateService.preview(slug, variables);
    // Remove unfilled optional variables (e.g. empty sections)
    const cleaned = result.content.replace(/\{\{\w+\}\}/g, '');
    return await marked.parse(cleaned);
  } catch {
    logger.debug(`[Email] Template "${slug}" not found in DB, using fallback`);
    return fallbackHtml;
  }
}

// ═══════════════════════════════════════════
// Transporter Setup
// ═══════════════════════════════════════════

const isConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const createTransporter = () => {
  if (!isConfigured()) {
    logger.warn('[Email] SMTP not configured — emails will be logged but not sent');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

/**
 * #139: Format extras price cell per price type
 * - PER_UNIT:   "80 szt. × 15 zł = 1 200 zł"
 * - PER_PERSON: "30 zł/os."
 * - FLAT:       "2 000 zł" or "2 × 1 000 zł = 2 000 zł"
 * - FREE:       "Gratis"
 */
function formatExtraPriceCell(e: { quantity: number; price: string; totalPrice: string; priceType: string }): string {
  switch (e.priceType) {
    case 'FREE':
      return 'Gratis';
    case 'PER_UNIT':
      return `${e.quantity} szt. × ${e.price} zł = <strong>${e.totalPrice} zł</strong>`;
    case 'PER_PERSON':
      return `${e.price} zł/os. = <strong>${e.totalPrice} zł</strong>`;
    case 'FLAT':
    default:
      if (e.quantity > 1) {
        return `${e.quantity} × ${e.price} zł = <strong>${e.totalPrice} zł</strong>`;
      }
      return `<strong>${e.totalPrice} zł</strong>`;
  }
}

// ═══════════════════════════════════════════
// Email Service
// ═══════════════════════════════════════════

const emailService = {
  /**
   * Send a raw email
   */
  async send(options: EmailOptions): Promise<boolean> {
    const transport = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@gosciniec.pl';

    if (!transport) {
      logger.info(`[Email][DRY-RUN] To: ${options.to} | Subject: ${options.subject}`);
      logger.debug(`[Email][DRY-RUN] Body preview: ${options.html.substring(0, 200)}...`);
      if (options.attachments && options.attachments.length > 0) {
        logger.debug(`[Email][DRY-RUN] Attachments: ${options.attachments.map(a => a.filename).join(', ')}`);
      }
      return false;
    }

    try {
      const mailOptions: any = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
      };

      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments;
      }

      const info = await transport.sendMail(mailOptions);

      logger.info(`[Email] Sent to ${options.to}: ${options.subject} (messageId: ${info.messageId})`);
      if (options.attachments && options.attachments.length > 0) {
        logger.debug(`[Email] Attachments: ${options.attachments.map(a => a.filename).join(', ')}`);
      }
      return true;
    } catch (error: any) {
      logger.error(`[Email] Failed to send to ${options.to}: ${error.message}`);
      return false;
    }
  },

  /**
   * Send reservation confirmation with extras list
   * Updated: #137 — includes venue surcharge row
   * Updated: #139 — PER_UNIT label + per-type price formatting
   */
  async sendReservationConfirmation(to: string, data: ReservationConfirmationData, pdfBuffer?: Buffer): Promise<boolean> {
    const company = await getCompanyInfo();
    const subject = `✅ Potwierdzenie rezerwacji: ${data.eventType} — ${data.reservationDate}`;

    // Pre-build dynamic sections for template variables
    const menuSection = data.menuPackageName ? `- **Menu:** ${data.menuPackageName}` : '';
    const surchargeSection = data.venueSurcharge
      ? `- **Dopłata za obiekt:** ${data.venueSurcharge} zł (${data.venueSurchargeLabel || 'Dopłata za cały obiekt'})`
      : '';
    const depositSection = data.depositAmount && data.depositDueDate
      ? `- **Zaliczka:** ${data.depositAmount} zł do ${data.depositDueDate}`
      : '';
    const notesSection = data.notes ? `\n**Uwagi:** ${data.notes}` : '';

    let extrasSection = '';
    if (data.extras && data.extras.length > 0) {
      const extrasList = data.extras.map(e => `  - ${e.name} (${e.categoryName}): ${e.totalPrice} zł`).join('\n');
      extrasSection = `\n**Usługi dodatkowe:**\n${extrasList}`;
      if (data.extrasTotalPrice) {
        extrasSection += `\n  - **Razem extras:** ${data.extrasTotalPrice} zł`;
      }
    }

    const vars: Record<string, string> = {
      clientName: data.clientName,
      eventType: data.eventType,
      eventDate: data.reservationDate,
      startTime: data.startTime,
      endTime: data.endTime,
      hallName: data.hallName,
      guestCount: String(data.guestCount),
      adults: String(data.adults),
      children: String(data.children),
      toddlers: String(data.toddlers),
      totalPrice: data.totalPrice,
      menuSection,
      extrasSection,
      surchargeSection,
      depositSection,
      notesSection,
      companyName: company.name,
      companyPhone: '',
      companyEmail: '',
    };

    // Try to get company contact info
    try {
      const settings = await companySettingsService.getSettings();
      vars.companyPhone = settings.phone || '';
      vars.companyEmail = settings.email || '';
    } catch { /* fallback to empty */ }

    const fallbackBody = this.buildReservationConfirmationFallback(data, company.name);
    const body = await renderEmailTemplate('email-reservation-confirmation', vars, fallbackBody);

    const html = await buildHtmlFromLayout({
      title: 'Potwierdzenie rezerwacji',
      preheader: `Rezerwacja ${data.eventType} — ${data.reservationDate} potwierdzona`,
      companyName: company.name,
      body,
      footer: company.footerText,
    });

    const attachments = pdfBuffer ? [{
      filename: 'Potwierdzenie_rezerwacji.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : undefined;

    return this.send({ to, subject, html, attachments });
  },

  /** Fallback HTML for reservation confirmation (original hardcoded version) */
  buildReservationConfirmationFallback(data: ReservationConfirmationData, companyName: string): string {
    const priceTypeLabels: Record<string, string> = { FLAT: 'ryczałt', PER_PERSON: 'za osobę', PER_UNIT: 'za sztukę', FREE: 'gratis' };

    let extrasHtml = '';
    if (data.extras && data.extras.length > 0) {
      const extrasRows = data.extras.map(e => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e9ecef;">${e.name}</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#6b7280;font-size:13px;">${e.categoryName}</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;text-align:right;">${formatExtraPriceCell(e)}</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;font-size:13px;color:#6b7280;">${priceTypeLabels[e.priceType] || e.priceType}${e.note ? ` · ${e.note}` : ''}</td>
        </tr>
      `).join('');
      extrasHtml = `<h3 style="margin:28px 0 12px;color:#7c3aed;font-size:16px;">🎁 Usługi dodatkowe</h3>
        <table style="width:100%;border-collapse:collapse;margin:0 0 12px;"><thead><tr style="background:#f5f3ff;">
          <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Usługa</th>
          <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Kategoria</th>
          <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:right;font-weight:600;color:#7c3aed;">Cena</th>
          <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Info</th>
        </tr></thead><tbody>${extrasRows}</tbody></table>
        ${data.extrasTotalPrice ? `<p style="text-align:right;font-weight:600;color:#7c3aed;">Razem usługi dodatkowe: ${data.extrasTotalPrice} zł</p>` : ''}`;
    }

    let depositHtml = '';
    if (data.depositAmount && data.depositDueDate) {
      depositHtml = `<tr><td style="padding:10px 16px;background:#fef3c7;border:1px solid #fde68a;font-weight:600;color:#d97706;">Zaliczka</td>
        <td style="padding:10px 16px;border:1px solid #fde68a;"><strong>${data.depositAmount} zł</strong> do ${data.depositDueDate}</td></tr>`;
    }

    return `
      <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
      <p>Potwierdzamy przyjęcie rezerwacji:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Wydarzenie</td><td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong>${data.eventType}</strong></td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Data</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.reservationDate}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Godziny</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.startTime} — ${data.endTime}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Goście</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.guestCount} (dorośli: ${data.adults}, dzieci: ${data.children}, maluchy: ${data.toddlers})</td></tr>
        ${data.menuPackageName ? `<tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Menu</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.menuPackageName}</td></tr>` : ''}
        ${data.venueSurcharge ? `<tr><td style="padding:10px 16px;background:#fff7ed;border:1px solid #fed7aa;font-weight:600;color:#ea580c;">Dopłata za obiekt</td><td style="padding:10px 16px;border:1px solid #fed7aa;"><strong style="color:#ea580c;">${data.venueSurcharge} zł</strong></td></tr>` : ''}
        <tr><td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Kwota</td><td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong style="color:#16a34a;font-size:18px;">${data.totalPrice} zł</strong></td></tr>
        ${depositHtml}
      </table>
      ${extrasHtml}
      ${data.notes ? `<p style="margin-top:16px;padding:12px 16px;background:#f9fafb;border-left:4px solid #e5e7eb;color:#6b7280;font-size:14px;"><strong>Uwagi:</strong> ${data.notes}</p>` : ''}
      <p>W razie pytań lub zmian prosimy o kontakt.</p>`;
  },

  /**
   * Send deposit upcoming reminder (X days before due)
   */
  async sendDepositReminder(to: string, data: DepositReminderData): Promise<boolean> {
    const company = await getCompanyInfo();
    const subject = `Przypomnienie: zaliczka ${data.depositAmount} zł — termin za ${data.daysLeft} dni`;

    const vars: Record<string, string> = {
      clientName: data.clientName,
      depositAmount: data.depositAmount,
      dueDate: data.dueDate,
      daysLeft: String(data.daysLeft),
      reservationDate: data.reservationDate,
      hallName: data.hallName,
      eventType: data.eventType,
      guestCount: String(data.guestCount),
      companyName: company.name,
    };

    const fallbackBody = `
      <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
      <p>Przypominamy o zbliżającym się terminie płatności zaliczki:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Kwota</td><td style="padding:10px 16px;border:1px solid #e9ecef;"><strong style="color:#e11d48;font-size:18px;">${data.depositAmount} zł</strong></td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Termin płatności</td><td style="padding:10px 16px;border:1px solid #e9ecef;"><strong>${data.dueDate}</strong> (za ${data.daysLeft} dni)</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Rezerwacja</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.eventType} — ${data.reservationDate}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Liczba gości</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.guestCount}</td></tr>
      </table>
      <p>Prosimy o terminowe uregulowanie płatności. W razie pytań prosimy o kontakt.</p>`;

    const body = await renderEmailTemplate('email-deposit-reminder', vars, fallbackBody);

    const html = await buildHtmlFromLayout({
      title: 'Przypomnienie o zaliczce',
      preheader: `Termin płatności za ${data.daysLeft} dni`,
      companyName: company.name,
      body,
      footer: company.footerText,
    });

    return this.send({ to, subject, html });
  },

  /**
   * Send deposit overdue notification
   */
  async sendDepositOverdueNotice(to: string, data: DepositOverdueData): Promise<boolean> {
    const company = await getCompanyInfo();
    const subject = `⚠️ Zaległa zaliczka: ${data.depositAmount} zł — termin minął ${data.daysOverdue} dni temu`;

    const vars: Record<string, string> = {
      clientName: data.clientName,
      depositAmount: data.depositAmount,
      dueDate: data.dueDate,
      daysOverdue: String(data.daysOverdue),
      reservationDate: data.reservationDate,
      hallName: data.hallName,
      eventType: data.eventType,
      companyName: company.name,
    };

    const fallbackBody = `
      <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
      <p style="color:#dc2626;">Termin płatności zaliczki już minął. Prosimy o jak najszybsze uregulowanie należności:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:10px 16px;background:#fef2f2;border:1px solid #fecaca;font-weight:600;color:#dc2626;">Kwota</td><td style="padding:10px 16px;border:1px solid #fecaca;"><strong style="color:#dc2626;font-size:18px;">${data.depositAmount} zł</strong></td></tr>
        <tr><td style="padding:10px 16px;background:#fef2f2;border:1px solid #fecaca;font-weight:600;color:#dc2626;">Termin płatności</td><td style="padding:10px 16px;border:1px solid #fecaca;"><strong>${data.dueDate}</strong> (${data.daysOverdue} dni temu)</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Rezerwacja</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.eventType} — ${data.reservationDate}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td></tr>
      </table>
      <p>W przypadku braku wpłaty zastrzegamy sobie prawo do anulowania rezerwacji.</p>
      <p>Jeśli płatność została już dokonana, prosimy o informację — zaktualizujemy status w systemie.</p>`;

    const body = await renderEmailTemplate('email-deposit-overdue', vars, fallbackBody);

    const html = await buildHtmlFromLayout({
      title: 'Zaległa zaliczka — prosimy o kontakt',
      preheader: `Termin płatności minął ${data.daysOverdue} dni temu`,
      companyName: company.name,
      body,
      footer: company.footerText,
    });

    return this.send({ to, subject, html });
  },

  /**
   * Send deposit payment confirmation WITH PDF attachment
   */
  async sendDepositPaidConfirmation(to: string, data: {
    clientName: string;
    depositAmount: string;
    paidAt: string;
    paymentMethod: string;
    reservationDate: string;
    hallName: string;
    eventType: string;
  }, pdfBuffer?: Buffer): Promise<boolean> {
    const company = await getCompanyInfo();
    const subject = `✅ Potwierdzenie wpłaty zaliczki: ${data.depositAmount} zł`;

    const methodLabels: Record<string, string> = {
      TRANSFER: 'Przelew bankowy',
      CASH: 'Gotówka',
      BLIK: 'BLIK',
      CARD: 'Karta płatnicza',
    };

    const vars: Record<string, string> = {
      clientName: data.clientName,
      depositAmount: data.depositAmount,
      paidAt: data.paidAt,
      paymentMethod: methodLabels[data.paymentMethod] || data.paymentMethod,
      reservationDate: data.reservationDate,
      hallName: data.hallName,
      eventType: data.eventType,
      companyName: company.name,
    };

    const fallbackBody = `
      <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
      <p style="color:#16a34a;">Potwierdzamy otrzymanie wpłaty zaliczki:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Kwota</td><td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong style="color:#16a34a;font-size:18px;">${data.depositAmount} zł</strong></td></tr>
        <tr><td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Data wpłaty</td><td style="padding:10px 16px;border:1px solid #bbf7d0;">${data.paidAt}</td></tr>
        <tr><td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Metoda</td><td style="padding:10px 16px;border:1px solid #bbf7d0;">${methodLabels[data.paymentMethod] || data.paymentMethod}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Rezerwacja</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.eventType} — ${data.reservationDate}</td></tr>
        <tr><td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td><td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td></tr>
      </table>
      <p>Dziękujemy za wpłatę! ${pdfBuffer ? 'Potwierdzenie w załączniku PDF.' : ''}</p>`;

    const body = await renderEmailTemplate('email-deposit-paid', vars, fallbackBody);

    const html = await buildHtmlFromLayout({
      title: 'Potwierdzenie wpłaty zaliczki',
      preheader: `Zaliczka ${data.depositAmount} zł została zaksięgowana`,
      companyName: company.name,
      body,
      footer: company.footerText,
    });

    const attachments = pdfBuffer ? [{
      filename: 'Potwierdzenie_wplaty.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : undefined;

    return this.send({ to, subject, html, attachments });
  },

  /**
   * Send password reset email with CTA button
   */
  async sendPasswordResetEmail(to: string, data: PasswordResetEmailData): Promise<boolean> {
    const company = await getCompanyInfo();
    const subject = `🔑 Resetowanie hasła — ${company.name}`;

    const vars: Record<string, string> = {
      firstName: data.firstName,
      resetUrl: data.resetUrl,
      expiresInMinutes: String(data.expiresInMinutes),
      companyName: company.name,
    };

    const fallbackBody = `
      <p>Dzień dobry, <strong>${data.firstName}</strong>,</p>
      <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
      <p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;font-weight:600;font-size:16px;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(124,58,237,0.3);">
          Ustaw nowe hasło
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;">Link jest ważny przez <strong>${data.expiresInMinutes} minut</strong>. Po tym czasie konieczne będzie wygenerowanie nowego.</p>
      <p style="color:#6b7280;font-size:14px;">Jeśli nie prosiłeś o zmianę hasła, zignoruj tę wiadomość — Twoje konto pozostanie bezpieczne.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;">Jeśli przycisk nie działa, skopiuj i wklej ten link w przeglądarkę:<br /><a href="${data.resetUrl}" style="color:#7c3aed;word-break:break-all;">${data.resetUrl}</a></p>`;

    const body = await renderEmailTemplate('email-password-reset', vars, fallbackBody);

    const html = await buildHtmlFromLayout({
      title: 'Resetowanie hasła',
      preheader: 'Kliknij link aby ustawić nowe hasło',
      companyName: company.name,
      body,
      footer: company.footerText,
    });

    return this.send({ to, subject, html });
  },

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    const transport = getTransporter();
    if (!transport) {
      logger.warn('[Email] SMTP not configured — cannot verify');
      return false;
    }

    try {
      await transport.verify();
      logger.info('[Email] SMTP connection verified successfully');
      return true;
    } catch (error: any) {
      logger.error(`[Email] SMTP verification failed: ${error.message}`);
      return false;
    }
  },
};

// ═══════════════════════════════════════════
// HTML Layout from DB (with fallback)
// ═══════════════════════════════════════════

async function buildHtmlFromLayout(opts: {
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
    html = html.replace(/\{\{companyName\}\}/g, opts.companyName || 'Gościniec');
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

function buildHtmlTemplate(opts: {
  title: string;
  preheader: string;
  body: string;
  footer: string;
  companyName?: string;
}): string {
  const displayName = opts.companyName || 'Gościniec';

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
      <h1>🏛️ ${displayName}</h1>
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

export default emailService;
