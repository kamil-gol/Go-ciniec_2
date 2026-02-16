# Reports Module - Comprehensive Documentation

**Created:** 16.02.2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [API Reference](#api-reference)
5. [Frontend Implementation](#frontend-implementation)
6. [Data Models](#data-models)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Moduł **Reports** dostarcza kompleksową analitykę finansową i operacyjną dla systemu rezerwacji. Umożliwia generowanie raportów przychodów, analizę zajętości sal oraz eksport danych do Excel i PDF.

### Key Statistics

- **Backend:** 2 serwisy, 1 controller, 6 endpointów
- **Frontend:** 1 strona, 3 hooki custom, kompletny UI z filtrami
- **Funkcjonalności:** Przychody, Zajętość, Excel, PDF
- **Kod:** ~1200 linii TypeScript (backend + frontend)

---

## Features

### 💰 Revenue Report (Raport Przychodów)

**Metryki:**
- **Łączny przychód** - suma wszystkich zrealizowanych rezerwacji
- **Średnia/rezerwację** - średni przychód z jednej rezerwacji
- **Wzrost vs okres wcześniej** - procentowa zmiana względem poprzedniego okresu
- **Najlepszy dzień** - data z najwyższym przychodem
- **Oczekujący przychód** - suma z niezrealizowanych rezerwacji

**Breakdown:**
- Grupowanie: dzień, tydzień, miesiąc, rok
- Dla każdego okresu: przychód, liczba rezerwacji, średnia

**Rankingi:**
- **Wg sali** - która sala generuje najwięcej przychodu
- **Wg typu wydarzenia** - które eventy są najbardziej dochodowe

**Filtry:**
- Zakres dat (`dateFrom`, `dateTo`)
- Sala (`hallId`)
- Typ wydarzenia (`eventTypeId`)
- Grupowanie (`groupBy`)

### 🏢 Occupancy Report (Raport Zajętości)

**Metryki:**
- **Średnia zajętość** - procent zajętości wszystkich sal
- **Najlepszy dzień tygodnia** - który dzień ma najwyższą frekwencję
- **Najpopularniejsza sala** - sala z najwyższym wykorzystaniem
- **Łącznie rezerwacji** - całkowita liczba rezerwacji w okresie

**Ranking sal:**
- Zajętość % (liczba dni z rezerwacją / dni w okresie)
- Liczba rezerwacji
- Średnia liczba gości

**Peak Analysis:**
- **Peak Hours** - najbardziej popularne godziny rozpoczęcia rezerwacji
- **Peak Days of Week** - ranking dni tygodnia (PN-ND)

**Filtry:**
- Zakres dat (`dateFrom`, `dateTo`)
- Sala (`hallId`)

### 📊 Export Features

**Excel Export:**
- Format: `.xlsx` (ExcelJS)
- Zawartość:
  - Arkusz 1: Podsumowanie (Summary)
  - Arkusz 2: Szczegółowe dane (Details)
  - Formatowanie: nagłówki, wycentrowanie, bold
  - Polskie nazwy kolumn

**PDF Export:**
- Format: A4, portrait
- Zawartość:
  - Nagłówek z logo i datą generowania
  - Podsumowanie metryk
  - Tabele z danymi
  - Obsługa polskich znaków (DejaVu fonts)

---

## Architecture

### Tech Stack

**Backend:**
```
Node.js + Express + TypeScript
Prisma ORM
ExcelJS (xlsx generation)
PDFKit (pdf generation)
```

**Frontend:**
```
Next.js 14 (App Router)
React 18 + TypeScript
TanStack Query (data fetching)
Tailwind CSS + Shadcn UI
```

### File Structure

```
apps/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── reports.controller.ts       # HTTP layer
│   │   ├── services/
│   │   │   └── reports.service.ts          # Business logic
│   │   ├── types/
│   │   │   └── reports.types.ts            # TypeScript types
│   │   └── routes/
│   │       └── reports.routes.ts           # Route definitions
│   └── ...
│
└── frontend/
    ├── app/dashboard/reports/
    │   └── page.tsx                    # Main reports page
    ├── hooks/
    │   └── use-reports.ts              # Data fetching + export
    └── types/
        └── reports.types.ts            # Frontend types
```

### Data Flow

```
[Frontend UI]
     ↓
[TanStack Query Hook]
     ↓
[GET /api/reports/*]
     ↓
[Reports Controller]
     ↓
[Reports Service]
     ↓
[Prisma ORM]
     ↓
[PostgreSQL]
```

---

## API Reference

### Revenue Endpoints

#### GET `/api/reports/revenue`

Pobiera raport przychodów.

**Query Parameters:**
```typescript
{
  dateFrom: string;        // ISO date, required
  dateTo: string;          // ISO date, required
  groupBy?: 'day' | 'week' | 'month' | 'year';  // default: 'month'
  hallId?: string;         // optional, UUID
  eventTypeId?: string;    // optional, UUID
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    summary: {
      totalRevenue: number;
      avgRevenuePerReservation: number;
      totalReservations: number;
      completedReservations: number;
      growthPercent: number;
      maxRevenueDay: string;        // YYYY-MM-DD
      maxRevenueDayAmount: number;
      pendingRevenue: number;
    },
    breakdown: Array<{
      period: string;
      revenue: number;
      count: number;
      avgRevenue: number;
    }>,
    byHall: Array<{
      hallId: string;
      hallName: string;
      revenue: number;
      count: number;
    }>,
    byEventType: Array<{
      eventTypeId: string;
      eventTypeName: string;
      revenue: number;
      count: number;
    }>
  }
}
```

**Example:**
```bash
curl "http://localhost:3001/api/reports/revenue?dateFrom=2026-01-01&dateTo=2026-12-31&groupBy=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### GET `/api/reports/revenue/excel`

Generuje plik Excel z raportem przychodów.

**Query Parameters:** Takie same jak `/revenue`

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="raport_przychody_YYYY-MM-DD.xlsx"`

**Example:**
```bash
curl "http://localhost:3001/api/reports/revenue/excel?dateFrom=2026-01-01&dateTo=2026-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o raport.xlsx
```

---

#### GET `/api/reports/revenue/pdf`

Generuje plik PDF z raportem przychodów.

**Query Parameters:** Takie same jak `/revenue`

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="raport_przychody_YYYY-MM-DD.pdf"`

---

### Occupancy Endpoints

#### GET `/api/reports/occupancy`

Pobiera raport zajętości sal.

**Query Parameters:**
```typescript
{
  dateFrom: string;    // ISO date, required
  dateTo: string;      // ISO date, required
  hallId?: string;     // optional, UUID
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    summary: {
      avgOccupancy: number;       // percent
      peakDay: string;            // day name (Monday, Tuesday, ...)
      peakHall: string;           // hall name
      totalReservations: number;
      totalDaysInPeriod: number;
    },
    halls: Array<{
      hallId: string;
      hallName: string;
      occupancy: number;          // percent
      reservations: number;
      avgGuestsPerReservation: number;
    }>,
    peakHours: Array<{
      hour: number;               // 0-23
      count: number;
    }>,
    peakDaysOfWeek: Array<{
      dayOfWeek: string;          // Monday, Tuesday, ...
      dayOfWeekNum: number;       // 1-7
      count: number;
    }>
  }
}
```

---

#### GET `/api/reports/occupancy/excel`

Generuje plik Excel z raportem zajętości.

**Query Parameters:** Takie same jak `/occupancy`

---

#### GET `/api/reports/occupancy/pdf`

Generuje plik PDF z raportem zajętości.

**Query Parameters:** Takie same jak `/occupancy`

---

## Frontend Implementation

### useRevenueReport Hook

```typescript
import { useRevenueReport } from '@/hooks/use-reports';
import type { RevenueReportFilters } from '@/types/reports.types';

function RevenueReportPage() {
  const filters: RevenueReportFilters = {
    dateFrom: '2026-01-01',
    dateTo: '2026-12-31',
    groupBy: 'month'
  };
  
  const { data, isLoading, isError } = useRevenueReport(filters, true);
  
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;
  
  return (
    <div>
      <h1>Łączny przychód: {data.summary.totalRevenue} zł</h1>
      {/* ... */}
    </div>
  );
}
```

### useOccupancyReport Hook

```typescript
import { useOccupancyReport } from '@/hooks/use-reports';
import type { OccupancyReportFilters } from '@/types/reports.types';

function OccupancyReportPage() {
  const filters: OccupancyReportFilters = {
    dateFrom: '2026-01-01',
    dateTo: '2026-12-31'
  };
  
  const { data, isLoading } = useOccupancyReport(filters, true);
  
  return (
    <div>
      <h1>Średnia zajętość: {data.summary.avgOccupancy}%</h1>
      {/* ... */}
    </div>
  );
}
```

### Export Functions

```typescript
import {
  exportRevenueExcel,
  exportRevenuePDF,
  exportOccupancyExcel,
  exportOccupancyPDF
} from '@/hooks/use-reports';

function ExportButtons() {
  const filters = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };
  
  return (
    <div>
      <button onClick={() => exportRevenueExcel(filters)}>
        Eksport Excel (Przychody)
      </button>
      <button onClick={() => exportRevenuePDF(filters)}>
        Eksport PDF (Przychody)
      </button>
      <button onClick={() => exportOccupancyExcel(filters)}>
        Eksport Excel (Zajętość)
      </button>
      <button onClick={() => exportOccupancyPDF(filters)}>
        Eksport PDF (Zajętość)
      </button>
    </div>
  );
}
```

---

## Data Models

### TypeScript Types

```typescript
// apps/backend/src/types/reports.types.ts

export type GroupByPeriod = 'day' | 'week' | 'month' | 'year';

export interface RevenueReportFilters {
  dateFrom: string;
  dateTo: string;
  groupBy?: GroupByPeriod;
  hallId?: string;
  eventTypeId?: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  avgRevenuePerReservation: number;
  totalReservations: number;
  completedReservations: number;
  growthPercent: number;
  maxRevenueDay: string;
  maxRevenueDayAmount: number;
  pendingRevenue: number;
}

export interface RevenueBreakdownItem {
  period: string;
  revenue: number;
  count: number;
  avgRevenue: number;
}

export interface RevenueByEntity {
  hallId?: string;
  hallName?: string;
  eventTypeId?: string;
  eventTypeName?: string;
  revenue: number;
  count: number;
}

export interface RevenueReportData {
  summary: RevenueSummary;
  breakdown: RevenueBreakdownItem[];
  byHall: RevenueByEntity[];
  byEventType: RevenueByEntity[];
}

export interface OccupancyReportFilters {
  dateFrom: string;
  dateTo: string;
  hallId?: string;
}

export interface OccupancySummary {
  avgOccupancy: number;
  peakDay: string;
  peakHall: string;
  totalReservations: number;
  totalDaysInPeriod: number;
}

export interface HallOccupancy {
  hallId: string;
  hallName: string;
  occupancy: number;
  reservations: number;
  avgGuestsPerReservation: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

export interface PeakDayOfWeek {
  dayOfWeek: string;
  dayOfWeekNum: number;
  count: number;
}

export interface OccupancyReportData {
  summary: OccupancySummary;
  halls: HallOccupancy[];
  peakHours: PeakHour[];
  peakDaysOfWeek: PeakDayOfWeek[];
}
```

---

## Examples

### Przykład 1: Revenue Report (miesięczny)

**Request:**
```bash
GET /api/reports/revenue?dateFrom=2026-01-01&dateTo=2026-12-31&groupBy=month
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 114700,
      "avgRevenuePerReservation": 19116.67,
      "totalReservations": 6,
      "completedReservations": 1,
      "growthPercent": 0,
      "maxRevenueDay": "2026-02-20",
      "maxRevenueDayAmount": 35350,
      "pendingRevenue": 79350
    },
    "breakdown": [
      { "period": "2026-02", "revenue": 35350, "count": 1, "avgRevenue": 35350 },
      { "period": "2026-03", "revenue": 18000, "count": 1, "avgRevenue": 18000 },
      { "period": "2026-04", "revenue": 7400, "count": 1, "avgRevenue": 7400 },
      { "period": "2026-05", "revenue": 9600, "count": 1, "avgRevenue": 9600 },
      { "period": "2026-06", "revenue": 26850, "count": 1, "avgRevenue": 26850 },
      { "period": "2026-08", "revenue": 17500, "count": 1, "avgRevenue": 17500 }
    ],
    "byHall": [
      { "hallId": "uuid1", "hallName": "Sala Główna", "revenue": 35350, "count": 1 }
    ],
    "byEventType": [
      { "eventTypeId": "uuid2", "eventTypeName": "Wesele", "revenue": 35350, "count": 1 }
    ]
  }
}
```

### Przykład 2: Occupancy Report

**Request:**
```bash
GET /api/reports/occupancy?dateFrom=2026-01-01&dateTo=2026-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "avgOccupancy": 2,
      "peakDay": "Thursday",
      "peakHall": "Sala Główna",
      "totalReservations": 6,
      "totalDaysInPeriod": 365
    },
    "halls": [
      {
        "hallId": "uuid1",
        "hallName": "Sala Główna",
        "occupancy": 2,
        "reservations": 6,
        "avgGuestsPerReservation": 99
      }
    ],
    "peakHours": [
      { "hour": 14, "count": 6 }
    ],
    "peakDaysOfWeek": [
      { "dayOfWeek": "Thursday", "dayOfWeekNum": 4, "count": 2 },
      { "dayOfWeek": "Wednesday", "dayOfWeekNum": 3, "count": 1 },
      { "dayOfWeek": "Saturday", "dayOfWeekNum": 6, "count": 1 },
      { "dayOfWeek": "Sunday", "dayOfWeekNum": 0, "count": 1 },
      { "dayOfWeek": "Friday", "dayOfWeekNum": 5, "count": 1 }
    ]
  }
}
```

### Przykład 3: Filtrowanie po sali

**Request:**
```bash
GET /api/reports/revenue?dateFrom=2026-01-01&dateTo=2026-12-31&hallId=uuid1&groupBy=month
```

Zwróci tylko dane dla sali o podanym UUID.

---

## Troubleshooting

### Problem 1: Brak danych w raporcie

**Objaw:** `breakdown: []`, `byHall: []`

**Przyczyny:**
1. Brak rezerwacji w podanym zakresie dat
2. Wszystkie rezerwacje mają status inny niż PENDING/CONFIRMED/COMPLETED
3. Błędny format daty (`dateFrom`/`dateTo`)

**Rozwiązanie:**
```typescript
// Sprawdź format dat
const dateFrom = '2026-01-01'; // poprawny
const dateTo = '2026-12-31';   // poprawny

// Sprawdź w bazie danych
SELECT * FROM "Reservation" 
WHERE "startDateTime" BETWEEN '2026-01-01' AND '2026-12-31'
AND status IN ('PENDING', 'CONFIRMED', 'COMPLETED');
```

### Problem 2: Excel nie pobiera się

**Objaw:** Błąd 500 lub plik nie rozpoczyna pobierania

**Przyczyny:**
1. Brak zainstalowanego `exceljs` w backend
2. Błędne nagłówki response

**Rozwiązanie:**
```bash
# Backend - zainstaluj exceljs
cd apps/backend
npm install exceljs

# Restart backend
docker-compose restart backend
```

### Problem 3: Polskie znaki w PDF wyświetlają się jako `?`

**Objaw:** Znaki `ą`, `ę`, `ł`, `ó` renderowane jako `?` w PDF

**Przyczyny:**
1. Brak fontów DejaVu w backend container
2. PDFKit nie używa custom fontów

**Rozwiązanie:**
```dockerfile
# Dockerfile backend
RUN apt-get update && \
    apt-get install -y fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*
```

### Problem 4: `groupBy=week` - dziwne numery tygodni

**Objaw:** Breakdown pokazuje `2026-W05` zamiast czytelnej nazwy

**Wyjaśnienie:** To poprawne zachowanie - ISO 8601 week format.

**Jak czytać:**
- `2026-W05` = tydzień 5 roku 2026
- `2026-W52` = ostatni tydzień roku 2026

### Problem 5: Unicode escapes w frontendzie

**Objaw:** Tekst wyświetla się jako `\u0105` zamiast `ą`

**Rozwiązanie:** Zostało naprawione globalnie 16.02.2026. Jeśli problem występuje w nowych plikach:

```bash
cd /home/kamil/rezerwacje

# Napraw Unicode w pojedynczym pliku
sed -i \
  -e 's/\\u0105/ą/g' \
  -e 's/\\u0119/ę/g' \
  -e 's/\\u0142/ł/g' \
  plik.tsx
```

---

## Performance Notes

### Database Queries

**Revenue Report:**
- 1 query dla summary + breakdown
- 1 query dla byHall ranking
- 1 query dla byEventType ranking
- **Total:** 3 queries

**Occupancy Report:**
- 1 query dla halls + summary
- 1 query dla peak hours
- 1 query dla peak days
- **Total:** 3 queries

### Caching Strategy

Frontend używa TanStack Query z:
- `staleTime: 5 * 60 * 1000` (5 minut)
- `cacheTime: 10 * 60 * 1000` (10 minut)

To oznacza:
- Dane są "fresh" przez 5 minut
- Potem refetch w tle przy następnym użyciu
- Cache trzymany przez 10 minut

### Excel/PDF Generation Time

- **Small datasets** (<50 records): ~100-200ms
- **Medium datasets** (50-500 records): ~500ms-1s
- **Large datasets** (500+ records): ~1-3s

---

## Future Enhancements

### Planned Features

1. **Charts & Visualizations**
   - Line charts dla trendów przychodów
   - Bar charts dla rankingów sal
   - Pie charts dla udziału typów wydarzeń

2. **Advanced Filters**
   - Porównanie wielu periodów
   - Filtrowanie po statusie rezerwacji
   - Filtrowanie po source (online/phone/walk-in)

3. **Scheduled Reports**
   - Automatyczne generowanie raportów (daily/weekly/monthly)
   - Email delivery
   - Cloud storage integration

4. **Real-time Updates**
   - WebSocket dla live metrics
   - Auto-refresh dashboard

5. **More Export Formats**
   - CSV export
   - JSON export (dla API integration)
   - Power BI / Tableau connectors

---

## Changelog

### v1.0.0 (16.02.2026)

**Added:**
- Revenue report z pełną analityką finansową
- Occupancy report z analizą zajętości sal
- Excel export (ExcelJS)
- PDF export (PDFKit)
- Frontend UI z filtrami i presetami dat
- TanStack Query hooks
- Pełna polonizacja

**Fixed:**
- Unicode escapes → UTF-8 (globalnie we frontendzie)
- Polskie czcionki w PDF (DejaVu)

---

## Contributors

- **Kamil Gołębiowski** ([@kamil-gol](https://github.com/kamil-gol)) - Architecture, Backend, Frontend

---

## License

Private project

---

**Last updated:** 16.02.2026, 20:12 CET
