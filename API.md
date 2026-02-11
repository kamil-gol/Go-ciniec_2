# 🚀 Rezerwacje API Documentation

**Base URL**: `http://localhost:3001/api`  
**Version**: 1.1.0  
**Last Updated**: 2026-02-11  
**Status**: ✅ Production Ready

---

## 🔒 Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication.

### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Get Token
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "ValidPass123!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "ADMIN"
    }
  }
}
```

---

## 🏛️ Hall Management

### List All Halls
```bash
GET /api/halls
GET /api/halls?isActive=true
GET /api/halls?minCapacity=50&maxCapacity=150
GET /api/halls?search=bankiet
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sala Bankietowa",
      "capacity": 100,
      "pricePerPerson": "50.00",
      "description": "Główna sala bankietowa",
      "isActive": true,
      "createdAt": "2026-02-06T16:00:00Z",
      "updatedAt": "2026-02-06T16:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Hall by ID
```bash
GET /api/halls/:id
```

### Create Hall (ADMIN)
```bash
POST /api/halls
{
  "name": "Sala Bankietowa",
  "capacity": 100,
  "pricePerPerson": 50.00,
  "description": "Główna sala bankietowa z parkietem"
}
```

### Update Hall (ADMIN)
```bash
PUT /api/halls/:id
{
  "name": "Sala Bankietowa Premium",
  "capacity": 120,
  "pricePerPerson": 60.00
}
```

### Delete Hall (ADMIN)
```bash
DELETE /api/halls/:id
```

**Note**: Cannot delete hall with active reservations. Sets `isActive` to `false`.

---

## 👥 Client Management

### List All Clients (STAFF)
```bash
GET /api/clients
GET /api/clients?search=kowalski
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "email": "jan.kowalski@example.com",
      "phone": "+48123456789",
      "address": "ul. Kwiatowa 5, 41-500 Chorzów",
      "notes": "Klient regularny",
      "createdAt": "2026-02-06T16:00:00Z",
      "updatedAt": "2026-02-06T16:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Client by ID (STAFF)
```bash
GET /api/clients/:id
```

**Response** includes recent reservations:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "email": "jan.kowalski@example.com",
    "phone": "+48123456789",
    "address": "ul. Kwiatowa 5",
    "notes": "Klient regularny",
    "reservations": [
      {
        "id": "uuid",
        "date": "2026-03-15",
        "status": "CONFIRMED",
        "eventType": { "name": "Ślub" },
        "hall": { "name": "Sala Bankietowa" }
      }
    ]
  }
}
```

### Create Client (STAFF)
```bash
POST /api/clients
{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "jan.kowalski@example.com",
  "phone": "+48123456789",
  "address": "ul. Kwiatowa 5, 41-500 Chorzów",
  "notes": "Klient regularny, preferuje sobotnie wydarzenia"
}
```

**Validation**:
- `firstName`, `lastName`, `email` - Required
- `email` - Must be valid format and unique
- `phone` - Optional, min 9 digits

### Update Client (STAFF)
```bash
PUT /api/clients/:id
{
  "phone": "+48987654321",
  "notes": "Zmiana numeru telefonu"
}
```

### Delete Client (ADMIN)
```bash
DELETE /api/clients/:id
```

**Note**: Cannot delete client with existing reservations.

---

## 🎉 Event Type Management

### List All Event Types
```bash
GET /api/event-types
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Komunia",
      "createdAt": "2026-02-06T16:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Konferencja",
      "createdAt": "2026-02-06T16:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Rocznica",
      "createdAt": "2026-02-06T16:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Urodziny",
      "createdAt": "2026-02-06T16:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Ślub",
      "createdAt": "2026-02-06T16:00:00Z"
    }
  ],
  "count": 5
}
```

### Get Event Type by ID
```bash
GET /api/event-types/:id
```

**Response** includes reservation count:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ślub",
    "createdAt": "2026-02-06T16:00:00Z",
    "_count": {
      "reservations": 15
    }
  }
}
```

### Create Event Type (ADMIN)
```bash
POST /api/event-types
{
  "name": "Ślub"
}
```

### Update Event Type (ADMIN)
```bash
PUT /api/event-types/:id
{
  "name": "Ślub i Wesele"
}
```

### Delete Event Type (ADMIN)
```bash
DELETE /api/event-types/:id
```

**Note**: Cannot delete event type used in reservations.

---

## 📅 Reservation Management

### List All Reservations (STAFF)
```bash
GET /api/reservations
GET /api/reservations?status=CONFIRMED
GET /api/reservations?hallId=uuid
GET /api/reservations?clientId=uuid
GET /api/reservations?dateFrom=2026-06-01&dateTo=2026-06-30
GET /api/reservations?archived=true
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2026-06-15T00:00:00.000Z",
      "startTime": "1970-01-01T18:00:00.000Z",
      "endTime": "1970-01-01T23:00:00.000Z",
      "guests": 80,
      "totalPrice": "4000.00",
      "status": "CONFIRMED",
      "notes": "Wesele - uroczystość rodzinna",
      "depositAmount": "1500.00",
      "depositDueDate": "2026-05-15T00:00:00.000Z",
      "depositPaid": false,
      "hall": {
        "id": "uuid",
        "name": "Sala Bankietowa",
        "capacity": 100,
        "pricePerPerson": "50.00"
      },
      "client": {
        "id": "uuid",
        "firstName": "Jan",
        "lastName": "Kowalski",
        "email": "jan.kowalski@example.com",
        "phone": "+48123456789"
      },
      "eventType": {
        "id": "uuid",
        "name": "Ślub"
      },
      "createdByUser": {
        "id": "uuid",
        "email": "admin@example.com"
      },
      "createdAt": "2026-02-06T16:00:00.000Z",
      "updatedAt": "2026-02-06T16:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Reservation by ID (STAFF)
```bash
GET /api/reservations/:id
```

### Create Reservation (STAFF)
```bash
POST /api/reservations
{
  "hallId": "uuid",
  "clientId": "uuid",
  "eventTypeId": "uuid",
  "date": "2026-06-15",
  "startTime": "18:00",
  "endTime": "23:00",
  "guests": 80,
  "notes": "Wesele - uroczystość rodzinna",
  "depositAmount": 1500,
  "depositDueDate": "2026-05-15"
}
```

**Validation**:
- `hallId`, `clientId`, `eventTypeId` - Required
- `date`, `startTime`, `endTime`, `guests` - Required
- `date` - Must be in the future
- `guests` - Must be ≤ hall capacity
- `endTime` - Must be after startTime
- **Overlap check**: No overlapping reservations for same hall

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "totalPrice": "4000.00",
    "status": "PENDING",
    ...
  },
  "message": "Reservation created successfully"
}
```

**Note**: `totalPrice` is automatically calculated as `guests × pricePerPerson`

### Update Reservation (STAFF)
```bash
PUT /api/reservations/:id
{
  "date": "2026-06-20",
  "guests": 90,
  "notes": "Zwiększona liczba gości",
  "depositPaid": true
}
```

**Business Rules**:
- Cannot update COMPLETED or CANCELLED reservations
- Price recalculated automatically if guests changed
- Overlap check if date/time changed
- All changes tracked in ReservationHistory

### Update Reservation Status (STAFF)
```bash
PATCH /api/reservations/:id/status
{
  "status": "CONFIRMED",
  "reason": "Deposit paid, reservation confirmed"
}
```

**Status Workflow**:
- `PENDING` → `CONFIRMED` or `CANCELLED`
- `CONFIRMED` → `COMPLETED` or `CANCELLED`
- `COMPLETED` → (no transitions)
- `CANCELLED` → (no transitions)

### Cancel Reservation (ADMIN)
```bash
DELETE /api/reservations/:id
{
  "reason": "Client request"
}
```

**Note**: Sets status to CANCELLED and archives the reservation

---

## 💰 Deposit Management ✨ NEW!

### List All Deposits (STAFF)
```bash
GET /api/deposits
GET /api/deposits?status=PENDING
GET /api/deposits?status=PAID
GET /api/deposits?overdue=true
GET /api/deposits?dateFrom=2026-01-01&dateTo=2026-12-31
GET /api/deposits?search=Kowalski
GET /api/deposits?page=1&perPage=20
```

**Query Parameters**:
- `status` - Filter by status: PENDING, PARTIAL, PAID, OVERDUE
- `overdue` - Show only overdue deposits (boolean)
- `dateFrom` / `dateTo` - Filter by due date range
- `search` - Search in client name
- `page` / `perPage` - Pagination

**Response**:
```json
{
  "deposits": [
    {
      "id": "uuid",
      "receiptNumber": "ZAL-2026-0001",
      "reservationId": "uuid",
      "amount": 1500.00,
      "amountPaid": 1500.00,
      "dueDate": "2026-05-15T00:00:00.000Z",
      "status": "PAID",
      "notes": "Zaliczka na wesele",
      "reminderSent": false,
      "createdAt": "2026-02-11T00:00:00.000Z",
      "updatedAt": "2026-02-11T10:30:00.000Z",
      "reservation": {
        "id": "uuid",
        "date": "2026-06-15",
        "eventType": "Ślub",
        "hall": "Sala Bankietowa",
        "client": {
          "firstName": "Jan",
          "lastName": "Kowalski",
          "phone": "+48123456789",
          "email": "jan@example.com"
        }
      },
      "payments": [
        {
          "id": "uuid",
          "amount": 1500.00,
          "paymentDate": "2026-02-11T10:30:00.000Z",
          "paymentMethod": "TRANSFER",
          "notes": "Przelew bankowy"
        }
      ]
    }
  ],
  "total": 25,
  "page": 1,
  "perPage": 20,
  "totalPages": 2
}
```

### Get Deposit by ID (STAFF)
```bash
GET /api/deposits/:id
```

**Response**: Single deposit with full reservation and payment history

### Get Deposits for Reservation (STAFF)
```bash
GET /api/reservations/:reservationId/deposits
```

**Response**: All deposits associated with specific reservation

### Create Deposit (STAFF)
```bash
POST /api/deposits
{
  "reservationId": "uuid",
  "amount": 1500.00,
  "dueDate": "2026-05-15",
  "notes": "Zaliczka na wesele - 30% wartości rezerwacji"
}
```

**Validation**:
- `reservationId` - Required, must exist
- `amount` - Required, must be > 0
- `dueDate` - Required
- Auto-generates unique `receiptNumber` (ZAL-YYYY-NNNN)
- Initial status is PENDING

**Response**:
```json
{
  "id": "uuid",
  "receiptNumber": "ZAL-2026-0001",
  "reservationId": "uuid",
  "amount": 1500.00,
  "amountPaid": 0,
  "dueDate": "2026-05-15T00:00:00.000Z",
  "status": "PENDING",
  "notes": "Zaliczka na wesele - 30% wartości rezerwacji",
  "createdAt": "2026-02-11T00:00:00.000Z"
}
```

### Update Deposit (STAFF)
```bash
PUT /api/deposits/:id
{
  "amount": 1800.00,
  "dueDate": "2026-05-20",
  "notes": "Zaktualizowana kwota zaliczki"
}
```

**Business Rules**:
- Cannot update if status is PAID
- Amount must be >= amountPaid
- Status recalculated automatically

### Delete Deposit (ADMIN)
```bash
DELETE /api/deposits/:id
```

**Note**: Can only delete deposits with status PENDING and no payments

### Add Payment to Deposit (STAFF)
```bash
POST /api/deposits/:depositId/payments
{
  "amount": 750.00,
  "paymentDate": "2026-03-15",
  "paymentMethod": "CASH",
  "notes": "Pierwsza wpłata - gotówka"
}
```

**Payment Methods**:
- `CASH` - Gotówka
- `TRANSFER` - Przelew bankowy
- `CARD` - Karta płatnicza
- `OTHER` - Inna metoda

**Validation**:
- `amount` - Required, must be > 0
- `paymentDate` - Required
- `paymentMethod` - Required
- Amount cannot exceed remaining balance
- Automatically updates deposit status:
  - PENDING → PARTIAL (if partial payment)
  - PARTIAL/PENDING → PAID (if fully paid)

**Response**:
```json
{
  "id": "uuid",
  "depositId": "uuid",
  "amount": 750.00,
  "paymentDate": "2026-03-15T00:00:00.000Z",
  "paymentMethod": "CASH",
  "notes": "Pierwsza wpłata - gotówka",
  "createdAt": "2026-03-15T10:00:00.000Z",
  "deposit": {
    "id": "uuid",
    "amount": 1500.00,
    "amountPaid": 750.00,
    "status": "PARTIAL"
  }
}
```

### Get Deposit Statistics (STAFF)
```bash
GET /api/deposits/statistics
```

**Response**:
```json
{
  "totalDeposits": 25,
  "totalAmount": 37500.00,
  "totalPaid": 28000.00,
  "totalRemaining": 9500.00,
  "paidCount": 18,
  "pendingCount": 5,
  "partialCount": 2,
  "overdueCount": 3,
  "upcomingDueCount": 4
}
```

**Statistics Breakdown**:
- `totalDeposits` - Total number of deposits
- `totalAmount` - Sum of all deposit amounts
- `totalPaid` - Sum of all payments made
- `totalRemaining` - Amount still to be paid
- `paidCount` - Fully paid deposits
- `pendingCount` - Awaiting first payment
- `partialCount` - Partially paid
- `overdueCount` - Past due date and not fully paid
- `upcomingDueCount` - Due within next 7 days

### Get Pending Reminders (STAFF)
```bash
GET /api/deposits/reminders/pending
```

**Response**: List of deposits requiring payment reminders (due within 7 days, not fully paid, reminder not sent)

### Mark Reminder as Sent (STAFF)
```bash
PUT /api/deposits/:depositId/reminder-sent
```

**Response**: Updated deposit with `reminderSent: true`

---

## 🔒 Role-Based Access Control

| Endpoint | ADMIN | EMPLOYEE | CLIENT |
|----------|-------|----------|--------|
| **Halls** |
| List/Get | ✅ | ✅ | ✅ |
| Create | ✅ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| **Clients** |
| List/Get | ✅ | ✅ | ❌ |
| Create | ✅ | ✅ | ❌ |
| Update | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| **Event Types** |
| List/Get | ✅ | ✅ | ✅ |
| Create | ✅ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| **Reservations** |
| List/Get | ✅ | ✅ | ❌ |
| Create | ✅ | ✅ | ❌ |
| Update | ✅ | ✅ | ❌ |
| Update Status | ✅ | ✅ | ❌ |
| Cancel | ✅ | ❌ | ❌ |
| **Deposits** ✨ |
| List/Get | ✅ | ✅ | ❌ |
| Create | ✅ | ✅ | ❌ |
| Update | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| Add Payment | ✅ | ✅ | ❌ |
| Statistics | ✅ | ✅ | ❌ |
| Reminders | ✅ | ✅ | ❌ |

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Name, capacity, and pricePerPerson are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Deposit not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Payment amount exceeds remaining balance"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 📊 Common Patterns

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully" // optional
}
```

### List Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "count": 10
}
```

### Paginated Response
```json
{
  "data": [ /* array of items */ ],
  "total": 100,
  "page": 1,
  "perPage": 20,
  "totalPages": 5
}
```

---

## 🔧 Development

### Health Check
```bash
GET /api/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T16:00:00.000Z",
  "uptime": 12345.67
}
```

### Testing
```bash
# Using curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"ValidPass123!"}'

# Save token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"ValidPass123!"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Create deposit
curl -X POST http://localhost:3001/api/deposits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reservationId": "uuid",
    "amount": 1500.00,
    "dueDate": "2026-05-15",
    "notes": "Zaliczka 30%"
  }'

# Add payment
curl -X POST http://localhost:3001/api/deposits/{depositId}/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 750.00,
    "paymentDate": "2026-03-15",
    "paymentMethod": "CASH",
    "notes": "Pierwsza wpłata"
  }'

# Get statistics
curl http://localhost:3001/api/deposits/statistics \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Implementation Status

### Completed (100%)
- ✅ Authentication & Authorization
- ✅ Hall Management API (5 endpoints)
- ✅ Client Management API (5 endpoints)
- ✅ Event Type Management API (5 endpoints)
- ✅ Reservation Management API (6 endpoints)
- ✅ **Deposit Management API (10 endpoints)** ✨ NEW!

**Total**: 31 REST API endpoints (+10 from v1.0.0)

### Features Implemented
- ✅ JWT Authentication
- ✅ Role-Based Access Control (ADMIN, EMPLOYEE, CLIENT)
- ✅ Automatic price calculation
- ✅ Overlap detection for reservations
- ✅ Status workflow management
- ✅ Complete audit trail (ReservationHistory)
- ✅ Comprehensive validation
- ✅ Business rules enforcement
- ✅ **Deposit tracking & management** ✨
- ✅ **Partial payment support** ✨
- ✅ **Payment history** ✨
- ✅ **Automatic status updates** ✨
- ✅ **Statistics & reporting** ✨
- ✅ **Payment reminders** ✨

---

## 📈 API Statistics

- **Modules**: 5 (Auth, Halls, Clients, Event Types, Reservations, **Deposits**)
- **Endpoints**: 31 (+10)
- **Story Points**: 75/75 (100%)
- **Version**: 1.1.0
- **Status**: ✅ Production Ready

---

## 🆕 Changelog

### v1.1.0 (2026-02-11)
- ✨ **NEW**: Deposit Management Module
  - CRUD operations for deposits
  - Partial payment support
  - Payment history tracking
  - Automatic status management
  - Statistics and reporting
  - Payment reminder system
  - 10 new API endpoints

### v1.0.0 (2026-02-06)
- Initial release
- Core reservation system
- Hall, client, event type management
- 21 API endpoints
