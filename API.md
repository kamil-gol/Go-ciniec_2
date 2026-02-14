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

Generates a professionally formatted PDF menu card for the given template. Includes all packages with their dish categories and individual dishes.

**Response**: `application/pdf` binary stream

**Headers**:
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="karta-menu-{slug}.pdf"
```

**Features**:
- Full Polish character support (DejaVu fonts)
- Restaurant branding from env vars (`RESTAURANT_NAME`, `RESTAURANT_ADDRESS`, `RESTAURANT_PHONE`)
- Auto-fetches dishes via PackageCategorySettings → DishCategory → Dish relations
- Separate page sections per package with category grouping

**Example**:
```bash
curl -o karta_menu.pdf \
  http://localhost:3001/api/menu-templates/{id}/pdf \
  -H "Authorization: Bearer $TOKEN"
```

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

### Reorder Packages
```bash
PUT /api/menu-packages/reorder
{ "packageOrders": [{ "id": "uuid", "displayOrder": 1 }, ...] }
```

### Assign Options to Package
```bash
POST /api/menu-packages/:id/options
{ "optionIds": ["uuid1", "uuid2"], "replace": true }
```

---

## ✨ Menu Options

### List All Options
```bash
GET /api/menu-options
GET /api/menu-options?category=Alkohol
GET /api/menu-options?isActive=true
GET /api/menu-options?search=DJ
```

### Get Option by ID
```bash
GET /api/menu-options/:id
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

**Price Types**: `PER_PERSON` (per guest) | `FLAT` (fixed price)

### Update Option (ADMIN)
```bash
PUT /api/menu-options/:id
```

### Delete Option (ADMIN)
```bash
DELETE /api/menu-options/:id
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

**Response** includes full price breakdown:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "priceBreakdown": {
      "packageCost": {
        "adults": { "count": 50, "priceEach": 300, "total": 15000 },
        "children": { "count": 10, "priceEach": 150, "total": 1500 },
        "toddlers": { "count": 5, "priceEach": 0, "total": 0 },
        "subtotal": 16500
      },
      "optionsCost": [
        { "option": "Bar Open", "priceType": "PER_PERSON", "priceEach": 50, "quantity": 65, "total": 3250 }
      ],
      "optionsSubtotal": 3250,
      "totalMenuPrice": 19750
    }
  }
}
```

### Get Reservation Menu
```bash
GET /api/reservations/:id/menu
```

### Update Reservation Menu
```bash
PUT /api/reservations/:id/menu
{ "adultsCount": 55, "childrenCount": 12, "toddlersCount": 5 }
```

### Remove Reservation Menu
```bash
DELETE /api/reservations/:id/menu
```

---

## 🍳 Dish Categories & Dishes

### Dish Categories
```bash
GET    /api/dish-categories          # List all
GET    /api/dish-categories/:id      # Get by ID
POST   /api/dish-categories          # Create
PUT    /api/dish-categories/:id      # Update
DELETE /api/dish-categories/:id      # Delete
```

### Dishes
```bash
GET    /api/dishes                   # List all (filter: ?categoryId=, ?search=, ?isActive=)
GET    /api/dishes/:id               # Get by ID
POST   /api/dishes                   # Create
PUT    /api/dishes/:id               # Update
DELETE /api/dishes/:id               # Delete
```

---

## 💰 Deposits

```bash
GET    /api/deposits                          # List all
GET    /api/deposits/:id                      # Get by ID
POST   /api/deposits                          # Create
PUT    /api/deposits/:id                      # Update
DELETE /api/deposits/:id                      # Delete
GET    /api/reservations/:id/deposits         # Deposits for reservation
POST   /api/deposits/:id/payments             # Add partial payment
```

---

## 🔒 Role-Based Access Control

| Module | ADMIN | EMPLOYEE | CLIENT |
|--------|-------|----------|--------|
| Halls — List/Get | ✅ | ✅ | ✅ |
| Halls — CUD | ✅ | ❌ | ❌ |
| Clients — List/Get | ✅ | ✅ | ❌ |
| Clients — CUD | ✅ | ✅ | ❌ |
| Event Types — List/Get | ✅ | ✅ | ✅ |
| Event Types — CUD | ✅ | ❌ | ❌ |
| Reservations — List/Get | ✅ | ✅ | ❌ |
| Reservations — CUD | ✅ | ✅ | ❌ |
| Menu Templates — List/Get | ✅ | ✅ | ✅ |
| Menu Templates — CUD | ✅ | ❌ | ❌ |
| Menu Templates — PDF | ✅ | ✅ | ❌ |
| Menu Packages — List/Get | ✅ | ✅ | ✅ |
| Menu Packages — CUD | ✅ | ❌ | ❌ |
| Menu Options — List/Get | ✅ | ✅ | ✅ |
| Menu Options — CUD | ✅ | ❌ | ❌ |
| Deposits | ✅ | ✅ | ❌ |

---

## ⚠️ Error Responses

| Code | Meaning |
|------|---------|
| 400 | Bad Request — validation error |
| 401 | Unauthorized — no/invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — cannot delete (has relations) |
| 500 | Internal Server Error |

---

## 🔧 Development

### Health Check
```bash
GET /api/health
```

### Environment Variables (Menu PDF)
```env
RESTAURANT_NAME="Gościniec"
RESTAURANT_ADDRESS="ul. Przykładowa 1, 41-500 Chorzów"
RESTAURANT_PHONE="+48 123 456 789"
RESTAURANT_EMAIL="kontakt@gosciniec.pl"
RESTAURANT_WEBSITE="www.gosciniec.pl"
```

---

## ✅ Implementation Status

### Modules & Endpoints
- Auth (2 endpoints)
- Halls (5 endpoints)
- Clients (5 endpoints)
- Event Types (6 endpoints)
- Reservations (6 endpoints)
- Queue (5 endpoints)
- Menu Templates (8 endpoints incl. duplicate, active-by-event-type, **PDF export**)
- Menu Packages (9 endpoints incl. reorder, assign-options, list-all, by-event-type)
- Menu Options (5 endpoints)
- Reservation Menu (4 endpoints: select, get, update, remove)
- Menu Calculator
- Dish Categories (5 endpoints)
- Dishes (5 endpoints)
- Deposits (6 endpoints)

**Total**: ~71 REST API endpoints  
**Version**: 2.1.0  
**Status**: ✅ Production Ready

---

> 📖 **Szczegółowa dokumentacja Menu API** z pełnymi przykładami curl i response'ami:  
> [`apps/backend/src/routes/README_MENU_API.md`](apps/backend/src/routes/README_MENU_API.md)
