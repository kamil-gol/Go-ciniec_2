# Bugfix Session - 2026-02-09

## Bug #9: Race Condition w Drag & Drop Kolejki

### 🐞 **Problem**

**Data wykrycia:** 2026-02-09  
**Severity:** High  
**Status:** ✅ Fixed

#### Opis problemu

Przy użyciu funkcji drag & drop do zmiany kolejności rezerwacji w module Kolejki występowały:**

1. **Race Conditions** - wiele jednoczesnych requestów aktualizujących pozycje
2. **Duplikaty pozycji** - dwa elementy mogły mieć tą samą pozycję
3. **Unique Constraint Violations** - konflikty w bazie danych
4. **Niestabilne zachowanie** - czasami drag & drop działał, czasami nie

#### Root Cause

```typescript
// ❌ PRZED - Multiple sequential requests (race condition)
for (const item of reorderedItems) {
  await queueApi.moveToPosition(item.id, item.position);
}
// Każdy request: PUT /api/queue/:id/position
// Problem: Między requestami inna osoba może zmienić pozycje!
```

**Przykład:**
- User 1: Przesuwa #3 → #1
- User 2: Jednocześnie przesuwa #2 → #3  
- Rezultat: Duplikaty pozycji lub błędy unique constraint

---

### 🔧 **Rozwiązanie**

#### Strategia: Batch Update w Transakcji

Zaimplementowano **atomiczną aktualizację** wszystkich pozycji w jednej transakcji Prisma.

#### 1. Nowy Endpoint

**Route:**
```typescript
POST /api/queue/batch-update-positions
```

**Payload:**
```json
{
  "updates": [
    { "id": "uuid-1", "position": 1 },
    { "id": "uuid-2", "position": 2 },
    { "id": "uuid-3", "position": 3 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  },
  "message": "Zaktualizowano 3 pozycji w kolejce"
}
```

#### 2. Service Layer - Two-Phase Update

Problem: **Unique constraint** na parze `(date, position)` uniemożliwia bezpośrednią zamianę pozycji.

**Rozwiązanie: Dwuetapowa aktualizacja**

```typescript
// ✅ PO - Atomic transaction with two-phase update
await prisma.$transaction(async (tx) => {
  // Phase 1: Set TEMPORARY high positions (1000+)
  for (let i = 0; i < updates.length; i++) {
    await tx.reservation.update({
      where: { id: updates[i].id },
      data: { reservationQueuePosition: 1000 + i }
    });
  }
  
  // Phase 2: Set FINAL positions
  for (const update of updates) {
    await tx.reservation.update({
      where: { id: update.id },
      data: { 
        reservationQueuePosition: update.position,
        queueOrderManual: true 
      }
    });
  }
});
```

**Dlaczego działa:**
- **Faza 1:** Wszystkie elementy przesuwamy na pozycje 1000+ (unikamy konfliktów)
- **Faza 2:** Bezpiecznie ustawiamy finalne pozycje (1, 2, 3...)
- **Transakcja:** All-or-nothing - albo wszystko się uda, albo nic

#### 3. Frontend - Single Request

```typescript
// ✅ PO - Single atomic request
const handleReorder = async (reorderedItems: QueueItem[]) => {
  const updates = reorderedItems.map(item => ({
    id: item.id,
    position: item.position,
  }));
  
  await queueApi.batchUpdatePositions({ updates });
};
```

---

### 📊 **Porównanie**

| Aspekt | Przed | Po |
|--------|-------|----|
| **Liczba requestów** | N (loop) | 1 (batch) |
| **Atomowość** | ❌ Nie | ✅ Tak |
| **Race conditions** | ❌ Możliwe | ✅ Uniemożliwione |
| **Unique violations** | ❌ Częste | ✅ Brak |
| **Wydajność** | Niska | Wysoka |

---

### 🔍 **Rozwiązane Edge Cases**

#### Problem 1: CHECK Constraint

**Błąd:**
```sql
CHECK (reservationQueuePosition > 0)
```

Początkowo próbowano użyć **negatywnych pozycji** jako tymczasowych:
```typescript
// ❌ Nie działa - łamie CHECK constraint
reservationQueuePosition: -(i + 1)  // -1, -2, -3...
```

**Rozwiązanie:** Wysokie pozycje dodatnie
```typescript
// ✅ Działa - spełnia CHECK constraint
reservationQueuePosition: 1000 + i  // 1000, 1001, 1002...
```

#### Problem 2: Unique Constraint Conflict

**Scenariusz:**
```
Mamy: #1, #2
Chcemy: #1 → #2, #2 → #1
```

**Próba bezpośredniej zamiany:**
```typescript
// ❌ BŁĄD!
UPDATE reservation SET position = 2 WHERE id = 'uuid-1';
// ERROR: Unique constraint violated (pozycja 2 już istnieje!)
```

**Rozwiązanie dwuetapowe:**
```typescript
// ✅ DZIAŁA
// Faza 1:
UPDATE reservation SET position = 1000 WHERE id = 'uuid-1';
UPDATE reservation SET position = 1001 WHERE id = 'uuid-2';

// Faza 2:
UPDATE reservation SET position = 2 WHERE id = 'uuid-1';
UPDATE reservation SET position = 1 WHERE id = 'uuid-2';
```

---

### 📝 **Commits**

1. **[3171b64](https://github.com/kamil-gol/Go-ciniec_2/commit/3171b643fc03b9d444af2041aee946bf2d04690a)**  
   `fix: use batchUpdatePositions for atomic drag & drop`
   - Dodanie endpointu `POST /api/queue/batch-update-positions`
   - Controller + Service + Types
   - Frontend API client
   - Zmiana `handleReorder` na pojedynczy request

2. **[481258c](https://github.com/kamil-gol/Go-ciniec_2/commit/481258c6a8f84c72642a3c51384afdd4aad48d05)**  
   `fix: use temporary negative positions to avoid unique constraint`
   - Próba użycia negatywnych pozycji tymczasowych
   - ❌ Niepowodzenie (CHECK constraint)

3. **[1d00185](https://github.com/kamil-gol/Go-ciniec_2/commit/1d00185b4714ac2c9111ed3769743ff0c0936ccd)**  
   `fix: use high temporary positions (1000+) instead of negative`
   - ✅ Ostateczne rozwiązanie
   - Wysokie pozycje dodatnie (1000+) jako tymczasowe

---

### ✅ **Weryfikacja**

#### Test 1: Pojedyncze przeciągnięcie
- ✅ #3 → #1: Działa
- ✅ Pozycje: 1, 2, 3, 4, 5 (bez duplikatów)

#### Test 2: Multiple drag
- ✅ Przesuniecie 3 elementów naraz
- ✅ Jeden request POST batch-update-positions
- ✅ Wszystkie pozycje zaktualizowane atomowo

#### Test 3: Race condition simulation
- ✅ Dwóch użytkowników jednocześnie zmienia kolejność
- ✅ Transakcja zapewnia izolację
- ✅ Brak konfliktów unique constraint

#### Test 4: Edge cases
- ✅ Zamiana pozycji (#1 ↔ #2)
- ✅ Przesunięcie na koniec (#1 → #5)
- ✅ Przesunięcie na początek (#5 → #1)

---

### 📚 **Lekcje wyciągnięte**

1. **Batch operations > Loops**  
   Zawsze rozważ batch API dla operacji na wielu elementach

2. **Transakcje są kluczowe**  
   Atomowość zapobiega race conditions

3. **Two-phase update pattern**  
   Użyteczny przy unique constraints - najpierw tymczasowe wartości, potem finalne

4. **Testuj constraints**  
   CHECK i UNIQUE constraints mogą zablokować pozornie poprawne rozwiązania

5. **DevTools Network = Best Friend**  
   Monitoring requestów ujawnił problem z wieloma requestami

---

### 🔗 **Powiązana dokumentacja**

- [QUEUE.md](./QUEUE.md) - Pełna dokumentacja systemu kolejki
- [DATABASE.md](./DATABASE.md) - Constraints i migracje
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architektura backendu

---

**Autor:** Perplexity AI  
**Data:** 2026-02-09  
**Status:** ✅ Resolved and Deployed
