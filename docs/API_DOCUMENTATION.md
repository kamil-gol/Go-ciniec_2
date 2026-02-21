# 📚 Menu System API Documentation

**Version:** 1.3.0  
**Created:** 2026-02-10  
**Updated:** 2026-02-16 🆕 - Dodano Attachments API  
**Status:** ✅ Production Ready  

---

## 📏 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Postman Collection](#postman-collection)
4. [API Reference](#api-reference)
   - [Menu Templates](#menu-templates)
   - [Menu Packages](#menu-packages)
   - [Menu Options](#menu-options)
   - [Reservation Menu](#reservation-menu-selection)
   - [PDF Generation](#pdf-generation)
   - [Calendar API](#calendar-api)
   - **[Attachments API](#attachments-api)** 🆕
5. [Architecture](#architecture)
6. [Data Models](#data-models)

---

## 🎯 Overview

Menu System API provides complete restaurant menu management with:

- ✅ **Menu Templates** - Event-specific menus (Wedding, Birthday, Communion)
- ✅ **Menu Packages** - Pricing tiers with different service levels
- ✅ **Menu Options** - Add-on services (alcohol, entertainment, decorations)
- ✅ **Immutable Snapshots** - Price protection for reservations
- ✅ **Price History** - Complete audit trail of price changes
- ✅ **PDF Generator** - Detailed reservation confirmations
- ✅ **Calendar API** - Monthly reservation calendar data
- ✅ **Attachments API** - Polymorphic file attachments with RODO redirect 🆕

### Key Features

- **Type-Safe:** Full TypeScript with Zod validation
- **Immutable Pricing:** Snapshots protect against price changes
- **Price History:** Track all price modifications
- **Flexible Options:** Per-person, flat, or free pricing
- **Event-Specific:** Different menus for different event types
- **Date-Based Activation:** Seasonal menus with validity periods
- **PDF Downloads:** Professional reservation confirmations with menu details
- **Calendar View:** Monthly reservation data with hall filtering
- **File Attachments:** Upload, download, archive files per entity (Client, Reservation, Deposit) 🆕
- **RODO Redirect:** RODO documents auto-stored at client level regardless of upload context 🆕

---

## 🚀 Quick Start

### 1. Start Backend

```bash
cd /home/kamil/rezerwacje
docker compose up -d
```

### 2. Verify API

```bash
curl http://localhost:3001/api/health
```

### 3. Get Sample Data

```bash
# All menus
curl http://localhost:3001/api/menu-templates | jq

# All options
curl http://localhost:3001/api/menu-options | jq

# Wedding packages
curl 'http://localhost:3001/api/menu-packages/template/21067150-841a-4659-9e97-11ce5a4105ac' | jq

# Download reservation PDF
curl -X GET 'http://localhost:3001/api/reservations/{id}/pdf' \
  -H "Authorization: Bearer {token}" \
  -o reservation.pdf

# Calendar reservations
curl 'http://localhost:3001/api/calendar/reservations?year=2026&month=2' | jq

# List attachments for a client 🆕
curl 'http://localhost:3001/api/attachments?entityType=CLIENT&entityId={clientId}' \
  -H "Authorization: Bearer {token}" | jq
```

---

## 📦 Postman Collection

**🔗 Import URL:**
```
https://raw.githubusercontent.com/kamil-gol/Go-ciniec_2/main/docs/postman/Menu_System_API.postman_collection.json
```

**📚 Full Guide:** [Postman README](./postman/README.md)

### Quick Import

1. Open Postman
2. Click **Import** → **Link**
3. Paste URL above
4. Click **Import**

**Includes:**
- 23 ready-to-use requests (+1 PDF endpoint, +2 Calendar endpoints, +8 Attachment endpoints 🆕)
- Pre-filled variables with real IDs
- Example payloads
- Testing scenarios

---

## 📏 API Reference

### Base URL

```
http://localhost:3001/api
```

### Endpoints Summary

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| **Templates** | 7 | Admin for CUD |
| **Packages** | 7 | Admin for CUD |
| **Options** | 5 | Admin for CUD |
| **Reservations** | 4 | User/Admin |
| **PDF Generation** | 1 | User/Admin |
| **Calendar** | 2 | User/Admin |
| **Attachments** 🆕 | 8 | Staff+ |
| **Total** | **34** | Mixed |

---

## 🍛 Menu Templates

### List Templates

```http
GET /api/menu-templates
```

**Query Params:**
- `eventTypeId` - Filter by event type
- `isActive` - Filter by active status
- `date` - Filter by validity date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Menu Weselne Wiosna 2026",
      "eventType": {
        "id": "uuid",
        "name": "Wesele",
        "color": "#FF69B4"
      },
      "packages": [
        {
          "id": "uuid",
          "name": "Pakiet Złoty",
          "pricePerAdult": "300",
          "pricePerChild": "150"
        }
      ]
    }
  ],
  "count": 3
}
```

### Get Active Menu

```http
GET /api/menu-templates/active/:eventTypeId
```

Returns currently active template for event type (based on date).

### Create Template (ADMIN)

```http
POST /api/menu-templates
Content-Type: application/json

{
  "eventTypeId": "uuid",
  "name": "Menu Letnie 2026",
  "validFrom": "2026-07-01T00:00:00.000Z",
  "validTo": "2026-09-30T00:00:00.000Z",
  "isActive": true
}
```

---

## 📦 Menu Packages

### List Packages

```http
GET /api/menu-packages/template/:templateId
```

Returns all packages for specific template with options.

### Create Package (ADMIN)

```http
POST /api/menu-packages
Content-Type: application/json

{
  "menuTemplateId": "uuid",
  "name": "Pakiet VIP",
  "pricePerAdult": 500,
  "pricePerChild": 250,
  "pricePerToddler": 0,
  "includedItems": [
    "Menu 5-daniowe",
    "Open bar premium"
  ],
  "isPopular": true,
  "color": "#FFD700",
  "icon": "star"
}
```

### Update Package (ADMIN)

```http
PUT /api/menu-packages/:id
Content-Type: application/json

{
  "pricePerAdult": 550,
  "changeReason": "Sezonowa podwyżka cen"
}
```

**Note:** Price changes are logged in `MenuPriceHistory` table.

---

## ✨ Menu Options

### List Options

```http
GET /api/menu-options
```

**Query Params:**
- `category` - Filter by category
- `isActive` - Filter by active status
- `search` - Search in name/description

### Categories

- Alkohol
- Animacje
- Dekoracje
- Dodatki
- Dodatkowe
- Foto & Video
- Muzyka
- Rozrywka

### Create Option (ADMIN)

```http
POST /api/menu-options
Content-Type: application/json

{
  "name": "Fontanna czekoladowa",
  "category": "Dodatki",
  "priceType": "FLAT",
  "priceAmount": 350,
  "allowMultiple": false
}
```

**Price Types:**
- `FLAT` - Fixed price
- `PER_PERSON` - Price per guest
- `FREE` - No charge

---

## 🍽️ Reservation Menu Selection

### Select Menu

```http
POST /api/reservations/:id/select-menu
Content-Type: application/json

{
  "packageId": "uuid",
  "selectedOptions": [
    {
      "optionId": "uuid",
      "quantity": 1
    }
  ]
}
```

Creates immutable snapshot with current prices.

### Get Menu Snapshot

```http
GET /api/reservations/:id/menu
```

**Response includes:**
- Menu snapshot (immutable)
- Guest counts
- Complete price breakdown
- Total cost calculation

---

## 📄 PDF Generation

### Download Reservation PDF

```http
GET /api/reservations/:id/pdf
Authorization: Bearer {token}
```

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="rezerwacja_{id}.pdf"
Content-Length: {bytes}

[Binary PDF data]
```

### PDF Contents

Generated PDF includes:

#### 1. Restaurant Header
- Restaurant name
- Address, phone, email
- Website & NIP

#### 2. Reservation Details
- Reservation ID
- Generation date
- Status badge (color-coded)

#### 3. Client Information
- Full name
- Phone & email
- Address (if provided)

#### 4. Event Details
- Hall name (or "Reserved" status)
- Event type
- Date & time
- Guest breakdown:
  - Adults (18+)
  - Children (4-12)
  - Toddlers (0-3)

#### 5. Selected Menu
- **Package name**
- **Guest counts for menu:**
  - Number of adults
  - Number of children
  - Number of toddlers
- **Dishes grouped by category:**
  - Category name (e.g., "Przystawki (3)")
  - Quantity x Dish name
  - Allergens (if applicable)
- **Menu prices:**
  - Package price: XX,XX zł
  - Additional options: XX,XX zł
  - **Total menu: XX,XX zł** (bold)

#### 6. Cost Calculation
- Price per adult x count
- Price per child x count
- Price per toddler x count
- **TOTAL PRICE** (bold)

#### 7. Deposit Information
- Amount
- Due date
- Status (Paid/Unpaid)

#### 8. Footer
- Thank you message
- Auto-generated note

### Example Request

```bash
# Using curl
curl -X GET "http://localhost:3001/api/reservations/abc123/pdf" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -o "reservation_abc123.pdf"
```

### Features

✅ **Polish Character Support** - DejaVu fonts for proper display  
✅ **Professional Layout** - Clean hierarchy with proper spacing  
✅ **Color-Coded Status** - Visual badges for reservation status  
✅ **Complete Menu Details** - All dishes with quantities and allergens  
✅ **Price Breakdown** - Transparent cost calculation  
✅ **Allergen Information** - Safety for guests with allergies  
✅ **Immutable Data** - Uses menuSnapshot (prices won't change)  
✅ **Backward Compatible** - Works with old reservations without menu  

### Allergen Labels

```typescript
const ALLERGEN_LABELS = {
  gluten: 'Gluten',
  lactose: 'Laktoza',
  eggs: 'Jajka',
  nuts: 'Orzechy',
  fish: 'Ryby',
  soy: 'Soja',
  shellfish: 'Skorupiaki',
  peanuts: 'Orzeszki ziemne'
};
```

### Error Responses

```json
// 404 - Reservation not found
{
  "success": false,
  "error": "Reservation not found"
}

// 401 - Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 500 - PDF generation error
{
  "success": false,
  "error": "Failed to generate PDF"
}
```

### Technical Details

**Library:** PDFKit  
**Font:** DejaVu Sans (Polish characters)  
**Page Size:** A4  
**Margins:** 50px  
**Encoding:** UTF-8  

**Service Location:**
```
apps/backend/src/services/pdf.service.ts
```

**Controller Location:**
```
apps/backend/src/controllers/reservation.controller.ts
```

**Route:**
```typescript
router.get('/reservations/:id/pdf', downloadReservationPDF);
```

### Documentation

📚 **Full Guide:** [PDF Enhancement Session](./PDF_ENHANCEMENT_SESSION_2026-02-11.md)

---

## 📅 Calendar API

Dedykowane endpointy do widoku kalendarza rezerwacji.

**Dokumentacja sesji:** [Calendar View 2026-02-15](./CALENDAR_VIEW_2026-02-15.md)

### GET `/api/calendar/reservations`

Pobiera rezerwacje na konkretny miesiąc w formacie zoptymalizowanym dla kalendarza.

```http
GET /api/calendar/reservations?year=2026&month=2
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | number | ✅ | Rok (np. 2026) |
| `month` | number | ✅ | Miesiąc (1-12) |

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-02-20",
    "startTime": "18:00",
    "endTime": "23:00",
    "status": "CONFIRMED",
    "guests": 50,
    "totalPrice": 5000,
    "customEventType": null,
    "client": {
      "id": "uuid",
      "firstName": "Jan",
      "lastName": "Kowalski"
    },
    "hall": {
      "id": "uuid",
      "name": "Sala Główna"
    },
    "eventType": {
      "id": "uuid",
      "name": "Wesele",
      "color": "#6366f1"
    }
  }
]
```

**Status values:** `CONFIRMED`, `PENDING`, `RESERVED`, `COMPLETED`, `CANCELLED`

### GET `/api/calendar/halls`

Pobiera listę sal do filtrowania w kalendarzu.

```http
GET /api/calendar/halls
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sala Główna",
    "isActive": true
  },
  {
    "id": "uuid",
    "name": "Sala Kameralna",
    "isActive": true
  }
]
```

### Frontend Hooks

Kalendarz korzysta z React Query hooków zdefiniowanych w `lib/api/calendar-api.ts`:

```typescript
// Rezerwacje na miesiąc (auto-refetch, caching)
const { data, isLoading, error } = useCalendarReservations(2026, 2)

// Lista sal
const { data: halls } = useCalendarHalls()
```

### Backend Location

```
apps/backend/src/calendar/
├── calendar.module.ts      # NestJS module
├── calendar.controller.ts  # 2 endpoints
└── calendar.service.ts     # Business logic
```

---

## 📎 Attachments API 🆕

Polymorphic file management — upload, download, archive files attached to Client, Reservation, or Deposit entities.

**Dokumentacja modułu:** [Attachments Module 2026-02-15](./ATTACHMENTS_MODULE_2026-02-15.md)

### Key Concepts

- **Polymorphic:** One table, multiple entity types (`CLIENT`, `RESERVATION`, `DEPOSIT`)
- **RODO Redirect:** RODO uploaded from Reservation/Deposit is automatically stored under CLIENT
- **Soft Delete:** Files are archived (`isArchived=true`), not physically removed
- **Category Validation:** Each entity type has its own valid categories
- **Batch Checks:** Efficiently verify RODO/Contract status for multiple entities

### Categories per Entity Type

| Entity | Categories |
|---|---|
| **CLIENT** | `RODO`, `CORRESPONDENCE`, `OTHER` |
| **RESERVATION** | `RODO`, `CONTRACT`, `ANNEX`, `POST_EVENT`, `OTHER` |
| **DEPOSIT** | `RODO`, `PAYMENT_PROOF`, `INVOICE`, `REFUND_PROOF`, `OTHER` |

### POST `/api/attachments`

Upload a file (multipart/form-data). Requires `Staff+` role.

```http
POST /api/attachments
Content-Type: multipart/form-data
Authorization: Bearer {token}

--boundary
Content-Disposition: form-data; name="file"; filename="umowa.pdf"
Content-Type: application/pdf

[Binary file data]
--boundary
Content-Disposition: form-data; name="entityType"

RESERVATION
--boundary
Content-Disposition: form-data; name="entityId"

550e8400-e29b-41d4-a716-446655440000
--boundary
Content-Disposition: form-data; name="category"

CONTRACT
--boundary
Content-Disposition: form-data; name="label"

Umowa główna
--boundary--
```

**Response (201):**
```json
{
  "id": "uuid",
  "entityType": "RESERVATION",
  "entityId": "uuid",
  "category": "CONTRACT",
  "label": "Umowa główna",
  "description": null,
  "originalName": "umowa.pdf",
  "storedName": "abc123-umowa.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 245632,
  "storagePath": "reservations/abc123-umowa.pdf",
  "isArchived": false,
  "createdAt": "2026-02-16T12:00:00.000Z",
  "uploadedBy": {
    "id": "uuid",
    "firstName": "Jan",
    "lastName": "Kowalski"
  }
}
```

> **RODO Redirect:** If `category=RODO` and `entityType` is `RESERVATION` or `DEPOSIT`, the file is automatically redirected to `entityType=CLIENT` with the resolved `clientId`.

### GET `/api/attachments`

List attachments for an entity.

```http
GET /api/attachments?entityType=CLIENT&entityId={id}&category=RODO
Authorization: Bearer {token}
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `entityType` | string | ✅ | `CLIENT`, `RESERVATION`, `DEPOSIT` |
| `entityId` | string | ✅ | UUID of the entity |
| `category` | string | ❌ | Filter by category |

**Response:** Array of attachment objects (same shape as upload response).

### GET `/api/attachments/check`

Check if entity has a specific attachment category.

```http
GET /api/attachments/check?entityType=CLIENT&entityId={id}&category=RODO
```

**Response:**
```json
{
  "hasAttachment": true
}
```

### POST `/api/attachments/batch-check-rodo`

Batch check RODO status for multiple clients.

```http
POST /api/attachments/batch-check-rodo
Content-Type: application/json

{
  "clientIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response:**
```json
{
  "uuid-1": true,
  "uuid-2": false,
  "uuid-3": true
}
```

### POST `/api/attachments/batch-check-contract`

Batch check contract status for multiple reservations.

```http
POST /api/attachments/batch-check-contract
Content-Type: application/json

{
  "reservationIds": ["uuid-1", "uuid-2"]
}
```

**Response:**
```json
{
  "uuid-1": true,
  "uuid-2": false
}
```

### GET `/api/attachments/:id/download`

Download/stream a file.

```http
GET /api/attachments/{uuid}/download
Authorization: Bearer {token}
```

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="umowa.pdf"

[Binary file data]
```

### PATCH `/api/attachments/:id`

Update attachment metadata.

```http
PATCH /api/attachments/{uuid}
Content-Type: application/json
Authorization: Bearer {token}

{
  "label": "Umowa - wersja poprawiona",
  "description": "Po korekcie prawnej",
  "category": "CONTRACT"
}
```

### DELETE `/api/attachments/:id`

Soft-delete (archive) an attachment.

```http
DELETE /api/attachments/{uuid}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "isArchived": true
}
```

### Frontend Hooks

Attachments korzystają z TanStack Query hooków w `hooks/use-attachments.ts`:

```typescript
// List attachments for entity
const { data, isLoading } = useAttachments('RESERVATION', reservationId)

// Upload mutation
const upload = useUploadAttachment()
await upload.mutateAsync({ file, entityType, entityId, category })

// Batch RODO check
const { data: rodoMap } = useBatchCheckRodo(clientIds)

// Batch contract check
const { data: contractMap } = useBatchCheckContract(reservationIds)
```

### Backend Location

```
apps/backend/src/
├── routes/attachment.routes.ts       # 8 endpoints
├── controllers/attachment.controller.ts
├── services/attachment.service.ts     # CRUD + RODO redirect
├── constants/attachmentCategories.ts  # Category validation
├── types/attachment.types.ts          # DTOs
├── middlewares/upload.ts              # Multer config
└── tests/attachment.service.test.ts   # 38 unit tests ✅
```

### Error Responses

```json
// 400 - Invalid entityType
{ "error": "Nieprawidłowy entityType: INVALID. Dozwolone: CLIENT, RESERVATION, DEPOSIT" }

// 400 - Invalid category
{ "error": "Nieprawidłowa kategoria \"PHOTO\" dla typu \"CLIENT\"" }

// 400 - RODO redirect failed
{ "error": "Nie udało się znaleźć klienta powiązanego z RESERVATION {id}" }

// 404 - Attachment not found
{ "error": "Attachment not found" }

// 404 - File missing on disk
{ "error": "Plik nie istnieje na dysku" }
```

---

## 🏡 Architecture

### Stack

- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express.js + NestJS
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Validation:** Zod
- **PDF Generation:** PDFKit
- **File Upload:** Multer 🆕
- **Frontend:** Next.js 14 + TanStack Query
- **Testing:** Jest + ts-jest 🆕
- **Container:** Docker

### Project Structure

```
apps/backend/src/
├── controllers/        # Request handlers
│   ├── menuTemplate.controller.ts
│   ├── menuPackage.controller.ts
│   ├── menuOption.controller.ts
│   ├── reservation.controller.ts
│   ├── reservationMenu.controller.ts
│   └── attachment.controller.ts     🆕
├── calendar/           # Calendar module
│   ├── calendar.module.ts
│   ├── calendar.controller.ts
│   └── calendar.service.ts
├── services/          # Business logic
│   ├── menu.service.ts
│   ├── reservation.service.ts
│   ├── reservationMenu.service.ts
│   ├── pdf.service.ts
│   └── attachment.service.ts        🆕
├── routes/            # API routes
│   ├── menu.routes.ts
│   ├── reservation.routes.ts
│   └── attachment.routes.ts         🆕
├── constants/         # Constants
│   └── attachmentCategories.ts      🆕
├── middlewares/       # Middleware
│   └── upload.ts                    🆕
├── validation/        # Zod schemas
│   └── menu.validation.ts
├── types/             # TypeScript types
│   ├── menu.types.ts
│   └── attachment.types.ts          🆕
└── tests/             # Unit tests    🆕
    ├── setup.ts
    └── attachment.service.test.ts

apps/frontend/
├── components/attachments/           🆕
│   ├── attachment-panel.tsx
│   ├── attachment-row.tsx
│   ├── attachment-upload-dialog.tsx
│   └── attachment-preview.tsx
├── hooks/
│   └── use-attachments.ts            🆕
└── lib/api/
    └── attachments.ts                🆕
```

### Database Schema

```mermaid
erDiagram
    EventType ||--o{ MenuTemplate : has
    MenuTemplate ||--o{ MenuPackage : contains
    MenuPackage ||--o{ MenuPackageOption : has
    MenuOption ||--o{ MenuPackageOption : assigned_to
    Reservation ||--o| ReservationMenuSnapshot : has
    MenuPackage ||--o{ MenuPriceHistory : tracks
    MenuOption ||--o{ MenuPriceHistory : tracks
    Reservation ||--o{ Deposit : has
    Reservation ||--o{ Attachment : has
    Client ||--o{ Attachment : has
    Deposit ||--o{ Attachment : has
    User ||--o{ Attachment : uploaded_by
```

---

## 📊 Data Models

### MenuTemplate

```typescript
{
  id: string;
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;          // "Wiosenne", "Letnie"
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
  displayOrder: number;
  packages: MenuPackage[];
}
```

### MenuPackage

```typescript
{
  id: string;
  menuTemplateId: string;
  name: string;
  pricePerAdult: Decimal;
  pricePerChild: Decimal;
  pricePerToddler: Decimal;
  includedItems: string[];   // JSON array
  minGuests?: number;
  maxGuests?: number;
  isPopular: boolean;
  isRecommended: boolean;
  color?: string;
  icon?: string;
}
```

### MenuOption

```typescript
{
  id: string;
  name: string;
  category: string;
  priceType: 'FLAT' | 'PER_PERSON' | 'FREE';
  priceAmount: Decimal;
  allowMultiple: boolean;
  maxQuantity?: number;
  isActive: boolean;
}
```

### CalendarReservation

```typescript
{
  id: string;
  date: string;              // "2026-02-20"
  startTime: string | null;  // "18:00"
  endTime: string | null;    // "23:00"
  status: 'CONFIRMED' | 'PENDING' | 'RESERVED' | 'COMPLETED' | 'CANCELLED';
  guests: number;
  totalPrice: number;
  customEventType: string | null;
  client: { id: string; firstName: string; lastName: string };
  hall: { id: string; name: string } | null;
  eventType: { id: string; name: string; color: string } | null;
}
```

### Attachment 🆕

```typescript
{
  id: string;                // UUID
  entityType: 'CLIENT' | 'RESERVATION' | 'DEPOSIT';
  entityId: string;          // UUID of related entity
  category: string;          // e.g. 'RODO', 'CONTRACT', 'INVOICE'
  label: string | null;      // User-defined label
  description: string | null;
  originalName: string;      // Original filename
  storedName: string;        // UUID-prefixed stored filename
  mimeType: string;          // e.g. 'application/pdf'
  sizeBytes: number;
  storagePath: string;       // Relative path: 'clients/abc123.pdf'
  isArchived: boolean;       // Soft-delete flag
  uploadedById: string;      // User who uploaded
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
```

### ReservationMenuSnapshot

```typescript
{
  id: string;
  reservationId: string;
  menuData: Json;            // Immutable snapshot with dishSelections
  packagePrice: Decimal;
  optionsPrice: Decimal;
  totalMenuPrice: Decimal;
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  selectedAt: Date;
}
```

---

## 🔒 Security (TODO)

### Authentication

- [ ] JWT tokens
- [ ] Admin vs User roles
- [ ] Protected CRUD endpoints
- [ ] PDF download authorization

### Current Status

- ⚠️ Most endpoints are public
- ⚠️ No authentication required
- 🔒 Attachment endpoints require `Staff+` role ✅
- 🔒 To be implemented in Phase 3

---

## 🧪 Testing

### Unit Tests (Jest) 🆕

```bash
# Run all tests
docker compose run --rm backend npm test

# Watch mode
docker compose run --rm backend npm run test:watch

# Coverage report
docker compose run --rm backend npm run test:coverage
```

**Current coverage:**
- ✅ `attachment.service.ts` — **38 tests passing**
  - `createAttachment()` — 9 tests (RODO redirect, validation)
  - `getAttachments()` — 4 tests (filtering, archived)
  - `getAttachmentsWithClientRodo()` — 3 tests (cross-reference)
  - `updateAttachment()` — 3 tests (metadata, validation)
  - `deleteAttachment()` — 2 tests (soft-delete)
  - `hardDeleteAttachment()` — 2 tests (file + DB)
  - `batchCheckRodo()` — 4 tests (batch status)
  - `batchCheckContract()` — 3 tests (batch status)
  - `hasAttachment()` — 3 tests (existence check)
  - `countByCategory()` — 2 tests (grouping)
  - `getFilePath()` — 2 tests (file resolution)

### Manual Testing with Postman

1. Import collection (see above)
2. Run through test scenarios
3. Verify responses
4. Download and verify PDF

### Automated Testing (TODO)

- [x] Jest unit tests ✅
- [ ] Integration tests (supertest)
- [ ] E2E tests
- [ ] Frontend component tests

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health
```

### Logs

```bash
# All logs
docker compose logs backend

# Follow logs
docker compose logs -f backend

# Last 100 lines
docker compose logs backend --tail=100

# Errors only
docker compose logs backend | grep ERROR

# PDF generation logs
docker compose logs backend | grep "PDF Service"

# Attachment logs 🆕
docker compose logs backend | grep "Attachment"
docker compose logs backend | grep "RODO redirect"
```

---

## 🐛 Known Issues

### None! 🎉

All issues from Phase 2 have been resolved:
- ✅ Fixed `icon` field error in EventType
- ✅ All endpoints working
- ✅ Seed data loaded
- ✅ Type safety complete
- ✅ PDF generation with menu & prices
- ✅ Calendar view with monthly grid
- ✅ Attachment upload/download/archive 🆕
- ✅ 38 unit tests passing 🆕

---

## 🚀 Roadmap

### Completed ✅
- [x] Menu Templates, Packages, Options
- [x] Reservation Menu Selection
- [x] PDF Generation
- [x] Calendar API
- [x] Attachments API (backend + frontend + tests) 🆕

### Phase 3 - Frontend (Next)
- [x] Calendar view for reservations
- [x] Attachment panel in detail views 🆕
- [x] RODO/Contract badge indicators 🆕
- [ ] React components for menu browsing
- [ ] Admin panel for menu management
- [ ] Reservation menu selection UI
- [ ] Price breakdown visualization
- [ ] PDF download button in UI

### Phase 4 - Enhancement
- [ ] JWT authentication
- [ ] Role-based access control
- [ ] Performance optimization
- [ ] PDF email attachments
- [ ] Multilingual PDFs (EN/PL/DE)

---

## 📚 Resources

- **Postman Collection:** [Download JSON](./postman/Menu_System_API.postman_collection.json)
- **Postman Guide:** [README](./postman/README.md)
- **PDF Documentation:** [PDF Enhancement Session](./PDF_ENHANCEMENT_SESSION_2026-02-11.md)
- **Calendar Documentation:** [Calendar View 2026-02-15](./CALENDAR_VIEW_2026-02-15.md)
- **Attachments Documentation:** [Attachments Module 2026-02-15](./ATTACHMENTS_MODULE_2026-02-15.md) 🆕
- **Prisma Schema:** [schema.prisma](../prisma/schema.prisma)
- **TypeScript Types:** [menu.types.ts](../apps/backend/src/types/menu.types.ts)
- **Validation:** [menu.validation.ts](../apps/backend/src/validation/menu.validation.ts)
- **PDF Service:** [pdf.service.ts](../apps/backend/src/services/pdf.service.ts)
- **Attachment Service:** [attachment.service.ts](../apps/backend/src/services/attachment.service.ts) 🆕

---

## ❓ Support

**Issues?** Check:
1. [Postman Troubleshooting](./postman/README.md#troubleshooting)
2. Backend logs: `docker compose logs backend`
3. Database connection: `docker compose ps`
4. PDF generation logs: `docker compose logs backend | grep "PDF Service"`
5. Attachment logs: `docker compose logs backend | grep "Attachment"` 🆕

---

**Last Updated:** 2026-02-16 🆕  
**Status:** ✅ Production Ready  
**Version:** 1.3.0  
**New Features:** Attachments API — upload, download, archive, RODO redirect, batch checks 🚀
