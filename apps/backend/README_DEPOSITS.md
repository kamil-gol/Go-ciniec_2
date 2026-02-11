# 💰 Moduł Zarządzania Zaliczkami (Deposits Module)

## 📋 Spis treści

- [Wprowadzenie](#wprowadzenie)
- [Architektura](#architektura)
- [Model Bazy Danych](#model-bazy-danych)
- [API Endpoints](#api-endpoints)
- [Przykłady Użycia](#przykłady-użycia)
- [Integracja z Rezerwacjami](#integracja-z-rezerwacjami)
- [Testy](#testy)

---

## 🎯 Wprowadzenie

Moduł zarządzania zaliczkami umożliwia:

✅ Rejestrowanie wpłat zaliczek dla rezerwacji  
✅ Zarządzanie płatnościami częściowymi  
✅ Automatyczne wykrywanie przeterminowanych zaliczek  
✅ Generowanie potwierdzeń wpłat  
✅ Dashboard z przypomnieniami  
✅ Statystyki finansowe  

---

## 🏗️ Architektura

### Struktura Plików

```
apps/backend/src/
├── types/
│   └── deposit.types.ts          # TypeScript typy i interfejsy
├── services/
│   └── deposit.service.ts         # Logika biznesowa
├── controllers/
│   └── deposit.controller.ts      # Request handlers
└── routes/
    └── deposit.routes.ts          # API routes
```

### Warstwy Aplikacji

1. **Routes** - Definicja endpointów API
2. **Controller** - Walidacja requestów, obsługa błędów
3. **Service** - Logika biznesowa, operacje na bazie danych
4. **Prisma** - ORM, modele bazy danych

---

## 🗄️ Model Bazy Danych

### Deposit (Zaliczka)

```prisma
model Deposit {
  id              String   @id @default(uuid())
  reservationId   String
  
  // Kwoty
  amount          Decimal  // Całkowita kwota zaliczki
  paidAmount      Decimal  // Wpłacona kwota
  remainingAmount Decimal  // Pozostała kwota
  
  // Daty
  dueDate         String   // Termin płatności (YYYY-MM-DD)
  paidAt          DateTime?
  
  // Status
  status          String   // PENDING | PAID | OVERDUE | PARTIAL | CANCELLED
  paid            Boolean
  
  // Metoda płatności
  paymentMethod   String?  // CASH | CARD | TRANSFER | BLIK | OTHER
  
  // Metadata
  title           String?
  description     String?
  receiptNumber   String?  @unique
  
  // Przypomnienia
  reminderSentAt  DateTime?
  
  // PDF
  confirmationPdfUrl String?
  
  // Notatki wewnętrzne
  internalNotes   String?
  
  // Relacje
  reservation     Reservation
  paymentHistory  DepositPayment[]
}
```

### DepositPayment (Historia Płatności)

```prisma
model DepositPayment {
  id              String   @id @default(uuid())
  depositId       String
  
  amount          Decimal
  paymentMethod   String
  paymentDate     DateTime
  
  notes           String?
  receiptNumber   String?
  
  deposit         Deposit
}
```

### Statusy Zaliczki

| Status | Opis |
|--------|------|
| `PENDING` | Oczekuje na płatność |
| `PAID` | Opłacona w całości |
| `OVERDUE` | Przeterminowana (po terminie) |
| `PARTIAL` | Częściowo opłacona |
| `CANCELLED` | Anulowana |

> **Uwaga**: Status `OVERDUE` jest obliczany automatycznie gdy `dueDate < today` i `paid = false`

---

## 🔌 API Endpoints

### 1. CRUD Operations

#### POST `/api/deposits`
Utwórz nową zaliczkę

**Request:**
```json
{
  "reservationId": "uuid",
  "amount": 1000.00,
  "dueDate": "2026-03-15",
  "title": "Pierwsza zaliczka",
  "description": "Zaliczka na wesele Kowalskich",
  "internalNotes": "Klient prosił o fakturę"
}
```

**Response:**
```json
{
  "id": "uuid",
  "reservationId": "uuid",
  "amount": 1000.00,
  "paidAmount": 0,
  "remainingAmount": 1000.00,
  "dueDate": "2026-03-15",
  "status": "PENDING",
  "paid": false,
  "reservation": {
    "id": "uuid",
    "date": "2026-06-15",
    "client": { ... },
    "totalPrice": 5000.00
  }
}
```

---

#### GET `/api/deposits`
Lista zaliczek z filtrami

**Query Parameters:**
- `status` - Filtruj po statusie (PENDING, PAID, OVERDUE, PARTIAL)
- `paid` - Filtruj opłacone (true/false)
- `reservationId` - Filtruj po ID rezerwacji
- `dueDateFrom` - Data od (YYYY-MM-DD)
- `dueDateTo` - Data do (YYYY-MM-DD)
- `overdueOnly` - Tylko przeterminowane (true/false)
- `upcomingOnly` - Termin w ciągu 7 dni (true/false)
- `search` - Szukaj w nazwisku klienta lub numerze pokwitowania
- `page` - Numer strony (default: 1)
- `perPage` - Wyników na stronę (default: 20, max: 100)
- `sortBy` - Sortuj po (dueDate, amount, createdAt, paidAt)
- `sortOrder` - Kierunek (asc, desc)

**Example:**
```bash
GET /api/deposits?status=PENDING&overdueOnly=true&sortBy=dueDate&sortOrder=asc
```

**Response:**
```json
{
  "deposits": [ ... ],
  "total": 45,
  "page": 1,
  "perPage": 20,
  "totalPages": 3
}
```

---

#### GET `/api/deposits/:id`
Szczegóły zaliczki

**Response:**
```json
{
  "id": "uuid",
  "amount": 1000.00,
  "paidAmount": 500.00,
  "remainingAmount": 500.00,
  "status": "PARTIAL",
  "paymentHistory": [
    {
      "id": "uuid",
      "amount": 300.00,
      "paymentMethod": "TRANSFER",
      "paymentDate": "2026-02-10T10:00:00Z",
      "notes": "Przelew z konta głównego"
    },
    {
      "id": "uuid",
      "amount": 200.00,
      "paymentMethod": "CASH",
      "paymentDate": "2026-02-11T14:30:00Z"
    }
  ],
  "reservation": { ... }
}
```

---

#### PUT `/api/deposits/:id`
Aktualizuj zaliczkę

**Request:**
```json
{
  "amount": 1200.00,
  "dueDate": "2026-03-20",
  "title": "Pierwsza zaliczka (zwiększona)",
  "internalNotes": "Klient poprosił o zwiększenie zaliczki"
}
```

---

#### DELETE `/api/deposits/:id`
Usuń zaliczkę

**Response:** `204 No Content`

---

### 2. Payment Operations

#### PUT `/api/deposits/:id/mark-paid`
Oznacz jako opłaconą (płatność pełna lub częściowa)

**Request:**
```json
{
  "paymentMethod": "TRANSFER",
  "amount": 500.00,  // Opcjonalne - dla płatności częściowej
  "paidAt": "2026-02-11T15:00:00Z",  // Opcjonalne
  "notes": "Przelew bankowy - tytuł: RES-123",
  "receiptNumber": "ZAL-2026-0042"  // Opcjonalne
}
```

**Response:**
```json
{
  "id": "uuid",
  "paidAmount": 500.00,
  "remainingAmount": 500.00,
  "status": "PARTIAL",
  "paid": false,
  "receiptNumber": "ZAL-2026-0042"
}
```

---

#### POST `/api/deposits/:id/payments`
Dodaj płatność częściową

**Request:**
```json
{
  "amount": 300.00,
  "paymentMethod": "CASH",
  "paymentDate": "2026-02-12T10:00:00Z",  // Opcjonalne
  "notes": "Gotówka w biurze"
}
```

---

### 3. Statistics & Reminders

#### GET `/api/deposits/statistics`
Statystyki zaliczek

**Response:**
```json
{
  "totalDeposits": 120,
  "totalAmount": 145000.00,
  "totalPaid": 98000.00,
  "totalRemaining": 47000.00,
  "pendingCount": 35,
  "paidCount": 78,
  "overdueCount": 5,
  "partialCount": 12,
  "upcomingDueCount": 8  // Termin w ciągu 7 dni
}
```

---

#### GET `/api/deposits/reminders/pending`
Zaliczki wymagające przypomnienia

**Response:**
```json
[
  {
    "id": "uuid",
    "amount": 800.00,
    "remainingAmount": 800.00,
    "dueDate": "2026-02-10",  // Przeterminowane!
    "status": "OVERDUE",
    "reservation": {
      "client": {
        "firstName": "Jan",
        "lastName": "Kowalski",
        "email": "jan@example.com",
        "phone": "+48123456789"
      },
      "date": "2026-06-15",
      "eventType": { "name": "Wesele" }
    }
  }
]
```

---

#### PUT `/api/deposits/:id/reminder-sent`
Oznacz przypomnienie jako wysłane

**Response:** `204 No Content`

---

### 4. Integration with Reservations

#### GET `/api/reservations/:reservationId/deposits`
Lista zaliczek dla rezerwacji

#### POST `/api/reservations/:reservationId/deposits`
Utwórz zaliczkę dla rezerwacji

---

## 💡 Przykłady Użycia

### Workflow 1: Nowa Rezerwacja + Zaliczka

```typescript
// 1. Utworzenie rezerwacji
const reservation = await createReservation({ ... });

// 2. Dodanie zaliczki
const deposit = await fetch('/api/deposits', {
  method: 'POST',
  body: JSON.stringify({
    reservationId: reservation.id,
    amount: reservation.totalPrice * 0.2, // 20% zaliczka
    dueDate: '2026-03-01',
    title: 'Zaliczka 20%'
  })
});
```

---

### Workflow 2: Płatność Częściowa

```typescript
// Klient wpłaca 300 zł gotówką
const updated = await fetch(`/api/deposits/${depositId}/payments`, {
  method: 'POST',
  body: JSON.stringify({
    amount: 300,
    paymentMethod: 'CASH',
    notes: 'Wpłata gotówką w biurze'
  })
});

// Status automatycznie zmieni się na PARTIAL
// remainingAmount zostanie przeliczone
```

---

### Workflow 3: Dashboard Przypomnień

```typescript
// Pobierz przeterminowane i zbliżające się terminy
const reminders = await fetch('/api/deposits/reminders/pending');

// Dla każdej zaliczki:
reminders.forEach(deposit => {
  // Wyślij email/SMS do klienta
  sendReminder(deposit.reservation.client.email, {
    amount: deposit.remainingAmount,
    dueDate: deposit.dueDate
  });
  
  // Oznacz jako wysłane
  fetch(`/api/deposits/${deposit.id}/reminder-sent`, {
    method: 'PUT'
  });
});
```

---

## 🔄 Integracja z Rezerwacjami

### Pobieranie Zaliczek Rezerwacji

```typescript
import { useEffect, useState } from 'react';

function ReservationDeposits({ reservationId }) {
  const [deposits, setDeposits] = useState([]);
  
  useEffect(() => {
    fetch(`/api/reservations/${reservationId}/deposits`)
      .then(res => res.json())
      .then(setDeposits);
  }, [reservationId]);
  
  return (
    <div>
      <h3>Zaliczki</h3>
      {deposits.map(deposit => (
        <DepositCard key={deposit.id} deposit={deposit} />
      ))}
    </div>
  );
}
```

---

## 🧪 Testy

### Uruchomienie Testów

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Przykład Testu

```typescript
describe('Deposit Service', () => {
  it('should create deposit with correct initial values', async () => {
    const deposit = await depositService.createDeposit({
      reservationId: 'test-id',
      amount: 1000,
      dueDate: '2026-03-01'
    });
    
    expect(deposit.amount).toBe(1000);
    expect(deposit.paidAmount).toBe(0);
    expect(deposit.remainingAmount).toBe(1000);
    expect(deposit.status).toBe('PENDING');
  });
  
  it('should automatically mark as OVERDUE when past due date', async () => {
    // Test implementation...
  });
});
```

---

## 🚀 Deployment

### Migracja Bazy Danych

```bash
# Development
docker compose exec backend npx prisma migrate dev --name add_deposits_module

# Production
docker compose exec backend npx prisma migrate deploy
```

### Restart Serwisów

```bash
cd /home/kamil/rezerwacje
git pull origin main
docker compose restart backend frontend
```

---

## 📚 Dokumentacja Techniczna

### TypeScript Types

```typescript
import {
  Deposit,
  DepositPayment,
  DepositStatus,
  PaymentMethod,
  CreateDepositRequest,
  UpdateDepositRequest,
  DepositWithRelations,
  DepositStatistics
} from '@types/deposit.types';
```

### Service Functions

```typescript
import * as depositService from '@services/deposit.service';

// CRUD
depositService.createDeposit(data)
depositService.getDepositById(id)
depositService.listDeposits(filters)
depositService.updateDeposit(id, data)
depositService.deleteDeposit(id)

// Payments
depositService.markDepositPaid(id, data)
depositService.addDepositPayment(id, data)

// Statistics
depositService.getDepositStatistics()
depositService.getDepositsForReminders()
depositService.markReminderSent(id)
```

---

## 🎨 Frontend Components (TODO - Sprint 2)

- `DepositList` - Tabela z listą zaliczek
- `DepositCard` - Karta pojedynczej zaliczki
- `DepositForm` - Formularz dodawania/edycji
- `DepositPaymentModal` - Modal płatności
- `DepositStatistics` - Dashboard ze statystykami
- `DepositReminders` - Lista przypomnień

---

## 📞 Support

W razie pytań lub problemów, kontakt:
- Repository: https://github.com/kamil-gol/Go-ciniec_2
- Issues: https://github.com/kamil-gol/Go-ciniec_2/issues

---

**Ostatnia aktualizacja:** 11.02.2026  
**Wersja:** 1.0.0  
**Status:** ✅ SPRINT 1 Backend Foundation - Ukończony
