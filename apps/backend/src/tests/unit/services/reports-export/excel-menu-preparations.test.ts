/**
 * Unit tests for excel-menu-preparations.ts
 * Covers: exportMenuPreparationsToExcel — detailed & summary views
 * Issue: #257
 */

import type { MenuPreparationsReport } from '@/types/reports.types';

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

jest.mock('@services/reports-export/export.helpers', () => ({
  portionTargetLabel: jest.fn((target: string | undefined) => {
    if (target === 'ADULTS_ONLY') return ' (dorośli)';
    if (target === 'CHILDREN_ONLY') return ' (dzieci)';
    return '';
  }),
}));

import { exportMenuPreparationsToExcel } from '@services/reports-export/excel-menu-preparations';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function createBaseSummary(): MenuPreparationsReport['summary'] {
  return {
    totalMenus: 5,
    totalGuests: 120,
    totalAdults: 80,
    totalChildren: 30,
    totalToddlers: 10,
    topPackage: { name: 'Pakiet Gold', count: 3 },
    nearestEvent: { date: '2026-03-20', startTime: '14:00', clientName: 'Jan Kowalski' },
  };
}

function createDetailedReport(): MenuPreparationsReport {
  return {
    summary: createBaseSummary(),
    filters: { dateFrom: '2026-03-01', dateTo: '2026-03-31', view: 'detailed' },
    days: [
      {
        date: '2026-03-15',
        dateLabel: 'Sobota, 15 marca 2026',
        totalReservations: 2,
        totalGuests: 60,
        reservations: [
          {
            reservationId: 'res-1',
            clientName: 'Jan Kowalski',
            hallName: 'Sala A',
            eventTypeName: 'Wesele',
            date: '2026-03-15',
            startTime: '14:00:00',
            endTime: '22:00:00',
            guests: { adults: 30, children: 10, toddlers: 5, total: 45 },
            package: { name: 'Pakiet Gold', description: 'Pełny pakiet' },
            courses: [
              {
                courseName: 'Przystawki',
                icon: null,
                dishes: [
                  { name: 'Carpaccio', description: null, portionSize: 1 },
                  { name: 'Tatar', description: 'Z polędwicy', portionSize: 1 },
                ],
                portionTarget: 'ADULTS_ONLY',
              },
            ],
            packagePrice: 150,
            totalMenuPrice: 6750,
          },
          {
            reservationId: 'res-2',
            clientName: 'Anna Nowak',
            hallName: null,
            eventTypeName: null,
            date: '2026-03-15',
            startTime: '18:00:00',
            endTime: null,
            guests: { adults: 10, children: 5, toddlers: 0, total: 15 },
            package: { name: 'Pakiet Basic', description: null },
            courses: [],
            packagePrice: 80,
            totalMenuPrice: 1200,
          },
        ],
      },
    ],
  };
}

function createSummaryReport(): MenuPreparationsReport {
  return {
    summary: createBaseSummary(),
    filters: { dateFrom: '2026-03-01', dateTo: '2026-03-31', view: 'summary' },
    days: [],
    summaryDays: [
      {
        date: '2026-03-15',
        dateLabel: 'Sobota, 15 marca 2026',
        totalReservations: 2,
        totalGuests: 60,
        courses: [
          {
            courseName: 'Przystawki',
            icon: null,
            dishes: [
              {
                dishName: 'Carpaccio',
                totalPortions: 40,
                adultPortions: 30,
                childrenPortions: 10,
                portionTarget: 'ADULTS_ONLY',
                reservations: [
                  { id: 'res-1', clientName: 'Jan Kowalski', guests: 45 },
                  { id: 'res-2', clientName: 'Anna Nowak', guests: 15 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('exportMenuPreparationsToExcel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock sheet state
    Object.assign(mockSheet, createMockSheet());
  });

  describe('ogólne', () => {
    it('powinno zwrócić Buffer', async () => {
      const report = createDetailedReport();
      const result = await exportMenuPreparationsToExcel(report);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('powinno wywołać writeBuffer', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      expect(mockWriteBuffer).toHaveBeenCalled();
    });
  });

  describe('detailed view', () => {
    it('powinno ustawić tytuł widoku szczegółowego', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      expect(mockMergeCellsCalls).toContain('A1:E1');
      expect(mockCells['A1'].value).toContain('Widok szczegółowy');
    });

    it('powinno dodać wiersz z filtrem okresu', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const periodRow = mockRows.find(r => r.values && r.values[0] === 'Okres:');
      expect(periodRow).toBeDefined();
      expect(periodRow.values[1]).toContain('2026-03-01');
    });

    it('powinno wyrenderować KPI summary z liczbami gości', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const kpiRow = mockRows.find(r => r.values && r.values[0] === 'Rezerwacje z menu');
      expect(kpiRow).toBeDefined();
      expect(kpiRow.values[1]).toBe(5);

      const adultsRow = mockRows.find(r => r.values && r.values[0] === 'Dorośli');
      expect(adultsRow).toBeDefined();
      expect(adultsRow.values[1]).toBe(80);
    });

    it('powinno wyrenderować nagłówek SZCZEGÓŁY WG DNI', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const header = mockRows.find(r => r.values && r.values[0] === 'SZCZEGÓŁY WG DNI');
      expect(header).toBeDefined();
    });

    it('powinno wyrenderować wiersz dnia z datą i liczbami', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const dayRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Sobota, 15 marca 2026'),
      );
      expect(dayRow).toBeDefined();
    });

    it('powinno wyrenderować rezerwację z klientem i salą', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const resRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Jan Kowalski'),
      );
      expect(resRow).toBeDefined();
      expect(resRow.values[1]).toBe('Sala A');
    });

    it('powinno wyrenderować kurs z portionTarget', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const courseRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Przystawki'),
      );
      expect(courseRow).toBeDefined();
    });

    it('powinno wyrenderować dania w kursie', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const dishRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Carpaccio'),
      );
      expect(dishRow).toBeDefined();
    });

    it('powinno wyrenderować "(brak dań w menu)" gdy brak kursów', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      // Second reservation has 0 courses
      const emptyRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('brak dań w menu'),
      );
      expect(emptyRow).toBeDefined();
    });

    it('powinno obsłużyć rezerwację bez czasu zakończenia', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      // Anna Nowak has endTime=null, startTime should show only start
      const resRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Anna Nowak'),
      );
      expect(resRow).toBeDefined();
      // Time column should have start time only
      expect(resRow.values[2]).toBe('18:00');
    });

    it('powinno wyświetlić czas w formacie HH:MM – HH:MM', async () => {
      const report = createDetailedReport();
      await exportMenuPreparationsToExcel(report);

      const resRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Jan Kowalski'),
      );
      expect(resRow.values[2]).toContain('14:00');
    });
  });

  describe('summary view', () => {
    it('powinno ustawić tytuł widoku zbiorczego', async () => {
      const report = createSummaryReport();
      await exportMenuPreparationsToExcel(report);

      expect(mockCells['A1'].value).toContain('Widok zbiorczy');
    });

    it('powinno wyrenderować nagłówek ZESTAWIENIE ZBIORCZE', async () => {
      const report = createSummaryReport();
      await exportMenuPreparationsToExcel(report);

      const header = mockRows.find(r => r.values && r.values[0] === 'ZESTAWIENIE ZBIORCZE');
      expect(header).toBeDefined();
    });

    it('powinno wyrenderować wiersz dnia z sumą rezerwacji i gości', async () => {
      const report = createSummaryReport();
      await exportMenuPreparationsToExcel(report);

      const dayRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Sobota, 15 marca 2026'),
      );
      expect(dayRow).toBeDefined();
    });

    it('powinno wyrenderować kurs w widoku zbiorczym', async () => {
      const report = createSummaryReport();
      await exportMenuPreparationsToExcel(report);

      const courseRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Przystawki'),
      );
      expect(courseRow).toBeDefined();
    });

    it('powinno wyrenderować nagłówki kolumn (Danie, Porcje, itd.)', async () => {
      const report = createSummaryReport();
      await exportMenuPreparationsToExcel(report);

      const colRow = mockRows.find(r => r.values && r.values[0] === '  Danie');
      expect(colRow).toBeDefined();
    });

    it('powinno wyrenderować danie ze statystykami porcji', async () => {
      const report = createSummaryReport();
      await exportMenuPreparationsToExcel(report);

      const dishRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Carpaccio'),
      );
      expect(dishRow).toBeDefined();
      expect(dishRow.values[1]).toBe(40); // totalPortions
      expect(dishRow.values[2]).toBe(30); // adultPortions
      expect(dishRow.values[3]).toBe(10); // childrenPortions
    });

    it('powinno wyrenderować listę klientów z liczbą gości', async () => {
      const report = createSummaryReport();
      await exportMenuPreparationsToExcel(report);

      const dishRow = mockRows.find(r =>
        r.values && typeof r.values[0] === 'string' && r.values[0].includes('Carpaccio'),
      );
      expect(dishRow.values[4]).toContain('Jan Kowalski');
      expect(dishRow.values[4]).toContain('Anna Nowak');
    });
  });

  describe('empty data handling', () => {
    it('powinno obsłużyć raport bez dni (detailed view)', async () => {
      const report = createDetailedReport();
      report.days = [];
      const result = await exportMenuPreparationsToExcel(report);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('powinno obsłużyć raport bez summaryDays (summary view)', async () => {
      const report = createSummaryReport();
      report.summaryDays = [];
      const result = await exportMenuPreparationsToExcel(report);

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
