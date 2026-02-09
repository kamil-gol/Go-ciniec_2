# 🔌 API Documentation - Moduł Rezerwacje

Kompletna dokumentacja REST API dla modułu rezerwacji sal weselnych.

---

## 📋 Spis Treści

- [Base URL](#base-url)
- [Autoryzacja](#autoryzacja)
- [Formaty Danych](#formaty-danych)
- [Endpoints](#endpoints)
  - [Lista Rezerwacji](#get-apireservations)
  - [Szczegóły Rezerwacji](#get-apireservationsid)
  - [Tworzenie Rezerwacji](#post-apireservations)
  - [Aktualizacja Rezerwacji](#patch-apireservationsid)
  - [Usuwanie Rezerwacji](#delete-apireservationsid)
  - [Zmiana Statusu](#patch-apireservationsidstatus)
  - [Generowanie PDF](#get-apireservationsidpdf)
  - [Historia Zmian](#get-apireservationsidhistory)
- [Kody Błędów](#kody-błędów)
- [Modele Danych](#modele-danych)

---

## 🌐 Base URL

```
Production:  https://your-domain.pl/api
Development: http://localhost:3001/api
```

---

## 🔐 Autoryzacja

Wszystkie endpointy wymagają autoryzacji JWT token.

### Header:
```http
Authorization: Bearer <your_jwt_token>
```

### Uzyskanie tokenu:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jan Kowalski"
  }
}
```

---

## 📦 Formaty Danych

### Content-Type
- Request: `application/json`
- Response: `application/json`
- PDF: `application/pdf`

### Encoding
- UTF-8

### Daty
- Format ISO 8601: `2026-02-09T15:30:00Z`
- Timezone: UTC

### Liczby dziesiętne
- Ceny: 2 miejsca po przecinku (np. `1250.00`)

---

## 📡 Endpoints

### GET /api/reservations

Pobiera listę rezerwacji z opcjonalnymi filtrami.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | `number` | No | Numer strony (default: 1) |
| `limit` | `number` | No | Liczba wyników na stronę (default: 20, max: 100) |
| `status` | `string` | No | Filtr po statusie: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESERVED` |
| `hallId` | `number` | No | Filtr po ID sali |
| `eventTypeId` | `number` | No | Filtr po typie wydarzenia |
| `dateFrom` | `string` | No | Data od (ISO 8601) |
| `dateTo` | `string` | No | Data do (ISO 8601) |
| `search` | `string` | No | Wyszukiwanie po imieniu/nazwisku klienta |
| `sortBy` | `string` | No | Sortowanie: `eventDate`, `createdAt`, `totalPrice` |
| `sortOrder` | `string` | No | Kolejność: `asc`, `desc` (default: `desc`) |

#### Request Example

```http
GET /api/reservations?status=CONFIRMED&hallId=1&page=1&limit=20
Authorization: Bearer <token>
```

#### Response 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "eventDate": "2026-06-15T14:00:00Z",
      "status": "CONFIRMED",
      "client": {
        "id": 45,
        "firstName": "Anna",
        "lastName": "Nowak",
        "phone": "+48 123 456 789",
        "email": "anna.nowak@example.com"
      },
      "hall": {
        "id": 1,
        "name": "Sala Główna",
        "capacity": 100
      },
      "eventType": {
        "id": 2,
        "name": "Wesele"
      },
      "adults": 80,
      "children": 15,
      "toddlers": 5,
      "totalGuests": 100,
      "pricePerAdult": 150.00,
      "pricePerChild": 75.00,
      "pricePerToddler": 0.00,
      "totalPrice": 13125.00,
      "deposit": {
        "id": 67,
        "amount": 3000.00,
        "paid": true,
        "paidAt": "2026-02-09T10:30:00Z",
        "paymentMethod": "TRANSFER",
        "dueDate": "2026-05-15T23:59:59Z"
      },
      "notes": "Uwagi specjalne dla tej rezerwacji",
      "createdAt": "2026-02-01T09:15:00Z",
      "updatedAt": "2026-02-09T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### GET /api/reservations/:id

Pobiera szczegółowe informacje o konkretnej rezerwacji.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | ID rezerwacji |

#### Request Example

```http
GET /api/reservations/123
Authorization: Bearer <token>
```

#### Response 200 OK

```json
{
  "success": true,
  "data": {
    "id": 123,
    "eventDate": "2026-06-15T14:00:00Z",
    "status": "CONFIRMED",
    "client": {
      "id": 45,
      "firstName": "Anna",
      "lastName": "Nowak",
      "phone": "+48 123 456 789",
      "email": "anna.nowak@example.com",
      "address": "ul. Kwiatowa 15, 40-123 Katowice"
    },
    "hall": {
      "id": 1,
      "name": "Sala Główna",
      "capacity": 100,
      "pricePerPerson": 150.00
    },
    "eventType": {
      "id": 2,
      "name": "Wesele"
    },
    "adults": 80,
    "children": 15,
    "toddlers": 5,
    "totalGuests": 100,
    "pricePerAdult": 150.00,
    "pricePerChild": 75.00,
    "pricePerToddler": 0.00,
    "totalPrice": 13125.00,
    "deposit": {
      "id": 67,
      "amount": 3000.00,
      "paid": true,
      "paidAt": "2026-02-09T10:30:00Z",
      "paymentMethod": "TRANSFER",
      "dueDate": "2026-05-15T23:59:59Z"
    },
    "notes": "Uwagi specjalne",
    "specialRequests": "Menu wegetariańskie dla 10 osób",
    "anniversaryYear": null,
    "anniversaryOccasion": null,
    "createdAt": "2026-02-01T09:15:00Z",
    "updatedAt": "2026-02-09T14:20:00Z",
    "createdBy": {
      "id": 5,
      "name": "Jan Kowalski",
      "email": "jan@example.com"
    }
  }
}
```

#### Response 404 Not Found

```json
{
  "success": false,
  "error": "Reservation not found"
}
```

---

### POST /api/reservations

Tworzy nową rezerwację.

#### Request Body

```json
{
  "eventDate": "2026-06-15T14:00:00Z",
  "hallId": 1,
  "eventTypeId": 2,
  "clientId": 45,
  "adults": 80,
  "children": 15,
  "toddlers": 5,
  "pricePerAdult": 150.00,
  "pricePerChild": 75.00,
  "pricePerToddler": 0.00,
  "notes": "Uwagi specjalne",
  "specialRequests": "Menu wegetariańskie dla 10 osób",
  "deposit": {
    "amount": 3000.00,
    "dueDate": "2026-05-15T23:59:59Z"
  }
}
```

#### Validation Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `eventDate` | `string` | Yes | ISO 8601, must be in the future |
| `hallId` | `number` | Yes | Must exist in database |
| `eventTypeId` | `number` | Yes | Must exist in database |
| `clientId` | `number` | Yes | Must exist in database |
| `adults` | `number` | Yes | Min: 1, Max: hall capacity |
| `children` | `number` | No | Min: 0, Max: hall capacity |
| `toddlers` | `number` | No | Min: 0, Max: hall capacity |
| `pricePerAdult` | `number` | Yes | Min: 0, 2 decimal places |
| `pricePerChild` | `number` | No | Min: 0, 2 decimal places |
| `pricePerToddler` | `number` | No | Min: 0, 2 decimal places |
| `notes` | `string` | No | Max: 1000 characters |
| `specialRequests` | `string` | No | Max: 1000 characters |
| `deposit.amount` | `number` | No | Min: 0, Max: totalPrice |
| `deposit.dueDate` | `string` | No | ISO 8601, before eventDate |

#### Response 201 Created

```json
{
  "success": true,
  "data": {
    "id": 124,
    "eventDate": "2026-06-15T14:00:00Z",
    "status": "PENDING",
    "client": { /* ... */ },
    "hall": { /* ... */ },
    "eventType": { /* ... */ },
    "adults": 80,
    "children": 15,
    "toddlers": 5,
    "totalGuests": 100,
    "totalPrice": 13125.00,
    "deposit": {
      "id": 68,
      "amount": 3000.00,
      "paid": false,
      "dueDate": "2026-05-15T23:59:59Z"
    },
    "createdAt": "2026-02-09T16:05:00Z",
    "updatedAt": "2026-02-09T16:05:00Z"
  },
  "message": "Reservation created successfully"
}
```

#### Response 400 Bad Request

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "adults",
      "message": "Adults must be at least 1"
    },
    {
      "field": "eventDate",
      "message": "Event date must be in the future"
    }
  ]
}
```

#### Response 409 Conflict

```json
{
  "success": false,
  "error": "Hall is already booked for this date",
  "existingReservation": {
    "id": 100,
    "eventDate": "2026-06-15T14:00:00Z",
    "client": "Jan Kowalski"
  }
}
```

---

### PATCH /api/reservations/:id

Aktualizuje istniejącą rezerwację.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | ID rezerwacji |

#### Request Body (partial update)

```json
{
  "adults": 85,
  "children": 12,
  "toddlers": 3,
  "notes": "Zaktualizowane uwagi",
  "specialRequests": "Dodatkowe krzesła dla dzieci"
}
```

#### Response 200 OK

```json
{
  "success": true,
  "data": {
    "id": 123,
    "eventDate": "2026-06-15T14:00:00Z",
    "status": "CONFIRMED",
    "adults": 85,
    "children": 12,
    "toddlers": 3,
    "totalGuests": 100,
    "totalPrice": 13650.00,
    "updatedAt": "2026-02-09T16:10:00Z"
  },
  "message": "Reservation updated successfully"
}
```

#### Response 403 Forbidden

```json
{
  "success": false,
  "error": "Cannot modify completed or cancelled reservation"
}
```

---

### PATCH /api/reservations/:id/status

Zmienia status rezerwacji.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | ID rezerwacji |

#### Request Body

```json
{
  "status": "CONFIRMED",
  "reason": "Klient wpłacił zaliczkę"
}
```

#### Allowed Status Transitions

```
RESERVED → PENDING → CONFIRMED → COMPLETED
    ↓          ↓           ↓
 CANCELLED  CANCELLED  CANCELLED
```

#### Response 200 OK

```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "CONFIRMED",
    "previousStatus": "PENDING",
    "updatedAt": "2026-02-09T16:15:00Z"
  },
  "message": "Status updated successfully"
}
```

#### Response 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid status transition",
  "currentStatus": "COMPLETED",
  "requestedStatus": "PENDING",
  "allowedTransitions": []
}
```

---

### GET /api/reservations/:id/pdf

Generuje i pobiera PDF z potwierdzeniem rezerwacji.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | ID rezerwacji |

#### Request Example

```http
GET /api/reservations/123/pdf
Authorization: Bearer <token>
```

#### Response 200 OK

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="rezerwacja_123_Anna_Nowak.pdf"

[Binary PDF data]
```

#### PDF Contains:

- Logo Gościńca
- Numer rezerwacji
- Dane klienta
- Data i godzina wydarzenia
- Nazwa sali
- Typ wydarzenia
- Liczba gości (dorośli, dzieci, maluchy)
- Ceny i suma całkowita
- Status zaliczki
- Uwagi specjalne
- QR code z linkiem do rezerwacji

#### Response 404 Not Found

```json
{
  "success": false,
  "error": "Reservation not found"
}
```

---

### GET /api/reservations/:id/history

Pobiera historię zmian rezerwacji.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | ID rezerwacji |

#### Request Example

```http
GET /api/reservations/123/history
Authorization: Bearer <token>
```

#### Response 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": 567,
      "reservationId": 123,
      "action": "STATUS_CHANGED",
      "previousValue": "PENDING",
      "newValue": "CONFIRMED",
      "reason": "Klient wpłacił zaliczkę",
      "changedBy": {
        "id": 5,
        "name": "Jan Kowalski",
        "email": "jan@example.com"
      },
      "timestamp": "2026-02-09T16:15:00Z"
    },
    {
      "id": 566,
      "reservationId": 123,
      "action": "GUESTS_UPDATED",
      "previousValue": {"adults": 80, "children": 15, "toddlers": 5},
      "newValue": {"adults": 85, "children": 12, "toddlers": 3},
      "reason": "Korekta liczby gości",
      "changedBy": {
        "id": 5,
        "name": "Jan Kowalski"
      },
      "timestamp": "2026-02-09T16:10:00Z"
    },
    {
      "id": 565,
      "reservationId": 123,
      "action": "CREATED",
      "previousValue": null,
      "newValue": null,
      "reason": "Nowa rezerwacja",
      "changedBy": {
        "id": 5,
        "name": "Jan Kowalski"
      },
      "timestamp": "2026-02-01T09:15:00Z"
    }
  ]
}
```

---

### DELETE /api/reservations/:id

Usuwa rezerwację (soft delete).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | ID rezerwacji |

#### Request Example

```http
DELETE /api/reservations/123
Authorization: Bearer <token>
```

#### Response 200 OK

```json
{
  "success": true,
  "message": "Reservation deleted successfully",
  "data": {
    "id": 123,
    "status": "CANCELLED",
    "deletedAt": "2026-02-09T16:20:00Z"
  }
}
```

#### Response 403 Forbidden

```json
{
  "success": false,
  "error": "Cannot delete completed reservation"
}
```

---

## ❌ Kody Błędów

### HTTP Status Codes

| Code | Description | Example |
|------|-------------|----------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Validation error, invalid data |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists / date conflict |
| `422` | Unprocessable Entity | Invalid business logic |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | Database unavailable |

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific validation error"
    }
  ],
  "timestamp": "2026-02-09T16:25:00Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request data validation failed |
| `NOT_FOUND` | Resource not found |
| `ALREADY_EXISTS` | Resource with this identifier already exists |
| `DATE_CONFLICT` | Hall already booked for this date |
| `INVALID_STATUS_TRANSITION` | Cannot change status from A to B |
| `INSUFFICIENT_PERMISSIONS` | User doesn't have required permissions |
| `CAPACITY_EXCEEDED` | Total guests exceed hall capacity |
| `PAST_DATE` | Event date is in the past |
| `DEPOSIT_EXCEEDS_TOTAL` | Deposit amount exceeds total price |

---

## 📊 Modele Danych

### Reservation

```typescript
interface Reservation {
  id: number;
  eventDate: string; // ISO 8601
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESERVED';
  
  // Relations
  client: Client;
  hall: Hall;
  eventType: EventType;
  deposit?: Deposit;
  
  // Guests
  adults: number;
  children: number;
  toddlers: number;
  totalGuests: number; // Calculated
  
  // Pricing
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  totalPrice: number; // Calculated
  
  // Additional Info
  notes?: string;
  specialRequests?: string;
  anniversaryYear?: number; // For "Rocznica" events
  anniversaryOccasion?: string; // For "Rocznica" events
  
  // Metadata
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  createdBy: User;
}
```

### Client

```typescript
interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Hall

```typescript
interface Hall {
  id: number;
  name: string;
  capacity: number;
  pricePerPerson: number;
  description?: string;
  active: boolean;
}
```

### EventType

```typescript
interface EventType {
  id: number;
  name: string; // "Wesele", "Urodziny", "Rocznica/Jubileusz", etc.
  description?: string;
  active: boolean;
}
```

### Deposit

```typescript
interface Deposit {
  id: number;
  reservationId: number;
  amount: number;
  paid: boolean;
  paidAt?: string; // ISO 8601
  paymentMethod?: 'CASH' | 'TRANSFER' | 'BLIK';
  dueDate: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔗 Powiązane Dokumenty

- [📋 CHANGELOG_RESERVATIONS.md](../../CHANGELOG_RESERVATIONS.md) - Historia zmian
- [🗄️ RESERVATIONS_SCHEMA.md](../database/RESERVATIONS_SCHEMA.md) - Schemat bazy danych
- [👥 RESERVATIONS_USER_GUIDE.md](../user-guide/RESERVATIONS_USER_GUIDE.md) - Podręcznik użytkownika
- [🔄 RESERVATION_WORKFLOWS.md](../workflows/RESERVATION_WORKFLOWS.md) - Procesy biznesowe
- [🚀 RESERVATIONS_DEPLOYMENT.md](../deployment/RESERVATIONS_DEPLOYMENT.md) - Deployment

---

## 📞 Wsparcie

W razie pytań dotyczących API:
- 📧 Email: dev@gosciniecrodzinny.pl
- 🐛 GitHub Issues: [API Questions](https://github.com/kamil-gol/Go-ciniec_2/issues?q=label%3Aapi)

---

**Ostatnia aktualizacja:** 09.02.2026 - 17:03 CET  
**Wersja API:** 2.2.0  
**Autor:** Kamil Gołębiowski
