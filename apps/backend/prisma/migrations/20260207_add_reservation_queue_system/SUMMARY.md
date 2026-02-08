# 🎯 PODSUMOWANIE: System List Rezerwowych

**Branch:** `feature/reservation-queue`  
**Data:** 2026-02-07  
**Status:** ✅ Gotowe do implementacji backendu

---

## 🚀 Co zostało zrobione?

### ✅ **1. Schema i Migracja Bazy Danych**

**Nowe elementy:**
- Enum `ReservationStatus`: `RESERVED`, `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`
- Kolumna `reservationQueuePosition` - pozycja w kolejce (1, 2, 3...)
- Kolumna `reservationQueueDate` - data, na którą jest rezerwacja
- Kolumna `queueOrderManual` - flaga, czy kolejność ustawiona ręcznie
- Opcjonalne pola dla RESERVED: `hallId`, `eventTypeId`, `startDateTime`, `endDateTime`

**Pliki:**
- `schema.prisma` - zaktualizowana schema
- `migration.sql` - pełna migracja SQL

---

### ✅ **2. Automatyczne Przeliczanie Pozycji**

**Funkcja:** `recalculate_queue_positions(date, exclude_id)`

**Działanie:**
- Przelicza pozycje dla danego dnia
- Pomija rezerwacje z `queueOrderManual = true`
- Sortuje według `createdAt` (kto pierwszy, ten lepszy)

**Trigger:** `recalculate_queue_on_status_change`
- Wywoływany automatycznie przy zmianie statusu
- Działa gdy RESERVED → PENDING/CONFIRMED/CANCELLED

**Przykład:**
```
Przed anulowaniem:
#1 → Jan
#2 → Maria  
#3 → Piotr

Jan anuluje → trigger się odpala

Po anulowaniu:
#1 → Maria (była #2)
#2 → Piotr (był #3)
```

---

### ✅ **3. Manualna Zmiana Kolejności**

**Funkcja 1:** `swap_queue_positions(id1, id2)`
- Zamienia miejscami dwie rezerwacje
- Ustawia `queueOrderManual = true` dla obu

**Funkcja 2:** `move_to_queue_position(id, new_position)`
- Przenosi rezerwację na określoną pozycję
- Przesuwa inne rezerwacje w górę/dół
- Ustawia `queueOrderManual = true` dla wszystkich poruszonych

**Użycie:**
```sql
-- Zamień miejscami rezerwacje
SELECT swap_queue_positions(
  'jan-uuid'::UUID,
  'piotr-uuid'::UUID
);

-- Przenieś Marię na pozycję #1 (priorytet VIP)
SELECT move_to_queue_position(
  'maria-uuid'::UUID,
  1
);
```

---

### ✅ **4. Automatyczne Anulowanie Przeterminowanych**

**Funkcja:** `auto_cancel_expired_reserved()`

**Działanie:**
- Anuluje RESERVED rezerwacje, których `reservationQueueDate` minął
- Dodaje notatkę o automatycznym anulowaniu
- Loguje do `ReservationHistory`
- Zwraca liczbę anulowanych i ich ID

**Scheduled Job:**
Uruchamiane codziennie o 00:01 przez:
- **Node-cron** (w backendzie) - ZALECANE
- **System cron** (Linux)
- **Ofelia** (Docker scheduler)

**Skrypt:** `auto_cancel_expired_reserved.sql`

---

## 📚 Dokumentacja

### **README.md**
- Pełny opis funkcjonalności
- Scenariusze użycia (automatic vs manual ordering)
- Przykłady zapytań SQL
- Breaking changes
- Rollback instructions

### **HOWTO.md**
- Instrukcje krok po kroku
- 3 opcje uruchomienia migracji
- 3 opcje setup crona
- Troubleshooting
- Checklist weryfikacji

### **test_migration.sql**
- Testy struktury bazy
- Testy funkcjonalne (recalculate, swap, move)
- Testy triggerów
- Testy auto-cancel
- Performance tests

### **SUMMARY.md** (ten plik)
- Szybkie podsumowanie
- Lista TODO dla następnych kroków

---

## 🔄 Przepływ Danych

### **Tworzenie RESERVED**

1. Użytkownik wypełnia minimalny formularz:
   - Data wydarzenia
   - Liczba gości
   - Dane klienta
   - Notatki (opcjonalnie)

2. Backend:
   - Sprawdza liczbę RESERVED na ten dzień
   - Przypisuje `reservationQueuePosition = count + 1`
   - Ustawia `queueOrderManual = false`
   - Tworzy rekord

3. Potwierdzenie:
   - "Dodano do listy rezerwowej na pozycję #X"

---

### **Awans RESERVED → PENDING**

1. Użytkownik wybiera RESERVED rezerwację
2. Klika "Awansuj na listę główną"
3. Modal z pełnym formularzem:
   - Sala (WYMAGANE)
   - Typ wydarzenia (WYMAGANE)
   - Godzina rozpoczęcia (WYMAGANE)
   - Godzina zakończenia (WYMAGANE)
   - Ceny (WYMAGANE)

4. Backend waliduje:
   - ✅ Wszystkie pola wypełnione
   - ✅ Brak kolizji sali
   - ✅ Godziny są poprawne

5. Jeśli OK:
   - Status → PENDING
   - Trigger przelicza pozycje pozostałych RESERVED
   - Zwolniona pozycja znika

---

### **Manualna Zmiana Kolejności**

1. Widok listy rezerwowej dla dnia
2. Drag & drop lub przyciski ↑/↓
3. Backend wywołuje:
   - `swap_queue_positions()` dla zamiany
   - `move_to_queue_position()` dla przesunięcia
4. Wszystkie poruszone rezerwacje:
   - `queueOrderManual = true`
   - Od teraz pomijane przez auto-recalc

---

### **Auto-anulowanie**

1. Cron uruchamia się codziennie o 00:01
2. Wywołuje `auto_cancel_expired_reserved()`
3. Funkcja:
   - Znajduje RESERVED gdzie `reservationQueueDate <= CURRENT_DATE`
   - Zmienia status → CANCELLED
   - Dodaje notatkę
   - Loguje do historii
4. Email/powiadomienie dla klienta (TODO w backendzie)

---

## 📊 Scenariusze Kolejkowania

### **Scenariusz A: Pełen Automatyzm**

```
Początek:
#1 Jan (2026-02-01 10:00) - auto
#2 Maria (2026-02-05 14:00) - auto
#3 Piotr (2026-02-07 09:00) - auto

→ Maria awansuje na listę główną

Koniec:
#1 Jan - auto
#2 Piotr - auto  ← automatyczne przeliczenie
```

### **Scenariusz B: Pełen Manual**

```
Początek:
#1 Jan - auto
#2 Maria - auto
#3 Piotr - auto

→ Admin przenosi Piotra na #1 (klient VIP)

Koniec:
#1 Piotr - MANUAL ✅
#2 Jan - MANUAL ✅
#3 Maria - MANUAL ✅

→ Jan anuluje

Dalej:
#1 Piotr - MANUAL (bez zmian)
#2 Maria - MANUAL (bez zmian)
❌ Brak auto-przeliczenia bo wszystkie MANUAL
```

### **Scenariusz C: Mixed (Najczęstszy)**

```
Początek:
#1 Jan - auto
#2 Maria - MANUAL (admin przesunął w górę)
#3 Piotr - auto
#4 Anna - auto

→ Jan anuluje

Koniec:
#1 Maria - MANUAL (bez zmian, bo MANUAL)
#2 Piotr - auto (był #3, teraz #2)
#3 Anna - auto (była #4, teraz #3)
✅ Tylko AUTO się przeliczają, MANUAL bez zmian
```

---

## 🛠️ TODO: Backend API (Krok 2)

### **Endpointy do stworzenia:**

```typescript
// CRUD dla RESERVED
POST   /api/reservations/reserved          // Dodaj do kolejki
GET    /api/reservations/reserved/:id      // Szczegóły
PUT    /api/reservations/reserved/:id      // Edytuj dane
DELETE /api/reservations/reserved/:id      // Anuluj

// Widok kolejki
GET    /api/reservations/queue/:date       // Lista na dany dzień
GET    /api/reservations/queue              // Wszystkie kolejki

// Zarządzanie kolejką
POST   /api/reservations/queue/swap         // Zamień dwie pozycje
PUT    /api/reservations/queue/:id/position // Przenieś na pozycję

// Awans
PUT    /api/reservations/:id/promote       // RESERVED → PENDING/CONFIRMED

// Raport
GET    /api/reservations/queue/stats       // Statystyki kolejek
```

### **Logika walidacji:**

```typescript
// Przy tworzeniu RESERVED
- clientId: REQUIRED
- reservationQueueDate: REQUIRED
- guests: REQUIRED, > 0
- hallId: OPTIONAL
- eventTypeId: OPTIONAL
- startDateTime: OPTIONAL
- endDateTime: OPTIONAL

// Przy awansie RESERVED → PENDING
- hallId: REQUIRED
- eventTypeId: REQUIRED
- startDateTime: REQUIRED
- endDateTime: REQUIRED
- pricePerAdult/Child/Toddler: REQUIRED (jeśli guests > 0)
- Sprawdź kolizje sali
- Sprawdź zakres godzin (8:00-2:00)
```

### **Service functions:**

```typescript
// queue.service.ts
class QueueService {
  async addToQueue(data): Promise<Reservation>
  async getQueueForDate(date): Promise<Reservation[]>
  async swapPositions(id1, id2): Promise<void>
  async moveToPosition(id, pos): Promise<void>
  async promoteToMain(id, data): Promise<Reservation>
  async getQueueStats(): Promise<Stats>
  async autoCancelExpired(): Promise<CancelResult>
}
```

---

## 🎨 TODO: Frontend (Krok 3)

### **Komponenty do stworzenia:**

```
1. ReservedForm.tsx
   - Uproszczony formularz (data + goście + klient)
   - Bez sal, godzin, cen
   
2. QueueListView.tsx
   - Lista rezerwacji RESERVED dla danego dnia
   - Drag & drop do zmiany kolejności
   - Badge z numerem pozycji
   - Przycisk "Awansuj"
   
3. QueueCalendar.tsx
   - Kalendarz z liczbą osób na liście dla każdego dnia
   - Kolor/ikona jeśli jest kolejka
   
4. PromoteModal.tsx
   - Pełny formularz rezerwacji
   - Walidacja wszystkich pól
   - Sprawdzanie kolizji
   
5. QueueStatsWidget.tsx
   - Widget na dashboard
   - "Dzisiaj 3 osoby na liście"
   - "Najdłuższa kolejka: 15.03 (8 osób)"
```

### **Przykładowy widok:**

```
📅 Lista Rezerwowa - 15 marca 2026

┌────────────────────────────────────┐
│ #1  Jan Kowalski              40 osób │
│     🤖 Auto  •  01.02 10:30         │
│     [👁️ Szczegóły] [⬆️ Awansuj]        │
├────────────────────────────────────┤
│ #2  Maria Nowak 🌟           25 osób │
│     🖐️ Manual  •  05.02 14:20       │
│     [👁️ Szczegóły] [⬆️ Awansuj]        │
├────────────────────────────────────┤
│ #3  Piotr Wiśniewski          30 osób │
│     🤖 Auto  •  07.02 09:15         │
│     [👁️ Szczegóły] [⬆️ Awansuj]        │
└────────────────────────────────────┘

[➕ Dodaj do kolejki]
```

---

## ✅ Checklist przed mergem do main

### Baza danych
- [ ] Migracja uruchomiona na dev
- [ ] Wszystkie testy przeszły
- [ ] Triggery działają
- [ ] Funkcje testowane manualnie
- [ ] Auto-cancel testowany

### Backend
- [ ] Endpointy zaimplementowane
- [ ] Walidacja działa
- [ ] Testy jednostkowe napisane
- [ ] Testy integracyjne napisane
- [ ] Cron job skonfigurowany
- [ ] Logi działają

### Frontend
- [ ] Formularze działają
- [ ] Widoki kolejek działają
- [ ] Drag & drop działa
- [ ] Awansowanie działa
- [ ] Responsywność OK
- [ ] Ikony/style spójne

### Dokumentacja
- [ ] API dokumentacja
- [ ] User guide
- [ ] Admin guide (cron setup)
- [ ] Changelog zaktualizowany

### Testy E2E
- [ ] Utworzenie RESERVED
- [ ] Awans do PENDING
- [ ] Manualna zmiana kolejności
- [ ] Auto-anulowanie
- [ ] Kolizje sal

---

## 📞 Kontakt

**Author:** Kamil Gołębiowski  
**Email:** kamilgolebiowski@10g.pl  
**Branch:** `feature/reservation-queue`

---

## 🎉 Gotówka do kodu!

Wszystkie zmiany bazy danych są gotowe. Można przystąpić do:
1. **Backend API** (Krok 2)
2. **Frontend UI** (Krok 3)
3. **Testy** (Krok 4)
