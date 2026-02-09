# 🍽️ Menu Management System

**Version:** 1.0.0  
**Created:** 2026-02-09  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Snapshot Pattern](#snapshot-pattern)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [Integration with Reservations](#integration-with-reservations)
8. [Price Calculation](#price-calculation)
9. [Testing](#testing)
10. [Examples](#examples)

---

## 📖 Overview

### Purpose

Menu Management System allows administrators to create and manage event-specific menus with packages and options. The system uses a **snapshot architecture** to preserve historical menu selections even when templates change.

### Key Features

✅ **Event-Specific Menus** - Each event type has custom menus  
✅ **Package Tiers** - Basic, Standard, Premium pricing tiers  
✅ **Add-On Options** - DJ, catering, photography, decorations  
✅ **Snapshot Architecture** - Immutable historical records  
✅ **Time-Based Validity** - Menus valid for specific periods  
✅ **Price History Tracking** - Full audit trail of price changes  
✅ **Drag & Drop Reordering** - Easy package management  
✅ **Premium UI** - Gradients, animations, dark mode support

### Use Cases

1. **Admin**: Create spring wedding menu → 3 packages (Silver, Gold, Diamond) → Assign 15 options
2. **Client**: Select Gold Package → Add DJ + Open Bar → System creates snapshot
3. **Admin**: Update prices in June → Old reservations preserve original prices ✅

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    MENU MANAGEMENT SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   TEMPLATE   │──────│   PACKAGES   │                     │
│  │   LAYER      │ 1:M  │   (Tiers)    │                     │
│  └──────────────┘      └──────┬───────┘                     │
│         │                      │                              │
│         │                      │ M:M                          │
│         │                      │                              │
│         │               ┌──────▼───────┐                     │
│         │               │   OPTIONS    │                     │
│         │               │  (Add-ons)   │                     │
│         │               └──────────────┘                     │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────┐                   │
│  │        RESERVATION SNAPSHOT           │                   │
│  │  (Immutable copy at selection time)   │                   │
│  └──────────────────────────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Admin creates Menu Template
   └─> Adds Packages (Silver, Gold, Diamond)
       └─> Assigns Options to each Package

2. Client views available menus for event type
   └─> Selects Package
       └─> Adds optional Options

3. System creates Snapshot
   └─> Copies all menu data to JSON
       └─> Calculates totals
           └─> Saves to ReservationMenuSnapshot

4. Admin updates menu prices (next season)
   └─> New reservations use new prices ✅
       └─> Old reservations keep original prices ✅
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```sql
┌─────────────────────┐
│   EventType         │
├─────────────────────┤
│ PK  id              │
│     name            │
└──────┬──────────────┘
       │ 1
       │
       ▼ M
┌─────────────────────┐
│   MenuTemplate      │
├─────────────────────┤
│ PK  id              │
│ FK  eventTypeId     │
│     name            │
│     validFrom       │
│     validTo         │
└──────┬──────────────┘
       │ 1
       │
       ▼ M
┌─────────────────────┐
│   MenuPackage       │
├─────────────────────┤
│ PK  id              │
│ FK  menuTemplateId  │
│     name            │
│     pricePerAdult   │
│     pricePerChild   │
│     includedItems[] │
└──────┬──────────────┘
       │ M
       │
       ▼ M
┌─────────────────────┐        ┌─────────────────────┐
│ MenuPackageOption   │   M:M  │   MenuOption        │
├─────────────────────┤◄───────┤─────────────────────┤
│ PK  id              │        │ PK  id              │
│ FK  packageId       │        │     name            │
│ FK  optionId        │        │     category        │
│     customPrice     │        │     priceType       │
│     isDefault       │        │     priceAmount     │
└─────────────────────┘        └─────────────────────┘

┌─────────────────────────────┐
│ ReservationMenuSnapshot     │
├─────────────────────────────┤
│ PK  id                      │
│ FK  reservationId (UNIQUE)  │
│     menuData (JSONB)        │ ← SNAPSHOT!
│     packagePrice            │
│     optionsPrice            │
│     totalMenuPrice          │
└─────────────────────────────┘
```

### Key Tables

#### MenuTemplate

**Purpose**: Base template for event-specific menus

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `eventTypeId` | UUID | FK to EventType |
| `name` | String | "Menu Weselne Wiosna 2026" |
| `validFrom` | DateTime | Start date |
| `validTo` | DateTime | End date (optional) |
| `isActive` | Boolean | Active status |
| `variant` | String | "Zimowe", "Letnie" |

#### MenuPackage

**Purpose**: Pricing tiers within a menu

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `menuTemplateId` | UUID | FK to MenuTemplate |
| `name` | String | "Pakiet Złoty" |
| `pricePerAdult` | Decimal | Price per adult |
| `pricePerChild` | Decimal | Price per child (4-12) |
| `pricePerToddler` | Decimal | Price per toddler (0-3) |
| `includedItems` | String[] | ["Tort", "Kelnerzy"] |
| `isPopular` | Boolean | Show "Popular" badge |
| `color` | String | "#FFD700" for UI |

#### MenuOption

**Purpose**: Add-on services/items

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | String | "DJ + Nagłośnienie" |
| `category` | String | "Muzyka", "Alkohol", etc. |
| `priceType` | Enum | PER_PERSON, FLAT, FREE |
| `priceAmount` | Decimal | Price value |
| `allowMultiple` | Boolean | Can select multiple? |

#### ReservationMenuSnapshot

**Purpose**: Immutable copy of selected menu

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `reservationId` | UUID | FK to Reservation (UNIQUE) |
| `menuData` | JSONB | **Complete snapshot** |
| `packagePrice` | Decimal | Calculated package cost |
| `optionsPrice` | Decimal | Calculated options cost |
| `totalMenuPrice` | Decimal | Total menu cost |
| `adultsCount` | Integer | Guest count snapshot |
| `selectedAt` | DateTime | Selection timestamp |

---

## 🔌 API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication

All endpoints require JWT token:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Menu Templates

#### List All Templates

```http
GET /api/menu-templates
GET /api/menu-templates?eventTypeId=uuid
GET /api/menu-templates?isActive=true
GET /api/menu-templates?date=2026-05-15
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "tpl-123",
      "eventTypeId": "evt-456",
      "name": "Menu Weselne Wiosna 2026",
      "description": "Eleganckie menu weselne...",
      "variant": "Wiosenne",
      "validFrom": "2026-03-01T00:00:00Z",
      "validTo": "2026-06-30T23:59:59Z",
      "isActive": true,
      "displayOrder": 1,
      "eventType": {
        "id": "evt-456",
        "name": "Wesele",
        "color": "#FF69B4"
      },
      "packages": [
        {
          "id": "pkg-789",
          "name": "Pakiet Złoty",
          "pricePerAdult": 300,
          "isPopular": true
        }
      ]
    }
  ],
  "count": 1
}
```

#### Get Active Menu for Event Type

```http
GET /api/menu-templates/active/:eventTypeId
GET /api/menu-templates/active/:eventTypeId?date=2026-05-15
```

Returns the currently active menu template for the event type on the specified date (default: today).

#### Create Menu Template (ADMIN)

```http
POST /api/menu-templates
```

**Request:**

```json
{
  "eventTypeId": "evt-456",
  "name": "Menu Weselne Lato 2026",
  "description": "Letnie menu z sezonowymi dodatkami",
  "variant": "Letnie",
  "validFrom": "2026-07-01",
  "validTo": "2026-09-30",
  "displayOrder": 1,
  "imageUrl": "/images/menus/summer-2026.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "tpl-new",
    "eventTypeId": "evt-456",
    "name": "Menu Weselne Lato 2026",
    "validFrom": "2026-07-01T00:00:00Z",
    "validTo": "2026-09-30T23:59:59Z",
    "isActive": true,
    "createdAt": "2026-02-09T22:00:00Z"
  }
}
```

#### Update Menu Template (ADMIN)

```http
PUT /api/menu-templates/:id
```

**Request:**

```json
{
  "name": "Menu Weselne Lato 2026 UPDATED",
  "validTo": "2026-10-15",
  "isActive": false
}
```

#### Duplicate Menu Template (ADMIN)

```http
POST /api/menu-templates/:id/duplicate
```

**Request:**

```json
{
  "newName": "Menu Weselne Jesień 2026",
  "newVariant": "Jesienne",
  "validFrom": "2026-10-01",
  "validTo": "2026-12-31",
  "copyPackages": true,
  "copyOptions": true
}
```

Creates a complete copy of the template with all packages and options.

#### Delete Menu Template (ADMIN)

```http
DELETE /api/menu-templates/:id
```

**Note**: Cannot delete template used in active reservations.

---

### Menu Packages

#### List Packages in Template

```http
GET /api/menu-packages/:templateId
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "pkg-silver",
      "menuTemplateId": "tpl-123",
      "name": "Pakiet Srebrny",
      "description": "Klasyczny pakiet weselny",
      "pricePerAdult": 200,
      "pricePerChild": 100,
      "pricePerToddler": 0,
      "color": "#C0C0C0",
      "icon": "medal",
      "displayOrder": 1,
      "isPopular": false,
      "includedItems": [
        "Tort 2-piętrowy",
        "Obrus + serwetki",
        "Kelner (1 osoba)"
      ],
      "packageOptions": [
        {
          "id": "pko-1",
          "option": {
            "id": "opt-dj",
            "name": "DJ + Nagłośnienie",
            "category": "Muzyka",
            "priceType": "FLAT",
            "priceAmount": 2000
          },
          "isDefault": false
        }
      ]
    }
  ]
}
```

#### Create Package (ADMIN)

```http
POST /api/menu-packages
```

**Request:**

```json
{
  "menuTemplateId": "tpl-123",
  "name": "Pakiet Złoty",
  "description": "Najpopularniejszy wybór par młodych",
  "shortDescription": "Kompleksowa obsługa + dekoracje",
  "pricePerAdult": 300,
  "pricePerChild": 150,
  "pricePerToddler": 0,
  "color": "#FFD700",
  "icon": "star",
  "badgeText": "Najpopularniejszy",
  "displayOrder": 2,
  "isPopular": true,
  "isRecommended": true,
  "includedItems": [
    "Tort 3-piętrowy",
    "Kelnerzy (2 osoby)",
    "Dekoracje stołów"
  ],
  "minGuests": 50,
  "maxGuests": 120
}
```

#### Update Package (ADMIN)

```http
PUT /api/menu-packages/:id
```

#### Reorder Packages (ADMIN)

```http
PUT /api/menu-packages/reorder
```

**Request:**

```json
{
  "packageOrders": [
    { "packageId": "pkg-1", "displayOrder": 1 },
    { "packageId": "pkg-2", "displayOrder": 2 },
    { "packageId": "pkg-3", "displayOrder": 3 }
  ]
}
```

#### Delete Package (ADMIN)

```http
DELETE /api/menu-packages/:id
```

---

### Menu Options

#### List All Options

```http
GET /api/menu-options
GET /api/menu-options?category=Muzyka
GET /api/menu-options?isActive=true
GET /api/menu-options?search=DJ
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "opt-dj",
      "name": "DJ + Nagłośnienie",
      "description": "Profesjonalny DJ z własnym sprzętem",
      "category": "Muzyka",
      "priceType": "FLAT",
      "priceAmount": 2000,
      "allowMultiple": false,
      "maxQuantity": 1,
      "icon": "music",
      "isActive": true,
      "displayOrder": 1
    }
  ],
  "count": 1
}
```

#### Create Option (ADMIN)

```http
POST /api/menu-options
```

**Request:**

```json
{
  "name": "Fotograf (8h)",
  "description": "Profesjonalny fotograf ślubny - 8 godzin + 500 zdjęć",
  "shortDescription": "Fotografia ślubna cały dzień",
  "category": "Foto & Video",
  "priceType": "FLAT",
  "priceAmount": 3000,
  "allowMultiple": false,
  "maxQuantity": 1,
  "icon": "camera",
  "imageUrl": "/images/options/photographer.jpg",
  "displayOrder": 1
}
```

#### Update Option (ADMIN)

```http
PUT /api/menu-options/:id
```

#### Delete Option (ADMIN)

```http
DELETE /api/menu-options/:id
```

---

### Assign Options to Package

#### Assign Multiple Options (ADMIN)

```http
POST /api/menu-packages/:packageId/options
```

**Request:**

```json
{
  "options": [
    {
      "optionId": "opt-dj",
      "customPrice": null,
      "isRequired": false,
      "isDefault": true,
      "displayOrder": 1
    },
    {
      "optionId": "opt-bar",
      "customPrice": 45,
      "isRequired": false,
      "isDefault": false,
      "displayOrder": 2
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "assigned": 2,
    "packageOptions": [
      { "optionId": "opt-dj", "customPrice": null },
      { "optionId": "opt-bar", "customPrice": 45 }
    ]
  }
}
```

---

### Reservation Menu Selection

#### Select Menu for Reservation

```http
POST /api/reservations/:reservationId/select-menu
```

**Request:**

```json
{
  "packageId": "pkg-gold",
  "selectedOptions": [
    { "optionId": "opt-dj", "quantity": 1 },
    { "optionId": "opt-bar", "quantity": 1 },
    { "optionId": "opt-photo", "quantity": 1 }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "snapshot": {
      "id": "snap-123",
      "reservationId": "res-456",
      "menuData": {
        "templateName": "Menu Weselne Wiosna 2026",
        "packageName": "Pakiet Złoty",
        "pricePerAdult": 300,
        "pricePerChild": 150,
        "selectedOptions": [
          {
            "name": "DJ + Nagłośnienie",
            "priceType": "FLAT",
            "priceAmount": 2000,
            "quantity": 1,
            "totalPrice": 2000
          },
          {
            "name": "Bar Open",
            "priceType": "PER_PERSON",
            "priceAmount": 50,
            "quantity": 1,
            "totalPrice": 4000
          }
        ]
      },
      "packagePrice": 24000,
      "optionsPrice": 6000,
      "totalMenuPrice": 30000,
      "adultsCount": 60,
      "childrenCount": 20,
      "toddlersCount": 0,
      "selectedAt": "2026-02-09T22:30:00Z"
    },
    "priceBreakdown": {
      "packageCost": {
        "adults": { "count": 60, "priceEach": 300, "total": 18000 },
        "children": { "count": 20, "priceEach": 150, "total": 3000 },
        "toddlers": { "count": 0, "priceEach": 0, "total": 0 },
        "subtotal": 21000
      },
      "optionsCost": [
        {
          "option": "DJ + Nagłośnienie",
          "priceType": "FLAT",
          "priceEach": 2000,
          "quantity": 1,
          "total": 2000
        },
        {
          "option": "Bar Open",
          "priceType": "PER_PERSON",
          "priceEach": 50,
          "quantity": 80,
          "total": 4000
        }
      ],
      "optionsSubtotal": 6000,
      "totalMenuPrice": 27000
    }
  }
}
```

#### Get Menu Snapshot

```http
GET /api/reservations/:reservationId/menu
```

#### Update Menu Selection

```http
PUT /api/reservations/:reservationId/menu
```

#### Remove Menu Selection

```http
DELETE /api/reservations/:reservationId/menu
```

---

## 📸 Snapshot Pattern

### Why Snapshots?

**Problem**: When menu prices change, what happens to existing reservations?

❌ **Traditional FK Approach**:
- Reservation → Package (FK) → Current price = 350 zł
- Admin changes price to 400 zł
- Old reservations now show 400 zł (WRONG!)

✅ **Snapshot Approach**:
- Reservation → Snapshot (JSON) → Original price = 350 zł
- Admin changes template price to 400 zł
- Old reservations STILL show 350 zł (CORRECT!)

### How It Works

```typescript
// 1. Client selects menu
const snapshot = {
  menuData: {
    templateName: "Menu Weselne Wiosna 2026",
    packageName: "Pakiet Złoty",
    pricePerAdult: 300,  // ← Saved at selection time
    selectedOptions: [
      { name: "DJ", priceAmount: 2000 }  // ← Saved
    ]
  },
  packagePrice: 24000,
  optionsPrice: 2000,
  totalMenuPrice: 26000,
  selectedAt: "2026-02-09T22:00:00Z"
};

// 2. Admin changes prices (June 2026)
await prisma.menuPackage.update({
  where: { id: "pkg-gold" },
  data: { pricePerAdult: 350 }  // 300 → 350
});

// 3. Old reservation snapshot is UNCHANGED
const oldReservation = await prisma.reservationMenuSnapshot.findUnique({
  where: { reservationId: "res-feb" }
});

console.log(oldReservation.menuData.pricePerAdult);  // 300 ✅

// 4. New reservation gets current price
const newSnapshot = await createSnapshot("pkg-gold");
console.log(newSnapshot.menuData.pricePerAdult);  // 350 ✅
```

### Benefits

| Aspect | Snapshot |
|--------|----------|
| **Historical Accuracy** | ✅ Perfect |
| **Audit Trail** | ✅ Complete record |
| **Price Changes** | ✅ No impact on old data |
| **Template Deletion** | ✅ Data preserved |
| **Legal Compliance** | ✅ Original contract terms |

---

## 🎨 UI/UX Guidelines

### Design Principles

1. **Premium Look** - Gradients, smooth animations, modern cards
2. **Dark Mode First** - Semantic tokens for all colors
3. **Mobile Responsive** - Touch-friendly, swipe gestures
4. **Accessibility** - ARIA labels, keyboard navigation
5. **Performance** - Lazy loading, optimistic updates

### Color Palette

#### Package Colors

```tsx
const packageColors = {
  silver: {
    light: '#C0C0C0',
    gradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
  },
  gold: {
    light: '#FFD700',
    gradient: 'from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/30'
  },
  diamond: {
    light: '#B9F2FF',
    gradient: 'from-cyan-100 to-blue-200 dark:from-cyan-900/30 dark:to-blue-900/30'
  }
};
```

### Component Examples

#### Package Card

```tsx
<div className="group relative rounded-2xl border border-border bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-950/30 p-6 transition-all hover:scale-105 hover:shadow-2xl">
  {/* Popular Badge */}
  {isPopular && (
    <div className="absolute -top-3 -right-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-1 text-white text-sm font-bold shadow-lg">
      ⭐ Najpopularniejszy
    </div>
  )}
  
  {/* Icon */}
  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-3xl shadow-lg">
    {icon}
  </div>
  
  {/* Name */}
  <h3 className="text-2xl font-bold text-foreground mb-2">
    {name}
  </h3>
  
  {/* Price */}
  <p className="text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
    {pricePerAdult} zł/os
  </p>
  
  {/* Included Items */}
  <ul className="mt-4 space-y-2">
    {includedItems.map((item, i) => (
      <li key={i} className="flex items-center gap-2 text-muted-foreground">
        <Check className="h-4 w-4 text-green-500" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
  
  {/* CTA */}
  <Button 
    className="mt-6 w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
    onClick={() => selectPackage(id)}
  >
    Wybierz Pakiet
  </Button>
</div>
```

#### Option Checkbox

```tsx
<div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent">
  <div className="flex items-center gap-3">
    <Checkbox 
      id={option.id}
      checked={isSelected}
      onCheckedChange={handleToggle}
    />
    <label htmlFor={option.id} className="cursor-pointer">
      <div className="flex items-center gap-2">
        <span className="text-lg">{option.icon}</span>
        <span className="font-semibold text-foreground">{option.name}</span>
      </div>
      <p className="text-sm text-muted-foreground">{option.shortDescription}</p>
    </label>
  </div>
  
  <div className="text-right">
    <p className="font-bold text-foreground">
      {option.priceType === 'FLAT' 
        ? `${option.priceAmount} zł`
        : `${option.priceAmount} zł/os`
      }
    </p>
    <p className="text-xs text-muted-foreground">
      {option.priceType === 'PER_PERSON' && `× ${guestCount} = ${total} zł`}
    </p>
  </div>
</div>
```

#### Price Summary

```tsx
<div className="sticky bottom-0 rounded-t-3xl border-t border-border bg-card/95 backdrop-blur-lg p-6 shadow-2xl">
  <div className="space-y-2">
    <div className="flex justify-between text-muted-foreground">
      <span>Pakiet {packageName}:</span>
      <span>{packagePrice} zł</span>
    </div>
    <div className="flex justify-between text-muted-foreground">
      <span>Opcje dodatkowe:</span>
      <span>{optionsPrice} zł</span>
    </div>
    <Separator />
    <div className="flex justify-between text-xl font-bold">
      <span>RAZEM MENU:</span>
      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
        {totalMenuPrice} zł
      </span>
    </div>
  </div>
  
  <Button 
    className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
    size="lg"
  >
    Potwierdź Wybór
  </Button>
</div>
```

---

## 🔗 Integration with Reservations

### Reservation Flow

```
1. Create Reservation
   └─> Set event type, date, guests

2. Select Hall
   └─> Choose hall based on capacity

3. Select Menu (NEW!)
   └─> Show active menu for event type
       └─> Select package
           └─> Add optional options
               └─> Create snapshot

4. Review & Confirm
   └─> Show complete summary
       └─> Hall price + Menu price = Total

5. Save Reservation
   └─> Status: PENDING
       └─> Menu snapshot attached
```

### Database Relations

```prisma
model Reservation {
  id            String   @id
  hallId        String
  eventTypeId   String
  
  // ... other fields
  
  menuSnapshot  ReservationMenuSnapshot?  // ← NEW!
}

model ReservationMenuSnapshot {
  id            String      @id
  reservationId String      @unique
  menuData      Json
  totalMenuPrice Decimal
  
  reservation   Reservation @relation(fields: [reservationId], references: [id])
}
```

### Price Calculation

```typescript
// Total reservation price
const totalPrice = 
  hallPrice +                    // From Hall
  menuSnapshot.totalMenuPrice +  // From Menu Snapshot
  additionalServices;            // Other services

// Menu snapshot price breakdown
const menuPrice = 
  (adults * pricePerAdult) +
  (children * pricePerChild) +
  (toddlers * pricePerToddler) +
  sum(selectedOptions.map(opt => 
    opt.priceType === 'FLAT' 
      ? opt.priceAmount 
      : opt.priceAmount * totalGuests
  ));
```

---

## 💰 Price Calculation

### Formula

```
Total Menu Price = Package Cost + Options Cost

Package Cost = 
  (adults × pricePerAdult) +
  (children × pricePerChild) +
  (toddlers × pricePerToddler)

Options Cost = Σ(
  if option.priceType === 'FLAT':
    option.priceAmount × quantity
  else if option.priceType === 'PER_PERSON':
    option.priceAmount × totalGuests × quantity
  else:
    0
)

Total Guests = adults + children + toddlers
```

### Example

**Reservation Details:**
- 60 adults, 15 children, 5 toddlers
- Package: Złoty (300 zł/adult, 150 zł/child, 0 zł/toddler)
- Options:
  - DJ: 2000 zł (FLAT)
  - Bar Open: 50 zł/person (PER_PERSON)
  - Fotograf: 2500 zł (FLAT)

**Calculation:**

```
Package Cost:
  60 × 300 = 18,000 zł
  15 × 150 = 2,250 zł
  5 × 0 = 0 zł
  ─────────────────
  Subtotal: 20,250 zł

Options Cost:
  DJ: 2000 zł (FLAT)
  Bar Open: 50 × 80 = 4,000 zł (PER_PERSON × total guests)
  Fotograf: 2500 zł (FLAT)
  ─────────────────
  Subtotal: 8,500 zł

Total Menu Price: 20,250 + 8,500 = 28,750 zł
```

---

## 🧪 Testing

### Unit Tests

```typescript
// menu.service.test.ts
describe('MenuService', () => {
  describe('calculateMenuPrice', () => {
    it('should calculate package price correctly', () => {
      const result = calculateMenuPrice({
        package: { pricePerAdult: 300, pricePerChild: 150, pricePerToddler: 0 },
        guests: { adults: 60, children: 15, toddlers: 5 },
        options: []
      });
      
      expect(result.packagePrice).toBe(20250);
    });
    
    it('should calculate FLAT options correctly', () => {
      const result = calculateMenuPrice({
        package: { pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0 },
        guests: { adults: 50, children: 10, toddlers: 0 },
        options: [
          { priceType: 'FLAT', priceAmount: 2000, quantity: 1 }
        ]
      });
      
      expect(result.optionsPrice).toBe(2000);
    });
    
    it('should calculate PER_PERSON options correctly', () => {
      const result = calculateMenuPrice({
        package: { pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0 },
        guests: { adults: 50, children: 10, toddlers: 0 },
        options: [
          { priceType: 'PER_PERSON', priceAmount: 50, quantity: 1 }
        ]
      });
      
      expect(result.optionsPrice).toBe(3000); // 50 × 60 guests
    });
  });
  
  describe('createSnapshot', () => {
    it('should create immutable snapshot', async () => {
      const snapshot = await menuService.createSnapshot({
        reservationId: 'res-123',
        packageId: 'pkg-gold',
        selectedOptions: [{ optionId: 'opt-dj', quantity: 1 }],
        guests: { adults: 80, children: 20, toddlers: 0 }
      });
      
      expect(snapshot.menuData).toHaveProperty('packageName');
      expect(snapshot.totalMenuPrice).toBeGreaterThan(0);
    });
  });
});
```

### Integration Tests

```typescript
// menu.api.test.ts
describe('Menu API', () => {
  it('POST /api/menu-templates - should create template', async () => {
    const response = await request(app)
      .post('/api/menu-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventTypeId: eventType.id,
        name: 'Test Menu',
        validFrom: '2026-01-01',
        isActive: true
      });
      
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
  
  it('POST /api/reservations/:id/select-menu - should create snapshot', async () => {
    const response = await request(app)
      .post(`/api/reservations/${reservation.id}/select-menu`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        packageId: package.id,
        selectedOptions: [
          { optionId: option.id, quantity: 1 }
        ]
      });
      
    expect(response.status).toBe(200);
    expect(response.body.data.snapshot).toHaveProperty('menuData');
  });
});
```

---

## 📚 Examples

### Example 1: Create Complete Menu

```typescript
// 1. Create template
const template = await prisma.menuTemplate.create({
  data: {
    eventTypeId: weddingTypeId,
    name: 'Menu Weselne Wiosna 2026',
    validFrom: new Date('2026-03-01'),
    validTo: new Date('2026-06-30'),
    isActive: true
  }
});

// 2. Create packages
const goldPackage = await prisma.menuPackage.create({
  data: {
    menuTemplateId: template.id,
    name: 'Pakiet Złoty',
    pricePerAdult: 300,
    pricePerChild: 150,
    pricePerToddler: 0,
    color: '#FFD700',
    icon: 'star',
    isPopular: true,
    includedItems: ['Tort 3-piętrowy', 'Kelnerzy', 'Dekoracje']
  }
});

// 3. Create options
const djOption = await prisma.menuOption.create({
  data: {
    name: 'DJ + Nagłośnienie',
    category: 'Muzyka',
    priceType: 'FLAT',
    priceAmount: 2000,
    icon: 'music'
  }
});

// 4. Assign option to package
await prisma.menuPackageOption.create({
  data: {
    packageId: goldPackage.id,
    optionId: djOption.id,
    isDefault: true
  }
});
```

### Example 2: Client Selects Menu

```typescript
// Client selects package + options
const snapshot = await menuService.selectMenu({
  reservationId: 'res-456',
  packageId: 'pkg-gold',
  selectedOptions: [
    { optionId: 'opt-dj', quantity: 1 },
    { optionId: 'opt-bar', quantity: 1 }
  ],
  guests: {
    adults: 60,
    children: 20,
    toddlers: 0
  }
});

// Snapshot created with immutable data
console.log(snapshot.totalMenuPrice); // 26000 zł
```

### Example 3: Admin Updates Prices

```typescript
// Update package price
await prisma.menuPackage.update({
  where: { id: 'pkg-gold' },
  data: { pricePerAdult: 350 } // 300 → 350
});

// Record price history
await prisma.menuPriceHistory.create({
  data: {
    entityType: 'PACKAGE',
    entityId: 'pkg-gold',
    packageId: 'pkg-gold',
    fieldName: 'pricePerAdult',
    oldValue: 300,
    newValue: 350,
    changeReason: 'Sezonowa podwyżka',
    effectiveFrom: new Date()
  }
});

// Old reservations UNCHANGED (snapshot preserved)
const oldReservation = await prisma.reservationMenuSnapshot.findUnique({
  where: { reservationId: 'res-feb' }
});
console.log(oldReservation.menuData.pricePerAdult); // Still 300 ✅

// New reservations get new price
const newSnapshot = await menuService.selectMenu({ ... });
console.log(newSnapshot.menuData.pricePerAdult); // 350 ✅
```

---

## 🎉 Summary

✅ **Complete menu management system**  
✅ **Snapshot architecture** for historical accuracy  
✅ **3 event types seeded** (Wedding, Birthday, Communion)  
✅ **7 packages, 33 options** with realistic data  
✅ **Premium UI** with gradients and dark mode  
✅ **Full API documentation** with examples  
✅ **Price calculation** with multiple guest types  
✅ **Integration ready** with reservations

---

**Last Updated:** 2026-02-09  
**Version:** 1.0.0  
**Author:** System Rezerwacji Sal - Gościniec Rodzinny
