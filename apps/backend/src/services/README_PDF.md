# PDF Generation Service — Premium Redesign (#157)

## Overview

Centralized PDF generation service powering all document exports in the system.
Uses **pdfkit** as the rendering engine with a shared set of premium helpers
(navy header banner, gold accents, compact tables, info boxes, inline footers)
to produce consistent, professional A4 documents in Polish.

Restaurant branding is loaded dynamically from **CompanySettings** (DB) on
every generation call, with `.env` fallbacks.

## Supported PDF Types

| # | Type | Public Method | Interface | Source |
|---|------|--------------|-----------|--------|
| 1 | Reservation confirmation | `generateReservationPDF()` | `ReservationPDFData` | pdf.service.ts |
| 2 | Payment confirmation | `generatePaymentConfirmationPDF()` | `PaymentConfirmationData` | pdf.service.ts |
| 3 | Menu card | `generateMenuCardPDF()` | `MenuCardPDFData` | pdf.service.ts |
| 4 | Revenue report | `generateRevenueReportPDF()` | `RevenueReportPDFData` | pdf.service.ts |
| 5 | Occupancy report | `generateOccupancyReportPDF()` | `OccupancyReportPDFData` | pdf.service.ts |

All methods return `Promise<Buffer>` — raw PDF bytes ready to stream or attach.

## Architecture

```
Controller / Service
        │
        ▼
┌──────────────────────────────┐
│   pdf.service.ts             │
│                              │
│  ┌────────────────────────┐  │
│  │  Shared Premium Helpers│  │
│  │  ───────────────────── │  │
│  │  drawHeaderBanner()    │  │
│  │  drawSectionHeader()   │  │
│  │  drawInfoBox()         │  │
│  │  drawCompactTable()    │  │
│  │  drawSeparator()       │  │
│  │  drawInlineFooter()    │  │
│  │  safePageBreak()       │  │
│  │  translateDayOfWeek()  │  │
│  └────────────────────────┘  │
│                              │
│  ┌─────────┐ ┌────────────┐  │
│  │Reserv.  │ │Payment     │  │
│  │Builder  │ │Confirm.    │  │
│  └─────────┘ └────────────┘  │
│  ┌─────────┐ ┌────────────┐  │
│  │Menu Card│ │Reports     │  │
│  │Builder  │ │(Rev + Occ) │  │
│  └─────────┘ └────────────┘  │
└──────────────────────────────┘
        ▲
        │
┌──────────────────────────────┐
│  reports-export.service.ts   │
│  (delegates PDF to above,    │
│   keeps Excel generation)    │
└──────────────────────────────┘
```

## Premium Design System

### Color Palette (`COLORS`)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1a2332` | Header banner, body text |
| `primaryLight` | `#2c3e50` | Section headers, table headers |
| `accent` | `#c8a45a` | Gold accent bars, separators |
| `success` | `#27ae60` | Paid / confirmed badges |
| `warning` | `#f39c12` | Pending badges |
| `danger` | `#e74c3c` | Cancelled badges |
| `info` | `#3498db` | Reserved badge, report badge |
| `textDark` | `#1a2332` | Primary body text |
| `textMuted` | `#7f8c8d` | Secondary / meta text |
| `textLight` | `#bdc3c7` | Disabled / footer text |
| `border` | `#dce1e8` | Table borders, separators |
| `bgLight` | `#f4f6f9` | Alternating rows, info boxes |
| `allergen` | `#e67e22` | Allergen labels |
| `purple` | `#8e44ad` | Extras / optional items |

### Shared Helpers

- **`drawHeaderBanner(doc, badgeLabel?, badgeColor?)`** — 65px navy banner with gold accent line, restaurant name + contact, optional status badge (top-right rounded rect).
- **`drawSectionHeader(doc, title, left, pageWidth)`** — Bold 11pt section title.
- **`drawInfoBox(doc, title, x, y, width, lines[])`** — Box with `bgLight` background, 3px gold accent bar, muted title, and content lines.
- **`drawCompactTable(doc, headers, rows, colWidths, startX)`** — Navy header row, alternating row backgrounds, auto page-break.
- **`drawSeparator(doc, left, width)`** — 0.5pt horizontal border line.
- **`drawInlineFooter(doc, left, pageWidth)`** — Thank-you message + auto-generation notice.
- **`safePageBreak(doc, minSpace)`** — Adds new page if remaining space < `minSpace`.
- **`translateDayOfWeek(day)`** — English → Polish day name translation.

### Fonts

The service tries to load **DejaVuSans** (regular + bold) for full Polish character
support. Falls back to Helvetica if fonts are not found.

Font search paths:
```
/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
/usr/share/fonts/dejavu/DejaVuSans.ttf
./fonts/DejaVuSans.ttf
```

## PDF Type Details

### 1. Reservation Confirmation

Sections: Header banner (status badge) → Title + meta → Two-column (Client | Event) →
Menu table (snapshot or legacy) → Extras inline chips → Financial summary box
(with deposit badge) → Notes → Footer.

**Status badges:**

| Status | Label | Color |
|--------|-------|-------|
| RESERVED | REZERWACJA | Blue |
| PENDING | OCZEKUJACA | Orange |
| CONFIRMED | POTWIERDZONA | Green |
| COMPLETED | ZAKONCZONA | Gray |
| CANCELLED | ANULOWANA | Red |

**Endpoint:** `GET /api/reservations/:id/pdf`

### 2. Payment Confirmation

Sections: Header banner ("OPLACONA" green badge) → Title → Two-column
(Client | Payment details) → Full-width reservation info box →
Financial summary (total → deposit → remaining) → Footer.

**Endpoint:** `GET /api/deposits/:id/confirmation-pdf`

### 3. Menu Card

Sections: Header banner ("KARTA MENU" gold badge) → Template title + event type →
Per-package: navy header box with price + optional badge (POPULARNY/POLECANY),
course tables (dish name, description, allergens), required options,
optional extras → Legend box → Footer.

**Endpoint:** `GET /api/menu-templates/:id/pdf`

### 4. Revenue Report

Sections: Header banner ("RAPORT" blue badge) → Title + period/groupBy meta →
Summary info box (total, avg, count, growth%, extras) →
Breakdown by period table → By hall table → By event type table →
By service item table (purple header) → Footer.

**Endpoint:** `GET /api/reports/revenue/export?format=pdf`

### 5. Occupancy Report

Sections: Header banner ("RAPORT" blue badge) → Title + period meta →
Summary info box (avg occupancy, peak day/hall, total reservations) →
Halls ranking table → Peak hours table → Peak days of week table → Footer.

**Endpoint:** `GET /api/reports/occupancy/export?format=pdf`

## Exported Interfaces

From `pdf.service.ts`:

```typescript
export interface MenuCardPDFData { ... }
export interface RevenueReportPDFData { ... }
export interface OccupancyReportPDFData { ... }
```

Internal (not exported): `ReservationPDFData`, `PaymentConfirmationData`,
`RestaurantData`, `MenuSnapshot`, `MenuData`, etc.

## Usage Examples

### Backend — Direct Service Usage

```typescript
import { pdfService } from './services/pdf.service';

// Reservation PDF
const pdfBuffer = await pdfService.generateReservationPDF(reservationData);

// Payment confirmation PDF
const confirmBuffer = await pdfService.generatePaymentConfirmationPDF(paymentData);

// Menu card PDF
const menuBuffer = await pdfService.generateMenuCardPDF(menuCardData);

// Revenue report PDF
const revenueBuffer = await pdfService.generateRevenueReportPDF(revenueData);

// Occupancy report PDF
const occupancyBuffer = await pdfService.generateOccupancyReportPDF(occupancyData);
```

### Reports — via reports-export.service.ts

```typescript
import reportsExportService from './services/reports-export.service';

// These delegate to pdfService internally
const revenuePdf = await reportsExportService.exportRevenueToPDF(report);
const occupancyPdf = await reportsExportService.exportOccupancyToPDF(report);

// Excel exports remain in reports-export.service.ts
const revenueXlsx = await reportsExportService.exportRevenueToExcel(report);
const occupancyXlsx = await reportsExportService.exportOccupancyToExcel(report);
```

### Frontend — Download PDF (Axios)

```typescript
const downloadPDF = async (url: string, filename: string) => {
  const response = await axios.get(url, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
  });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

## File Structure

```
apps/backend/src/
├── services/
│   ├── pdf.service.ts              # All PDF generation (5 types)
│   ├── reports-export.service.ts   # Excel exports + PDF delegation
│   ├── company-settings.service.ts # Restaurant branding from DB
│   └── README_PDF.md               # This documentation
├── controllers/
│   ├── reservation.controller.ts   # downloadPDF()
│   ├── deposit.controller.ts       # downloadConfirmationPDF()
│   ├── menu-template.controller.ts # downloadMenuCardPDF()
│   └── reports.controller.ts       # exportRevenue/Occupancy (PDF+Excel)
└── routes/
    ├── reservation.routes.ts
    ├── deposit.routes.ts
    ├── menu-template.routes.ts
    └── reports.routes.ts
```

## Configuration

Restaurant data is loaded from **CompanySettings** (database) on every PDF
generation call via `refreshRestaurantData()`. Fallback values come from
environment variables:

```env
RESTAURANT_NAME=Gosciniec Rodzinny
RESTAURANT_ADDRESS=
RESTAURANT_PHONE=
RESTAURANT_EMAIL=
RESTAURANT_WEBSITE=
RESTAURANT_NIP=
```

## Dependencies

```json
{
  "dependencies": {
    "pdfkit": "^0.15.0",
    "exceljs": "^4.x"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.4"
  }
}
```

## Performance

- **Generation time:** ~50–150 ms per document
- **File size:** ~15–40 KB (depends on content density)
- **Memory usage:** ~2–5 MB peak during generation

## Limitations

1. **No logo image** — text-only header banner
2. **Single language** — Polish only
3. **No digital signature** — PDFs are not signed
4. **Font dependency** — DejaVuSans required for full Polish character support

## Future Enhancements

- [ ] Restaurant logo image in header banner
- [ ] Multi-language support
- [ ] Digital signature
- [ ] Custom templates per event type
- [ ] QR code with reservation/payment link
- [ ] Batch PDF generation
- [ ] PDF/A compliance for archival

---

**Last Updated:** 2026-02-26  
**Version:** 2.0.0 — Premium Redesign (#157)  
**Author:** System
