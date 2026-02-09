# 🍽️ Menu System API Documentation

Complete API reference for the Menu Management System.

**Base URL:** `http://localhost:3001/api`

---

## 📋 Table of Contents

1. [Menu Templates](#menu-templates)
2. [Menu Packages](#menu-packages)
3. [Menu Options](#menu-options)
4. [Reservation Menu Selection](#reservation-menu-selection)
5. [Common Schemas](#common-schemas)
6. [Error Responses](#error-responses)

---

## 🎨 Menu Templates

Manage menu templates for different event types.

### List All Templates

```http
GET /api/menu-templates
```

**Query Parameters:**
- `eventTypeId` (optional) - Filter by event type
- `isActive` (optional) - Filter active templates (true/false)
- `date` (optional) - Filter by validity date (ISO string)

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/menu-templates?isActive=true&eventTypeId=wesele-123"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tpl_abc123",
      "name": "Menu Weselne",
      "variant": "Premium",
      "eventTypeId": "wesele-123",
      "eventType": {
        "id": "wesele-123",
        "name": "Wesele",
        "color": "#8b5cf6"
      },
      "isActive": true,
      "validFrom": "2026-01-01T00:00:00.000Z",
      "validTo": "2026-12-31T23:59:59.999Z",
      "packages": [
        { "id": "pkg_1", "name": "Ekonomiczny", "displayOrder": 1 },
        { "id": "pkg_2", "name": "Standard", "displayOrder": 2 }
      ],
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-15T12:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Single Template

```http
GET /api/menu-templates/:id
```

**Example:**
```bash
curl -X GET "http://localhost:3001/api/menu-templates/tpl_abc123"
```

---

### Get Active Template for Event Type

```http
GET /api/menu-templates/active/:eventTypeId
```

**Query Parameters:**
- `date` (optional) - Check validity for specific date (defaults to today)

**Example:**
```bash
curl -X GET "http://localhost:3001/api/menu-templates/active/wesele-123?date=2026-06-15"
```

---

### Create Template

```http
POST /api/menu-templates
```

**Request Body:**
```json
{
  "name": "Menu Weselne",
  "variant": "Premium",
  "eventTypeId": "wesele-123",
  "isActive": true,
  "validFrom": "2026-01-01T00:00:00.000Z",
  "validTo": "2026-12-31T23:59:59.999Z"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3001/api/menu-templates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Weselne",
    "variant": "Premium",
    "eventTypeId": "wesele-123",
    "isActive": true,
    "validFrom": "2026-01-01T00:00:00.000Z",
    "validTo": "2026-12-31T23:59:59.999Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tpl_new123",
    "name": "Menu Weselne",
    "variant": "Premium",
    ...
  },
  "message": "Menu template created successfully"
}
```

---

### Update Template

```http
PUT /api/menu-templates/:id
```

**Request Body:**
```json
{
  "name": "Menu Weselne Deluxe",
  "variant": "Platinum",
  "isActive": true
}
```

**Example:**
```bash
curl -X PUT "http://localhost:3001/api/menu-templates/tpl_abc123" \
  -H "Content-Type: application/json" \
  -d '{"name": "Menu Weselne Deluxe"}'
```

---

### Delete Template

```http
DELETE /api/menu-templates/:id
```

**Example:**
```bash
curl -X DELETE "http://localhost:3001/api/menu-templates/tpl_abc123"
```

**Response:**
```json
{
  "success": true,
  "message": "Menu template deleted successfully"
}
```

---

### Duplicate Template

```http
POST /api/menu-templates/:id/duplicate
```

Duplicates template with all packages and their options.

**Request Body:**
```json
{
  "newName": "Menu Weselne 2027",
  "newVariant": "Premium",
  "validFrom": "2027-01-01T00:00:00.000Z",
  "validTo": "2027-12-31T23:59:59.999Z"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3001/api/menu-templates/tpl_abc123/duplicate" \
  -H "Content-Type: application/json" \
  -d '{
    "newName": "Menu Weselne 2027",
    "newVariant": "Premium",
    "validFrom": "2027-01-01T00:00:00.000Z",
    "validTo": "2027-12-31T23:59:59.999Z"
  }'
```

---

## 📦 Menu Packages

Manage pricing packages within templates.

### List Packages by Template

```http
GET /api/menu-packages/template/:templateId
```

**Example:**
```bash
curl -X GET "http://localhost:3001/api/menu-packages/template/tpl_abc123"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pkg_123",
      "name": "Ekonomiczny",
      "priceAdult": 250.00,
      "priceChild": 125.00,
      "priceToddler": 0.00,
      "includedItems": [
        "3 dania główne",
        "Deser",
        "Napoje bezalkoholowe"
      ],
      "displayOrder": 1,
      "templateId": "tpl_abc123",
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Single Package

```http
GET /api/menu-packages/:id
```

---

### Create Package

```http
POST /api/menu-packages
```

**Request Body:**
```json
{
  "templateId": "tpl_abc123",
  "name": "Standard",
  "priceAdult": 300.00,
  "priceChild": 150.00,
  "priceToddler": 0.00,
  "includedItems": [
    "5 dań głównych",
    "Deser premium",
    "Napoje + kawa/herbata"
  ],
  "displayOrder": 2
}
```

**Example:**
```bash
curl -X POST "http://localhost:3001/api/menu-packages" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "tpl_abc123",
    "name": "Standard",
    "priceAdult": 300.00,
    "priceChild": 150.00,
    "priceToddler": 0.00,
    "includedItems": ["5 dań", "Deser", "Napoje"],
    "displayOrder": 2
  }'
```

---

### Update Package

```http
PUT /api/menu-packages/:id
```

**Request Body:**
```json
{
  "name": "Standard Plus",
  "priceAdult": 320.00,
  "includedItems": [
    "6 dań głównych",
    "Deser premium",
    "Napoje + kawa/herbata + lody"
  ]
}
```

---

### Delete Package

```http
DELETE /api/menu-packages/:id
```

---

### Reorder Packages

```http
PUT /api/menu-packages/reorder
```

Change display order for drag & drop functionality.

**Request Body:**
```json
{
  "packageOrders": [
    { "id": "pkg_1", "displayOrder": 2 },
    { "id": "pkg_2", "displayOrder": 1 },
    { "id": "pkg_3", "displayOrder": 3 }
  ]
}
```

---

### Assign Options to Package

```http
POST /api/menu-packages/:id/options
```

**Request Body:**
```json
{
  "optionIds": ["opt_123", "opt_456", "opt_789"],
  "replace": true
}
```

- `replace: true` - Replace all existing options
- `replace: false` - Add to existing options

---

## ✨ Menu Options

Manage additional menu options (alcohol, music, decorations, etc.).

### List All Options

```http
GET /api/menu-options
```

**Query Parameters:**
- `category` (optional) - Filter by category (e.g., "Alkohol", "Muzyka")
- `isActive` (optional) - Filter active options
- `search` (optional) - Search by name

**Example:**
```bash
curl -X GET "http://localhost:3001/api/menu-options?category=Alkohol&isActive=true"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "opt_123",
      "name": "Bar Open",
      "category": "Alkohol",
      "description": "Nieograniczona ilość alkoholu przez całe wesele",
      "priceType": "PER_PERSON",
      "priceAmount": 50.00,
      "isActive": true,
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Single Option

```http
GET /api/menu-options/:id
```

---

### Create Option

```http
POST /api/menu-options
```

**Request Body:**
```json
{
  "name": "DJ + Oprawa muzyczna",
  "category": "Muzyka",
  "description": "Profesjonalny DJ z nagłośnieniem i oświetleniem",
  "priceType": "FLAT",
  "priceAmount": 800.00,
  "isActive": true
}
```

**Price Types:**
- `PER_PERSON` - Price per guest
- `FLAT` - Fixed price

**Example:**
```bash
curl -X POST "http://localhost:3001/api/menu-options" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DJ + Oprawa muzyczna",
    "category": "Muzyka",
    "description": "Profesjonalny DJ",
    "priceType": "FLAT",
    "priceAmount": 800.00,
    "isActive": true
  }'
```

---

### Update Option

```http
PUT /api/menu-options/:id
```

**Request Body:**
```json
{
  "name": "DJ Premium",
  "priceAmount": 1200.00
}
```

---

### Delete Option

```http
DELETE /api/menu-options/:id
```

---

## 🎯 Reservation Menu Selection

Client-facing endpoints for selecting menu for reservations.

### Select Menu for Reservation

```http
POST /api/reservations/:id/select-menu
```

Creates a menu snapshot for the reservation.

**Request Body:**
```json
{
  "templateId": "tpl_abc123",
  "packageId": "pkg_456",
  "selectedOptions": [
    {
      "optionId": "opt_123",
      "quantity": 50
    },
    {
      "optionId": "opt_456",
      "quantity": 1
    }
  ],
  "adultsCount": 50,
  "childrenCount": 10,
  "toddlersCount": 5
}
```

**Example:**
```bash
curl -X POST "http://localhost:3001/api/reservations/res_xyz789/select-menu" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "tpl_abc123",
    "packageId": "pkg_456",
    "selectedOptions": [
      {"optionId": "opt_123", "quantity": 50}
    ],
    "adultsCount": 50,
    "childrenCount": 10,
    "toddlersCount": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "menu_snapshot_123",
    "reservationId": "res_xyz789",
    "snapshot": {
      "template": { ... },
      "package": { ... },
      "selectedOptions": [ ... ]
    },
    "priceBreakdown": {
      "packageCost": {
        "adults": { "count": 50, "priceEach": 300, "total": 15000 },
        "children": { "count": 10, "priceEach": 150, "total": 1500 },
        "toddlers": { "count": 5, "priceEach": 0, "total": 0 },
        "subtotal": 16500
      },
      "optionsCost": [
        {
          "option": "Bar Open",
          "priceType": "PER_PERSON",
          "priceEach": 50,
          "quantity": 65,
          "total": 3250
        }
      ],
      "optionsSubtotal": 3250,
      "totalMenuPrice": 19750
    },
    "createdAt": "2026-02-10T10:00:00.000Z"
  },
  "message": "Menu selected successfully"
}
```

---

### Get Reservation Menu

```http
GET /api/reservations/:id/menu
```

Retrieves menu snapshot with price breakdown.

**Example:**
```bash
curl -X GET "http://localhost:3001/api/reservations/res_xyz789/menu"
```

---

### Update Reservation Menu (Guest Counts)

```http
PUT /api/reservations/:id/menu
```

**Request Body:**
```json
{
  "adultsCount": 55,
  "childrenCount": 12,
  "toddlersCount": 5
}
```

**Example:**
```bash
curl -X PUT "http://localhost:3001/api/reservations/res_xyz789/menu" \
  -H "Content-Type: application/json" \
  -d '{
    "adultsCount": 55,
    "childrenCount": 12,
    "toddlersCount": 5
  }'
```

---

### Remove Reservation Menu

```http
DELETE /api/reservations/:id/menu
```

**Example:**
```bash
curl -X DELETE "http://localhost:3001/api/reservations/res_xyz789/menu"
```

---

## 📋 Common Schemas

### MenuTemplate

```typescript
{
  id: string;
  name: string;
  variant?: string;
  eventTypeId: string;
  eventType: {
    id: string;
    name: string;
    color: string;
  };
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
  packages: MenuPackage[];
  createdAt: Date;
  updatedAt: Date;
}
```

### MenuPackage

```typescript
{
  id: string;
  name: string;
  templateId: string;
  priceAdult: number;
  priceChild: number;
  priceToddler: number;
  includedItems: string[];
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### MenuOption

```typescript
{
  id: string;
  name: string;
  category: string;
  description?: string;
  priceType: 'PER_PERSON' | 'FLAT';
  priceAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PriceBreakdown

```typescript
{
  packageCost: {
    adults: { count: number; priceEach: number; total: number };
    children: { count: number; priceEach: number; total: number };
    toddlers: { count: number; priceEach: number; total: number };
    subtotal: number;
  };
  optionsCost: Array<{
    option: string;
    priceType: string;
    priceEach: number;
    quantity: number;
    total: number;
  }>;
  optionsSubtotal: number;
  totalMenuPrice: number;
}
```

---

## ❌ Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "path": ["priceAdult"],
      "message": "Expected number, received string"
    }
  ]
}
```

### Not Found (404)

```json
{
  "success": false,
  "error": "Menu template not found"
}
```

### Conflict (409)

```json
{
  "success": false,
  "error": "Cannot delete menu template: It has associated reservations"
}
```

### Server Error (500)

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message"
}
```

---

## 🚀 Quick Start Examples

### Complete Menu Setup Flow

```bash
# 1. Create menu template
TEMPLATE_ID=$(curl -s -X POST "http://localhost:3001/api/menu-templates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Weselne 2026",
    "variant": "Standard",
    "eventTypeId": "wesele-123",
    "isActive": true,
    "validFrom": "2026-01-01T00:00:00.000Z",
    "validTo": "2026-12-31T23:59:59.999Z"
  }' | jq -r '.data.id')

# 2. Add package
PACKAGE_ID=$(curl -s -X POST "http://localhost:3001/api/menu-packages" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "'$TEMPLATE_ID'",
    "name": "Standard",
    "priceAdult": 300.00,
    "priceChild": 150.00,
    "priceToddler": 0.00,
    "includedItems": ["Przystawki", "Zupa", "Danie główne", "Deser"],
    "displayOrder": 1
  }' | jq -r '.data.id')

# 3. Add option
OPTION_ID=$(curl -s -X POST "http://localhost:3001/api/menu-options" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bar Open",
    "category": "Alkohol",
    "priceType": "PER_PERSON",
    "priceAmount": 50.00,
    "isActive": true
  }' | jq -r '.data.id')

echo "Setup complete!"
echo "Template ID: $TEMPLATE_ID"
echo "Package ID: $PACKAGE_ID"
echo "Option ID: $OPTION_ID"
```

---

## 📖 Frontend Integration

### React Query Hooks

See `/apps/frontend/hooks/use-menu.ts` for ready-to-use hooks:

```typescript
import { useMenuTemplates, useSelectMenu } from '@/hooks/use-menu';

// List templates
const { data: templates } = useMenuTemplates({ isActive: true });

// Select menu
const selectMutation = useSelectMenu();
selectMutation.mutate({
  reservationId: 'res_123',
  selection: {
    templateId: 'tpl_456',
    packageId: 'pkg_789',
    selectedOptions: [...],
    guestCounts: { ... }
  }
});
```

---

## 🔐 Authentication (Coming Soon)

Currently, all endpoints are open. Admin endpoints (POST/PUT/DELETE) will require authentication when auth middleware is enabled.

**Planned:**
- JWT authentication
- Role-based access control (ADMIN, USER)
- Reservation owner verification

---

**Created:** 2026-02-10  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
