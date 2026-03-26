/**
 * Unit tests for excel-preparations.ts
 * Covers: exportPreparationsToExcel — detailed & summary views
 * Issue: #257
 */

import type { PreparationsReport } from '@/types/reports.types';

// ─── Mock ExcelJS ────────────────────────────────────────────────────────────

const mockWriteBuffer = jest.fn().mockResolvedValue(Buffer.from('mock-xlsx'));

const mockRows: any[] = [];
let mockColumns: any[] = [];
const mockMergeCellsCalls: string[] = [];
const mockCells: Record<string, any> = {};

function createMockSheet() {
  mockRows.length = 0;
  mockColumns.length = 0;
  mockMergeCellsCalls.length = 0;
  Object.keys(mockCells).forEach(k => delete mockCells[k]);

  return {
    mergeCells: jest.fn((range: string) => mockMergeCellsCalls.push(range)),
    getCell: jest.fn((ref: string) => {
      if (!mockCells[ref]) mockCells[ref] = { value: null, font: {}, alignment: {} };
      return mockCells[ref];
    }),
    getRow: jest.fn((idx: number) => ({
      height: 20,
      set height(val: number) { /* noop */ },
    })),
    addRow: jest.fn((values: any[]) => {
      const row = {
        values,
        font: {} as any,
        fill: {} as any,
      };
      mockRows.push(row);
      return row;
    }),
    set columns(cols: any[]) { mockColumns = cols; },
    get columns() { return mockColumns; },
  };
}

const mockSheet = createMockSheet();

jest.mock('exceljs', () => ({
  __esModule: true,
  default: {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn(() => mockSheet),
      xlsx: { writeBuffer: mockWriteBuffer },
    })),
  },
}));

import { exportPreparationsToExcel } from '@services/reports-export/excel-preparations';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function createDetailedReport(): PreparationsReport {
  return {
    summary: {
      totalExtras: 15,
      totalReservationsWithExtras: 4,
      nearestEvent: { date: '2026-03-15', startTime: '14:00', clientName: 'Jan Kowalski' },
      topCategory: { name: 'Dekoracje', icon: '🎨', count: 8 },
    },
    filters: { dateFrom: '2026-03-01', dateTo: '2026-03-31', view: 'detailed' },
    days: [
      {
        date: '2026-03-15',
        dateLabel: 'Sobota, 15 marca 2026',
        totalItems: 6,
        categories: [
          {
            categoryId: 'cat-1',
            categoryName: 'Dekoracje',
            categoryIcon: '🎨',
            categoryColor: '#FF5733',
            itemCount: 3,
            items: [
              {
                extraId: 'ext-1',
                serviceName: 'Balony helowe',
                serviceItemId: 'si-1',
                quantity: 20,
                priceType: 'PER_PERSON',
                unitPrice: 5,
                totalPrice: 100,
                note: 'Różowe i białe',
                status: 'CONFIRMED',
                reservation: {
                  id: 'res-1',
                  clientName: 'Jan Kowalski',
                  hallName: 'Sala A',
                  eventTypeName: 'Urodziny',
                  date: '2026-03-15',
                  startTime: '14:00:00',
                  endTime: '18:00:00',
                  guests: 30,
                  adults: 20,
                  children: 8,
                  toddlers: 2,
                },
              },
              {
                extraId: 'ext-2',
                serviceName: 'Girlanda kwiatowa',
                serviceItemId: 'si-2',
                quantity: 1,
                priceType: 'FLAT',
                unitPrice: 200,
                totalPrice: 200,
                note: null,
                status: 'PENDING',
                reservation: {
                  id: 'res-2',
                  clientName: 'Anna Nowak',
                  hallName: 'Sala B',
                  eventTypeName: null,
                  date: '2026-03-15',
                  startTime: '10:00:00',
                  endTime: null,
                  guests: 15,
                  adults: 10,
                  children: 5,
                  toddlers: 0,
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function createSummaryReport(): PreparationsReport {
  return {
    summary: {
      totalExtras: 10,
      totalReservationsWithExtras: 3,
      nearestEvent: null,
      topCategory: null,
    },
    filters: { dateFrom: '2026-03-01', dateTo: '2026-03-31', view: 'summary' },
    days: [],
    summaryDays: [
      {
        date: '2026-03-15',
        dateLabel: 'Sobota, 15 marca 2026',
        totalItems: 5,
        totalReservations: 2,
        items: [
          {
            serviceItemId: 'si-1',
            serviceName: 'Balony helowe',
            categoryName: 'Dekoracje',
            categoryIcon: '🎨',
            categoryColor: '#FF5733',
            totalQuantity: 40,
            totalPersons: 60,
            reservationCount: 2,
            reservations: [
              { id: 'res-1', clientName: 'Jan Kowalski', date: '2026-03-15', startTime: '14:00:00', quantity: 20 },
              { id: 'res-2', clientName: 'Anna Nowak', date: '2026-03-15', startTime: null, quantity: 20 },
            ],
          },
        ],
      },
    ],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('exportPreparationsToExcel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockSheet, createMockSheet());
  });

  describe('ogólne', () => {
    it('powinno zwrócić Buffer', async () => {
      const report = createDetailedReport();
      const result = await exportPreparationsToExcel(report);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('powinno scalić komórki dla tytułu A1:E1', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      expect(mockMergeCellsCalls).toContain('A1:E1');
    });
  });

  describe('detailed view', () => {
    it('powinno ustawić tytuł widoku szczegółowego', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      expect(mockCells['A1'].value).toContain('Widok szczegółowy');
    });

    it('powinno dodać informacje o filtrach', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const periodRow = mockRows.find(r => r.values && r.values[0] === 'Okres:');
      expect(periodRow).toBeDefined();
      expect(periodRow.values[1]).toContain('2026-03-01');
    });

    it('powinno wyrenderować nagłówek SZCZEGÓŁY WG DNI', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const header = mockRows.find(r => r.values && r.values[0] === 'SZCZEGÓŁY WG DNI');
      expect(header).toBeDefined();
    });

    it('powinno wyrenderować wiersz dnia z datą i liczbą usług', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const dayRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Sobota, 15 marca 2026'),
      );
      expect(dayRow).toBeDefined();
      expect(dayRow.values[4]).toContain('Usług: 6');
    });

    it('powinno wyrenderować kategorię z ikoną', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const catRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('🎨') && r.values[0].includes('Dekoracje'),
      );
      expect(catRow).toBeDefined();
    });

    it('powinno wyrenderować nagłówki kolumn dla usług', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const colRow = mockRows.find(r => r.values && r.values[0] === '  Usługa');
      expect(colRow).toBeDefined();
    });

    it('powinno wyrenderować usługę z danymi rezerwacji', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Balony helowe'),
      );
      expect(serviceRow).toBeDefined();
      expect(serviceRow.values[1]).toContain('Jan Kowalski');
      expect(serviceRow.values[2]).toBe(20); // quantity
    });

    it('powinno formatować czas jako HH:MM – HH:MM', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Balony helowe'),
      );
      expect(serviceRow.values[3]).toContain('14:00');
      expect(serviceRow.values[3]).toContain('18:00');
    });

    it('powinno obsłużyć brak endTime — tylko startTime', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Girlanda'),
      );
      expect(serviceRow.values[3]).toBe('10:00');
    });

    it('powinno wyświetlić "—" dla uwag null', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const girlandaRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Girlanda'),
      );
      expect(girlandaRow.values[4]).toBe('—');
    });

    it('powinno wyświetlić treść uwagi gdy istnieje', async () => {
      const report = createDetailedReport();
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Balony'),
      );
      expect(serviceRow.values[4]).toBe('Różowe i białe');
    });

    it('powinno obsłużyć brak startTime — wyświetlić "—"', async () => {
      const report = createDetailedReport();
      report.days[0].categories[0].items[0].reservation.startTime = null;
      report.days[0].categories[0].items[0].reservation.endTime = null;
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Balony'),
      );
      expect(serviceRow.values[3]).toBe('—');
    });
  });

  describe('summary view', () => {
    it('powinno ustawić tytuł widoku zbiorczego', async () => {
      const report = createSummaryReport();
      await exportPreparationsToExcel(report);

      expect(mockCells['A1'].value).toContain('Widok zbiorczy');
    });

    it('powinno wyrenderować nagłówek ZESTAWIENIE ZBIORCZE', async () => {
      const report = createSummaryReport();
      await exportPreparationsToExcel(report);

      const header = mockRows.find(r => r.values && r.values[0] === 'ZESTAWIENIE ZBIORCZE');
      expect(header).toBeDefined();
    });

    it('powinno wyrenderować wiersz dnia z sumami', async () => {
      const report = createSummaryReport();
      await exportPreparationsToExcel(report);

      const dayRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Sobota, 15 marca 2026'),
      );
      expect(dayRow).toBeDefined();
    });

    it('powinno wyrenderować nagłówki kolumn dla zbiorczego', async () => {
      const report = createSummaryReport();
      await exportPreparationsToExcel(report);

      const colRow = mockRows.find(r => r.values && r.values[0] === 'Usługa');
      expect(colRow).toBeDefined();
    });

    it('powinno wyrenderować usługę z łączną ilością', async () => {
      const report = createSummaryReport();
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0] === 'Balony helowe',
      );
      expect(serviceRow).toBeDefined();
      expect(serviceRow.values[2]).toBe(40); // totalQuantity
      expect(serviceRow.values[3]).toBe(2); // reservationCount
    });

    it('powinno wyrenderować klientów z czasem', async () => {
      const report = createSummaryReport();
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0] === 'Balony helowe',
      );
      expect(serviceRow.values[4]).toContain('Jan Kowalski');
      expect(serviceRow.values[4]).toContain('14:00');
    });

    it('powinno obsłużyć klienta bez startTime w zbiorczym', async () => {
      const report = createSummaryReport();
      await exportPreparationsToExcel(report);

      const serviceRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0] === 'Balony helowe',
      );
      // Anna Nowak has no startTime — should just show name without time
      expect(serviceRow.values[4]).toContain('Anna Nowak');
    });
  });

  describe('empty data', () => {
    it('powinno obsłużyć raport bez dni (detailed view)', async () => {
      const report = createDetailedReport();
      report.days = [];
      const result = await exportPreparationsToExcel(report);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('powinno obsłużyć raport bez summaryDays', async () => {
      const report = createSummaryReport();
      report.summaryDays = [];
      const result = await exportPreparationsToExcel(report);

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
