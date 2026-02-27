// apps/backend/src/services/pdf-preparations.integration.ts

/**
 * Integration bridge — connects pdf.service.ts with pdf-preparations.builder.ts
 * This avoids modifying the massive pdf.service.ts file directly.
 *
 * Usage: import { generatePreparationsReportPDF } from './pdf-preparations.integration';
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import companySettingsService from './company-settings.service';
import { buildPreparationsReportPDF } from './pdf-preparations.builder';
import type { PreparationsReport } from '@/types/reports.types';

const FONT_PATHS = {
  regular: [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    './fonts/DejaVuSans.ttf',
  ],
  bold: [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    './fonts/DejaVuSans-Bold.ttf',
  ],
};

function findFont(paths: string[]): string | undefined {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Generate preparations report PDF (standalone, does not depend on PDFService class).
 * Mirrors the pattern used by other report PDFs but lives in a separate module.
 */
export async function generatePreparationsReportPDF(
  data: PreparationsReport
): Promise<Buffer> {
  // Load company settings
  let restaurantName = process.env.RESTAURANT_NAME || 'Gościniec Rodzinny';
  let restaurantPhone = process.env.RESTAURANT_PHONE || '';
  let restaurantEmail = process.env.RESTAURANT_EMAIL || '';

  try {
    const settings = await companySettingsService.getSettings();
    restaurantName = settings.companyName || restaurantName;
    restaurantPhone = settings.phone || restaurantPhone;
    restaurantEmail = settings.email || restaurantEmail;
  } catch {
    console.warn('[PDF Preparations] Could not load company settings, using fallbacks');
  }

  // Resolve fonts
  const fontRegular = findFont(FONT_PATHS.regular);
  const fontBold = findFont(FONT_PATHS.bold);
  const useCustomFonts = !!(fontRegular && fontBold);

  return new Promise((resolve, reject) => {
    console.log('[PDF Service] Generating preparations report PDF');

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 30, left: 40, right: 40 },
      info: {
        Title: 'Raport Przygotowań',
        Author: restaurantName,
        Subject: 'Raport przygotowań usług dodatkowych',
      },
    });

    // Setup fonts
    if (useCustomFonts && fontRegular && fontBold) {
      doc.registerFont('DejaVu', fontRegular);
      doc.registerFont('DejaVu-Bold', fontBold);
      doc.font('DejaVu');
    } else {
      doc.font('Helvetica');
    }

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log(`[PDF Service] Preparations report PDF generated, size: ${buffer.length} bytes`);
      resolve(buffer);
    });
    doc.on('error', (error) => reject(error));

    // Build PDF content
    buildPreparationsReportPDF(
      {
        doc,
        regularFont: useCustomFonts ? 'DejaVu' : 'Helvetica',
        boldFont: useCustomFonts ? 'DejaVu-Bold' : 'Helvetica-Bold',
        restaurantName,
        restaurantPhone,
        restaurantEmail,
      },
      data
    );

    doc.end();
  });
}
