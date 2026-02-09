# 🍽️ Menu Integration with Reservations

Complete guide to menu integration in the reservation system.

---

## 📍 Overview

Menu integration allows users to:
- ✅ Select menu templates for reservations
- ✅ Choose packages with pricing tiers
- ✅ Add optional extras (alcohol, music, decorations, etc.)
- ✅ View detailed price breakdowns
- ✅ Edit/update menu selections
- ✅ See menu costs alongside reservation costs

---

## 📊 Integration Architecture

```
Reservation Details Page
    │
    ├── Client Info
    ├── Hall Info
    ├── Event Details
    ├── 🍽️ Menu Section (NEW!)
    │   ├── ReservationMenuSection
    │   │   ├── MenuSelectionFlow (Dialog)
    │   │   ├── Package Display
    │   │   ├── Options Display
    │   │   └── Price Breakdown
    │   └── CRUD Actions (Add/Edit/Delete)
    ├── Notes
    ├── Guests Breakdown
    └── Pricing
```

---

## 🧩 Components

### 1. ReservationMenuSection

**Location:** `apps/frontend/components/reservations/ReservationMenuSection.tsx`

**Purpose:** Main component that displays and manages menu for a reservation.

**Props:**
```typescript
interface ReservationMenuSectionProps {
  reservationId: string;          // Reservation ID
  eventTypeId: string;            // Event type to filter templates
  eventDate: Date;                // Date for menu validity check
  adults: number;                 // Adult guest count
  children: number;               // Children count
  toddlers: number;               // Toddlers count
  onMenuUpdated?: () => void;     // Callback after menu changes
}
```

**Features:**
- ✅ Auto-fetch menu if already selected
- ✅ Show "Add Menu" button if no menu
- ✅ Display selected package & options
- ✅ Show price breakdown
- ✅ Edit/delete menu actions
- ✅ Responsive design matching reservation style

**Usage:**
```tsx
import { ReservationMenuSection } from '@/components/reservations/ReservationMenuSection'

<ReservationMenuSection
  reservationId={reservation.id}
  eventTypeId={reservation.eventType.id}
  eventDate={new Date(reservation.startDateTime)}
  adults={reservation.adults}
  children={reservation.children}
  toddlers={reservation.toddlers}
  onMenuUpdated={loadReservation}
/>
```

---

### 2. MenuSelectionFlow (Used in Dialog)

**Location:** `apps/frontend/components/menu/MenuSelectionFlow.tsx`

**Purpose:** Multi-step wizard for selecting menu.

**Flow:**
1. ➡️ Select Menu Template
2. ➡️ Choose Package
3. ➡️ Add Optional Extras
4. ➡️ Review & Confirm

**Features:**
- Filters templates by event type
- Checks validity dates
- Calculates prices in real-time
- Shows guest counts
- Validates before submission

---

## 📦 Data Flow

### Adding Menu to Reservation

```
1. User clicks "Add Menu" button
   ↓
2. MenuSelectionFlow opens in dialog
   ↓
3. User selects template, package, options
   ↓
4. User confirms selection
   ↓
5. API Call: POST /api/reservations/:id/select-menu
   ↓
6. Backend creates menu snapshot
   ↓
7. Frontend refetches reservation
   ↓
8. Menu section displays selected menu
```

### Updating Menu

```
1. User clicks "Edit" button
   ↓
2. MenuSelectionFlow opens with current selection
   ↓
3. User modifies selection
   ↓
4. API Call: POST /api/reservations/:id/select-menu (replaces)
   ↓
5. Frontend refetches
```

### Deleting Menu

```
1. User clicks "Delete" button
   ↓
2. Confirmation dialog
   ↓
3. API Call: DELETE /api/reservations/:id/menu
   ↓
4. Frontend refetches
```

---

## 💰 Price Breakdown Display

### Package Cost

```
Dorośli (50 × 300 zł)    15,000 zł
Dzieci (10 × 150 zł)      1,500 zł
Maluchy (5 × 0 zł)           0 zł
───────────────────────────
Suma pakietu           16,500 zł
```

### Options Cost

```
Bar Open (65 × 50 zł)      3,250 zł
DJ + Taniec (stała)         800 zł
Dekoracje (stała)        1,500 zł
───────────────────────────
Suma opcji              5,550 zł
```

### Total

```
╔═══════════════════════════╗
║ Całkowity koszt menu    ║
║ 22,050 zł              ║
╚═══════════════════════════╝
```

---

## 🎨 UI States

### 1. No Menu Selected

```tsx
┌────────────────────────────────────────┐
│  🍽️ Menu                              │
├────────────────────────────────────────┤
│                                        │
│           🍽️                          │
│                                        │
│      Brak wybranego menu               │
│   Dodaj menu do rezerwacji             │
│                                        │
│        [ + Dodaj menu ]                │
│                                        │
└────────────────────────────────────────┘
```

### 2. Menu Selected

```tsx
┌────────────────────────────────────────┐
│  🍽️ Menu               [Edit] [❌]   │
│  Menu Weselne - Premium              │
├────────────────────────────────────────┤
│                                        │
│  📦 Pakiet: Standard                  │
│     Dorośli: 300 zł                    │
│     Dzieci: 150 zł                     │
│                                        │
│  ✅ 5 dań głównych                     │
│  ✅ Deser premium                      │
│                                        │
│  🛍️ Dodatkowe opcje (2)               │
│     ✨ Bar Open - 50 zł/osoba           │
│     ✨ DJ + Taniec - 800 zł stała        │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  💰 Koszt menu                       │
├────────────────────────────────────────┤
│  Pakiet:            16,500 zł         │
│  Opcje dodatkowe:    5,550 zł         │
│  ────────────────────────────    │
│  RAZEM:             22,050 zł         │
└────────────────────────────────────────┘
```

### 3. Loading State

```tsx
┌────────────────────────────────────────┐
│  🍽️ Menu                              │
├────────────────────────────────────────┤
│                                        │
│              ⏳                         │
│         Wczytywanie...                 │
│                                        │
└────────────────────────────────────────┘
```

---

## 🔧 API Hooks Used

### useReservationMenu

```typescript
const { data, isLoading, error } = useReservationMenu(reservationId)

// Returns:
{
  snapshot: {
    template: MenuTemplate,
    package: MenuPackage,
    selectedOptions: MenuOption[]
  },
  priceBreakdown: PriceBreakdown
}
```

### useSelectMenu

```typescript
const selectMutation = useSelectMenu()

await selectMutation.mutateAsync({
  reservationId: 'res_123',
  selection: {
    templateId: 'tpl_456',
    packageId: 'pkg_789',
    selectedOptions: [...],
    adultsCount: 50,
    childrenCount: 10,
    toddlersCount: 5
  }
})
```

### useDeleteReservationMenu

```typescript
const deleteMutation = useDeleteReservationMenu()

await deleteMutation.mutateAsync(reservationId)
```

---

## ✅ Features Checklist

### Display Features
- ✅ Show "No menu" state with add button
- ✅ Display selected package details
- ✅ Show package pricing per guest type
- ✅ List included items with checkmarks
- ✅ Display selected options with prices
- ✅ Show complete price breakdown
- ✅ Calculate per-person and flat costs
- ✅ Display total menu cost
- ✅ Match reservation page styling
- ✅ Responsive design

### Interaction Features
- ✅ Add menu button
- ✅ Edit menu button
- ✅ Delete menu button (with confirmation)
- ✅ Open selection dialog
- ✅ Auto-reload after changes
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications

### Integration Features
- ✅ Pass guest counts to price calculation
- ✅ Filter templates by event type
- ✅ Check template validity for date
- ✅ Pre-fill with existing selection on edit
- ✅ Trigger parent reload on update
- ✅ Handle conditional rendering

---

## 📝 Usage Example

### In Reservation Detail Page

```tsx
import { ReservationMenuSection } from '@/components/reservations/ReservationMenuSection'

function ReservationDetailsPage() {
  const [reservation, setReservation] = useState(null)
  
  const loadReservation = async () => {
    const data = await getReservationById(id)
    setReservation(data)
  }

  return (
    <div>
      {/* Client, Hall, Event sections... */}
      
      {/* Menu Section */}
      {reservation.eventType?.id && eventDate && (
        <ReservationMenuSection
          reservationId={reservation.id}
          eventTypeId={reservation.eventType.id}
          eventDate={eventDate}
          adults={reservation.adults || 0}
          children={reservation.children || 0}
          toddlers={reservation.toddlers || 0}
          onMenuUpdated={loadReservation}
        />
      )}
      
      {/* Notes, Guests, Pricing... */}
    </div>
  )
}
```

---

## 🚨 Error Handling

### Common Errors

1. **No active menu for event type**
   - Shows empty state
   - Suggests creating menu first

2. **Invalid date**
   - Filters out expired templates
   - Shows warning

3. **API Error**
   - Shows toast notification
   - Retries or allows manual retry

4. **Missing guest counts**
   - Defaults to 0
   - Still allows menu selection

---

## 🔄 Update Flow

### When Guest Counts Change

**Manual Update Required:**
- Menu prices are **snapshots**
- If guest counts change in reservation, menu needs manual update
- Edit button re-opens selection with new counts
- Prices recalculate automatically

**Future Enhancement:**
- Auto-update menu when guest counts change
- Show warning if counts differ

---

## 🎉 Complete!

**Integration includes:**
- ✅ Full CRUD for menu in reservations
- ✅ Beautiful UI matching reservation design
- ✅ Real-time price calculations
- ✅ Responsive & accessible
- ✅ Error handling & loading states
- ✅ Toast notifications

**Files:**
- Component: `apps/frontend/components/reservations/ReservationMenuSection.tsx`
- Page: `apps/frontend/app/dashboard/reservations/[id]/page.tsx`
- Hooks: `apps/frontend/hooks/use-menu.ts`
- API: `apps/frontend/lib/api/menu-api.ts`

**Ready to use!** 🚀
