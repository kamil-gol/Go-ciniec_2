# 🐛 BUG #9 FIX - Queue Nullable Constraints

## Problem

Brak walidacji spójności danych dla queue fields:

### **Błędy przed fixem:**

1. ❌ RESERVED bez queue fields
   ```sql
   INSERT INTO Reservation (
     status = 'RESERVED',
     reservationQueuePosition = NULL,  -- ❌ Powinno być wymagane!
     reservationQueueDate = NULL        -- ❌ Powinno być wymagane!
   );
   -- Sukces, ale inconsistent state!
   ```

2. ❌ PENDING/CONFIRMED z queue fields
   ```sql
   UPDATE Reservation
   SET status = 'PENDING'
   WHERE id = 'xxx';
   -- reservationQueuePosition nadal != NULL
   -- Inconsistent state!
   ```

3. ❌ Duplicate positions
   ```sql
   -- Rezerwacja A: position=1, date=2026-02-08
   -- Rezerwacja B: position=1, date=2026-02-08
   -- ❌ Konflikt!
   ```

4. ❌ Invalid positions
   ```sql
   reservationQueuePosition = 0   -- ❌ Powinno być >= 1
   reservationQueuePosition = -1  -- ❌ Negative!
   ```

---

## ✅ Rozwiązanie

### **1. CHECK Constraint - Status-Based Validation**

```sql
ALTER TABLE "Reservation"
ADD CONSTRAINT check_queue_fields_for_reserved
CHECK (
  (
    -- RESERVED: Queue fields REQUIRED
    "status" = 'RESERVED' AND
    "reservationQueuePosition" IS NOT NULL AND
    "reservationQueueDate" IS NOT NULL
  )
  OR
  (
    -- NOT RESERVED: Queue fields MUST be NULL
    "status" != 'RESERVED' AND
    "reservationQueuePosition" IS NULL AND
    "reservationQueueDate" IS NULL
  )
);
```

**Efekt:**
- ✅ RESERVED **musi** mieć position + date
- ✅ PENDING/CONFIRMED/etc **nie może** mieć position + date
- ✅ Wymuszane na poziomie bazy danych

---

### **2. UNIQUE Index - No Duplicate Positions**

```sql
CREATE UNIQUE INDEX idx_unique_queue_position_per_date
ON "Reservation" (
  DATE("reservationQueueDate"),
  "reservationQueuePosition"
)
WHERE "status" = 'RESERVED'
AND "reservationQueuePosition" IS NOT NULL
AND "reservationQueueDate" IS NOT NULL;
```

**Efekt:**
- ✅ Tylko jedna rezerwacja może mieć position=1 dla danego dnia
- ✅ Partial index (tylko RESERVED) = wydajność
- ✅ Automatyczna walidacja przy INSERT/UPDATE

---

### **3. CHECK Constraint - Positive Positions**

```sql
ALTER TABLE "Reservation"
ADD CONSTRAINT check_queue_position_positive
CHECK (
  "reservationQueuePosition" IS NULL 
  OR 
  "reservationQueuePosition" > 0
);
```

**Efekt:**
- ✅ Position musi być >= 1 (jeśli nie NULL)
- ✅ Zapobiega negative/zero positions

---

### **4. Trigger - Pre-Save Validation**

```sql
CREATE TRIGGER validate_queue_fields
BEFORE INSERT OR UPDATE ON "Reservation"
FOR EACH ROW
EXECUTE FUNCTION validate_queue_fields_before_save();
```

**Funkcja:**
```sql
CREATE OR REPLACE FUNCTION validate_queue_fields_before_save()
RETURNS TRIGGER AS $$
BEGIN
  -- RESERVED: Wymaga queue fields
  IF NEW."status" = 'RESERVED' THEN
    IF NEW."reservationQueuePosition" IS NULL OR NEW."reservationQueueDate" IS NULL THEN
      RAISE EXCEPTION 'RESERVED requires position + date';
    END IF;
    IF NEW."reservationQueuePosition" <= 0 THEN
      RAISE EXCEPTION 'Position must be > 0';
    END IF;
  END IF;
  
  -- Non-RESERVED: Queue fields muszą być NULL
  IF NEW."status" != 'RESERVED' THEN
    IF NEW."reservationQueuePosition" IS NOT NULL OR NEW."reservationQueueDate" IS NOT NULL THEN
      RAISE EXCEPTION 'Only RESERVED can have queue fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Efekt:**
- ✅ Custom error messages
- ✅ Działa przed CHECK constraints (lepsze komunikaty)

---

## 📊 Przed/Po Comparison

### **Scenariusz 1: Create RESERVED bez queue**

**Przed:**
```sql
INSERT INTO Reservation (
  status = 'RESERVED',
  clientId = 'xxx',
  guests = 10
);
-- ✅ Sukces (ale inconsistent!)
```

**Po:**
```sql
INSERT INTO Reservation (
  status = 'RESERVED',
  clientId = 'xxx',
  guests = 10
);
-- ❌ ERROR: RESERVED requires position + date
```

---

### **Scenariusz 2: Promote bez clearing queue**

**Przed:**
```sql
UPDATE Reservation
SET status = 'PENDING'
WHERE id = 'xxx';
-- ✅ Sukces (ale queue fields nadal present!)
```

**Po:**
```sql
UPDATE Reservation
SET status = 'PENDING'
WHERE id = 'xxx';
-- ❌ ERROR: Only RESERVED can have queue fields

-- Poprawnie:
UPDATE Reservation
SET 
  status = 'PENDING',
  reservationQueuePosition = NULL,
  reservationQueueDate = NULL
WHERE id = 'xxx';
-- ✅ Sukces
```

---

### **Scenariusz 3: Duplicate positions**

**Przed:**
```sql
-- Rezerwacja A:
INSERT INTO Reservation (status='RESERVED', position=1, date='2026-02-08', ...);
-- ✅ Sukces

-- Rezerwacja B:
INSERT INTO Reservation (status='RESERVED', position=1, date='2026-02-08', ...);
-- ✅ Sukces (ale duplicate!)
```

**Po:**
```sql
-- Rezerwacja A:
INSERT INTO Reservation (status='RESERVED', position=1, date='2026-02-08', ...);
-- ✅ Sukces

-- Rezerwacja B:
INSERT INTO Reservation (status='RESERVED', position=1, date='2026-02-08', ...);
-- ❌ ERROR: duplicate key violates unique constraint "idx_unique_queue_position_per_date"
```

---

## 🧪 Testing

### **Test 1: RESERVED wymaga queue fields**

```sql
-- ❌ Powinien failować
INSERT INTO "Reservation" (
  "id", "clientId", "createdById", "status", "guests", "adults", "totalPrice"
)
VALUES (
  gen_random_uuid(), 
  '<client-id>', 
  '<user-id>', 
  'RESERVED', 
  10, 
  10, 
  0
);
-- Expected: ERROR: RESERVED requires position + date

-- ✅ Powinien działać
INSERT INTO "Reservation" (
  "id", "clientId", "createdById", "status", "guests", "adults", "totalPrice",
  "reservationQueuePosition", "reservationQueueDate"
)
VALUES (
  gen_random_uuid(), 
  '<client-id>', 
  '<user-id>', 
  'RESERVED', 
  10, 
  10, 
  0,
  1,
  '2026-02-10'
);
-- Expected: SUCCESS
```

---

### **Test 2: Non-RESERVED nie może mieć queue**

```sql
-- ❌ Powinien failować
INSERT INTO "Reservation" (
  "id", "clientId", "createdById", "hallId", "eventTypeId",
  "status", "guests", "adults", "totalPrice",
  "startDateTime", "endDateTime",
  "reservationQueuePosition", "reservationQueueDate"
)
VALUES (
  gen_random_uuid(), 
  '<client-id>', 
  '<user-id>', 
  '<hall-id>',
  '<event-type-id>',
  'PENDING',
  10, 
  10, 
  1000,
  '2026-02-10 18:00:00',
  '2026-02-10 22:00:00',
  1,  -- ❌ PENDING nie może mieć position
  '2026-02-10'  -- ❌ PENDING nie może mieć date
);
-- Expected: ERROR: Only RESERVED can have queue fields
```

---

### **Test 3: Duplicate positions**

```sql
-- First insert
INSERT INTO "Reservation" (..., position=1, date='2026-02-10', ...);
-- ✅ SUCCESS

-- Second insert (same position & date)
INSERT INTO "Reservation" (..., position=1, date='2026-02-10', ...);
-- ❌ ERROR: duplicate key violates unique constraint
```

---

### **Test 4: Auto-cleanup existing data**

Migracja automatycznie czyści inconsistent data:

```sql
-- Przed migracją:
SELECT COUNT(*) FROM "Reservation" 
WHERE status != 'RESERVED' 
AND (reservationQueuePosition IS NOT NULL OR reservationQueueDate IS NOT NULL);
-- np. 5 rekordów

-- Po migracji:
SELECT COUNT(*) FROM "Reservation" 
WHERE status != 'RESERVED' 
AND (reservationQueuePosition IS NOT NULL OR reservationQueueDate IS NOT NULL);
-- 0 rekordów (auto-cleaned!)
```

---

## 🚀 Deployment

### **1. Uruchom migrację**

```bash
cd /home/kamil/rezerwacje
git pull origin feature/reservation-queue

# Uruchom migrację
docker compose exec postgres psql -U rezerwacje -d rezerwacje < \
  apps/backend/prisma/migrations/20260208_fix_queue_nullable_constraints/migration.sql
```

### **2. Sprawdź validation report**

Migracja wyświetli raport:

```
============================================
Queue Fields Validation Report
============================================
RESERVED without queue fields: 0
Non-RESERVED with queue fields: 3
Duplicate position conflicts: 0
============================================
Cleaning 3 non-RESERVED reservations with queue fields...
✅ Cleaned 3 reservations
```

### **3. Verify constraints**

```bash
docker compose exec postgres psql -U rezerwacje -d rezerwacje -c "
  SELECT conname, contype, pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid = 'Reservation'::regclass
  AND conname LIKE '%queue%';
"

# Expected output:
# check_queue_fields_for_reserved | c | CHECK ...
# check_queue_position_positive   | c | CHECK ...
```

---

## 📝 Summary

### **Constraints Added:**

| Constraint | Type | Purpose |
|------------|------|----------|
| `check_queue_fields_for_reserved` | CHECK | RESERVED wymaga queue fields, inne nie mogą |
| `check_queue_position_positive` | CHECK | Position > 0 |
| `idx_unique_queue_position_per_date` | UNIQUE INDEX | No duplicates |
| `validate_queue_fields` | TRIGGER | Pre-save validation |

### **Rules:**

✅ **RESERVED status:**
- ✅ `reservationQueuePosition` NOT NULL, > 0
- ✅ `reservationQueueDate` NOT NULL
- ✅ Unique (date, position)

✅ **Other statuses:**
- ✅ `reservationQueuePosition` NULL
- ✅ `reservationQueueDate` NULL

---

## ✅ Checklist

- [x] CHECK constraint dla status-based validation
- [x] UNIQUE index dla duplicate prevention
- [x] CHECK constraint dla positive positions
- [x] TRIGGER dla pre-save validation
- [x] Auto-cleanup existing inconsistent data
- [x] Validation report
- [x] Documentation
- [ ] Backend tests (opcjonalnie)
- [ ] Integration tests (opcjonalnie)

---

**Status:** ✅ READY TO DEPLOY  
**Data:** 08.02.2026 00:14 CET  
**Autor:** AI Assistant + Kamil Gol
