# Migration: Add Reservation Queue System

**Date:** 2026-02-07  
**Branch:** `feature/reservation-queue`

## 📋 Overview

This migration introduces a **reservation queue system** (lista rezerwowa) with advanced queue management:
- ✅ Minimal data entry for RESERVED status
- ✅ **Automatic position recalculation** when reservations are cancelled
- ✅ **Manual queue reordering** capability
- ✅ **Auto-cancellation** of expired RESERVED reservations

---

## 🎯 Changes

### 1. **New Enum: `ReservationStatus`**

```sql
CREATE TYPE "ReservationStatus" AS ENUM (
  'RESERVED',    -- NEW: Waiting list status
  'PENDING',     -- Awaiting confirmation
  'CONFIRMED',   -- Confirmed reservation
  'COMPLETED',   -- Event finished
  'CANCELLED'    -- Cancelled
);
```

### 2. **New Columns**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `reservationQueuePosition` | `SMALLINT` | ✅ Yes | `null` | Position in queue (1, 2, 3...) |
| `reservationQueueDate` | `TIMESTAMP(3)` | ✅ Yes | `null` | Date queued for |
| `queueOrderManual` | `BOOLEAN` | ❌ No | `false` | If true, skip auto-recalculation |

### 3. **Optional Fields for RESERVED**

These fields are now **nullable**:
- `hallId` ← Required only for PENDING+
- `eventTypeId` ← Required only for PENDING+
- `startDateTime` ← Required only for PENDING+
- `endDateTime` ← Required only for PENDING+

### 4. **Database Functions**

#### `recalculate_queue_positions(date, exclude_id)`
Automatically recalculates positions for automatic ordering:
```sql
SELECT recalculate_queue_positions('2026-03-15'::TIMESTAMP);
```

#### `swap_queue_positions(id1, id2)`
Swaps two reservations' positions:
```sql
SELECT swap_queue_positions(
  'uuid-1'::UUID,
  'uuid-2'::UUID
);
```

#### `move_to_queue_position(id, new_position)`
Moves reservation to specific position:
```sql
SELECT move_to_queue_position(
  'uuid'::UUID,
  3  -- Move to position #3
);
```

#### `auto_cancel_expired_reserved()`
Cancels RESERVED reservations past their date:
```sql
SELECT * FROM auto_cancel_expired_reserved();
-- Returns: (cancelled_count, cancelled_ids[])
```

### 5. **Trigger: Auto-Recalculation**

When RESERVED status changes (cancelled or promoted):
```sql
CREATE TRIGGER recalculate_queue_on_status_change
AFTER UPDATE OF "status" ON "Reservation"
```

**Behavior:**
- ✅ Automatically recalculates positions for `queueOrderManual = false`
- ❌ Skips recalculation for `queueOrderManual = true`

---

## 🔄 Usage Flow

### Creating a RESERVED Reservation

**Required:**
- ✅ `clientId`
- ✅ `reservationQueueDate` (date only)
- ✅ `guests` (total)
- ✅ `status = RESERVED`

**Auto-assigned:**
- `reservationQueuePosition` (next available)
- `queueOrderManual = false` (automatic ordering)

---

### Queue Management Scenarios

#### **Scenario 1: Automatic Ordering (Default)**

```sql
-- Initial state
#1 → Jan (created 2026-02-01)
#2 → Maria (created 2026-02-05)
#3 → Piotr (created 2026-02-07)

-- Jan (#1) cancels
UPDATE "Reservation" SET status = 'CANCELLED' WHERE id = 'jan-id';

-- Automatic recalculation triggered:
#1 → Maria (was #2)
#2 → Piotr (was #3)
```

#### **Scenario 2: Manual Reordering**

```sql
-- Move Piotr to position #1 (priority customer)
SELECT move_to_queue_position('piotr-id'::UUID, 1);

-- Result:
#1 → Piotr (queueOrderManual = true)
#2 → Jan (queueOrderManual = true)
#3 → Maria (queueOrderManual = true)

-- Now ALL are marked manual - no auto-recalc on cancellation
```

#### **Scenario 3: Mixed Ordering**

```sql
-- Positions:
#1 → Jan (queueOrderManual = false)
#2 → Maria (queueOrderManual = true)  ← manually promoted
#3 → Piotr (queueOrderManual = false)
#4 → Anna (queueOrderManual = false)

-- Jan (#1) cancels
-- Only automatic positions recalculate:
#1 → Maria (manual - unchanged)
#2 → Piotr (was #3, auto-recalc)
#3 → Anna (was #4, auto-recalc)
```

#### **Scenario 4: Auto-Cancellation**

```sql
-- Today is 2026-03-15
-- RESERVED for 2026-03-15 still in queue → AUTO-CANCELLED

-- Run manually:
SELECT * FROM auto_cancel_expired_reserved();

-- Or via cron (daily at 00:01):
1 0 * * * psql ... -f auto_cancel_expired_reserved.sql
```

---

## 🚀 Promoting to PENDING/CONFIRMED

### Validation Requirements

When changing status from `RESERVED` → `PENDING`/`CONFIRMED`:

```typescript
if (newStatus !== 'RESERVED' && oldStatus === 'RESERVED') {
  // Validate required fields
  if (!hallId || !eventTypeId || !startDateTime || !endDateTime) {
    throw new Error('Missing required fields for promotion');
  }
  
  // Check hall availability
  const collision = await checkHallAvailability(hallId, startDateTime, endDateTime);
  if (collision) {
    throw new Error('Hall is not available for selected time');
  }
  
  // Validate pricing
  if (pricePerAdult === 0 && adults > 0) {
    throw new Error('Price per adult is required');
  }
}
```

---

## 📊 Query Examples

### View Queue for Specific Date

```sql
SELECT 
  r."reservationQueuePosition" AS "#",
  c."firstName" || ' ' || c."lastName" AS klient,
  r."guests" AS "ile osób",
  CASE 
    WHEN r."queueOrderManual" THEN '🖐️ Manual'
    ELSE '🤖 Auto'
  END AS "typ kolejności",
  TO_CHAR(r."createdAt", 'YYYY-MM-DD HH24:MI') AS dodano
FROM "Reservation" r
JOIN "Client" c ON r."clientId" = c."id"
WHERE r."status" = 'RESERVED'
  AND DATE(r."reservationQueueDate") = '2026-03-15'
ORDER BY r."reservationQueuePosition" ASC;
```

### Find Gaps in Queue

```sql
WITH queue_positions AS (
  SELECT 
    "reservationQueuePosition" AS pos,
    "reservationQueueDate"
  FROM "Reservation"
  WHERE "status" = 'RESERVED'
    AND DATE("reservationQueueDate") = '2026-03-15'
),
expected_positions AS (
  SELECT generate_series(1, 
    (SELECT MAX(pos) FROM queue_positions)
  ) AS pos
)
SELECT ep.pos AS "Missing Position"
FROM expected_positions ep
LEFT JOIN queue_positions qp ON ep.pos = qp.pos
WHERE qp.pos IS NULL;
```

### Reservations Expiring Soon

```sql
SELECT 
  c."firstName" || ' ' || c."lastName" AS klient,
  r."reservationQueueDate"::DATE AS "data wydarzenia",
  r."reservationQueuePosition" AS pozycja,
  DATE(r."reservationQueueDate") - CURRENT_DATE AS "dni do wydarzenia"
FROM "Reservation" r
JOIN "Client" c ON r."clientId" = c."id"
WHERE r."status" = 'RESERVED'
  AND DATE(r."reservationQueueDate") BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY r."reservationQueueDate" ASC, r."reservationQueuePosition" ASC;
```

---

## ⚠️ Breaking Changes

### Backend

1. **Type updates:**
   ```typescript
   // Add to types
   type ReservationStatus = 
     | 'RESERVED'  // NEW
     | 'PENDING'
     | 'CONFIRMED'
     | 'COMPLETED'
     | 'CANCELLED';
   ```

2. **Validation logic:**
   ```typescript
   // Check if required fields based on status
   const requiredFields = status === 'RESERVED' 
     ? ['clientId', 'guests', 'reservationQueueDate']
     : ['clientId', 'hallId', 'eventTypeId', 'startDateTime', 'endDateTime'];
   ```

3. **Queue management API:**
   ```typescript
   // New endpoints needed
   POST   /api/reservations/queue
   GET    /api/reservations/queue/:date
   PUT    /api/reservations/:id/queue-position
   POST   /api/reservations/queue/swap
   ```

### Frontend

1. New form for RESERVED
2. Queue position badge/indicator
3. Drag-and-drop reordering UI
4. Promotion modal with validation

---

## 🧪 Testing

See [test_migration.sql](./test_migration.sql) for verification queries.

**Test checklist:**
- [ ] Enum created
- [ ] Columns added
- [ ] Functions exist
- [ ] Trigger fires on status change
- [ ] Auto-recalculation works
- [ ] Manual reordering works
- [ ] Auto-cancellation works

---

## 🔙 Rollback

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS recalculate_queue_on_status_change ON "Reservation";

-- Drop functions
DROP FUNCTION IF EXISTS trigger_recalculate_queue_on_status_change();
DROP FUNCTION IF EXISTS recalculate_queue_positions(TIMESTAMP, UUID);
DROP FUNCTION IF EXISTS swap_queue_positions(UUID, UUID);
DROP FUNCTION IF EXISTS move_to_queue_position(UUID, INTEGER);
DROP FUNCTION IF EXISTS auto_cancel_expired_reserved();

-- Revert status column
ALTER TABLE "Reservation" ADD COLUMN "status_old" VARCHAR(20);
UPDATE "Reservation" SET "status_old" = "status"::text;
ALTER TABLE "Reservation" DROP COLUMN "status";
ALTER TABLE "Reservation" RENAME COLUMN "status_old" TO "status";

-- Drop queue columns
ALTER TABLE "Reservation" 
  DROP COLUMN "reservationQueuePosition",
  DROP COLUMN "reservationQueueDate",
  DROP COLUMN "queueOrderManual";

-- Drop enum
DROP TYPE "ReservationStatus";

-- Restore NOT NULL
ALTER TABLE "Reservation" 
  ALTER COLUMN "hallId" SET NOT NULL,
  ALTER COLUMN "eventTypeId" SET NOT NULL;
```

---

## 📦 Files

- `migration.sql` - Main migration with functions/triggers
- `auto_cancel_expired_reserved.sql` - Cron script for auto-cancellation
- `test_migration.sql` - Verification queries
- `README.md` - This file
- `HOWTO.md` - Step-by-step instructions

---

## 👤 Author

**Kamil Gołębiowski**  
Date: 2026-02-07
