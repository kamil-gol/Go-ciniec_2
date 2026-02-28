// apps/backend/src/services/pdf-menu-preparations.integration.ts

/**
 * Integration bridge — connects pdf.service.ts pattern with pdf-menu-preparations.builder.ts
 * Same pattern as pdf-preparations.integration.ts (#159)
 *
 * Usage: import { generateMenuPreparationsReportPDF } from './pdf-menu-preparations.integration';
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import companySettingsService from './company-settings.service';
import { buildMenuPreparationsReportPDF } from './pdf-menu-preparations.builder';
import type { MenuPreparationsReport } from '@/types/reports.types';

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
 * Generate menu preparations report PDF (standalone, does not depend on PDFService class).
 * Mirrors the pattern used by preparations report PDF (#159).
 */
export async function generateMenuPreparationsReportPDF(
  data: MenuPreparationsReport
): Promise<Buffer> {
  let restaurantName = process.env.RESTAURANT_NAME || 'Gościniec Rodzinny';
  let restaurantPhone = process.env.RESTAURANT_PHONE || '';
  let restaurantEmail = process.env.RESTAURANT_EMAIL || '';

  try {
    const settings = await companySettingsService.getSettings();
    restaurantName = settings.companyName || restaurantName;
    restaurantPhone = settings.phone || restaurantPhone;
    restaurantEmail = settings.email || restaurantEmail;
  } catch {
    console.warn('[PDF Menu Preparations] Could not load company settings, using fallbacks');
  }

  const fontRegular = findFont(FONT_PATHS.regular);
  const fontBold = findFont(FONT_PATHS.bold);
  const useCustomFonts = !!(fontRegular && fontBold);

  return new Promise((resolve, reject) => {
    console.log('[PDF Service] Generating menu preparations report PDF');

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 30, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: 'Raport Menu — Przygotowania',
        Author: restaurantName,
        Subject: 'Raport przygotowań menu — dania i kursy',
      },
    });

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
      console.log(`[PDF Service] Menu preparations report PDF generated, size: ${buffer.length} bytes`);
      resolve(buffer);
    });
    doc.on('error', (error) => reject(error));

    buildMenuPreparationsReportPDF(
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
