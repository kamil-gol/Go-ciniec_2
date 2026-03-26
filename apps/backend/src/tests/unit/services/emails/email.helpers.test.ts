/**
 * Unit tests for emails/email.helpers.ts
 * Covers: getCompanyInfo, renderEmailTemplate, formatExtraPriceCell
 */

jest.mock('../../../../services/company-settings.service', () => ({
  __esModule: true,
  default: {
    getSettings: jest.fn(),
  },
}));

jest.mock('../../../../services/document-template.service', () => ({
  __esModule: true,
  default: {
    preview: jest.fn(),
  },
}));

const mockMarkedParse = jest.fn().mockReturnValue('<p>parsed</p>');
jest.mock('marked', () => ({
  marked: {
    parse: mockMarkedParse,
  },
}));

jest.mock('../../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

import { getCompanyInfo, renderEmailTemplate, formatExtraPriceCell } from '../../../../services/emails/email.helpers';
import companySettingsService from '../../../../services/company-settings.service';
import documentTemplateService from '../../../../services/document-template.service';
const mockSettings = companySettingsService as any;
const mockDocService = documentTemplateService as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// getCompanyInfo
// ===============================================================

describe('getCompanyInfo', () => {
  it('returns company name from settings', async () => {
    mockSettings.getSettings.mockResolvedValue({ companyName: 'Moja Sala' });

    const result = await getCompanyInfo();

    expect(result.name).toBe('Moja Sala');
    expect(result.footerText).toContain('Moja Sala');
  });

  it('defaults to Gościniec when no company name', async () => {
    mockSettings.getSettings.mockResolvedValue({ companyName: '' });

    const result = await getCompanyInfo();
    expect(result.name).toBe('Gościniec');
  });

  it('falls back to Gościniec on error', async () => {
    mockSettings.getSettings.mockRejectedValue(new Error('DB down'));

    const result = await getCompanyInfo();

    expect(result.name).toBe('Gościniec');
    expect(result.footerText).toContain('Gościniec');
  });
});

// ===============================================================
// renderEmailTemplate
// ===============================================================

describe('renderEmailTemplate', () => {
  it('renders template from DB with variables', async () => {
    mockDocService.preview.mockResolvedValue({
      content: 'Hello {{name}}, event: {{event}}',
    });

    const result = await renderEmailTemplate('test-template', { name: 'Jan', event: 'Wesele' }, '<p>fallback</p>');

    expect(mockDocService.preview).toHaveBeenCalledWith('test-template', { name: 'Jan', event: 'Wesele' });
    expect(mockMarkedParse).toHaveBeenCalled();
    expect(result).toBe('<p>parsed</p>');
  });

  it('cleans unfilled variables from template', async () => {
    mockDocService.preview.mockResolvedValue({
      content: 'Hello {{name}}, notes: {{notes}}',
    });

    await renderEmailTemplate('slug', { name: 'Jan' }, '<p>fb</p>');

    // marked.parse should receive cleaned content (without {{notes}})
    const parsedArg = mockMarkedParse.mock.calls[0][0];
    expect(parsedArg).not.toContain('{{notes}}');
    expect(parsedArg).toContain('Hello');
  });

  it('falls back to hardcoded HTML when template not found', async () => {
    mockDocService.preview.mockRejectedValue(new Error('Not found'));

    const result = await renderEmailTemplate('missing-slug', {}, '<p>fallback</p>');

    expect(result).toBe('<p>fallback</p>');
  });
});

// ===============================================================
// formatExtraPriceCell
// ===============================================================

describe('formatExtraPriceCell', () => {
  it('returns Gratis for FREE type', () => {
    expect(formatExtraPriceCell({ quantity: 1, price: '0', totalPrice: '0', priceType: 'FREE' }))
      .toBe('Gratis');
  });

  it('formats PER_UNIT with quantity', () => {
    const result = formatExtraPriceCell({ quantity: 80, price: '15', totalPrice: '1200', priceType: 'PER_UNIT' });
    expect(result).toContain('80 szt.');
    expect(result).toContain('15');
    expect(result).toContain('1200');
  });

  it('formats PER_PERSON', () => {
    const result = formatExtraPriceCell({ quantity: 1, price: '30', totalPrice: '3000', priceType: 'PER_PERSON' });
    expect(result).toContain('30');
    expect(result).toContain('os.');
    expect(result).toContain('3000');
  });

  it('formats FLAT with quantity 1', () => {
    const result = formatExtraPriceCell({ quantity: 1, price: '2000', totalPrice: '2000', priceType: 'FLAT' });
    expect(result).toContain('2000');
    expect(result).not.toContain('szt.');
  });

  it('formats FLAT with quantity > 1', () => {
    const result = formatExtraPriceCell({ quantity: 2, price: '1000', totalPrice: '2000', priceType: 'FLAT' });
    expect(result).toContain('2');
    expect(result).toContain('1000');
    expect(result).toContain('2000');
  });

  it('handles unknown price type as FLAT', () => {
    const result = formatExtraPriceCell({ quantity: 1, price: '500', totalPrice: '500', priceType: 'CUSTOM' });
    expect(result).toContain('500');
  });
});
