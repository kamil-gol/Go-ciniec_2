# 📋 Plan Sprintów - System Rezerwacji Sal

**Status**: 🔧 W budowie  
**Okres**: Ciągły rozwój  
**Start projektu**: 06.02.2026  
**Aktualna wersja**: 1.4.4

---

## 📊 Mapa Sprintów

```
SPRINT 1 (06.02 - 09.02)   → Fundacja                          ✅ DONE
SPRINT 2 (09.02 - 11.02)   → Moduł Rezerwacji                  ✅ DONE
SPRINT 3 (11.02 - 12.02)   → Uzupełnianie Funkcjonalności      ✅ DONE
SPRINT 4 (12.02 - 13.02)   → System Menu & Dania               ✅ DONE
SPRINT 5 (13.02 - 15.02)   → Stabilizacja & Production Mode    ✅ DONE
─────────────────────────────────────────────────────────────────
SPRINT 6 (16.02 - 17.02)   → Quick Wins & Bugfixy              🔳 TODO
SPRINT 7 (18.02 - 20.02)   → System Rabatów                    🔳 TODO
SPRINT 8 (21.02 - 26.02)   → Historia Zmian & Archiwum         🔳 TODO
SPRINT 9 (27.02 - 05.03)   → Ujednolicenie UI & Mobile         🔳 TODO
```

---

# ✅ SPRINTY 1-5: ZAKOŃCZONE (v1.0.0 → v1.4.4)

Szczegóły zakończonych sprintów → patrz [CHANGELOG.md](../CHANGELOG.md)

**Podsumowanie:**
- ✅ Pełna infrastruktura (Docker, PostgreSQL, JWT Auth, RBAC)
- ✅ System rezerwacji + kolejka + 6-krokowy wizard
- ✅ System menu (kategorie, dania, szablony, pakiety, opcje, dodatki)
- ✅ System zaliczek, załączników, typów wydarzeń
- ✅ Frontend production mode (build + start)
- ✅ 45 testów E2E (Playwright)
- ✅ Pełna dokumentacja API (~68 endpointów)

---

# 🔧 SPRINT 6: Quick Wins & Bugfixy (16.02 - 17.02.2026)

## Cel
6 szybkich poprawek i usprawnień. Brak migracji DB, czyste zmiany frontend + backend logic.

**Estymacja:** ~1 dzień  
**Wersje:** v1.5.0 - v1.5.5  
**Branch:** `feature/sprint-6-quick-wins`

---

### US-6.1: Redirect do szczegółów po utworzeniu rezerwacji
**Priority**: 🟢 TRIVIAL  
**Points**: 1  
**Wersja**: v1.5.0

**Problem**: Po utworzeniu rezerwacji → redirect na listę → potem do szczegółów. Powinno iść bezpośrednio do szczegółów.

**Zakres zmian**:
- `create-reservation-form.tsx` — zmiana `router.push('/dashboard/reservations')` → `router.push(`/dashboard/reservations/${newReservation.id}`)`

**Zależności**: Brak  
**Walidacja**: API `POST /api/reservations` musi zwracać `id` nowej rezerwacji (już zwraca)

**Subtasks**:
- [ ] Zidentyfikować `onSuccess` w `useMutation`
- [ ] Zmienić redirect URL
- [ ] Test manualny: nowa rezerwacja → od razu szczegóły

---

### US-6.2: Usunięcie sali z PDF potwierdzenia rezerwacji
**Priority**: 🟢 MAŁA  
**Points**: 2  
**Wersja**: v1.5.1

**Problem**: PDF potwierdzenia zawiera informację o sali — klient nie powinien jej widzieć.

**Zakres zmian**:
- `apps/backend/src/services/reservation-pdf.service.ts` (lub odpowiednik) — usunąć sekcję renderującą nazwę sali i pojemność

**Zależności**: Brak — izolowana zmiana w generatorze PDF  
**Uwaga**: Sala nadal widoczna w panelu admina, tylko nie na PDF dla klienta

**Subtasks**:
- [ ] Zlokalizować sekcję "Sala" w generatorze PDF
- [ ] Usunąć/zakomentować blok renderujący salę
- [ ] Wygenerować testowy PDF i zweryfikować

---

### US-6.3: Usunięcie automatycznej notatki o dodatkowych godzinach
**Priority**: 🟢 MAŁA  
**Points**: 2  
**Wersja**: v1.5.2

**Problem**: System automatycznie dopisuje do notatek "⏰ Uwaga: Wydarzenie trwa Xh dłużej niż standardowe 6h..." — niepotrzebne, bo info o dopłacie jest już w Financial Summary.

**Zakres zmian**:
- `apps/backend/src/services/reservation.service.ts` — usunąć logikę automatycznego dopisywania notatki o >6h
- Opcjonalnie: jednorazowy SQL cleanup istniejących notatek

**Zależności**: `ReservationFinancialSummary.tsx` nadal pokazuje dopłatę 500 PLN/h w UI — ta część zostaje bez zmian

**Subtasks**:
- [ ] Znaleźć logikę generowania notatki w `reservation.service.ts`
- [ ] Usunąć auto-append do notes
- [ ] Przygotować SQL migration script dla istniejących rekordów
- [ ] Verify: Financial Summary nadal poprawnie oblicza extra hours

---

### US-6.4: Blokada zmiany statusu na COMPLETED przed datą wydarzenia
**Priority**: 🟡 ŚREDNIA  
**Points**: 3  
**Wersja**: v1.5.3

**Problem**: Można zmienić status na "Zakończona" przed datą wydarzenia — nie powinno być to możliwe.

**Zakres zmian**:

**Backend** (`reservation.service.ts`):
- W metodzie `updateStatus()` dodać walidację:
  ```typescript
  if (newStatus === 'COMPLETED') {
    const eventEnd = reservation.endDateTime || reservation.startDateTime
    if (eventEnd && eventEnd > new Date()) {
      throw new AppError(400, 'Nie można zakończyć rezerwacji przed datą wydarzenia')
    }
  }
  ```

**Frontend** (`StatusChanger.tsx`):
- Nowy prop: `startDateTime`, `endDateTime`
- Jeśli `currentStatus === 'CONFIRMED'` i `endDateTime > now()` → ukryć opcję `COMPLETED` z dropdown
- Tooltip: "Zmiana na Zakończona będzie dostępna po zakończeniu wydarzenia"

**Frontend** (`reservations/[id]/page.tsx`):
- Przekazać `startDateTime` i `endDateTime` do `StatusChanger`

**Zależności**: `StatusChanger.tsx`, `page.tsx`, `reservation.service.ts`

**Subtasks**:
- [ ] Backend: walidacja w `updateStatus()`
- [ ] Frontend: nowe propsy w `StatusChanger`
- [ ] Frontend: filtrowanie transition COMPLETED
- [ ] Frontend: przekazanie dat w `page.tsx`
- [ ] Test: próba zmiany statusu na COMPLETED w przyszłości → error

---

### US-6.5: Dodawanie nowego klienta w formularzu rezerwacji
**Priority**: 🟡 ŚREDNIA  
**Points**: 5  
**Wersja**: v1.5.4

**Problem**: W Kroku 5 (Klient) formularza rezerwacji jest Combobox z wyszukiwarką, ale brak przycisku "Dodaj nowego klienta".

**Zakres zmian**:

**Nowy komponent** — `CreateClientDialog.tsx`:
- Modal z formularzem: imię (wymagane), nazwisko (wymagane), telefon (wymagany), email (opcjonalny), notatki (opcjonalne)
- Walidacja: Zod schema
- Submit → `POST /api/clients`
- On success → zwraca nowego klienta do parent

**Integracja** — `create-reservation-form.tsx` (Krok 5):
- Przycisk `+ Nowy klient` pod Combobox
- Po utworzeniu klienta → auto-select w Combobox
- Odświeżenie listy klientów w Combobox

**Zależności**: API `POST /api/clients` (istnieje), model `Client` w Prisma

**Subtasks**:
- [ ] Nowy komponent `CreateClientDialog.tsx` z formularzem
- [ ] Zod schema dla klienta
- [ ] Integracja z Combobox w Kroku 5
- [ ] Auto-select po utworzeniu
- [ ] Test: utwórz klienta → automatycznie wybrany → kontynuuj do Kroku 6

---

### US-6.6: Auto-notatka o inflacji dla rezerwacji na następny rok
**Priority**: 🟡 ŚREDNIA  
**Points**: 3  
**Wersja**: v1.5.5

**Problem**: Jeśli rezerwacja jest na następny rok (i min. 3 miesiące do wydarzenia), klient powinien wiedzieć że cena może się zmienić o 10%.

**Zakres zmian**:

**Backend** (`reservation.service.ts` → `create()`):
- Po utworzeniu rezerwacji sprawdzić:
  1. `startDateTime.getFullYear() > currentYear`
  2. `differenceInMonths(startDateTime, now) >= 3`
- Jeśli oba spełnione → dopisać do `notes`:
  ```
  ⚠️ Informacja: Wydarzenie zaplanowane na [rok]. Ceny mogą ulec zmianie o maksymalnie 10% z uwagi na inflację.
  ```

**Frontend** (`create-reservation-form.tsx`, Krok 6):
- Żółty alert/banner pod podsumowaniem gdy data spełnia warunki
- Tekst: "Wydarzenie w przyszłym roku — do notatek zostanie dodana informacja o możliwej zmianie ceny."

**Zależności**: `reservation.service.ts`, pole `notes` w `Reservation`, Krok 6 formularza

**Subtasks**:
- [ ] Backend: logika sprawdzenia roku i dystansu 3 miesięcy
- [ ] Backend: auto-append do notes
- [ ] Frontend: żółty alert w Kroku 6
- [ ] Test: rezerwacja na 2027 → notatka dodana; na 2026 za 2 tygodnie → brak notatki

---

## 📊 Summary Sprint 6
- **Total Points**: 16
- **Deliverables**: 6 quick wins, brak migracji DB
- **Restart wymagany**: backend + frontend
- **Risk**: Niski

---

# 💰 SPRINT 7: System Rabatów (18.02 - 20.02.2026)

## Cel
Możliwość udzielenia rabatu procentowego lub kwotowego na cenę końcową rezerwacji.

**Estymacja:** ~2-3 dni  
**Wersja:** v1.6.0  
**Branch:** `feature/discount-system`

---

### US-7.1: Model danych — rozszerzenie Reservation
**Priority**: 🔴 CRITICAL  
**Points**: 5

**Nowe pola w `Reservation`**:
```prisma
  discountType        String?   @db.VarChar(20)   // "PERCENTAGE" | "FIXED" | null
  discountValue       Decimal?  @db.Decimal(10, 2) // np. 10 (=10%) lub 500 (=500 PLN)
  discountAmount      Decimal?  @db.Decimal(10, 2) // wyliczona kwota rabatu
  discountReason      String?   @db.Text           // powód rabatu
  priceBeforeDiscount Decimal?  @db.Decimal(10, 2) // oryginalna cena przed rabatem
```

**Logika przeliczania**:
- `PERCENTAGE`: `discountAmount = priceBeforeDiscount × discountValue / 100`
- `FIXED`: `discountAmount = discountValue`
- `totalPrice = priceBeforeDiscount - discountAmount`
- Walidacja: rabat nie może przekroczyć 100% ani kwoty totalPrice
- Walidacja: discountValue > 0

**Subtasks**:
- [ ] Migracja Prisma: dodanie 5 nowych pól
- [ ] Deployment migracji: `prisma migrate deploy`

---

### US-7.2: Backend — Discount API
**Priority**: 🔴 CRITICAL  
**Points**: 8

**Nowe endpointy**:
- `PATCH /api/reservations/:id/discount` — dodaj/zmień rabat
  - Body: `{ type: "PERCENTAGE" | "FIXED", value: number, reason: string }`
  - Wymaga: `authMiddleware` + `requireStaff`
- `DELETE /api/reservations/:id/discount` — usuń rabat

**Serwis** (`reservation.service.ts`):
- `applyDiscount(reservationId, { type, value, reason })` — oblicza discountAmount, aktualizuje totalPrice
- `removeDiscount(reservationId)` — przywraca oryginalną cenę
- Auto-wpis do `ReservationHistory` (changeType: `DISCOUNT_APPLIED` / `DISCOUNT_REMOVED`)

**Walidacje**:
- Rabat % musi być 0-100
- Rabat kwotowy nie może przekroczyć totalPrice
- Reason wymagany (min 3 znaki)
- Nie można dodać rabatu do CANCELLED rezerwacji

**Subtasks**:
- [ ] Serwis: `applyDiscount()` + `removeDiscount()`
- [ ] Kontroler: `PATCH` + `DELETE` endpointy
- [ ] Routes: dodanie do `reservation.routes.ts`
- [ ] Walidacje: Zod schema
- [ ] Historia zmian: wpis do `ReservationHistory`
- [ ] Testy: edge cases (100%, > totalPrice, negatywna wartość)

---

### US-7.3: Frontend — UI rabatu w Financial Summary
**Priority**: 🔴 CRITICAL  
**Points**: 8

**Komponent** (`ReservationFinancialSummary.tsx`):
- Nowa sekcja "Rabat" po sekcji "Cena":
  - Jeśli brak rabatu → przycisk "➕ Dodaj rabat"
  - Jeśli jest rabat → wyświetl: typ (% / PLN), wartość, kwotę, powód + przycisk "Edytuj" / "Usuń"
- Toggle: procentowy ↔ kwotowy (SegmentedControl lub Radio)
- Input wartości (number, z walidacją)
- Input powodu (textarea, min 3 znaki)
- Realtime preview: "Rabat 10% = -250,00 PLN"
- Cena końcowa: ~~2500,00 PLN~~ → **2250,00 PLN**

**Integracja z PDF** (jeśli rabat istnieje):
- Sekcja w PDF: "Rabat: -X PLN (powód)"
- Cena oryginalna + rabat + cena końcowa

**Zależności**: US-7.1 (migracja DB), US-7.2 (API endpoints)

**Subtasks**:
- [ ] UI sekcji rabatu w Financial Summary
- [ ] Toggle PERCENTAGE / FIXED
- [ ] Realtime preview kalkulacji
- [ ] Przycisk dodaj/edytuj/usuń rabat
- [ ] Mutacja `useMutation` dla `PATCH /api/reservations/:id/discount`
- [ ] Aktualizacja PDF generatora (sekcja rabat)
- [ ] Test: dodaj rabat 10% → cena się zmienia; usuń → wraca do oryginału

---

### US-7.4: Rabat w formularzu nowej rezerwacji
**Priority**: 🟡 HIGH  
**Points**: 5

**Krok 6 Podsumowanie** (`create-reservation-form.tsx`):
- Opcjonalna sekcja "Rabat" pod price breakdown
- Toggle: brak rabatu (default) / procentowy / kwotowy
- Jeśli aktywny: input wartości + input powodu
- Realtime: aktualizacja ceny końcowej w podsumowaniu
- Pola przekazywane do `POST /api/reservations`: `discountType`, `discountValue`, `discountReason`

**Zależności**: US-7.1 (migracja), US-7.2 (backend akceptuje pola rabatu w create)

**Subtasks**:
- [ ] UI sekcji rabatu w Kroku 6
- [ ] Zod schema: opcjonalne pola rabatu
- [ ] Realtime price recalc
- [ ] Backend: obsługa pól rabatu w `create()`

---

## 📊 Summary Sprint 7
- **Total Points**: 26
- **Deliverables**: Kompletny system rabatów (DB + API + UI + PDF)
- **Migracja DB**: ✅ Wymagana (5 nowych pól w Reservation)
- **Restart wymagany**: backend + frontend + migracja
- **Risk**: Średni (migracja DB, przeliczanie cen)

---

# 📜 SPRINT 8: Historia Zmian & Archiwum (21.02 - 26.02.2026)

## Cel
Globalny system audytu (kto co zmienił i kiedy) + moduł archiwum.

**Estymacja:** ~3-5 dni  
**Wersje:** v1.7.0 - v1.7.1  
**Branch:** `feature/audit-trail-and-archive`

---

### US-8.1: Backend — Reusable Audit Logger
**Priority**: 🔴 CRITICAL  
**Points**: 8  
**Wersja**: v1.7.0

**Nowy helper** (`utils/audit-logger.ts`):
```typescript
async function logChange(params: {
  userId: string
  action: string        // CREATE, UPDATE, DELETE, TOGGLE, ARCHIVE, etc.
  entityType: string    // CLIENT, HALL, EVENT_TYPE, DISH, MENU_TEMPLATE, ...
  entityId: string
  details: {
    fieldName?: string
    oldValue?: any
    newValue?: any
    description?: string
  }
})
```

- Zapisuje do istniejącego modelu `ActivityLog` (pola: `action`, `entityType`, `entityId`, `details` JSON, `userId`)
- `details` jako JSON zawiera: zmienione pola, stare/nowe wartości, opis akcji
- Helper `diffObjects(oldObj, newObj)` — automatyczne wykrywanie zmienionych pól

**Subtasks**:
- [ ] Helper `logChange()` + `diffObjects()`
- [ ] Testy unit: różne scenariusze diff

---

### US-8.2: Integracja Audit Logger we wszystkich modułach
**Priority**: 🔴 CRITICAL  
**Points**: 13

**Moduły do zintegrowania**:

| Moduł | Serwis | Akcje |
|-------|--------|-------|
| Klienci | `client.service.ts` | CREATE, UPDATE, DELETE |
| Sale | `hall.service.ts` | CREATE, UPDATE, TOGGLE_ACTIVE |
| Typy Wydarzeń | `eventType.service.ts` | CREATE, UPDATE, DELETE, TOGGLE_ACTIVE |
| Szablony Menu | `menuTemplate.service.ts` | CREATE, UPDATE, DELETE, DUPLICATE |
| Pakiety Menu | `menuPackage.service.ts` | CREATE, UPDATE, DELETE, REORDER |
| Opcje Menu | `menuOption.service.ts` | CREATE, UPDATE, DELETE |
| Dania | `dish.service.ts` | CREATE, UPDATE, DELETE |
| Kategorie Dań | `dishCategory.service.ts` | CREATE, UPDATE, DELETE |
| Zaliczki | `deposit.service.ts` | CREATE, UPDATE, PAYMENT |
| Załączniki | `attachment.controller.ts` | UPLOAD, DELETE, ARCHIVE |
| Rezerwacje | `reservation.service.ts` | Już ma `ReservationHistory` → dodać też do `ActivityLog` dla spójności |

**Pattern implementacji** (per serwis):
```typescript
// W metodzie update():
const oldData = await prisma.client.findUnique({ where: { id } })
// ... wykonaj update ...
await logChange({ userId, action: 'UPDATE', entityType: 'CLIENT', entityId: id,
  details: diffObjects(oldData, updatedData)
})
```

**Subtasks**:
- [ ] Klienci — 3 akcje
- [ ] Sale — 3 akcje
- [ ] Typy Wydarzeń — 4 akcje
- [ ] Menu (szablony, pakiety, opcje) — 10+ akcji
- [ ] Dania + Kategorie — 6 akcji
- [ ] Zaliczki — 3 akcje
- [ ] Załączniki — 3 akcje
- [ ] Rezerwacje — bridge do ActivityLog

---

### US-8.3: Backend — Activity Log API
**Priority**: 🔴 CRITICAL  
**Points**: 5

**Endpointy**:
- `GET /api/activity-log` — globalna lista (z paginacją)
  - Query params: `entityType`, `entityId`, `userId`, `action`, `dateFrom`, `dateTo`, `page`, `perPage`
- `GET /api/activity-log/entity/:entityType/:entityId` — historia konkretnego obiektu

**Routes**: `activity-log.routes.ts`  
**Auth**: `authMiddleware` + `requireStaff`

**Subtasks**:
- [ ] Kontroler: `getAll()`, `getByEntity()`
- [ ] Routes z auth
- [ ] Paginacja + filtry

---

### US-8.4: Frontend — Komponent historii zmian
**Priority**: 🔴 CRITICAL  
**Points**: 8

**Reusable komponent** `<AuditTimeline entityType="CLIENT" entityId={id} />`:
- Timeline z ikonami per akcja (CREATE=zielona, UPDATE=niebieska, DELETE=czerwona)
- Każdy wpis: data, kto, co zmienił (stara → nowa wartość), opis
- Filtrowanie po typie akcji
- Paginacja (lazy load)
- Użycie w każdym module szczegółów jako zakładka/sekcja

**Widok globalny** (`/dashboard/raporty/historia`):
- Tabela z filtrami: moduł, użytkownik, data, akcja
- Link do encji (kliknij → przejdź do szczegółów)

**Integracja** — dodanie komponentu do:
- Szczegóły klienta
- Szczegóły sali
- Szczegóły rezerwacji (obok istniejącej `reservation-history.tsx`)
- Szczegóły typu wydarzenia
- Szczegóły szablonu menu

**Subtasks**:
- [ ] Komponent `AuditTimeline.tsx`
- [ ] Hook `useActivityLog(entityType, entityId)`
- [ ] Strona `/dashboard/raporty/historia`
- [ ] Integracja w 5+ modułach

---

### US-8.5: Moduł Archiwum
**Priority**: 🟡 HIGH  
**Points**: 13  
**Wersja**: v1.7.1

**Koncepcja**: Centralne archiwum z zakończonymi/anulowanymi rezerwacjami i zarchiwizowanymi rekordami.

**Backend**:
- Wykorzystanie istniejącego pola `archivedAt` w `Reservation`
- `POST /api/reservations/:id/archive` — ustawia `archivedAt = now()`
- `POST /api/reservations/:id/unarchive` — ustawia `archivedAt = null`
- `GET /api/archive/reservations` — lista zarchiwizowanych (z paginacją, filtrami)
- Rozszerzenie: dodać `archivedAt` do `Client`, `Dish` (soft-delete → archiwum)
- Opcjonalnie: CRON archiwizujący COMPLETED/CANCELLED rezerwacje starsze niż 90 dni

**Frontend** — nowa strona `/dashboard/archiwum/page.tsx`:
- Sidebar: ikona "Archiwum" (Archive/Box icon)
- Zakładki: Rezerwacje | Klienci (opcjonalnie)
- Filtrowanie: po dacie archiwizacji, statusie, kliencie, sali
- Widok read-only: szczegóły bez możliwości edycji
- Akcja: "Przywróć" (odarchiwizuj) — przenosi z powrotem do aktywnych
- Badge z liczbą zarchiwizowanych na sidebarze

**Migracja DB**:
- Dodanie `archivedAt DateTime?` do `Client` i `Dish` (w `Reservation` już istnieje)
- Index na `archivedAt` dla szybkiego filtrowania

**Zależności**: US-8.1 (audit logger — archiwizacja powinna być logowana), pole `archivedAt` w Reservation

**Subtasks**:
- [ ] Backend: endpoints archive/unarchive
- [ ] Backend: GET /api/archive/reservations z filtrami
- [ ] Migracja: `archivedAt` w Client, Dish
- [ ] Frontend: strona `/dashboard/archiwum`
- [ ] Frontend: zakładki + filtry + read-only widok
- [ ] Frontend: przycisk "Przywróć"
- [ ] Sidebar: link do archiwum + badge count
- [ ] Opcjonalnie: CRON auto-archiwizacja >90 dni

---

## 📊 Summary Sprint 8
- **Total Points**: 47
- **Deliverables**: Globalny audit trail + moduł archiwum
- **Migracja DB**: ✅ Wymagana (archivedAt w Client, Dish + opcjonalnie indeksy)
- **Restart wymagany**: backend + frontend + migracja
- **Risk**: Wysoki (dotyka WSZYSTKICH serwisów — wymaga starannego review)

---

# 🎨 SPRINT 9: Ujednolicenie UI & Mobile (27.02 - 05.03.2026)

## Cel
Spójny wygląd wszystkich modułów + pełna responsywność mobilna.

**Estymacja:** ~5-7 dni  
**Wersja:** v1.8.0  
**Branch:** `feature/ui-unification`

---

### US-9.1: Design System — Shared Components
**Priority**: 🔴 CRITICAL  
**Points**: 13

**Nowe reusable komponenty**:

1. **`<ModuleHero>`** — wspólny hero section:
   - Props: `title`, `subtitle`, `icon`, `gradient` (preset: blue/cyan, fuchsia, green, orange), `stats[]`, `actions[]`
   - Responsive: mniejszy padding + font na mobile

2. **`<ModuleList>`** — wspólny kontener listy:
   - Toggle widoku: karty ↔ tabela
   - Wbudowane: search, filtry, paginacja, sortowanie
   - Props: `columns[]`, `data[]`, `renderCard()`, `renderRow()`

3. **`<ModuleDetailLayout>`** — layout szczegółów:
   - 2-kolumnowy na desktop, 1-kolumnowy na mobile
   - Sticky actions bar na mobile
   - Breadcrumbs

4. **`<ResponsiveTable>`** — auto-switch tabela → karty:
   - Breakpoint: `md` (768px)
   - Na mobile: każdy wiersz = karta z labelami

5. **`<MobileNav>`** — nawigacja mobilna:
   - Hamburger menu + drawer
   - Collapse sidebar na mobile
   - Bottom navigation bar (opcjonalnie)

**Design tokens** (`lib/design-tokens.ts` — rozszerzenie):
```typescript
export const MODULE_THEMES = {
  reservations: { gradient: 'from-blue-600 via-cyan-600 to-teal-600', accent: 'blue' },
  clients:      { gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', accent: 'violet' },
  halls:        { gradient: 'from-emerald-600 via-green-600 to-teal-600', accent: 'emerald' },
  eventTypes:   { gradient: 'from-fuchsia-600 via-pink-600 to-rose-600', accent: 'fuchsia' },
  menu:         { gradient: 'from-amber-600 via-orange-600 to-red-600', accent: 'amber' },
  archive:      { gradient: 'from-slate-600 via-gray-600 to-zinc-600', accent: 'slate' },
  reports:      { gradient: 'from-indigo-600 via-blue-600 to-cyan-600', accent: 'indigo' },
}
```

**Subtasks**:
- [ ] `ModuleHero` komponent + warianty
- [ ] `ModuleList` z toggle widoku
- [ ] `ModuleDetailLayout` 2-col/1-col
- [ ] `ResponsiveTable` z auto-switch
- [ ] `MobileNav` hamburger + drawer
- [ ] Design tokens: MODULE_THEMES

---

### US-9.2: Migracja modułów na shared components
**Priority**: 🔴 CRITICAL  
**Points**: 21

**Moduły do zmigrowania** (w kolejności):

| # | Moduł | Strony | Główne zmiany |
|---|-------|--------|---------------|
| 1 | Rezerwacje | lista + szczegóły | Już ma dobry hero → dopasuj do `ModuleHero` |
| 2 | Klienci | lista + szczegóły | Nowy hero + `ModuleList` + responsive |
| 3 | Sale | lista + szczegóły | Nowy hero + `ModuleList` + responsive |
| 4 | Typy Wydarzeń | lista + szczegóły | Już ma hero → dopasuj, responsive fix |
| 5 | Menu hub | hub + sub-strony | Ujednolić sub-strony z `ModuleList` |
| 6 | Zaliczki | sekcja w rezerwacji | Responsive fix |
| 7 | Archiwum | nowa strona | Użyj `ModuleHero` + `ModuleList` od razu |
| 8 | Raporty | dashboard | Responsive grid |

**Zasady migracji**:
- Każdy moduł: zamień custom hero → `<ModuleHero>`, custom list → `<ModuleList>`
- Nie zmieniaj logiki biznesowej — tylko UI wrapper
- Zachowaj istniejące feature'y (filtry, search, sortowanie)

**Subtasks**:
- [ ] Moduł Rezerwacje — migracja
- [ ] Moduł Klienci — migracja
- [ ] Moduł Sale — migracja
- [ ] Moduł Typy Wydarzeń — migracja
- [ ] Moduł Menu (hub + sub-strony) — migracja
- [ ] Moduł Zaliczki — responsive
- [ ] Moduł Archiwum — od razu shared
- [ ] Moduł Raporty — responsive grid

---

### US-9.3: Mobile-first responsive fixes
**Priority**: 🟡 HIGH  
**Points**: 13

**Audit + fix per strona**:

1. **Sidebar** → collapse na `<768px`, hamburger icon, drawer overlay
2. **Dashboard** → stack karty vertically, mniejsze fonty
3. **Formularze** → full-width inputs, stepper → vertical na mobile
4. **Tabele** → `ResponsiveTable` auto-switch
5. **Modale/Dialogi** → full-screen na mobile (`max-w-full` + `h-full` na `<640px`)
6. **Hero sections** → mniejszy padding (p-4 vs p-8), ukryj dekoracje
7. **Financial Summary** → stack zamiast grid
8. **PDF button** → floating action button na mobile

**Breakpoints**:
- `<640px` (sm): phone — single column, hamburger nav, full-screen modals
- `640-768px` (md): tablet portrait — 1-2 columns
- `768-1024px` (lg): tablet landscape — 2 columns, sidebar visible
- `>1024px` (xl): desktop — 3 columns, full sidebar

**Subtasks**:
- [ ] Sidebar responsive (hamburger + drawer)
- [ ] Dashboard responsive
- [ ] Formularz rezerwacji — stepper mobile
- [ ] Wszystkie tabele → ResponsiveTable
- [ ] Modale → full-screen mobile
- [ ] Hero sections → compact mobile
- [ ] Financial Summary → stack mobile
- [ ] Testowanie na 4 breakpointach

---

## 📊 Summary Sprint 9
- **Total Points**: 47
- **Deliverables**: Spójny design system, responsive na mobile
- **Migracja DB**: ❌ Nie wymagana
- **Restart wymagany**: frontend
- **Risk**: Średni (duży zakres zmian UI, ale brak zmian logiki)

---

# 📊 Podsumowanie Sprintów 6-9

| Sprint | Temat | Points | Estymacja | Wersja | Status |
|--------|-------|--------|-----------|--------|--------|
| 6 | Quick Wins & Bugfixy | 16 | ~1 dzień | v1.5.0-v1.5.5 | 🔳 TODO |
| 7 | System Rabatów | 26 | ~2-3 dni | v1.6.0 | 🔳 TODO |
| 8 | Historia Zmian & Archiwum | 47 | ~3-5 dni | v1.7.0-v1.7.1 | 🔳 TODO |
| 9 | Ujednolicenie UI & Mobile | 47 | ~5-7 dni | v1.8.0 | 🔳 TODO |
| **RAZEM** | | **136** | **~11-16 dni** | | |

---

# 🔗 Graf Zależności

```
SPRINT 6 (niezależny — brak migracji DB)
  ├── US-6.1 Redirect po utworzeniu ──────── brak zależności
  ├── US-6.2 Usunięcie sali z PDF ───────── brak zależności
  ├── US-6.3 Usunięcie notatki >6h ──────── brak zależności
  ├── US-6.4 Blokada COMPLETED ──────────── zależy od: StatusChanger props
  ├── US-6.5 Nowy klient w formularzu ───── zależy od: API POST /api/clients (istnieje)
  └── US-6.6 Auto-notatka inflacja ──────── brak zależności

SPRINT 7 (wymaga migracji DB)
  ├── US-7.1 Model danych ───────────────── MIGRACJA PRISMA (5 pól)
  ├── US-7.2 Discount API ───────────────── zależy od: US-7.1
  ├── US-7.3 UI rabatu ──────────────────── zależy od: US-7.1, US-7.2
  └── US-7.4 Rabat w formularzu ─────────── zależy od: US-7.1, US-7.2

SPRINT 8 (wymaga migracji DB + refactor serwisów)
  ├── US-8.1 Audit Logger helper ────────── brak zależności
  ├── US-8.2 Integracja w modułach ──────── zależy od: US-8.1
  ├── US-8.3 Activity Log API ───────────── zależy od: US-8.1
  ├── US-8.4 Frontend historia zmian ────── zależy od: US-8.3
  └── US-8.5 Moduł Archiwum ─────────────── zależy od: US-8.1 (logowanie), MIGRACJA

SPRINT 9 (czyste zmiany frontend)
  ├── US-9.1 Design System components ──── brak zależności
  ├── US-9.2 Migracja modułów ───────────── zależy od: US-9.1
  └── US-9.3 Mobile responsive ──────────── zależy od: US-9.1
                                             lepiej po Sprint 8 (archiwum = nowa strona)
```

---

**Last Updated**: 15.02.2026, 13:42 CET  
**Project Status**: 🔧 Sprint 6 zaplanowany
