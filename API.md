# 🚀 Rezerwacje API Documentation

**Base URL**: `http://localhost:3001/api`  
**Version**: 0.2.0-alpha  
**Last Updated**: 2026-02-06

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

### Pagination (Coming in Sprint 3)
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
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
```

---

## 🚀 Next API Module

### Reservation Management (Sprint 3)
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - List with filters
- `GET /api/reservations/:id` - Get details
- `PUT /api/reservations/:id` - Update reservation
- `PATCH /api/reservations/:id/status` - Change status
- `DELETE /api/reservations/:id` - Cancel reservation

**Features**:
- Overlap detection
- Price calculation
- Status workflow
- Deposit tracking
- History audit trail
