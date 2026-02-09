# 🗄️ Schemat Bazy Danych - Moduł Rezerwacje

Szczegółowa dokumentacja struktury bazy danych dla modułu rezerwacji sal weselnych.

---

## 📋 Spis Treści

- [Przegląd](#przegląd)
- [Tabele](#tabele)
  - [Reservation](#reservation)
  - [Client](#client)
  - [Hall](#hall)
  - [EventType](#eventtype)
  - [Deposit](#deposit)
  - [ReservationHistory](#reservationhistory)
  - [QueueEntry](#queueentry)
- [Relacje](#relacje)
- [Indeksy](#indeksy)
- [Constrainty](#constrainty)
- [Triggery](#triggery)
- [Migracje](#migracje)
- [Przykłady Zapytań](#przykłady-zapytań)

---

## 🔍 Przegląd

### Technologie
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5.x
- **Migration Tool:** Prisma Migrate

### Diagram ERD (uproszczony)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│  Reservation    │◄────────┐
└──────┬──────────┘         │
       │                    │ 1:1
       │ 1:1                │
       │              ┌─────┴──────┐
       │              │  Deposit   │
       │              └────────────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│ ReservationHistory  │
└─────────────────────┘

┌─────────────┐     ┌──────────────┐
│    Hall     │     │  EventType   │
└──────┬──────┘     └──────┬───────┘
       │                   │
       │ 1:N           1:N │
       └───────────┬───────┘
                   │
            ┌──────▼──────────┐
            │  Reservation    │
            └─────────────────┘

┌─────────────┐
│ QueueEntry  │
└──────┬──────┘
       │
       │ 1:1
       │
┌──────▼──────────┐
│  Reservation    │
└─────────────────┘
```

---

## 📊 Tabele

### Reservation

Główna tabela przechowująca informacje o rezerwacjach.

#### Prisma Model

```prisma
model Reservation {
  id              Int       @id @default(autoincrement())
  eventDate       DateTime
  status          ReservationStatus @default(PENDING)
  
  // Foreign Keys
  clientId        Int
  hallId          Int
  eventTypeId     Int
  createdById     Int?
  
  // Relations
  client          Client        @relation(fields: [clientId], references: [id])
  hall            Hall          @relation(fields: [hallId], references: [id])
  eventType       EventType     @relation(fields: [eventTypeId], references: [id])
  createdBy       User?         @relation(fields: [createdById], references: [id])
  deposit         Deposit?
  history         ReservationHistory[]
  queueEntry      QueueEntry?
  
  // Guest Information
  adults          Int           @default(0)
  children        Int           @default(0)
  toddlers        Int           @default(0) // Added 2026-02-09
  
  // Pricing
  pricePerAdult   Decimal       @db.Decimal(10, 2)
  pricePerChild   Decimal       @db.Decimal(10, 2) @default(0)
  pricePerToddler Decimal       @db.Decimal(10, 2) @default(0) // Added 2026-02-09
  totalPrice      Decimal       @db.Decimal(10, 2)
  
  // Additional Information
  notes           String?       @db.Text
  specialRequests String?       @db.Text
  
  // Anniversary specific (for "Rocznica/Jubileusz" events)
  anniversaryYear     Int?
  anniversaryOccasion String?
  
  // Metadata
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?     // Soft delete
  
  @@index([eventDate])
  @@index([status])
  @@index([clientId])
  @@index([hallId])
  @@index([eventTypeId])
  @@index([createdAt])
  @@map("reservations")
}

enum ReservationStatus {
  PENDING    // Oczekująca na potwierdzenie
  CONFIRMED  // Potwierdzona
  COMPLETED  // Zakończona
  CANCELLED  // Anulowana
  RESERVED   // Na liście rezerwowej
}
```

#### Kolumny

| Kolumna | Typ | Null | Default | Opis |
|---------|-----|------|---------|------|
| `id` | INTEGER | NO | AUTO | Primary Key |
| `eventDate` | TIMESTAMP | NO | - | Data i godzina wydarzenia |
| `status` | ENUM | NO | PENDING | Status rezerwacji |
| `clientId` | INTEGER | NO | - | FK do Client |
| `hallId` | INTEGER | NO | - | FK do Hall |
| `eventTypeId` | INTEGER | NO | - | FK do EventType |
| `createdById` | INTEGER | YES | NULL | FK do User (kto utworzył) |
| `adults` | INTEGER | NO | 0 | Liczba dorosłych |
| `children` | INTEGER | NO | 0 | Liczba dzieci (4-12 lat) |
| `toddlers` | INTEGER | NO | 0 | Liczba maluchów (0-3 lata) |
| `pricePerAdult` | DECIMAL(10,2) | NO | - | Cena za dorosłego |
| `pricePerChild` | DECIMAL(10,2) | NO | 0 | Cena za dziecko |
| `pricePerToddler` | DECIMAL(10,2) | NO | 0 | Cena za malucha |
| `totalPrice` | DECIMAL(10,2) | NO | - | Całkowita cena |
| `notes` | TEXT | YES | NULL | Notatki wewnętrzne |
| `specialRequests` | TEXT | YES | NULL | Specjalne życzenia klienta |
| `anniversaryYear` | INTEGER | YES | NULL | Która rocznica (dla rocznicy/jubileuszu) |
| `anniversaryOccasion` | VARCHAR | YES | NULL | Okazja rocznicy |
| `createdAt` | TIMESTAMP | NO | now() | Data utworzenia |
| `updatedAt` | TIMESTAMP | NO | now() | Data ostatniej aktualizacji |
| `deletedAt` | TIMESTAMP | YES | NULL | Data usunięcia (soft delete) |

#### Business Rules

1. **Walidacja liczby gości:**
   ```sql
   CHECK (adults > 0)
   CHECK (children >= 0)
   CHECK (toddlers >= 0)
   CHECK (adults + children + toddlers <= hall.capacity)
   ```

2. **Walidacja dat:**
   ```sql
   CHECK (eventDate > CURRENT_TIMESTAMP)
   ```

3. **Kalkulacja totalPrice:**
   ```typescript
   totalPrice = (adults * pricePerAdult) + 
                (children * pricePerChild) + 
                (toddlers * pricePerToddler)
   ```

4. **Unikalne rezerwacje:**
   - Jedna sala może mieć tylko jedną rezerwację w danym dniu (eventDate)
   - Sprawdzanie konfliktów przy tworzeniu/aktualizacji

---

### Client

Tabela przechowująca dane klientów.

#### Prisma Model

```prisma
model Client {
  id           Int           @id @default(autoincrement())
  firstName    String
  lastName     String
  phone        String
  email        String?
  address      String?
  notes        String?       @db.Text
  
  // Relations
  reservations Reservation[]
  
  // Metadata
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  
  @@index([lastName, firstName])
  @@index([phone])
  @@index([email])
  @@map("clients")
}
```

#### Kolumny

| Kolumna | Typ | Null | Default | Opis |
|---------|-----|------|---------|------|
| `id` | INTEGER | NO | AUTO | Primary Key |
| `firstName` | VARCHAR | NO | - | Imię |
| `lastName` | VARCHAR | NO | - | Nazwisko |
| `phone` | VARCHAR | NO | - | Telefon kontaktowy |
| `email` | VARCHAR | YES | NULL | Email |
| `address` | VARCHAR | YES | NULL | Adres |
| `notes` | TEXT | YES | NULL | Notatki o kliencie |
| `createdAt` | TIMESTAMP | NO | now() | Data utworzenia |
| `updatedAt` | TIMESTAMP | NO | now() | Data ostatniej aktualizacji |

---

### Hall

Tabela przechowująca informacje o salach.

#### Prisma Model

```prisma
model Hall {
  id             Int           @id @default(autoincrement())
  name           String        @unique
  capacity       Int
  pricePerPerson Decimal       @db.Decimal(10, 2)
  description    String?       @db.Text
  active         Boolean       @default(true)
  
  // Relations
  reservations   Reservation[]
  
  // Metadata
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  @@map("halls")
}
```

#### Kolumny

| Kolumna | Typ | Null | Default | Opis |
|---------|-----|------|---------|------|
| `id` | INTEGER | NO | AUTO | Primary Key |
| `name` | VARCHAR | NO | UNIQUE | Nazwa sali |
| `capacity` | INTEGER | NO | - | Pojemność sali |
| `pricePerPerson` | DECIMAL(10,2) | NO | - | Bazowa cena za osobę |
| `description` | TEXT | YES | NULL | Opis sali |
| `active` | BOOLEAN | NO | true | Czy sala jest aktywna |
| `createdAt` | TIMESTAMP | NO | now() | Data utworzenia |
| `updatedAt` | TIMESTAMP | NO | now() | Data ostatniej aktualizacji |

---

### EventType

Tabela przechowująca typy wydarzeń.

#### Prisma Model

```prisma
model EventType {
  id           Int           @id @default(autoincrement())
  name         String        @unique
  description  String?       @db.Text
  active       Boolean       @default(true)
  
  // Relations
  reservations Reservation[]
  
  // Metadata
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  
  @@map("event_types")
}
```

#### Przykładowe wartości

| ID | Name | Description |
|----|------|-------------|
| 1 | Wesele | Przyjęcie weselne |
| 2 | Urodziny | Przyjęcie urodzinowe |
| 3 | Rocznica/Jubileusz | Rocznica ślubu lub jubileusz |
| 4 | Komunia | Pierwsza komunia święta |
| 5 | Chrzciny | Przyjęcie chrzcielne |
| 6 | Inne | Inne wydarzenia |

---

### Deposit

Tabela przechowująca informacje o zaliczkach.

#### Prisma Model

```prisma
model Deposit {
  id            Int       @id @default(autoincrement())
  reservationId Int       @unique
  amount        Decimal   @db.Decimal(10, 2)
  paid          Boolean   @default(false)
  paidAt        DateTime? // Added 2026-02-09
  paymentMethod PaymentMethod? // Added 2026-02-09
  dueDate       DateTime
  notes         String?   @db.Text
  
  // Relations
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  
  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([reservationId])
  @@index([dueDate])
  @@index([paid])
  @@map("deposits")
}

enum PaymentMethod {
  CASH      // Gotówka
  TRANSFER  // Przelew
  BLIK      // BLIK
}
```

#### Kolumny

| Kolumna | Typ | Null | Default | Opis |
|---------|-----|------|---------|------|
| `id` | INTEGER | NO | AUTO | Primary Key |
| `reservationId` | INTEGER | NO | UNIQUE | FK do Reservation (1:1) |
| `amount` | DECIMAL(10,2) | NO | - | Kwota zaliczki |
| `paid` | BOOLEAN | NO | false | Czy opłacona |
| `paidAt` | TIMESTAMP | YES | NULL | Data opłacenia |
| `paymentMethod` | ENUM | YES | NULL | Metoda płatności |
| `dueDate` | TIMESTAMP | NO | - | Termin płatności |
| `notes` | TEXT | YES | NULL | Notatki o zaliczce |
| `createdAt` | TIMESTAMP | NO | now() | Data utworzenia |
| `updatedAt` | TIMESTAMP | NO | now() | Data ostatniej aktualizacji |

#### Business Rules

1. **Walidacja kwoty:**
   ```sql
   CHECK (amount > 0)
   CHECK (amount <= reservation.totalPrice)
   ```

2. **Walidacja terminu:**
   ```sql
   CHECK (dueDate < reservation.eventDate)
   ```

3. **Automatyczne ustawienie paidAt:**
   - Gdy `paid` zmienia się z `false` na `true`, ustawia się `paidAt = NOW()`

---

### ReservationHistory

Tabela przechowująca historię zmian rezerwacji (audit log).

#### Prisma Model

```prisma
model ReservationHistory {
  id            Int       @id @default(autoincrement())
  reservationId Int
  action        String    // "CREATED", "UPDATED", "STATUS_CHANGED", etc.
  previousValue Json?
  newValue      Json?
  reason        String?   @db.Text
  changedById   Int?
  
  // Relations
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  changedBy     User?       @relation(fields: [changedById], references: [id])
  
  // Metadata
  timestamp     DateTime    @default(now())
  
  @@index([reservationId])
  @@index([timestamp])
  @@map("reservation_history")
}
```

#### Przykładowe akcje

| Action | Description | Previous Value | New Value |
|--------|-------------|----------------|------------|
| `CREATED` | Rezerwacja utworzona | null | Cała rezerwacja |
| `STATUS_CHANGED` | Zmiana statusu | `"PENDING"` | `"CONFIRMED"` |
| `GUESTS_UPDATED` | Zmiana liczby gości | `{adults: 80}` | `{adults: 85}` |
| `PRICE_UPDATED` | Zmiana ceny | `13125.00` | `13650.00` |
| `DEPOSIT_PAID` | Opłacenie zaliczki | `{paid: false}` | `{paid: true}` |
| `CANCELLED` | Anulowanie | Status | `"CANCELLED"` |

---

### QueueEntry

Tabela przechowująca kolejkę oczekujących (lista rezerwowa).

#### Prisma Model

```prisma
model QueueEntry {
  id            Int         @id @default(autoincrement())
  reservationId Int         @unique
  hallId        Int
  targetDate    DateTime
  position      Int
  status        QueueStatus @default(WAITING)
  notes         String?     @db.Text
  
  // Relations
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  hall          Hall        @relation(fields: [hallId], references: [id])
  
  // Metadata
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([hallId, targetDate])
  @@index([position])
  @@index([status])
  @@map("queue_entries")
}

enum QueueStatus {
  WAITING   // Oczekuje
  PROMOTED  // Przeniesiona do PENDING
  EXPIRED   // Wygasła (termin minął)
  CANCELLED // Anulowana
}
```

#### Business Rules

1. **Unikalne pozycje:**
   - Dla danej sali i daty, każda pozycja musi być unikalna
   - Automatyczne zarządzanie pozycjami przy dodawaniu/usuwaniu

2. **Automatyczne promowanie:**
   - Gdy rezerwacja zostaje anulowana, system automatycznie promuje pierwszą osobę z kolejki
   - Status zmienia się z `WAITING` na `PROMOTED`
   - Rezerwacja zmienia status z `RESERVED` na `PENDING`

---

## 🔗 Relacje

### Diagram Relacji

```
Reservation N:1 Client
Reservation N:1 Hall
Reservation N:1 EventType
Reservation N:1 User (createdBy)
Reservation 1:1 Deposit
Reservation 1:N ReservationHistory
Reservation 1:1 QueueEntry

QueueEntry N:1 Hall
```

### Foreign Keys

| Tabela | Kolumna | Referencja | OnDelete |
|--------|---------|------------|----------|
| Reservation | clientId | Client(id) | RESTRICT |
| Reservation | hallId | Hall(id) | RESTRICT |
| Reservation | eventTypeId | EventType(id) | RESTRICT |
| Reservation | createdById | User(id) | SET NULL |
| Deposit | reservationId | Reservation(id) | CASCADE |
| ReservationHistory | reservationId | Reservation(id) | CASCADE |
| ReservationHistory | changedById | User(id) | SET NULL |
| QueueEntry | reservationId | Reservation(id) | CASCADE |
| QueueEntry | hallId | Hall(id) | RESTRICT |

---

## 📇 Indeksy

### Performance Indexes

```sql
-- Reservation indexes
CREATE INDEX idx_reservations_event_date ON reservations(event_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_client_id ON reservations(client_id);
CREATE INDEX idx_reservations_hall_id ON reservations(hall_id);
CREATE INDEX idx_reservations_event_type_id ON reservations(event_type_id);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

-- Client indexes
CREATE INDEX idx_clients_name ON clients(last_name, first_name);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);

-- Deposit indexes
CREATE INDEX idx_deposits_reservation_id ON deposits(reservation_id);
CREATE INDEX idx_deposits_due_date ON deposits(due_date);
CREATE INDEX idx_deposits_paid ON deposits(paid);

-- ReservationHistory indexes
CREATE INDEX idx_history_reservation_id ON reservation_history(reservation_id);
CREATE INDEX idx_history_timestamp ON reservation_history(timestamp);

-- QueueEntry indexes
CREATE INDEX idx_queue_hall_date ON queue_entries(hall_id, target_date);
CREATE INDEX idx_queue_position ON queue_entries(position);
CREATE INDEX idx_queue_status ON queue_entries(status);
```

---

## 🔒 Constrainty

### Check Constraints

```sql
-- Reservation constraints
ALTER TABLE reservations ADD CONSTRAINT chk_adults_positive 
  CHECK (adults > 0);

ALTER TABLE reservations ADD CONSTRAINT chk_children_non_negative 
  CHECK (children >= 0);

ALTER TABLE reservations ADD CONSTRAINT chk_toddlers_non_negative 
  CHECK (toddlers >= 0);

ALTER TABLE reservations ADD CONSTRAINT chk_event_date_future 
  CHECK (event_date > created_at);

ALTER TABLE reservations ADD CONSTRAINT chk_total_price_positive 
  CHECK (total_price > 0);

-- Deposit constraints
ALTER TABLE deposits ADD CONSTRAINT chk_deposit_amount_positive 
  CHECK (amount > 0);

-- Hall constraints
ALTER TABLE halls ADD CONSTRAINT chk_capacity_positive 
  CHECK (capacity > 0);

ALTER TABLE halls ADD CONSTRAINT chk_price_non_negative 
  CHECK (price_per_person >= 0);
```

### Unique Constraints

```sql
-- Hall name must be unique
ALTER TABLE halls ADD CONSTRAINT uq_hall_name UNIQUE (name);

-- EventType name must be unique
ALTER TABLE event_types ADD CONSTRAINT uq_event_type_name UNIQUE (name);

-- One deposit per reservation
ALTER TABLE deposits ADD CONSTRAINT uq_deposit_reservation UNIQUE (reservation_id);

-- One queue entry per reservation
ALTER TABLE queue_entries ADD CONSTRAINT uq_queue_reservation UNIQUE (reservation_id);
```

---

## ⚡ Triggery

### 1. Auto-update totalPrice

```sql
CREATE OR REPLACE FUNCTION calculate_total_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := 
    (NEW.adults * NEW.price_per_adult) +
    (NEW.children * NEW.price_per_child) +
    (NEW.toddlers * NEW.price_per_toddler);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_total_price
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION calculate_total_price();
```

### 2. Audit Log (ReservationHistory)

```sql
CREATE OR REPLACE FUNCTION log_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO reservation_history (reservation_id, action, new_value)
    VALUES (NEW.id, 'CREATED', row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO reservation_history (reservation_id, action, previous_value, new_value)
    VALUES (NEW.id, 'UPDATED', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_reservation_change
AFTER INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_reservation_change();
```

### 3. Auto-set paidAt when deposit is paid

```sql
CREATE OR REPLACE FUNCTION set_deposit_paid_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.paid = true AND OLD.paid = false) THEN
    NEW.paid_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_deposit_paid_at
BEFORE UPDATE ON deposits
FOR EACH ROW
EXECUTE FUNCTION set_deposit_paid_at();
```

---

## 🔄 Migracje

### Historia Migracji

| Data | Wersja | Opis | Status |
|------|--------|------|--------|
| 2026-01-15 | 001 | Inicjalna struktura tabel | ✅ Applied |
| 2026-01-20 | 002 | Dodanie tabeli ReservationHistory | ✅ Applied |
| 2026-01-25 | 003 | Dodanie tabeli QueueEntry | ✅ Applied |
| 2026-02-01 | 004 | Dodanie pól anniversary do Reservation | ✅ Applied |
| 2026-02-09 | 005 | Dodanie pola toddlers do Reservation | ✅ Applied |
| 2026-02-09 | 006 | Dodanie pól paidAt i paymentMethod do Deposit | ✅ Applied |

### Aktualna Migracja (006)

**Plik:** `prisma/migrations/20260209_add_deposit_payment_details/migration.sql`

```sql
-- AlterTable
ALTER TABLE "deposits" 
  ADD COLUMN "paid_at" TIMESTAMP,
  ADD COLUMN "payment_method" TEXT;

-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'BLIK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "deposits" 
  ALTER COLUMN "payment_method" TYPE "PaymentMethod" USING ("payment_method"::"PaymentMethod");
```

### Rollback Plan

```sql
-- Rollback migracji 006
ALTER TABLE "deposits" 
  DROP COLUMN "paid_at",
  DROP COLUMN "payment_method";

DROP TYPE IF EXISTS "PaymentMethod";
```

### Uruchamianie Migracji

```bash
# Sprawdź status migracji
npx prisma migrate status

# Uruchom nowe migracje
npx prisma migrate deploy

# Wygeneruj Prisma Client
npx prisma generate

# Reset bazy (TYLKO DEV!)
npx prisma migrate reset
```

---

## 💡 Przykłady Zapytań

### 1. Pobierz wszystkie rezerwacje na dany dzień

```sql
SELECT 
  r.id,
  r.event_date,
  r.status,
  c.first_name || ' ' || c.last_name AS client_name,
  h.name AS hall_name,
  et.name AS event_type,
  r.adults + r.children + r.toddlers AS total_guests,
  r.total_price
FROM reservations r
JOIN clients c ON r.client_id = c.id
JOIN halls h ON r.hall_id = h.id
JOIN event_types et ON r.event_type_id = et.id
WHERE DATE(r.event_date) = '2026-06-15'
  AND r.deleted_at IS NULL
ORDER BY r.event_date;
```

### 2. Znajdź rezerwacje z nieopłaconymi zaliczkami

```sql
SELECT 
  r.id,
  c.first_name || ' ' || c.last_name AS client,
  c.phone,
  r.event_date,
  d.amount AS deposit_amount,
  d.due_date AS deposit_due_date,
  DATE_PART('day', d.due_date - CURRENT_TIMESTAMP) AS days_until_due
FROM reservations r
JOIN clients c ON r.client_id = c.id
JOIN deposits d ON r.id = d.reservation_id
WHERE d.paid = false
  AND r.status IN ('PENDING', 'CONFIRMED')
  AND r.deleted_at IS NULL
ORDER BY d.due_date;
```

### 3. Statystyki rezerwacji według typu wydarzenia

```sql
SELECT 
  et.name AS event_type,
  COUNT(*) AS total_reservations,
  SUM(r.adults + r.children + r.toddlers) AS total_guests,
  AVG(r.total_price) AS avg_price,
  SUM(r.total_price) AS total_revenue
FROM reservations r
JOIN event_types et ON r.event_type_id = et.id
WHERE r.status = 'COMPLETED'
  AND r.event_date >= DATE_TRUNC('year', CURRENT_DATE)
  AND r.deleted_at IS NULL
GROUP BY et.id, et.name
ORDER BY total_reservations DESC;
```

### 4. Sprawdź dostępność sali na dany dzień

```sql
SELECT 
  h.id,
  h.name,
  h.capacity,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.hall_id = h.id
        AND DATE(r.event_date) = '2026-06-15'
        AND r.status IN ('PENDING', 'CONFIRMED')
        AND r.deleted_at IS NULL
    ) THEN 'Zajęta'
    ELSE 'Wolna'
  END AS status
FROM halls h
WHERE h.active = true;
```

### 5. Historia zmian dla rezerwacji

```sql
SELECT 
  rh.id,
  rh.action,
  rh.previous_value,
  rh.new_value,
  rh.reason,
  u.name AS changed_by,
  rh.timestamp
FROM reservation_history rh
LEFT JOIN users u ON rh.changed_by_id = u.id
WHERE rh.reservation_id = 123
ORDER BY rh.timestamp DESC;
```

### 6. Kolejka oczekujących dla sali

```sql
SELECT 
  qe.position,
  c.first_name || ' ' || c.last_name AS client_name,
  c.phone,
  r.event_date AS desired_date,
  r.adults + r.children + r.toddlers AS total_guests,
  qe.created_at AS added_to_queue
FROM queue_entries qe
JOIN reservations r ON qe.reservation_id = r.id
JOIN clients c ON r.client_id = c.id
WHERE qe.hall_id = 1
  AND qe.status = 'WAITING'
  AND DATE(qe.target_date) = '2026-06-15'
ORDER BY qe.position;
```

---

## 🔗 Powiązane Dokumenty

- [📋 CHANGELOG_RESERVATIONS.md](../../CHANGELOG_RESERVATIONS.md) - Historia zmian
- [🔌 RESERVATIONS_API.md](../api/RESERVATIONS_API.md) - Dokumentacja API
- [👥 RESERVATIONS_USER_GUIDE.md](../user-guide/RESERVATIONS_USER_GUIDE.md) - Podręcznik użytkownika
- [🔄 RESERVATION_WORKFLOWS.md](../workflows/RESERVATION_WORKFLOWS.md) - Procesy biznesowe

---

## 📞 Wsparcie

W razie pytań dotyczących schematu bazy danych:
- 📧 Email: dev@gosciniecrodzinny.pl
- 🐛 GitHub Issues: [Database Questions](https://github.com/kamil-gol/Go-ciniec_2/issues?q=label%3Adatabase)

---

**Ostatnia aktualizacja:** 09.02.2026 - 17:05 CET  
**Wersja schematu:** 2.2.0  
**Autor:** Kamil Gołębiowski
