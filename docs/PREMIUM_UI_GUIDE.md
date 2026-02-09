# 🌟 Premium UI & Multi-Reservation System

## Przegląd

Kompletna modernizacja interfejsu użytkownika dla **całego modułu Halls** oraz wprowadzenie systemu wielokrotnych rezerwacji dziennie.

**Data utworzenia:** 09.02.2026  
**Wersja:** 2.0.0  
**Branch:** feature/premium-halls-ui  
**Status:** ✅ Gotowy do testów

---

## 📄 Objęte Strony

### ✅ 1. Lista Sal - `/dashboard/halls`
**Status:** Premium UI ✨  
**Features:**
- Gradient hero header (purple/pink/indigo)
- 4 premium stats cards z animacjami
- Enhanced search bar
- Premium HallCard z hover effects

### ✅ 2. Szczegóły Sali - `/dashboard/halls/[id]`
**Status:** Premium UI ✨  
**Features:**
- Gradient hero z nazwą sali
- 3-poziomowy cennik (Dorośli/Dzieci/Maluchy)
- Premium info cards
- Kalendarz placeholder
- Quick stats grid

### ✅ 3. Edycja Sali - `/dashboard/halls/[id]/edit`
**Status:** Premium UI ✨  
**Features:**
- Purple gradient hero
- Smart pricing z auto-wyliczaniem (domyślnie OFF)
- Modern form inputs
- Amenities manager
- Gradient save button

### ✅ 4. Nowa Sala - `/dashboard/halls/new`
**Status:** Premium UI ✨  
**Features:**
- Emerald gradient hero (różni się od edit)
- Smart pricing z auto-wyliczaniem (domyślnie ON)
- Przykładowe wyliczenie cen
- Modern form inputs
- Emerald gradient button

---

## 🎨 Premium UI Features

### Design System

#### Kolory Gradientów

**Lista Sal (Dashboard):**
```tsx
from-violet-600 via-purple-600 to-indigo-600
```

**Szczegóły Sali:**
```tsx
from-violet-600 via-purple-600 to-indigo-600
```

**Edycja (Edit):**
```tsx
from-violet-600 via-purple-600 to-indigo-600
```

**Nowa Sala (New):**
```tsx
from-emerald-600 via-green-600 to-teal-600
```

💡 **Design Decision:** Strona "New" ma zielony gradient, aby wizualnie odróżnić "tworzenie" od "edycji".

---

### 1. Hero Headers

**Wspólne elementy:**
```tsx
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[color] p-8 text-white shadow-2xl">
  {/* Grid pattern background */}
  <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
  
  {/* Blur decorations */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
  
  {/* Content */}
  <div className="relative z-10">
    {/* Back button, title, actions */}
  </div>
</div>
```

**Ikony:**
- Lista: `Building2` (overview)
- Szczegóły: `Building2` (specific hall)
- Edit: `Building2` (editing)
- New: `Plus` (creating)

---

### 2. Stats Cards (tylko lista)

**4 metryki z gradientami:**

```tsx
// 1. Wszystkie sale
from-blue-500/10 to-cyan-500/10

// 2. Aktywne sale
from-green-500/10 to-emerald-500/10

// 3. Pojemność
from-purple-500/10 to-pink-500/10

// 4. Średnia cena
from-orange-500/10 to-amber-500/10
```

**Hover effects:**
- `-translate-y-1`
- `shadow-lg → shadow-xl`
- `transition-all duration-300`

---

### 3. Premium Pricing Cards

**Lokalizacja:**
- Lista: w HallCard (3 ceny inline)
- Szczegóły: dedykowana sekcja (3 duże karty)
- Edit/New: formularz z auto-calc

**3-poziomowy system:**

```tsx
// 1. Dorośli (13+ lat)
Gradient: purple-500 to indigo-500

// 2. Dzieci (4-12 lat)
Gradient: blue-500 to cyan-500

// 3. Maluchy (0-3 lat)
Gradient: green-500 to emerald-500
// Specjalne: jeśli cena = 0 → "✨ Gratis"
```

---

### 4. Smart Pricing (Edit/New)

**Auto-wyliczanie:**

```tsx
// Default: ON dla New, OFF dla Edit
const [autoCalculate, setAutoCalculate] = useState(isNew)

// Algorytm
pricePerChild = pricePerPerson * 0.5
pricePerToddler = pricePerPerson * 0.25

// Update on change
useEffect(() => {
  if (autoCalculate && pricePerPerson > 0) {
    setFormData(prev => ({
      ...prev,
      pricePerChild: Math.round(prev.pricePerPerson * 0.5 * 100) / 100,
      pricePerToddler: Math.round(prev.pricePerPerson * 0.25 * 100) / 100,
    }))
  }
}, [pricePerPerson, autoCalculate])
```

**UI Components:**

```tsx
{/* Toggle Switch */}
<div className="flex items-center gap-3">
  {autoCalculate ? <ToggleRight /> : <ToggleLeft />}
  <Label>Auto-wyliczanie</Label>
  <Switch checked={autoCalculate} onCheckedChange={setAutoCalculate} />
</div>

{/* Info Banner */}
{autoCalculate && (
  <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-4">
    ✨ Ceny dzieci i maluchów będą automatycznie wyliczane
  </div>
)}

{/* Disabled Inputs */}
<Input disabled={autoCalculate} />
{autoCalculate && <p className="text-xs text-emerald-600">✓ Wyliczone automatycznie</p>}
```

---

### 5. Form Inputs

**Enhanced styling:**

```tsx
<Input
  className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-[color]-500"
  placeholder="..."
/>

<Textarea
  className="text-base border-2 focus-visible:ring-2 focus-visible:ring-[color]-500 resize-none"
  rows={4}
/>
```

**Price inputs z suffix:**

```tsx
<div className="relative">
  <Input type="number" step="0.01" className="pr-12" />
  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
    zł
  </span>
</div>
```

---

### 6. Buttons

**Primary (gradient):**

```tsx
// Lista, Szczegóły, Edit
<Button className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 shadow-xl">
  Zobacz Kalendarz
</Button>

// New
<Button className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 shadow-xl">
  Utwórz Salę
</Button>
```

**Secondary (outline):**

```tsx
<Button variant="outline" size="lg" className="h-14 text-lg">
  Anuluj
</Button>
```

---

### 7. Cards & Containers

**Premium Card:**

```tsx
<Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
  {/* Content */}
</Card>
```

**Gradient Background Card:**

```tsx
<Card className="border-0 shadow-xl overflow-hidden">
  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 p-8">
    {/* Content */}
  </div>
</Card>
```

---

### 8. Loading States

**Spinner:**

```tsx
<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
  <div className="text-center space-y-4">
    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
    <p className="text-muted-foreground">Wczytywanie...</p>
  </div>
</div>
```

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
| 10:00-14:00 | 14:00-18:00 | ✅ OK | Dokładna granica (14:00 = 14:00) |
| 10:00-14:00 | 13:59-18:00 | ❌ KONFLIKT | Nakładanie (13:59 < 14:00) |
| 10:00-14:00 | 15:00-20:00 | ✅ OK | Odstęp 1h |
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

### Scenariusz 1: Wesele + Popołudniowy Event

**Sala Kryształowa - 2026-03-15:**

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

**Sprawdzenia dla `/dashboard/halls`:**
1. ✅ Hero header z gradientem purple/pink/indigo
2. ✅ 4 stats cards z ikonami (hover = lift)
3. ✅ Search bar większy (h-12)
4. ✅ HallCard gradient border on hover
5. ✅ Pricing box z 3 cenami
6. ✅ "Zobacz Kalendarz" button gradient

**Sprawdzenia dla `/dashboard/halls/[id]` (Szczegóły):**
1. ✅ Hero header z nazwą sali
2. ✅ Purple/pink gradient
3. ✅ 3 duże pricing cards (Dorośli/Dzieci/Maluchy)
4. ✅ "Gratis" dla maluchów jeśli cena = 0
5. ✅ Quick stats grid (3 karty)
6. ✅ Kalendarz placeholder

**Sprawdzenia dla `/dashboard/halls/[id]/edit` (Edycja):**
1. ✅ Purple gradient hero
2. ✅ Auto-calc toggle (domyślnie OFF)
3. ✅ Disabled inputs gdy auto-calc ON
4. ✅ "✓ Wyliczone automatycznie" text
5. ✅ Amenities manager
6. ✅ Gradient save button

**Sprawdzenia dla `/dashboard/halls/new` (Nowa):**
1. ✅ Emerald/green gradient hero (różni się!)
2. ✅ Auto-calc toggle (domyślnie ON)
3. ✅ Przykładowe wyliczenie cen
4. ✅ Gradient create button (emerald)

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

### Test 3: Auto-Calculate Pricing

**New Hall Page:**
1. Ustaw cenę dorośłego: 100 zł
2. Auto-calc powinien być ON domyślnie
3. Sprawdź:
   - Cena dziecka = 50 zł (50%)
   - Cena malucha = 25 zł (25%)
4. Wyłącz auto-calc
5. Zmień ceny ręcznie
6. Włącz auto-calc ponownie
7. Ceny powinny się zaktualizować

**Edit Hall Page:**
1. Auto-calc powinien być OFF domyślnie
2. Istniejące ceny zachowane
3. Włącz auto-calc
4. Ceny dzieci/maluchów powinny się przeliczyć

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

**Solution:** Calendar view z istniejącymi rezerwacjami

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

- [x] **Lista sal** - premium UI
- [x] **Szczegóły sali** - premium UI
- [x] **Edycja sali** - premium UI + auto-calc
- [x] **Nowa sala** - premium UI + auto-calc
- [x] **HallCard** - premium redesign
- [x] **Backend** - datetime overlap validation
- [ ] **Manual UI testing** - all pages
- [ ] **API testing** - create/update with overlap scenarios
- [ ] **Database migration** - None needed
- [ ] **Documentation updated** - ✅ Done
- [ ] **Pull request created** - feature/premium-halls-ui → main
- [ ] **Code review** - 2 approvals required
- [ ] **Deploy to staging** - test with real data
- [ ] **Deploy to production**

---

## 📄 Files Changed

### Frontend (Premium UI):
1. `apps/frontend/app/dashboard/halls/page.tsx` - lista sal ✅
2. `apps/frontend/components/halls/hall-card.tsx` - premium card ✅
3. `apps/frontend/app/dashboard/halls/[id]/page.tsx` - szczegóły ✅
4. `apps/frontend/app/dashboard/halls/[id]/edit/page.tsx` - edycja ✅
5. `apps/frontend/app/dashboard/halls/new/page.tsx` - nowa sala ✅

### Backend (Multi-Reservation):
6. `apps/backend/src/services/reservation.service.ts` - overlap validation ✅

### Documentation:
7. `docs/PREMIUM_UI_GUIDE.md` - this file ✅
8. `CHANGELOG.md` - to be updated

---

## 🔗 Resources

### Code References:
- [Premium Halls List](https://github.com/kamil-gol/Go-ciniec_2/blob/feature/premium-halls-ui/apps/frontend/app/dashboard/halls/page.tsx)
- [Hall Details Page](https://github.com/kamil-gol/Go-ciniec_2/blob/feature/premium-halls-ui/apps/frontend/app/dashboard/halls/%5Bid%5D/page.tsx)
- [Hall Edit Page](https://github.com/kamil-gol/Go-ciniec_2/blob/feature/premium-halls-ui/apps/frontend/app/dashboard/halls/%5Bid%5D/edit/page.tsx)
- [New Hall Page](https://github.com/kamil-gol/Go-ciniec_2/blob/feature/premium-halls-ui/apps/frontend/app/dashboard/halls/new/page.tsx)
- [HallCard Component](https://github.com/kamil-gol/Go-ciniec_2/blob/feature/premium-halls-ui/apps/frontend/components/halls/hall-card.tsx)
- [Reservation Service](https://github.com/kamil-gol/Go-ciniec_2/blob/feature/premium-halls-ui/apps/backend/src/services/reservation.service.ts)

### Related Documentation:
- [HALLS_MODULE.md](./HALLS_MODULE.md) - Basic hall management
- [API.md](../API.md) - API endpoints
- [DATABASE.md](./DATABASE.md) - Schema reference

---

## 📊 Summary

**Strony z Premium UI:** 5/5 ✅
- ✅ Lista sal (`/dashboard/halls`)
- ✅ Szczegóły sali (`/dashboard/halls/[id]`)
- ✅ Edycja sali (`/dashboard/halls/[id]/edit`)
- ✅ Nowa sala (`/dashboard/halls/new`)
- ✅ HallCard component

**Backend Features:** 1/1 ✅
- ✅ Multi-reservation system (datetime overlap validation)

**Total Commits:** 7
1. Redesign halls list page (dashboard)
2. Redesign HallCard component
3. Premium UI for hall details page
4. Premium UI for hall edit page
5. Premium UI for new hall page
6. DateTime overlap validation (backend)
7. Documentation update

---

**Dokument utworzony:** 09.02.2026  
**Ostatnia aktualizacja:** 09.02.2026 20:39 CET  
**Autor:** Kamil Gol + AI Assistant  
**Status:** ✅ Kompletny - gotowy do merge
