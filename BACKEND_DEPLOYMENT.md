# Backend Deployment - Zaawansowany System Rezerwacji

## ✅ Status: Backend API Ready!

Wszystkie komponenty backendu zostały zaktualizowane i są gotowe do użycia.

## Podsumowanie Zmian Backend

✅ **Zaktualizowane:**
1. ✅ Prisma Schema - nowe pola w modelach Hall i Reservation
2. ✅ SQL Migration - skrypt migracji bazy danych
3. ✅ Seed - przykładowe dane z nowymi polami
4. ✅ Types - zaktualizowane typy TypeScript
5. ✅ Utils - funkcje pomocnicze do business logic
6. ✅ Service - pełna logika biznesowa
7. ✅ Controller - walidacja requestów

## Wdrożenie Zmian

### Krok 1: Pobierz najnowszy kod

```bash
cd /home/kamil/rezerwacje
git fetch origin
git reset --hard origin/main
```

### Krok 2: Zastosuj migrację bazy danych (JUŻ WYKONANE ✅)

Jeśli jeszcze nie wykonano migracji:

```bash
# Skopiuj migrację do kontenera
docker cp apps/backend/prisma/migrations/20260207_add_advanced_reservation_fields/migration.sql rezerwacje-db:/tmp/migration.sql

# Wykonaj migrację
docker exec -i rezerwacje-db psql -U rezerwacje -d rezerwacje -f /tmp/migration.sql

# Dodaj brakujące kolumny (jeśli nie ma)
docker exec -i rezerwacje-db psql -U rezerwacje -d rezerwacje << 'EOF'
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "startDateTime" TIMESTAMP;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "endDateTime" TIMESTAMP;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "customEventType" VARCHAR(100);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "anniversaryYear" SMALLINT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "anniversaryOccasion" VARCHAR(100);
ALTER TABLE "Reservation" ALTER COLUMN "date" DROP NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "startTime" DROP NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "endTime" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "Reservation_startDateTime_idx" ON "Reservation"("startDateTime");
EOF
```

### Krok 3: Wygeneruj Prisma Client i restart

```bash
# Wygeneruj Prisma Client w kontenerze
docker-compose exec backend npx prisma generate

# Restart backendu
docker-compose restart backend

# Sprawdź logi
docker-compose logs -f backend
```

### Krok 4: Opcjonalnie - Zaseed bazy danych (tylko development)

**⚠️ UWAGA: To usunie wszystkie istniejące dane!**

```bash
docker-compose exec backend npm run seed
```

### Krok 5: Weryfikacja

Sprawdź czy wszystko działa:

```bash
# Sprawdź strukturę tabeli
docker exec -i rezerwacje-db psql -U rezerwacje -d rezerwacje -c "\d \"Reservation\""

# Sprawdź dane
docker exec -i rezerwacje-db psql -U rezerwacje -d rezerwacje -c "SELECT id, adults, children, guests, \"pricePerAdult\", \"pricePerChild\", \"customEventType\", \"anniversaryYear\" FROM \"Reservation\" LIMIT 5;"

# Test API
curl http://localhost:3001/api/reservations
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

### Reservation Model (Request/Response)
```typescript
{
  id: string
  hallId: string
  clientId: string
  eventTypeId: string
  
  // ✨ NOWE: DateTime fields
  startDateTime?: DateTime  // Preferowane zamiast date+startTime
  endDateTime?: DateTime    // Preferowane zamiast date+endTime
  
  // Legacy fields (dla kompatybilności wstecznej)
  date?: string
  startTime?: string
  endTime?: string
  
  // ✨ NOWE: Guest split
  adults: number
  children: number
  guests: number // Auto-computed: adults + children
  
  // ✨ NOWE: Separate pricing
  pricePerAdult: Decimal
  pricePerChild: Decimal
  totalPrice: Decimal // Auto-computed: (adults * pricePerAdult) + (children * pricePerChild)
  
  // ✨ NOWE: Status related
  confirmationDeadline?: DateTime
  
  // ✨ NOWE: Custom event fields
  customEventType?: string      // Dla typu "Inne"
  anniversaryYear?: number       // Dla typu "Rocznica"
  anniversaryOccasion?: string  // Dla typu "Rocznica"
  
  // Standard fields
  status: string
  notes?: string
  attachments: string[]
  // ...
}
```

## Business Logic Zaimplementowana ✅

### 1. Auto-obliczanie guests
```typescript
guests = adults + children
```

### 2. Auto-obliczanie totalPrice
```typescript
totalPrice = (adults * pricePerAdult) + (children * pricePerChild)
```

### 3. Walidacja confirmationDeadline
- Musi być co najmniej 1 dzień przed wydarzeniem
- Tylko dla statusu PENDING

### 4. Automatyczne notatki o dopłacie za dodatkowe godziny
- Standardowy czas: 6 godzin
- Jeśli wydarzenie trwa dłużej, automatycznie dodawana jest notatka:
  ```
  ⏰ Uwaga: Wydarzenie trwa Xh dłużej niż standardowe 6h. 
  Klient musi dopłacić za X dodatkowych godzin.
  ```

### 5. Warunkowe pola dla typów wydarzeń
- **Rocznica**: Wymagane `anniversaryYear` i `anniversaryOccasion`
- **Inne**: Wymagane `customEventType`

### 6. Wymagany powód zmian (reason)
- Przy aktualizacji ważnych pól (datetime, ceny, liczba gości)
- Minimum 10 znaków
- Automatycznie logowane w historii z podsumowaniem zmian

## Przykłady Użycia API

### POST /api/reservations (Utworzenie rezerwacji)

**Nowy format (preferowany):**
```json
{
  "hallId": "abc-123",
  "clientId": "def-456",
  "eventTypeId": "ghi-789",
  "startDateTime": "2026-06-15T17:00:00Z",
  "endDateTime": "2026-06-15T23:00:00Z",
  "adults": 100,
  "children": 20,
  "pricePerAdult": 120,
  "pricePerChild": 80,
  "confirmationDeadline": "2026-06-10T12:00:00Z",
  "notes": "Wesele"
}
```

**Legacy format (kompatybilność wsteczna):**
```json
{
  "hallId": "abc-123",
  "clientId": "def-456",
  "eventTypeId": "ghi-789",
  "date": "2026-06-15",
  "startTime": "17:00",
  "endTime": "23:00",
  "guests": 120,
  "notes": "Wesele"
}
```

**Rocznica (25 lat ślubu):**
```json
{
  "hallId": "abc-123",
  "clientId": "def-456",
  "eventTypeId": "rocznica-id",
  "startDateTime": "2026-08-20T18:00:00Z",
  "endDateTime": "2026-08-21T00:00:00Z",
  "adults": 50,
  "children": 0,
  "pricePerAdult": 120,
  "pricePerChild": 0,
  "anniversaryYear": 25,
  "anniversaryOccasion": "Srebrne wesele",
  "notes": "Specjalne dekoracje"
}
```

**Własne wydarzenie:**
```json
{
  "hallId": "abc-123",
  "clientId": "def-456",
  "eventTypeId": "inne-id",
  "startDateTime": "2026-07-10T14:00:00Z",
  "endDateTime": "2026-07-10T20:00:00Z",
  "adults": 30,
  "children": 10,
  "pricePerAdult": 100,
  "pricePerChild": 70,
  "customEventType": "Spotkanie rodzinne",
  "notes": "Grill w ogrodzie"
}
```

### PUT /api/reservations/:id (Aktualizacja rezerwacji)

```json
{
  "adults": 110,
  "children": 25,
  "reason": "Klient zmienił liczbę gości po rozmowie telefonicznej"
}
```

**Response zawiera:**
- Zaktualizowane dane rezerwacji
- Auto-przeliczone `guests` i `totalPrice`
- Historia zmian z podsumowaniem

## Testy Manualne

```bash
# 1. Utwórz rezerwację z nowym formatem
curl -X POST http://localhost:3001/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "hallId": "HALL_ID",
    "clientId": "CLIENT_ID",
    "eventTypeId": "EVENT_TYPE_ID",
    "startDateTime": "2026-12-20T17:00:00Z",
    "endDateTime": "2026-12-20T23:00:00Z",
    "adults": 80,
    "children": 15,
    "pricePerAdult": 120,
    "pricePerChild": 80
  }'

# 2. Pobierz rezerwacje
curl http://localhost:3001/api/reservations \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Zaktualizuj rezerwację (wymaga reason!)
curl -X PUT http://localhost:3001/api/reservations/RESERVATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "adults": 90,
    "children": 20,
    "reason": "Klient dodał dodatkowych gości"
  }'
```

## Rollback (w razie problemów)

```bash
# 1. Przywróć poprzednią wersję kodu
git checkout POPRZEDNI_COMMIT

# 2. Cofnij zmiany w bazie danych
docker exec -i rezerwacje-db psql -U rezerwacje -d rezerwacje << 'EOF'
-- Usuń nowe kolumny z Reservation
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "startDateTime";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "endDateTime";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "adults";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "children";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "pricePerAdult";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "pricePerChild";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "confirmationDeadline";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "customEventType";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "anniversaryYear";
ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "anniversaryOccasion";

-- Usuń nowe kolumny z Hall
ALTER TABLE "Hall" DROP COLUMN IF EXISTS "pricePerChild";

-- Przywróć NOT NULL na legacy fields
ALTER TABLE "Reservation" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "startTime" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "endTime" SET NOT NULL;
EOF

# 3. Restart
docker-compose restart backend
```

## Następne Kroki

✅ **Backend DONE:**
1. ✅ Database schema
2. ✅ Migration  
3. ✅ Seed
4. ✅ Types
5. ✅ Utils (business logic)
6. ✅ Service
7. ✅ Controller

⏭️ **Frontend TODO:**
1. ❌ Zaktualizuj formularze rezerwacji
2. ❌ Dodaj pola adults/children
3. ❌ Dodaj confirmation deadline picker
4. ❌ Dodaj warunkowe pola dla event types
5. ❌ Zaktualizuj walidację
6. ❌ Dodaj pole reason przy edycji
7. ❌ Zaktualizuj wyświetlanie rezerwacji

## Kontakt

W razie problemów sprawdź logi:
```bash
docker-compose logs backend
```
