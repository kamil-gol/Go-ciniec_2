# Backend Deployment - Zaawansowany System Rezerwacji

## Podsumowanie Zmian Backend

✅ **Zaktualizowane:**
1. Prisma Schema - nowe pola w modelach Hall i Reservation
2. SQL Migration - skrypt migracji bazy danych
3. Seed - przykładowe dane z nowymi polami

## Wdrożenie Zmian

### Krok 1: Pobierz najnowszy kod

```bash
git fetch origin
git reset --hard origin/main
```

### Krok 2: Zastosuj migrację bazy danych

**Opcja A: Używając Prisma Migrate (preferowane)**

```bash
cd apps/backend

# Zainstaluj zależności (jeśli potrzebne)
npm install

# Wygeneruj Prisma Client z nową schemaą
npx prisma generate

# Zastosuj migrację SQL
psql -U <database_user> -d <database_name> -f prisma/migrations/20260207_add_advanced_reservation_fields/migration.sql

# LUB użyj prisma migrate deploy (jeśli używasz Prisma Migrate)
npx prisma migrate deploy
```

**Opcja B: Ręcznie przez psql**

```bash
# Połącz się z bazą danych
psql -U postgres -d rezerwacje

# Wykonaj migrację
\i apps/backend/prisma/migrations/20260207_add_advanced_reservation_fields/migration.sql
```

**Opcja C: Przez Docker**

```bash
# Jeśli używasz Docker Compose
docker-compose exec db psql -U postgres -d rezerwacje -f /migrations/20260207_add_advanced_reservation_fields/migration.sql
```

### Krok 3: Zaseed bazy danych (opcjonalne - tylko development)

**⚠️ UWAGA: To usunie wszystkie istniejące dane!**

```bash
cd apps/backend

# Uruchom seed
npm run seed

# LUB
npx tsx prisma/seed.ts
```

### Krok 4: Restart aplikacji backend

**Docker:**
```bash
docker-compose restart backend
```

**Local:**
```bash
cd apps/backend
npm run dev
```

### Krok 5: Weryfikacja

Sprawdź czy migracja się powiodła:

```bash
# Połącz się z bazą
psql -U postgres -d rezerwacje

# Sprawdź nowe kolumny w Hall
\d "Hall"
# Powinna być kolumna: pricePerChild

# Sprawdź nowe kolumny w Reservation
\d "Reservation"
# Powinny być kolumny:
# - adults
# - children  
# - pricePerAdult
# - pricePerChild
# - confirmationDeadline

# Sprawdź dane (jeśli uruchomiono seed)
SELECT id, adults, children, guests, "pricePerAdult", "pricePerChild", "totalPrice" 
FROM "Reservation" 
LIMIT 3;
```

## Nowe Pola w API

### Hall Model
```typescript
{
  id: string
  name: string
  capacity: number
  pricePerPerson: Decimal
  pricePerChild?: Decimal  // ✨ NOWE
  // ... reszta pól
}
```

### Reservation Model
```typescript
{
  id: string
  // ... podstawowe pola ...
  
  // ✨ NOWE: DateTime fields
  startDateTime?: DateTime
  endDateTime?: DateTime
  
  // ✨ NOWE: Guest split
  adults: number
  children: number
  guests: number // Computed: adults + children
  
  // ✨ NOWE: Separate pricing
  pricePerAdult: Decimal
  pricePerChild: Decimal
  totalPrice: Decimal // Computed: (adults * pricePerAdult) + (children * pricePerChild)
  
  // ✨ NOWE: Status related
  confirmationDeadline?: DateTime
  
  // ✨ NOWE: Custom event fields
  customEventType?: string
  anniversaryYear?: number
  anniversaryOccasion?: string
  
  // ... reszta pól
}
```

## Walidacja Business Logic (TODO - do implementacji w kontrolerach)

### 1. Obliczanie guests
```typescript
const guests = adults + children
```

### 2. Obliczanie totalPrice
```typescript
const totalPrice = (adults * pricePerAdult) + (children * pricePerChild)
```

### 3. Walidacja confirmationDeadline
```typescript
if (status === 'PENDING' && confirmationDeadline) {
  const eventDate = new Date(startDateTime)
  const deadline = new Date(confirmationDeadline)
  const oneDayBefore = new Date(eventDate)
  oneDayBefore.setDate(eventDate.getDate() - 1)
  
  if (deadline > oneDayBefore) {
    throw new Error('Confirmation deadline must be at least 1 day before event')
  }
}
```

### 4. Walidacja czasu trwania wydarzenia
```typescript
const DEFAULT_HOURS = 6
const eventDuration = (endDateTime - startDateTime) / (1000 * 60 * 60) // hours

if (eventDuration > DEFAULT_HOURS) {
  const extraHours = eventDuration - DEFAULT_HOURS
  // Dodaj do notatek ostrzeżenie o dopłacie
  notes += `\n\n⏰ Uwaga: Wydarzenie trwa ${extraHours}h dłużej niż standardowe ${DEFAULT_HOURS}h. Klient musi dopłacić za ${extraHours} dodatkowych godzin.`
}
```

### 5. Warunkowe pola dla typów wydarzeń
```typescript
if (eventType.name === 'Rocznica') {
  // Wymagaj: anniversaryYear, anniversaryOccasion
  if (!anniversaryYear || !anniversaryOccasion) {
    throw new Error('Anniversary year and occasion are required for Rocznica event type')
  }
}

if (eventType.name === 'Inne') {
  // Wymagaj: customEventType
  if (!customEventType) {
    throw new Error('Custom event type is required for Inne event type')
  }
}
```

## Następne Kroki

1. ✅ Database schema - DONE
2. ✅ Migration - DONE  
3. ✅ Seed - DONE
4. ⏳ **TODO: Aktualizacja kontrolerów API**
   - `POST /reservations` - dodaj walidację nowych pól
   - `PATCH /reservations/:id` - dodaj walidację + detect changes
   - `GET /reservations/:id` - zwróć nowe pola
5. ⏳ **TODO: Aktualizacja DTOs/Validators**
6. ⏳ **TODO: Testy jednostkowe**
7. ⏳ **TODO: Testy integracyjne**

## Rollback (w razie problemów)

```bash
# Cofnij zmiany w bazie danych
psql -U postgres -d rezerwacje

-- Usuń nowe kolumny z Reservation
ALTER TABLE "Reservation" DROP COLUMN "adults";
ALTER TABLE "Reservation" DROP COLUMN "children";
ALTER TABLE "Reservation" DROP COLUMN "pricePerAdult";
ALTER TABLE "Reservation" DROP COLUMN "pricePerChild";
ALTER TABLE "Reservation" DROP COLUMN "confirmationDeadline";
DROP INDEX "Reservation_confirmationDeadline_idx";

-- Usuń nowe kolumny z Hall
ALTER TABLE "Hall" DROP COLUMN "pricePerChild";
```

## Kontakt

W razie problemów sprawdź logi:
```bash
docker-compose logs backend
```
