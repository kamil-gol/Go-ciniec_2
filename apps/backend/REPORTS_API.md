# Reports API Documentation

## Overview

The Reports API provides comprehensive analytics for revenue and occupancy tracking. All endpoints require JWT authentication.

**Base URL**: `/api/reports`

---

## Installation

### Required Dependencies

Install ExcelJS for Excel export functionality:

```bash
cd apps/backend
npm install exceljs@^4.4.0
# or
pnpm add exceljs@^4.4.0
```

PDFKit is already installed in the project.

---

## Endpoints

### 1. Revenue Report (JSON)

**Endpoint**: `GET /api/reports/revenue`

**Description**: Get comprehensive revenue analytics with breakdown by period, hall, and event type.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string | ✅ Yes | Start date (YYYY-MM-DD) |
| `dateTo` | string | ✅ Yes | End date (YYYY-MM-DD) |
| `groupBy` | string | ❌ No | Period aggregation: `day`, `week`, `month`, `year` (default: `month`) |
| `hallId` | UUID | ❌ No | Filter by specific hall |
| `eventTypeId` | UUID | ❌ No | Filter by event type |
| `status` | string | ❌ No | Filter by status: `CONFIRMED`, `COMPLETED` |

**Example Request**:

```bash
curl -X GET "http://localhost:3001/api/reports/revenue?dateFrom=2026-01-01&dateTo=2026-12-31&groupBy=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 245000,
      "avgRevenuePerReservation": 4900,
      "maxRevenueDay": "2026-05-15",
      "maxRevenueDayAmount": 12000,
      "growthPercent": 12,
      "totalReservations": 50,
      "completedReservations": 42,
      "pendingRevenue": 39200
    },
    "breakdown": [
      {
        "period": "2026-01",
        "revenue": 45000,
        "count": 9,
        "avgRevenue": 5000
      }
    ],
    "byHall": [
      {
        "hallId": "uuid",
        "hallName": "Sala Kryształowa",
        "revenue": 120000,
        "count": 25,
        "avgRevenue": 4800
      }
    ],
    "byEventType": [
      {
        "eventTypeId": "uuid",
        "eventTypeName": "Wesele",
        "revenue": 180000,
        "count": 36,
        "avgRevenue": 5000
      }
    ],
    "filters": {
      "dateFrom": "2026-01-01",
      "dateTo": "2026-12-31",
      "groupBy": "month"
    }
  }
}
```

---

### 2. Occupancy Report (JSON)

**Endpoint**: `GET /api/reports/occupancy`

**Description**: Get occupancy analytics with hall rankings, peak hours, and peak days.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string | ✅ Yes | Start date (YYYY-MM-DD) |
| `dateTo` | string | ✅ Yes | End date (YYYY-MM-DD) |
| `hallId` | UUID | ❌ No | Filter by specific hall |

**Example Request**:

```bash
curl -X GET "http://localhost:3001/api/reports/occupancy?dateFrom=2026-01-01&dateTo=2026-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "summary": {
      "avgOccupancy": 65.5,
      "peakDay": "Saturday",
      "peakHall": "Sala Kryształowa",
      "peakHallId": "uuid",
      "totalReservations": 240,
      "totalDaysInPeriod": 365
    },
    "halls": [
      {
        "hallId": "uuid",
        "hallName": "Sala Kryształowa",
        "occupancy": 75.5,
        "reservations": 120,
        "avgGuestsPerReservation": 85.5
      }
    ],
    "peakHours": [
      { "hour": 18, "count": 45 },
      { "hour": 19, "count": 42 }
    ],
    "peakDaysOfWeek": [
      { "dayOfWeek": "Saturday", "dayOfWeekNum": 6, "count": 80 },
      { "dayOfWeek": "Sunday", "dayOfWeekNum": 0, "count": 65 }
    ],
    "filters": {
      "dateFrom": "2026-01-01",
      "dateTo": "2026-12-31"
    }
  }
}
```

---

### 3. Export Revenue to Excel

**Endpoint**: `GET /api/reports/export/revenue/excel`

**Description**: Download revenue report as Excel (XLSX) file.

**Query Parameters**: Same as `/revenue` endpoint.

**Example Request**:

```bash
curl -X GET "http://localhost:3001/api/reports/export/revenue/excel?dateFrom=2026-01-01&dateTo=2026-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o raport_przychody.xlsx
```

**Response**: XLSX file download with filename `raport_przychody_2026-01-01_2026-12-31.xlsx`

---

### 4. Export Revenue to PDF

**Endpoint**: `GET /api/reports/export/revenue/pdf`

**Description**: Download revenue report as PDF file.

**Query Parameters**: Same as `/revenue` endpoint.

**Example Request**:

```bash
curl -X GET "http://localhost:3001/api/reports/export/revenue/pdf?dateFrom=2026-01-01&dateTo=2026-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o raport_przychody.pdf
```

**Response**: PDF file download with filename `raport_przychody_2026-01-01_2026-12-31.pdf`

---

### 5. Export Occupancy to Excel

**Endpoint**: `GET /api/reports/export/occupancy/excel`

**Description**: Download occupancy report as Excel (XLSX) file.

**Query Parameters**: Same as `/occupancy` endpoint.

**Example Request**:

```bash
curl -X GET "http://localhost:3001/api/reports/export/occupancy/excel?dateFrom=2026-01-01&dateTo=2026-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o raport_zajetosc.xlsx
```

**Response**: XLSX file download with filename `raport_zajetosc_2026-01-01_2026-12-31.xlsx`

---

### 6. Export Occupancy to PDF

**Endpoint**: `GET /api/reports/export/occupancy/pdf`

**Description**: Download occupancy report as PDF file.

**Query Parameters**: Same as `/occupancy` endpoint.

**Example Request**:

```bash
curl -X GET "http://localhost:3001/api/reports/export/occupancy/pdf?dateFrom=2026-01-01&dateTo=2026-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o raport_zajetosc.pdf
```

**Response**: PDF file download with filename `raport_zajetosc_2026-01-01_2026-12-31.pdf`

---

## Error Responses

### 400 Bad Request

**Invalid query parameters**:

```json
{
  "success": false,
  "message": "Invalid query parameters",
  "errors": [
    {
      "code": "invalid_string",
      "path": ["dateFrom"],
      "message": "Invalid date format (YYYY-MM-DD)"
    }
  ]
}
```

**Date range validation error**:

```json
{
  "success": false,
  "message": "dateFrom must be before or equal to dateTo"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to generate revenue report",
  "error": "Detailed error message"
}
```

---

## Usage Examples

### JavaScript Fetch

```javascript
// Get revenue report
const getRevenueReport = async () => {
  const response = await fetch(
    'http://localhost:3001/api/reports/revenue?' + new URLSearchParams({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      groupBy: 'month'
    }),
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data;
};

// Download Excel file
const downloadRevenueExcel = async () => {
  const response = await fetch(
    'http://localhost:3001/api/reports/export/revenue/excel?' + new URLSearchParams({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31'
    }),
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'raport_przychody.xlsx';
  a.click();
};
```

### TypeScript with Axios

```typescript
import axios from 'axios';

interface RevenueReportFilters {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  hallId?: string;
  eventTypeId?: string;
  status?: 'CONFIRMED' | 'COMPLETED';
}

const getRevenueReport = async (filters: RevenueReportFilters) => {
  const { data } = await axios.get('/api/reports/revenue', {
    params: filters,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return data.data;
};

const downloadRevenueExcel = async (filters: RevenueReportFilters) => {
  const { data } = await axios.get('/api/reports/export/revenue/excel', {
    params: filters,
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `raport_przychody_${filters.dateFrom}_${filters.dateTo}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

---

## Features

### Revenue Report
- ✅ Total revenue calculation
- ✅ Average revenue per reservation
- ✅ Growth percentage vs previous period
- ✅ Max revenue day identification
- ✅ Completed vs pending revenue split
- ✅ Breakdown by period (day/week/month/year)
- ✅ Rankings by hall and event type

### Occupancy Report
- ✅ Average occupancy percentage
- ✅ Peak day of week analysis
- ✅ Peak hour analysis (0-23)
- ✅ Hall rankings by occupancy
- ✅ Average guests per reservation
- ✅ Total reservations count

### Export
- ✅ Excel (XLSX) with formatting and styling
- ✅ PDF with professional layout
- ✅ Polish language support
- ✅ Dynamic filenames with date range
- ✅ Currency formatting (PLN)

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Obtain a token via the `/api/auth/login` endpoint.

---

## Rate Limiting

No rate limiting is currently implemented. Consider adding rate limiting for production use.

---

## Support

For issues or questions, contact the development team or create an issue in the repository.
