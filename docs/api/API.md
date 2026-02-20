# 🚀 Rezerwacje API Documentation

**Base URL**: `http://localhost:3001/api`  
**Version**: 2.1.0  
**Last Updated**: 2026-02-14  
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

### Get Hall by ID
```bash
GET /api/halls/:id
```

### Create Hall (ADMIN)
```bash
POST /api/halls
{ "name": "Sala Bankietowa", "capacity": 100, "pricePerPerson": 50.00, "description": "..." }
```

### Update Hall (ADMIN)
```bash
PUT /api/halls/:id
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

### Get Client by ID (STAFF)
```bash
GET /api/clients/:id
```

### Create Client (STAFF)
```bash
POST /api/clients
{ "firstName": "Jan", "lastName": "Kowalski", "email": "...", "phone": "+48123456789" }
```

### Update Client (STAFF)
```bash
PUT /api/clients/:id
```

### Delete Client (ADMIN)
```bash
DELETE /api/clients/:id
```

---

## 🎉 Event Type Management

### List All Event Types
```bash
GET /api/event-types
GET /api/event-types?isActive=true
```

### Get Event Type by ID
```bash
GET /api/event-types/:id
```

Response includes `_count.reservations` and `_count.menuTemplates`.

### Get Event Type Stats
```bash
GET /api/event-types/stats
```

### Create Event Type (ADMIN)
```bash
POST /api/event-types
{ "name": "Ślub", "description": "...", "color": "#EC4899", "isActive": true }
```

### Update Event Type (ADMIN)
```bash
PUT /api/event-types/:id
```

### Delete Event Type (ADMIN)
```bash
DELETE /api/event-types/:id
```

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
  "guests": 80
}
```

### Update Reservation (STAFF)
```bash
PUT /api/reservations/:id
```

### Update Reservation Status (STAFF)
```bash
PATCH /api/reservations/:id/status
{ "status": "CONFIRMED", "reason": "Deposit paid" }
```

**Status Workflow**: PENDING → CONFIRMED → COMPLETED, or → CANCELLED at any stage.

### Cancel Reservation (ADMIN)
```bash
DELETE /api/reservations/:id
```

---

## 🍽️ Menu Templates

### List All Templates
```bash
GET /api/menu-templates
GET /api/menu-templates?eventTypeId=uuid
GET /api/menu-templates?isActive=true
GET /api/menu-templates?date=2026-06-15
```

### Get Template by ID
```bash
GET /api/menu-templates/:id
```

### Get Active Template for Event Type
```bash
GET /api/menu-templates/active/:eventTypeId
GET /api/menu-templates/active/:eventTypeId?date=2026-06-15
```

### Create Template (ADMIN)
```bash
POST /api/menu-templates
{
  "name": "Menu Weselne",
  "variant": "Premium",
  "eventTypeId": "uuid",
  "isActive": true,
  "validFrom": "2026-01-01T00:00:00.000Z",
  "validTo": "2026-12-31T23:59:59.999Z"
}
```

### Update Template (ADMIN)
```bash
PUT /api/menu-templates/:id
```

### Delete Template (ADMIN)
```bash
DELETE /api/menu-templates/:id
```

### Duplicate Template (ADMIN)
```bash
POST /api/menu-templates/:id/duplicate
{ "newName": "Menu Weselne 2027", "newVariant": "Premium" }
```

Duplicates template with all packages and their options.

### Download Menu Card PDF (STAFF) 🆕
```bash
GET /api/menu-templates/:id/pdf
```

Generates a professionally formatted PDF menu card for the given template.

**Response**: `application/pdf` binary stream

---

## 📦 Menu Packages

### List All Active Packages 🆕
```bash
GET /api/menu-packages
```

### List Packages by Template
```bash
GET /api/menu-packages/template/:templateId
```

### List Packages by Event Type 🆕
```bash
GET /api/menu-packages/event-type/:eventTypeId
```

### Get Package by ID
```bash
GET /api/menu-packages/:id
```

### Create Package (ADMIN)
```bash
POST /api/menu-packages
{
  "templateId": "uuid",
  "name": "Standard",
  "priceAdult": 300.00,
  "priceChild": 150.00,
  "priceToddler": 0.00,
  "includedItems": ["Przystawki", "Zupa", "Danie główne", "Deser"],
  "displayOrder": 1
}
```

### Update Package (ADMIN)
```bash
PUT /api/menu-packages/:id
```

### Delete Package (ADMIN)
```bash
DELETE /api/menu-packages/:id
```

---

## ✨ Menu Options

### List All Options
```bash
GET /api/menu-options
GET /api/menu-options?category=Alkohol
GET /api/menu-options?isActive=true
```

### Create Option (ADMIN)
```bash
POST /api/menu-options
{
  "name": "Bar Open",
  "category": "Alkohol",
  "description": "Nieograniczona ilość alkoholu",
  "priceType": "PER_PERSON",
  "priceAmount": 50.00,
  "isActive": true
}
```

---

## 🔗 Reservation Menu Selection

### Select Menu for Reservation
```bash
POST /api/reservations/:id/select-menu
{
  "templateId": "uuid",
  "packageId": "uuid",
  "selectedOptions": [
    { "optionId": "uuid", "quantity": 50 }
  ],
  "adultsCount": 50,
  "childrenCount": 10,
  "toddlersCount": 5
}
```

---

## 🔒 Role-Based Access Control

| Module | ADMIN | EMPLOYEE | CLIENT |
|--------|-------|----------|--------|
| Halls — List/Get | ✅ | ✅ | ✅ |
| Halls — CUD | ✅ | ❌ | ❌ |
| Clients — CUD | ✅ | ✅ | ❌ |
| Reservations — CUD | ✅ | ✅ | ❌ |
| Menu Templates — CUD | ✅ | ❌ | ❌ |
| Menu Packages — CUD | ✅ | ❌ | ❌ |
| Deposits | ✅ | ✅ | ❌ |

---

**Total**: ~71 REST API endpoints  
**Version**: 2.1.0  
**Status**: ✅ Production Ready
