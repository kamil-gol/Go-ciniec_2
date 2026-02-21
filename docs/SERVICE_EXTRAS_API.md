# Service Extras API

REST API for managing service extras (venue decoration, music, cake, photography, etc.) assigned to reservations.

Base URL: `/api/service-extras`

## Authentication

All endpoints require `Authorization: Bearer <token>` header. Admin-only endpoints are marked with 🔒.

---

## Categories

### List categories
```
GET /api/service-extras/categories
Query: ?activeOnly=true (optional)
```
Returns all categories with nested items.

### Get category by ID
```
GET /api/service-extras/categories/:id
```

### Create category 🔒
```
POST /api/service-extras/categories
Body: {
  "name": "Muzyka",
  "slug": "muzyka",
  "description": "Oprawa muzyczna",
  "icon": "🎵",
  "color": "#8B5CF6",
  "displayOrder": 0,
  "isActive": true
}
```
- `slug` must be lowercase, alphanumeric with hyphens (unique)
- `displayOrder` auto-increments if omitted

### Update category 🔒
```
PUT /api/service-extras/categories/:id
Body: { "name": "Updated Name", ... } (partial update)
```

### Delete category 🔒
```
DELETE /api/service-extras/categories/:id
```
⚠️ Fails if any items in this category are assigned to reservations. Deactivate instead.

### Reorder categories 🔒
```
POST /api/service-extras/categories/reorder
Body: { "orderedIds": ["uuid1", "uuid2", "uuid3"] }
```

---

## Items

### List all items
```
GET /api/service-extras/items
Query: ?activeOnly=true (optional)
```

### Get item by ID
```
GET /api/service-extras/items/:id
```

### Create item 🔒
```
POST /api/service-extras/items
Body: {
  "categoryId": "uuid",
  "name": "DJ",
  "priceType": "FLAT",
  "basePrice": 2500,
  "icon": "🎧",
  "description": "Professional DJ",
  "isExclusive": false,
  "requiresNote": false,
  "noteLabel": null,
  "isActive": true
}
```

**Price types:**
| Type | Description | Total price calculation |
|------|-------------|------------------------|
| `FLAT` | Fixed fee | `unitPrice × quantity` |
| `PER_PERSON` | Per guest | `unitPrice × (adults + children) × quantity` |
| `FREE` | No charge | `0` |

**Exclusive items:** When `isExclusive: true`, assigning this item removes other items from the same category (e.g., "Standard Decor" vs "Premium Decor").

### Update item 🔒
```
PUT /api/service-extras/items/:id
Body: { ... } (partial update)
```

### Delete item 🔒
```
DELETE /api/service-extras/items/:id
```
⚠️ Fails if item is assigned to any reservation. Deactivate instead.

---

## Reservation Extras

### Get extras for a reservation
```
GET /api/service-extras/reservations/:reservationId/extras
```
Response:
```json
{
  "success": true,
  "data": {
    "extras": [
      {
        "id": "uuid",
        "serviceItemId": "uuid",
        "quantity": 1,
        "unitPrice": 2500,
        "priceType": "FLAT",
        "totalPrice": 2500,
        "note": null,
        "status": "PENDING",
        "serviceItem": { "name": "DJ", "icon": "🎧", "category": { "name": "Muzyka" } }
      }
    ],
    "totalExtrasPrice": 2500,
    "count": 1
  }
}
```

### Assign extra to reservation
```
POST /api/service-extras/reservations/:reservationId/extras
Body: {
  "serviceItemId": "uuid",
  "quantity": 1,
  "note": "Tort czekoladowy, 3 piętra",
  "customPrice": 300
}
```
- `quantity` defaults to 1
- `note` required if item has `requiresNote: true`
- `customPrice` overrides `basePrice` (optional)
- Duplicate items are rejected
- Exclusive items auto-remove conflicting items from same category

### Bulk assign extras (replace all)
```
PUT /api/service-extras/reservations/:reservationId/extras
Body: {
  "extras": [
    { "serviceItemId": "uuid1", "quantity": 1 },
    { "serviceItemId": "uuid2", "note": "Custom note" }
  ]
}
```
⚠️ Replaces ALL existing extras for this reservation.

### Update single extra
```
PUT /api/service-extras/reservations/:reservationId/extras/:extraId
Body: {
  "quantity": 2,
  "note": "Updated note",
  "status": "CONFIRMED",
  "customPrice": 200
}
```

**Statuses:**
| Status | Description |
|--------|-------------|
| `PENDING` | Newly added, awaiting confirmation |
| `CONFIRMED` | Confirmed by admin |
| `CANCELLED` | Cancelled (excluded from total) |

### Remove extra
```
DELETE /api/service-extras/reservations/:reservationId/extras/:extraId
```

---

## Integration with other modules

### Reservation response
`GET /reservations/:id` includes:
```json
{
  "reservationExtras": [...],
  "extrasTotalPrice": 5500,
  "_count": { "reservationExtras": 3 }
}
```

### Revenue / Stats
`GET /api/stats/overview` includes `extrasRevenueThisMonth` and revenue KPIs sum `totalPrice + extrasTotalPrice`.

### Deposits
Deposit limits use the full reservation price: `totalPrice + extrasTotalPrice`.

### PDF
Reservation PDF includes a dedicated "Usługi dodatkowe" section with category grouping, individual prices, and subtotal.

### Email
Confirmation emails include extras list with prices.

### Reports
Revenue reports break down extras by category. CSV export includes extras columns.

### Audit log
All extras operations (create, update, delete, bulk assign) are logged both on the extra entity and on the reservation timeline.

---

## Seed data

To populate the database with example categories and items:
```bash
npx ts-node apps/backend/prisma/seed-service-extras.ts
```

Creates 7 categories with ~30 items (music, cakes, decorations, photo/video, animations, transport, other).
