/**
 * Unit tests for emails/email-templates.ts
 * Covers: buildHtmlFromLayout, buildHtmlTemplate, buildReservationConfirmationFallback
 */

jest.mock('../../../../services/document-template.service', () => ({
  __esModule: true,
  default: {
    getBySlug: jest.fn(),
  },
}));

jest.mock('../../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../../../services/emails/email.helpers', () => ({
  formatExtraPriceCell: jest.fn().mockReturnValue('100 zl'),
}));

import { buildHtmlFromLayout, buildHtmlTemplate, buildReservationConfirmationFallback } from '../../../../services/emails/email-templates';
import documentTemplateService from '../../../../services/document-template.service';

const mockDocService = documentTemplateService as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// buildHtmlTemplate
// ===============================================================

describe('buildHtmlTemplate', () => {
  it('returns valid HTML with all placeholders filled', () => {
    const html = buildHtmlTemplate({
      title: 'Test Title',
      preheader: 'Preview text',
      body: '<p>Hello</p>',
      footer: 'Footer text',
    });

    expect(html).toContain('Test Title');
    expect(html).toContain('Preview text');
    expect(html).toContain('<p>Hello</p>');
    expect(html).toContain('Footer text');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('uses default company name when not provided', () => {
    const html = buildHtmlTemplate({
      title: 'T',
      preheader: 'P',
      body: 'B',
      footer: 'F',
    });

    expect(html).toContain('Gosciniec');
  });

  it('uses custom company name', () => {
    const html = buildHtmlTemplate({
      title: 'T',
      preheader: 'P',
      body: 'B',
      footer: 'F',
      companyName: 'Moja Firma',
    });

    expect(html).toContain('Moja Firma');
  });
});

// ===============================================================
// buildHtmlFromLayout
// ===============================================================

describe('buildHtmlFromLayout', () => {
  it('uses DB layout template when available', async () => {
    mockDocService.getBySlug.mockResolvedValue({
      content: '<html>{{title}} {{content}} {{preheader}} {{companyName}} {{footer}}</html>',
    });

    const result = await buildHtmlFromLayout({
      title: 'Title',
      preheader: 'Pre',
      body: 'Body',
      footer: 'Foot',
      companyName: 'TestCo',
    });

    expect(result).toContain('Title');
    expect(result).toContain('Body');
    expect(result).toContain('TestCo');
    expect(result).toContain('Pre');
    expect(result).toContain('Foot');
  });

  it('falls back to hardcoded template when DB template not found', async () => {
    mockDocService.getBySlug.mockRejectedValue(new Error('Not found'));

    const result = await buildHtmlFromLayout({
      title: 'Fallback Title',
      preheader: 'Pre',
      body: '<p>Content</p>',
      footer: 'Footer',
    });

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('Fallback Title');
    expect(result).toContain('<p>Content</p>');
  });

  it('defaults company name to Gosciniec', async () => {
    mockDocService.getBySlug.mockResolvedValue({
      content: '{{companyName}}',
    });

    const result = await buildHtmlFromLayout({
      title: 'T',
      preheader: 'P',
      body: 'B',
      footer: 'F',
    });

    expect(result).toContain('Gosciniec');
  });
});

// ===============================================================
// buildReservationConfirmationFallback
// ===============================================================

describe('buildReservationConfirmationFallback', () => {
  const baseData = {
    clientName: 'Anna Nowak',
    eventType: 'Wesele',
    reservationDate: '2026-06-15',
    startTime: '14:00',
    endTime: '22:00',
    hallName: 'Sala Bankietowa',
    guestCount: 120,
    adults: 100,
    children: 15,
    toddlers: 5,
    totalPrice: '15000',
  } as any;

  it('renders basic reservation info', () => {
    const html = buildReservationConfirmationFallback(baseData, 'TestCo');

    expect(html).toContain('Anna Nowak');
    expect(html).toContain('Wesele');
    expect(html).toContain('2026-06-15');
    expect(html).toContain('14:00');
    expect(html).toContain('Sala Bankietowa');
    expect(html).toContain('15000');
  });

  it('includes extras section when extras provided', () => {
    const data = {
      ...baseData,
      extras: [{ name: 'DJ', categoryName: 'Muzyka', quantity: 1, price: '500', totalPrice: '500', priceType: 'FLAT', note: '' }],
      extrasTotalPrice: '500',
    };

    const html = buildReservationConfirmationFallback(data, 'TestCo');

    expect(html).toContain('DJ');
    expect(html).toContain('Muzyka');
  });

  it('includes deposit info when provided', () => {
    const data = {
      ...baseData,
      depositAmount: '3000',
      depositDueDate: '2026-04-01',
    };

    const html = buildReservationConfirmationFallback(data, 'TestCo');

    expect(html).toContain('3000');
    expect(html).toContain('2026-04-01');
    expect(html).toContain('Zaliczka');
  });

  it('includes notes when provided', () => {
    const data = { ...baseData, notes: 'Wegetarianska opcja' };

    const html = buildReservationConfirmationFallback(data, 'TestCo');
    expect(html).toContain('Wegetarianska opcja');
  });

  it('omits extras section when no extras', () => {
    const html = buildReservationConfirmationFallback(baseData, 'TestCo');
    expect(html).not.toContain('Uslugi dodatkowe');
  });
});
