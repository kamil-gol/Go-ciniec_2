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
 */

import nodemailer from 'nodemailer';
import logger from '@utils/logger';
import companySettingsService from './company-settings.service';

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
    priceType: string;
    note?: string;
  }>;
  extrasTotalPrice?: string;
  depositAmount?: string;
  depositDueDate?: string;
  notes?: string;
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
   */
  async sendReservationConfirmation(to: string, data: ReservationConfirmationData, pdfBuffer?: Buffer): Promise<boolean> {
    const company = await getCompanyInfo();
    const subject = `✅ Potwierdzenie rezerwacji: ${data.eventType} — ${data.reservationDate}`;

    // Build extras section HTML
    let extrasHtml = '';
    if (data.extras && data.extras.length > 0) {
      const priceTypeLabels: Record<string, string> = {
        FLAT: 'ryczałt',
        PER_PERSON: 'za osobę',
        FREE: 'gratis',
      };

      const extrasRows = data.extras.map(e => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e9ecef;">${e.name}</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#6b7280;font-size:13px;">${e.categoryName}</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;text-align:center;">${e.quantity}</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;text-align:right;">${e.priceType === 'FREE' ? 'Gratis' : `${e.price} zł`}</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;font-size:13px;color:#6b7280;">${priceTypeLabels[e.priceType] || e.priceType}${e.note ? ` · ${e.note}` : ''}</td>
        </tr>
      `).join('');

      extrasHtml = `
        <h3 style="margin:28px 0 12px;color:#7c3aed;font-size:16px;">🎁 Usługi dodatkowe</h3>
        <table style="width:100%;border-collapse:collapse;margin:0 0 12px;">
          <thead>
            <tr style="background:#f5f3ff;">
              <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Usługa</th>
              <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Kategoria</th>
              <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:center;font-weight:600;color:#7c3aed;">Ilość</th>
              <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:right;font-weight:600;color:#7c3aed;">Cena</th>
              <th style="padding:8px 12px;border:1px solid #e9ecef;text-align:left;font-weight:600;color:#7c3aed;">Info</th>
            </tr>
          </thead>
          <tbody>
            ${extrasRows}
          </tbody>
        </table>
        ${data.extrasTotalPrice ? `<p style="text-align:right;font-weight:600;color:#7c3aed;">Razem usługi dodatkowe: ${data.extrasTotalPrice} zł</p>` : ''}
      `;
    }

    // Build deposit section
    let depositHtml = '';
    if (data.depositAmount && data.depositDueDate) {
      depositHtml = `
        <tr>
          <td style="padding:10px 16px;background:#fef3c7;border:1px solid #fde68a;font-weight:600;color:#d97706;">Zaliczka</td>
          <td style="padding:10px 16px;border:1px solid #fde68a;"><strong>${data.depositAmount} zł</strong> do ${data.depositDueDate}</td>
        </tr>
      `;
    }

    const html = buildHtmlTemplate({
      title: 'Potwierdzenie rezerwacji',
      preheader: `Rezerwacja ${data.eventType} — ${data.reservationDate} potwierdzona`,
      companyName: company.name,
      body: `
        <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
        <p>Potwierdzamy przyjęcie rezerwacji:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr>
            <td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Wydarzenie</td>
            <td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong>${data.eventType}</strong></td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Data</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.reservationDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Godziny</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.startTime} — ${data.endTime}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Goście</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.guestCount} (dorośli: ${data.adults}, dzieci: ${data.children}, maluchy: ${data.toddlers})</td>
          </tr>
          ${data.menuPackageName ? `
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Menu</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.menuPackageName}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Kwota</td>
            <td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong style="color:#16a34a;font-size:18px;">${data.totalPrice} zł</strong>${data.extrasTotalPrice ? ` <span style="color:#7c3aed;font-size:13px;">(w tym extras: ${data.extrasTotalPrice} zł)</span>` : ''}</td>
          </tr>
          ${depositHtml}
        </table>

        ${extrasHtml}

        ${data.notes ? `<p style="margin-top:16px;padding:12px 16px;background:#f9fafb;border-left:4px solid #e5e7eb;color:#6b7280;font-size:14px;"><strong>Uwagi:</strong> ${data.notes}</p>` : ''}

        <p>W razie pytań lub zmian prosimy o kontakt.</p>
        ${pdfBuffer ? '<p>Szczegóły rezerwacji w załączniku PDF.</p>' : ''}
      `,
      footer: company.footerText,
    });

    const attachments = pdfBuffer ? [{
      filename: 'Potwierdzenie_rezerwacji.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : undefined;

    return this.send({ to, subject, html, attachments });
  },

  /**
   * Send deposit upcoming reminder (X days before due)
   */
  async sendDepositReminder(to: string, data: DepositReminderData): Promise<boolean> {
    const company = await getCompanyInfo();
    const subject = `Przypomnienie: zaliczka ${data.depositAmount} zł — termin za ${data.daysLeft} dni`;

    const html = buildHtmlTemplate({
      title: 'Przypomnienie o zaliczce',
      preheader: `Termin płatności za ${data.daysLeft} dni`,
      companyName: company.name,
      body: `
        <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
        <p>Przypominamy o zbliżającym się terminie płatności zaliczki:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Kwota</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;"><strong style="color:#e11d48;font-size:18px;">${data.depositAmount} zł</strong></td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Termin płatności</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;"><strong>${data.dueDate}</strong> (za ${data.daysLeft} dni)</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Rezerwacja</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.eventType} — ${data.reservationDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Liczba gości</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.guestCount}</td>
          </tr>
        </table>
        <p>Prosimy o terminowe uregulowanie płatności. W razie pytań prosimy o kontakt.</p>
      `,
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

    const html = buildHtmlTemplate({
      title: 'Zaległa zaliczka — prosimy o kontakt',
      preheader: `Termin płatności minął ${data.daysOverdue} dni temu`,
      companyName: company.name,
      body: `
        <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
        <p style="color:#dc2626;">Termin płatności zaliczki już minął. Prosimy o jak najszybsze uregulowanie należności:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr>
            <td style="padding:10px 16px;background:#fef2f2;border:1px solid #fecaca;font-weight:600;color:#dc2626;">Kwota</td>
            <td style="padding:10px 16px;border:1px solid #fecaca;"><strong style="color:#dc2626;font-size:18px;">${data.depositAmount} zł</strong></td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#fef2f2;border:1px solid #fecaca;font-weight:600;color:#dc2626;">Termin płatności</td>
            <td style="padding:10px 16px;border:1px solid #fecaca;"><strong>${data.dueDate}</strong> (${data.daysOverdue} dni temu)</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Rezerwacja</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.eventType} — ${data.reservationDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td>
          </tr>
        </table>
        <p>W przypadku braku wpłaty zastrzegamy sobie prawo do anulowania rezerwacji.</p>
        <p>Jeśli płatność została już dokonana, prosimy o informację — zaktualizujemy status w systemie.</p>
      `,
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

    const html = buildHtmlTemplate({
      title: 'Potwierdzenie wpłaty zaliczki',
      preheader: `Zaliczka ${data.depositAmount} zł została zaksięgowana`,
      companyName: company.name,
      body: `
        <p>Dzień dobry, <strong>${data.clientName}</strong>,</p>
        <p style="color:#16a34a;">Potwierdzamy otrzymanie wpłaty zaliczki:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr>
            <td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Kwota</td>
            <td style="padding:10px 16px;border:1px solid #bbf7d0;"><strong style="color:#16a34a;font-size:18px;">${data.depositAmount} zł</strong></td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Data wpłaty</td>
            <td style="padding:10px 16px;border:1px solid #bbf7d0;">${data.paidAt}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;font-weight:600;color:#16a34a;">Metoda</td>
            <td style="padding:10px 16px;border:1px solid #bbf7d0;">${methodLabels[data.paymentMethod] || data.paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Rezerwacja</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.eventType} — ${data.reservationDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;">Sala</td>
            <td style="padding:10px 16px;border:1px solid #e9ecef;">${data.hallName}</td>
          </tr>
        </table>
        <p>Dziękujemy za wpłatę! ${pdfBuffer ? 'Potwierdzenie w załączniku PDF.' : ''}</p>
      `,
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
// HTML Template Builder
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
