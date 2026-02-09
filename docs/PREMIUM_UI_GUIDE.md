# 🌟 Premium UI & Multi-Reservation System

## Przegłąd

Modernizacja interfejsu użytkownika dla modułu sal oraz wprowadzenie systemu wielokrotnych rezerwacji dziennie.

**Data utworzenia:** 09.02.2026  
**Wersja:** 2.0.0  
**Branch:** feature/premium-halls-ui  
**Status:** ✅ Gotowy do testów

---

## 🎨 Premium UI Features

### 1. Modernizacja Strony Listy Sal

**Lokalizacja:** `apps/frontend/app/dashboard/halls/page.tsx`

#### Nowe Elementy:

##### Hero Header z Gradientem
```tsx
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
  <div className="absolute inset-0 bg-grid-white/10" />
  {/* Content */}
</div>
```

**Features:**
- Gradient purple/indigo
- Grid pattern w tle
- Dekoracyjne blur elements
- Duży tytuł (text-4xl)
- CTA button (Dodaj Salę)

##### Premium Stats Cards (4 metryki)

```tsx
<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
  {/* Stats content */}
</Card>
```

**Metryki:**
1. **Wszystkie sale** - gradient blue/cyan
2. **Aktywne sale** - gradient green/emerald
3. **Całkowita pojemność** - gradient purple/pink
4. **Średnia cena/os.** - gradient orange/amber

**Efekty:**
- Gradient backgrounds
- Ikony w kolorowych boxach
- Hover: lift effect (-translate-y-1)
- Shadow transitions
- Sparkles icon

##### Enhanced Search Bar

```tsx
<Input
  className="pl-12 h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
/>
```

**Improvements:**
- Większe pole (h-12)
- Border-2 dla lepszej widoczności
- Purple focus ring
- Ikona Search (5x5)

---

### 2. Redesign HallCard

**Lokalizacja:** `apps/frontend/components/halls/hall-card.tsx`

#### Nowe Features:

##### Gradient Border Effect
```tsx
<Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100" />
</Card>
```

**Efekty hover:**
- Gradient border pojawia się
- Card podnosi się (-translate-y-2)
- Shadow intensyfikuje się
- Transitions 500ms

##### Premium Header
```tsx
<div className="flex items-start gap-3">
  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
    <Sparkles className="h-5 w-5 text-white" />
  </div>
  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
    {hall.name}
  </CardTitle>
</div>
```

**Features:**
- Sparkles icon w gradient boxie
- Gradient text dla nazwy
- Badge z CheckCircle2 dla aktywnych

##### Premium Pricing Box

```tsx
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 border border-purple-200/50 shadow-inner">
  {/* 3 tiers pricing */}
</div>
```

**Layout:**
- Gradient background (purple/pink/indigo)
- Border z opacity 50%
- Shadow inner
- Dekoracyjny corner accent
- Tytuł: "💰 Cennik"

**Ceny (3 poziomy):**
```tsx
<div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
    <span>Dorośli:</span>
  </div>
  <strong className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
    {hall.pricePerPerson} zł
  </strong>
</div>
```

##### CTA Button
```tsx
<Button className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
  <Calendar className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
  Zobacz Kalendarz
</Button>
```

**Efekty:**
- Gradient button (purple/pink/indigo)
- Hover: darker gradients
- Shadow transitions
- Calendar icon scale on hover

---

## 🗓️ Multi-Reservation System

### Problem

Poprzednio: **Jedna rezerwacja na dzień dla jednej sali**
- System blokował cały dzień
- Niemożliwe były rezerwacje np. 10:00-14:00 i 18:00-22:00

### Rozwiązanie

Teraz: **Wiele rezerwacji dziennie - walidacja nakładających się czasów**

#### Logika Overlap Detection

**Lokalizacja:** `apps/backend/src/services/reservation.service.ts`

**Metoda:** `checkDateTimeOverlap(hallId, startDateTime, endDateTime, excludeId?)`

##### Algorytm:

```typescript
/**
 * Overlap występuje gdy:
 * (startA < endB) AND (endA > startB)
 * 
 * Przykłady:
 * Istniejąca: 10:00-14:00, Nowa: 15:00-20:00 → NO OVERLAP ✓
 * Istniejąca: 10:00-14:00, Nowa: 12:00-16:00 → OVERLAP ✗
 * Istniejąca: 10:00-14:00, Nowa: 14:00-18:00 → NO OVERLAP ✓
 */
const overlapping = await prisma.reservation.findFirst({
  where: {
    hallId,
    startDateTime: { not: null },
    endDateTime: { not: null },
    status: { in: ['PENDING', 'CONFIRMED'] },
    archivedAt: null,
    AND: [
      { startDateTime: { lt: endDateTime } },
      { endDateTime: { gt: startDateTime } }
    ]
  }
});

return !!overlapping;
```

##### Warunki sprawdzania:

1. **Ta sama sala** (`hallId`)
2. **Używają DateTime** (nie legacy date/time)
3. **Aktywny status** (PENDING lub CONFIRMED)
4. **Nie zarchiwowane**
5. **Wykluczenie edytowanej rezerwacji** (`excludeId`)

##### Przypadki Brzegowe:

| Istniejąca | Nowa | Wynik | Przyczyna |
|------------|------|-------|----------|
| 10:00-14:00 | 14:00-18:00 | ✅ OK | Doktryna granica (14:00 = 14:00) |
| 10:00-14:00 | 13:59-18:00 | ❌ KONFLIKT | Nakładanie (13:59 < 14:00) |
| 10:00-14:00 | 15:00-20:00 | ✅ OK | Odstep 1h |
| 10:00-14:00 | 08:00-11:00 | ❌ KONFLIKT | Nakładanie |
| 10:00-14:00 | 08:00-22:00 | ❌ KONFLIKT | Całkowite pokrycie |

---

### Integracja w Create Reservation

**Lokalizacja:** `apps/backend/src/services/reservation.service.ts` - metoda `createReservation`

```typescript
// NEW: Check for overlapping reservations using DateTime
const hasOverlap = await this.checkDateTimeOverlap(
  data.hallId,
  startDT,
  endDT
);

if (hasOverlap) {
  throw new Error('This time slot is already booked for the selected hall. Please choose a different time.');
}
```

**Komunikat błędu:**
> "This time slot is already booked for the selected hall. Please choose a different time."

---

### Integracja w Update Reservation

**Lokalizacja:** `apps/backend/src/services/reservation.service.ts` - metoda `updateReservation`

```typescript
// NEW: Check for overlapping reservations when updating time
if ((data.startDateTime || data.endDateTime) && finalStart && finalEnd) {
  const hasOverlap = await this.checkDateTimeOverlap(
    existingReservation.hallId,
    finalStart,
    finalEnd,
    id // exclude current reservation
  )}

  if (hasOverlap) {
    throw new Error('This time slot is already booked...');
  }
}
```

**Uwaga:** Przy edycji wykluczamy bieżącą rezerwację (`excludeId = id`)

---

## 🛠️ Przykłady Użycia

### Scenariusz 1: Wesele + Popółudniowy Event

**Sala Krystałowa - 2026-03-15:**

```json
{
  "reservation1": {
    "startDateTime": "2026-03-15T10:00:00Z",
    "endDateTime": "2026-03-15T14:00:00Z",
    "eventType": "Urodziny",
    "guests": 40
  },
  "reservation2": {
    "startDateTime": "2026-03-15T18:00:00Z",
    "endDateTime": "2026-03-15T23:00:00Z",
    "eventType": "Wesele",
    "guests": 100
  }
}
```

**Wynik:** ✅ **Obie rezerwacje zaakceptowane** - brak nakładania

---

### Scenariusz 2: Próba Konfliktu

**Sala Bankietowa - 2026-04-20:**

```json
{
  "existing": {
    "startDateTime": "2026-04-20T15:00:00Z",
    "endDateTime": "2026-04-20T20:00:00Z",
    "status": "CONFIRMED"
  },
  "new_attempt": {
    "startDateTime": "2026-04-20T18:00:00Z",
    "endDateTime": "2026-04-20T22:00:00Z"
  }
}
```

**Wynik:** ❌ **Odrzucone**

**Błąd:**
```
Error: This time slot is already booked for the selected hall. Please choose a different time.
```

**Przyczyna:**
- Istniejąca kończy się: 20:00
- Nowa zaczyna się: 18:00
- 18:00 < 20:00 → KONFLIKT

---

### Scenariusz 3: Dokładna Granica

**Sala Ogrodowa - 2026-05-10:**

```json
{
  "morning": {
    "startDateTime": "2026-05-10T08:00:00Z",
    "endDateTime": "2026-05-10T12:00:00Z"
  },
  "afternoon": {
    "startDateTime": "2026-05-10T12:00:00Z",
    "endDateTime": "2026-05-10T16:00:00Z"
  }
}
```

**Wynik:** ✅ **Zaakceptowane**

**Wyjaśnienie:**
- Morning kończy: 12:00
- Afternoon zaczyna: 12:00
- 12:00 = 12:00 (dokładna granica)
- Warunek: `startDateTime < endDateTime` (LT, nie LTE)
- Brak konfliktu!

---

## 📋 API Changes

### POST /api/reservations

**Nowa walidacja:**

```typescript
// Request
{
  "hallId": "uuid",
  "clientId": "uuid",
  "eventTypeId": "uuid",
  "startDateTime": "2026-06-15T14:00:00Z",
  "endDateTime": "2026-06-15T20:00:00Z",
  "adults": 80,
  "children": 20,
  "toddlers": 5
}

// Response (success)
{
  "success": true,
  "data": { /* reservation */ },
  "message": "Reservation created successfully"
}

// Response (overlap error)
{
  "success": false,
  "error": "This time slot is already booked for the selected hall. Please choose a different time."
}
```

### PUT /api/reservations/:id

**Nowa walidacja przy zmianie czasów:**

```typescript
// Request
{
  "startDateTime": "2026-06-15T15:00:00Z",
  "endDateTime": "2026-06-15T21:00:00Z",
  "reason": "Klient prosił o przedłużenie wydarzenia"
}

// Response (overlap with other reservation)
{
  "success": false,
  "error": "This time slot is already booked for the selected hall. Please choose a different time."
}
```

**Uwaga:** Edytowana rezerwacja jest wykluczana z overlap check (`excludeId`)

---

## 🧪 Testing Scenarios

### Test 1: Premium UI - Visual Check

**Kroki:**
```bash
cd /home/kamil/rezerwacje
git checkout feature/premium-halls-ui
git pull origin feature/premium-halls-ui
docker-compose restart frontend
```

**Sprawdzenia:**
1. Otwórz `http://localhost:3000/dashboard/halls`
2. Sprawdź hero header z gradientem
3. Sprawdź 4 stats cards z ikonami
4. Hover nad kartami - lift effect?
5. Hover nad HallCard - gradient border?
6. Sprawdz pricing box - 3 ceny
7. Zobacz Kalendarz button - gradient?

---

### Test 2: Multi-Reservation - Backend

**Setup:**
```bash
# Terminal 1 - Backend logs
docker-compose logs -f backend

# Terminal 2 - API calls
curl -X POST http://localhost:3001/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "hallId": "<hall-uuid>",
    "clientId": "<client-uuid>",
    "eventTypeId": "<event-uuid>",
    "startDateTime": "2026-06-15T10:00:00Z",
    "endDateTime": "2026-06-15T14:00:00Z",
    "adults": 50
  }'
```

**Test Cases:**

#### TC-1: Non-overlapping (powinno przejść)
```json
{
  "res1": { "start": "10:00", "end": "14:00" },
  "res2": { "start": "15:00", "end": "20:00" }
}
```
**Expected:** Obie 201 Created

#### TC-2: Overlapping (powinno zablokować)
```json
{
  "res1": { "start": "10:00", "end": "14:00" },
  "res2": { "start": "12:00", "end": "16:00" }
}
```
**Expected:** Res1 = 201, Res2 = 400 + error message

#### TC-3: Boundary test (dokładna granica)
```json
{
  "res1": { "start": "10:00", "end": "14:00" },
  "res2": { "start": "14:00", "end": "18:00" }
}
```
**Expected:** Obie 201 Created

---

### Test 3: Update Reservation - Overlap Check

**Setup:**
```bash
# Stwórz rezerwację 10:00-14:00
RES1_ID=<uuid>

# Stwórz rezerwację 15:00-20:00
RES2_ID=<uuid>

# Próbuj zaktualizować RES2 na 12:00-17:00 (konflikt z RES1)
curl -X PUT http://localhost:3001/api/reservations/$RES2_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "startDateTime": "2026-06-15T12:00:00Z",
    "endDateTime": "2026-06-15T17:00:00Z",
    "reason": "Klient chce wcześniejszy start"
  }'
```

**Expected:** 400 Bad Request + error message

---

## 📚 Known Issues

### 1. Legacy Format Still Supported

**Problem:** Stary format (date/startTime/endTime) nadal działa

**Impact:** Confusion - dwa sposoby tworzenia rezerwacji

**Solution (future):** Deprecate legacy format, migrate all to DateTime

**Priority:** Low

---

### 2. Brak Frontend Validation

**Problem:** Overlap sprawdzane tylko na backendzie

**Impact:** Użytkownik wypełnia formularz i dostaje błąd dopiero po submicie

**Solution:** Dodaj real-time availability check w formularzu

```tsx
// Pseudo-code
const checkAvailability = async (hallId, start, end) => {
  const response = await fetch(`/api/halls/${hallId}/availability?start=${start}&end=${end}`);
  return response.json();
};

useEffect(() => {
  if (selectedHall && startTime && endTime) {
    checkAvailability(selectedHall, startTime, endTime)
      .then(data => setIsAvailable(data.available));
  }
}, [selectedHall, startTime, endTime]);
```

**Priority:** Medium

---

### 3. Brak Wizualizacji Timeline

**Problem:** Trudno zobaczyć wolne sloty w kalendarzu

**Impact:** Użytkownik musi próbować różne czasy metodami prób i błędów

**Solution:** Calendar view z istniejacymi rezerwacjami

```tsx
// Component idea
<DayView date="2026-06-15" hallId={hallId}>
  <TimeSlot start="10:00" end="14:00" status="booked" />
  <TimeSlot start="14:00" end="18:00" status="available" />
  <TimeSlot start="18:00" end="22:00" status="booked" />
</DayView>
```

**Priority:** High

---

## 🚀 Deployment Checklist

- [ ] **Backend tests** - overlap detection
- [ ] **Manual UI testing** - all cards, hover effects
- [ ] **API testing** - create/update with overlap scenarios
- [ ] **Database migration** - if schema changed (None in this case)
- [ ] **Documentation updated** - this file + CHANGELOG
- [ ] **Pull request created** - feature/premium-halls-ui → main
- [ ] **Code review** - 2 approvals required
- [ ] **Deploy to staging** - test with real data
- [ ] **Deploy to production**

---

## 📄 Files Changed

### Frontend:
1. `apps/frontend/app/dashboard/halls/page.tsx` - premium UI redesign
2. `apps/frontend/components/halls/hall-card.tsx` - gradient cards

### Backend:
3. `apps/backend/src/services/reservation.service.ts` - datetime overlap validation

### Documentation:
4. `docs/PREMIUM_UI_GUIDE.md` - this file
5. `CHANGELOG.md` - to be updated

---

## 🔗 Resources

### Code References:
- [Premium Halls Page](../apps/frontend/app/dashboard/halls/page.tsx)
- [HallCard Component](../apps/frontend/components/halls/hall-card.tsx)
- [Reservation Service](../apps/backend/src/services/reservation.service.ts)

### Related Documentation:
- [HALLS_MODULE.md](./HALLS_MODULE.md) - Basic hall management
- [API.md](../API.md) - API endpoints
- [DATABASE.md](./DATABASE.md) - Schema reference

---

**Dokument utworzony:** 09.02.2026  
**Ostatnia aktualizacja:** 09.02.2026  
**Autor:** Kamil Gol + AI Assistant  
**Status:** ✅ Gotowy do review
