# 🚀 Rezerwacje API Documentation

**Base URL**: `http://localhost:3001/api`  
**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
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
  "error": "Hall not found"
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
  "timestamp": "2026-02-06T16:00:00.000Z",
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

# Use token
curl http://localhost:3001/api/halls \
  -H "Authorization: Bearer $TOKEN"

# Create reservation
curl -X POST http://localhost:3001/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "hallId": "uuid",
    "clientId": "uuid",
    "eventTypeId": "uuid",
    "date": "2026-06-15",
    "startTime": "18:00",
    "endTime": "23:00",
    "guests": 80
  }'
```

---

## ✅ Implementation Status

### Completed (100%)
- ✅ Authentication & Authorization
- ✅ Hall Management API (5 endpoints)
- ✅ Client Management API (5 endpoints)
- ✅ Event Type Management API (5 endpoints)
- ✅ Reservation Management API (6 endpoints)

**Total**: 21 REST API endpoints

### Features Implemented
- ✅ JWT Authentication
- ✅ Role-Based Access Control (ADMIN, EMPLOYEE, CLIENT)
- ✅ Automatic price calculation
- ✅ Overlap detection for reservations
- ✅ Status workflow management
- ✅ Complete audit trail (ReservationHistory)
- ✅ Comprehensive validation
- ✅ Business rules enforcement

---

## 📈 API Statistics

- **Modules**: 4 (Auth, Halls, Clients, Event Types, Reservations)
- **Endpoints**: 21
- **Story Points**: 60/60 (100%)
- **Version**: 1.0.0
- **Status**: ✅ Production Ready
