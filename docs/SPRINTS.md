# 📋 Plan Sprintów - System Rezerwacji Sal

**Status**: 🔧 W budowie  
**Okres**: Ciągły rozwój  
**Start projektu**: 06.02.2026  
**Aktualna wersja**: 1.9.0  

---

## 📊 Mapa Sprintów

> Uwaga: Sprinty 6-12 zostały zrealizowane przed planowanym terminem.

```
SPRINT 1 (06.02 - 09.02)   → Fundacja                          ✅ DONE
SPRINT 2 (09.02 - 11.02)   → Moduł Rezerwacji                  ✅ DONE
SPRINT 3 (11.02 - 12.02)   → Uzupełnianie Funkcjonalności      ✅ DONE
SPRINT 4 (12.02 - 13.02)   → System Menu & Dania               ✅ DONE
SPRINT 5 (13.02 - 15.02)   → Stabilizacja & Production Mode    ✅ DONE
─────────────────────────────────────────────────────────────────
SPRINT 6 (16.02 - 17.02)   → Quick Wins & Bugfixy              ✅ DONE
SPRINT 7 (15.02 - 16.02)   → UTF-8 Cleanup + Attachments       ✅ DONE
SPRINT 8 (15.02 - 16.02)   → System Rabatów                    ✅ DONE
SPRINT 9 (16.02 - 21.02)   → Historia Zmian & Archiwum         ✅ DONE
  Phase 1: Audit Logging (16.02)                                ✅ DONE
  Phase 2: UI Viewer (16.02)                                    ✅ DONE
    US-9.8: Activity Timeline                                   ✅ DONE (16.02)
    US-9.9: Archiwum — Soft Delete                              ✅ DONE (16.02)
    US-9.10: Archiwum — Archive Page                            ✅ DONE (16.02)
    US-9.11: Dziennik Audytu — Global Dashboard                 ✅ DONE (16.02)
SPRINT 10 (27.02 - 05.03)  → Ujednolicenie UI & Mobile         🔳 TODO
SPRINT 11 (16.02)          → Reports Module (Analytics)        ✅ DONE
SPRINT 12 (16.02)          → RBAC + Settings UI                ✅ DONE
```

---

# ✅ SPRINTY 1-8: ZAKOŃCZONE (v1.0.0 → v1.7.0)

Szczegóły zakończonych sprintów → patrz [CHANGELOG.md](../CHANGELOG.md)

**Podsumowanie:**
- ✅ Pełna infrastruktura (Docker, PostgreSQL, JWT Auth, RBAC)
- ✅ System rezerwacji + kolejka + 6-krokowy wizard
- ✅ System menu (kategorie, dania, szablony, pakiety, opcje, dodatki)
- ✅ System zadatków, załączników, typów wydarzeń
- ✅ Frontend production mode (build + start)
- ✅ 45 testów E2E (Playwright) + 38 unit tests (Jest)
- ✅ Pełna dokumentacja API (~70 endpointów)
- ✅ Sprint 6: quick wins (6 US)
- ✅ Sprint 7: UTF-8 cleanup + attachments frontend (TanStack Query, badges, preview modal)
- ✅ Sprint 8: kompletny system rabatów (PERCENTAGE/FIXED, atomowe tworzenie, edycja)

---

# ✅ SPRINT 6: Quick Wins & Bugfixy (16.02 - 17.02.2026)

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

**Subtasks**:
- [x] Zidentyfikować `onSuccess` w `useMutation`
- [x] Zmienić redirect URL
- [x] Test manualny: nowa rezerwacja → od razu szczegóły

---

### US-6.2: Usunięcie sali z PDF potwierdzenia rezerwacji
**Priority**: 🟢 MAŁA  
**Points**: 2  
**Wersja**: v1.5.1

**Subtasks**:
- [x] Zlokalizować sekcję "Sala" w generatorze PDF
- [x] Usunąć blok renderujący salę
- [x] Wygenerować testowy PDF i zweryfikować

---

### US-6.3: Usunięcie automatycznej notatki o dodatkowych godzinach
**Priority**: 🟢 MAŁA  
**Points**: 2  
**Wersja**: v1.5.2

**Subtasks**:
- [x] Znaleźć logikę generowania notatki w `reservation.service.ts`
- [x] Usunąć auto-append do notes
- [x] Verify: Financial Summary nadal poprawnie oblicza extra hours

---

### US-6.4: Blokada zmiany statusu na COMPLETED przed datą wydarzenia
**Priority**: 🟡 ŚREDNIA  
**Points**: 3  
**Wersja**: v1.5.3

**Subtasks**:
- [x] Backend: walidacja w `updateStatus()`
- [x] Frontend: nowe propsy w `StatusChanger`
- [x] Frontend: filtrowanie transition COMPLETED
- [x] Frontend: przekazanie dat w `page.tsx`
- [x] Test: próba zmiany statusu na COMPLETED w przyszłości → error

---

### US-6.5: Dodawanie nowego klienta w formularzu rezerwacji
**Priority**: 🟡 ŚREDNIA  
**Points**: 5  
**Wersja**: v1.5.4

**Subtasks**:
- [x] Nowy komponent `CreateClientDialog.tsx` z formularzem
- [x] Zod schema dla klienta
- [x] Integracja z Combobox w Kroku 5
- [x] Auto-select po utworzeniu
- [x] Test: utwórz klienta → automatycznie wybrany → kontynuuj do Kroku 6

---

### US-6.6: Auto-notatka o inflacji dla rezerwacji na następny rok
**Priority**: 🟡 ŚREDNIA  
**Points**: 3  
**Wersja**: v1.5.5

**Subtasks**:
- [x] Backend: logika sprawdzenia roku i dystansu 3 miesięcy
- [x] Backend: auto-append do notes
- [x] Frontend: żółty alert w Kroku 6
- [x] Test: rezerwacja na 2027 → notatka dodana; na 2026 za 2 tygodnie → brak notatki

---

## 📊 Summary Sprint 6
- **Total Points**: 16
- **Deliverables**: 6 quick wins, brak migracji DB
- **Restart wymagany**: backend + frontend
- **Risk**: Niski

---

# ✅ SPRINT 7: UTF-8 Cleanup + Attachments Frontend (15.02 - 16.02.2026)

## Cel
Globalny fix Unicode w projekcie + kompletna implementacja frontendu modułu załączników.

**Estymacja:** ~2 dni  
**Wersje:** v1.6.1 – v1.6.2  
**Branches:** `fix/sprint7-cleanup` + `feature/55-attachments-frontend`

---

### US-7.1: Globalny fix UTF-8 + lista rezerwacji
**Priority**: 🔴 CRITICAL  
**Points**: 5  
**Wersja**: v1.6.1  
**Branch**: `fix/sprint7-cleanup`  
**Sesja**: [SPRINT7_CLEANUP_2026-02-16.md](SPRINT7_CLEANUP_2026-02-16.md)

**Subtasks**:
- [x] Globalny fix Unicode w 29 plikach frontendowych (625 zamian)
- [x] Obsługa emoji surrogate pairs (\uD83C\uDF89 → 🎉)
- [x] Usunięcie zduplikowanych stron `/queue` i `/reservations`
- [x] Wymuszenie `charset=utf-8` w backend response headers
- [x] Domyślny widok listy rezerwacji (zamiast kalendarza)
- [x] Toggle Lista|Kalendarz

---

### US-7.2: Bugfix — PDF download nie pobiera pliku
**Priority**: 🔴 HIGH  
**Points**: 2  
**Issue**: #61

**Subtasks**:
- [x] Fix: delay cleanup `revokeObjectURL` + `removeChild` o 150ms
- [x] Fix: weryfikacja content-type dla błędów zwracanych jako 200
- [x] Fix: obsługa errorów dla `responseType: 'blob'`
- [x] Test: PDF pobiera się poprawnie

---

### US-7.3: Deposits — auto-confirm rezerwacji gdy wszystkie zaliczki PAID
**Priority**: 🟡 MEDIUM  
**Points**: 3  
**Issue**: #38 (Phase 4.2)

**Subtasks**:
- [x] Backend: logika w `updateDepositStatus()` — sprawdź wszystkie zaliczki
- [x] Jeśli wszystkie PAID → zmień status rezerwacji na CONFIRMED
- [x] Test: 2 zaliczki, obie PAID → rezerwacja CONFIRMED

---

### US-7.4: Deposits — blokada cancel/delete rezerwacji z opłaconymi zaliczkami
**Priority**: 🟡 MEDIUM  
**Points**: 2  
**Issue**: #38 (Phase 4.3)

**Subtasks**:
- [x] Backend: walidacja w `deleteReservation()` i `cancelReservation()`
- [x] Sprawdź `deposits.some(d => d.status === 'PAID')`
- [x] Jeśli tak → zwróć 400 z komunikatem
- [x] Test: próba usunięcia → error 400

---

### US-7.5: Attachments — Frontend Components (Phases 2-5)
**Priority**: 🔴 CRITICAL  
**Points**: 13  
**Wersja**: v1.6.2  
**Branch**: `feature/55-attachments-frontend`  
**PR**: #71  
**Issue**: #55  
**Sesja**: [ATTACHMENTS_MODULE_2026-02-15.md](ATTACHMENTS_MODULE_2026-02-15.md)

#### Phase 2: Frontend Components
**Subtasks**:
- [x] TanStack Query hooks (`useAttachments`, mutations)
- [x] `AttachmentPanel` z filtrowaniem, licznikami
- [x] `AttachmentUploadDialog` (drag & drop, walidacja, dynamiczne kategorie)
- [x] `AttachmentPreview` modal (PDF iframe, image zoom/rotate, blob URL)
- [x] `AttachmentRow` (badge kategorii, preview callback, action menu)
- [x] API client (`lib/api/attachments.ts`) z `getCategoriesForEntity()`

#### Phase 3: Sheet Integration
**Subtasks**:
- [x] Client detail view — AttachmentPanel pod kontaktami
- [x] Reservation detail view — AttachmentPanel pod notatkami
- [x] Deposit sheet — Dialog z AttachmentPanel w dropdown menu

#### Phase 4: Badges
**Subtasks**:
- [x] RODO badge na listach klientów i rezerwacji
- [x] Contract badge na liście rezerwacji
- [x] Deposit status badge na liście rezerwacji
- [x] Batch-check hooks (`useBatchCheckRodo`, `useBatchCheckContract`)
- [x] Efektywne ładowanie (jeden request per strona)

#### Phase 5: Testing
**Subtasks**:
- [x] Jest + ts-jest configuration (`jest.config.js`)
- [x] 38 unit tests dla `AttachmentService` (11 grup testowych)
- [x] Coverage: CRUD, RODO redirect, batch checks, file operations
- [x] Wszystkie testy zaliczone ✅

**Nowe pliki (21 total):**
- Backend: `jest.config.js`, `src/tests/setup.ts`, `src/tests/attachment.service.test.ts`
- Frontend: `hooks/use-attachments.ts`, 4 attachment components, `ui/sheet.tsx`
- Frontend: aktualizacje w 3 widokach (client/reservation detail, deposit actions, lists)

---

## 📊 Summary Sprint 7
- **Total Points**: 25 (5 + 2 + 3 + 2 + 13)
- **Deliverables**: 
  - Globalny fix UTF-8 w 29 plikach (625 zamian)
  - Kompletny frontend attachments z TanStack Query
  - AttachmentPreview modal (PDF + images)
  - RODO/Contract/Deposit badges z batch-check
  - 38 unit tests (Jest)
  - 3 bugfixy (PDF download, deposits auto-confirm, delete block)
- **Migracja DB**: ❌ Brak
- **Restart wymagany**: backend + frontend
- **Risk**: Średni
- **PR**: #68 (cleanup), #71 (attachments)

---

# ✅ SPRINT 8: System Rabatów (15.02 - 16.02.2026)

## Cel
Możliwość udzielenia rabatu procentowego lub kwotowego na cenę końcową rezerwacji.

**Estymacja:** ~2-3 dni (zrealizowano w ~1 dzień)  
**Wersja:** v1.7.0  
**Branches:** `feature/discount-create`, `fix/discount-atomic`  
**PR**: #63, #66  
**Issue**: #65 (bug fix)

---

### US-8.1: Model danych — rozszerzenie Reservation
**Priority**: 🔴 CRITICAL  
**Points**: 5  
**Status**: ✅ DONE

**Subtasks**:
- [x] Migracja Prisma: dodanie 5 nowych pól (`discountType`, `discountValue`, `discountAmount`, `discountReason`, `priceBeforeDiscount`)
- [x] Deployment migracji: `prisma migrate deploy`

**Implementacja**:
- Pola dodane w `apps/backend/prisma/schema.prisma` w modelu `Reservation`
- Wszystkie pola opcjonalne (nullable) — rabat nie jest wymagany
- `discountType`: PERCENTAGE | FIXED
- `discountValue`: wartość procentowa (np. 10) lub kwotowa (np. 500)
- `discountAmount`: wyliczona kwota rabatu w PLN
- `discountReason`: uzasadnienie (minimum 3 znaki)
- `priceBeforeDiscount`: oryginalna cena przed rabatem

---

### US-8.2: Backend — Discount API
**Priority**: 🔴 CRITICAL  
**Points**: 8  
**Status**: ✅ DONE

**Subtasks**:
- [x] Serwis: `discount.service.ts` z `applyDiscount()` + `removeDiscount()`
- [x] Kontroler: `discount.controller.ts` — obsługa `PATCH` + `DELETE`
- [x] Routes: endpointy w `reservation.routes.ts`
- [x] Walidacje: type, value, reason wymagane; walidacja 100% dla PERCENTAGE
- [x] Historia zmian: wpis do `ReservationHistory` z typem `DISCOUNT_APPLIED` / `DISCOUNT_REMOVED`
- [x] Testy: edge cases (100%, > totalPrice, negatywna wartość)
- [x] Obsługa rabatu w `createReservation()` — atomowe tworzenie z rabatem

**Implementacja**:
- **Endpointy**:
  - `PATCH /api/reservations/:id/discount` — dodaj/edytuj rabat
  - `DELETE /api/reservations/:id/discount` — usuń rabat
- **Walidacje**:
  - PERCENTAGE: max 100%, min 0.01%
  - FIXED: nie może przekroczyć ceny rezerwacji
  - Powód rabatu: minimum 3 znaki
- **Integracja z menu**: rabat jest naliczany od ceny finalnej po dodaniu menu + opcji
- **Historia**: każda zmiana rabatu zapisana w `ReservationHistory`

---

### US-8.3: Frontend — UI rabatu w formularzu tworzenia
**Priority**: 🔴 CRITICAL  
**Points**: 8  
**Status**: ✅ DONE  
**PR**: #63 (initial), #66 (atomic fix)

**Subtasks**:
- [x] Nowy komponent `CreateReservationDiscountSection.tsx`
- [x] Toggle PERCENTAGE / FIXED
- [x] Realtime preview kalkulacji w podsumowaniu
- [x] Walidacja: powód ≥3 znaki
- [x] Integracja z Zod schema formularza
- [x] Atomowe tworzenie: rabat w payloadzie `POST /api/reservations`
- [x] Test: dodaj rabat 10% → cena się zmienia; usuń → wraca do oryginału

**Implementacja**:
- Sekcja rabatu w kroku "Menu i wycena"
- Realtime kalkulacja `priceAfterDiscount` w podsumowaniu
- Pola `discountType`, `discountValue`, `discountReason` w Zod schema
- **Fix (PR #66)**: zamiana dwufazowego podejścia (CREATE + PATCH) na atomowe (pola rabatu w payloadzie `createReservation`)
- Eliminacja race condition i silent error catching

---

### US-8.4: Frontend — UI rabatu w Financial Summary (edycja istniejącej rezerwacji)
**Priority**: 🟡 HIGH  
**Points**: 5  
**Status**: ✅ DONE

**Subtasks**:
- [x] Sekcja rabatu w Financial Summary (widok szczegółów rezerwacji)
- [x] Dialog edycji rabatu z toggle PERCENTAGE/FIXED
- [x] Przyciski dodaj/edytuj/usuń rabat
- [x] Mutacje `useApplyDiscount` + `useRemoveDiscount` (TanStack Query)
- [x] Aktualizacja PDF generatora (sekcja rabat w PDF)

**Implementacja**:
- Dedykowane hooki: `useApplyDiscount`, `useRemoveDiscount`
- Dialog z formularzem rabatu (reużywalny między create a edit)
- PDF generator: sekcja "Rabat" w `buildPDFContent()` i `buildPaymentConfirmationContent()`
- Realtime refresh po dodaniu/usunięciu rabatu

---

## 📊 Summary Sprint 8
- **Total Points**: 26
- **Deliverables**: 
  - Kompletny system rabatów (DB + API + UI + PDF)
  - 5 pól rabatowych w modelu `Reservation`
  - Backend: `discount.service.ts`, `discount.controller.ts`, 2 endpointy
  - Frontend: `CreateReservationDiscountSection`, hooki TanStack Query
  - Atomowe tworzenie rezerwacji z rabatem (PR #66 fix)
  - Walidacje: PERCENTAGE ≤100%, FIXED ≤totalPrice, powód ≥3 znaki
- **Migracja DB**: ✅ Wykonana (5 pól dodanych do Reservation)
- **Restart wymagany**: backend + frontend + migracja
- **Risk**: Niski (zrealizowano przed terminem)
- **PR**: #63 (feature), #66 (atomic fix)
- **Issue**: #65 (bug: rabat nie był zapisywany)

---

# ✅ SPRINT 9: Historia Zmian & Archiwum (16.02 - 21.02.2026)

## Cel
Globalny system audytu (kto co zmienił i kiedy) + moduł archiwum.

**Estymacja:** ~3-5 dni (zrealizowano w 1 dzień)  
**Wersje:** v1.8.0 - v1.8.1  
**Branches:** `feature/audit-logging`, `feature/audit-phase2-queue`, `feature/audit-phase3-attachments-menu`, `feature/us-9.8-entity-timeline`, `feature/us-9.10-archive-page`, `feature/us-9.11-audit-dashboard`  
**Status**: ✅ DONE (16.02.2026)

---

## ✅ Phase 1: Audit Logging Backend (16.02.2026)

**Status**: ✅ COMPLETED  
**Wersja**: v1.8.0  
**PR**: #74, #75, #76  
**Czas realizacji**: ~4 godziny

### US-9.1: ActivityLog — model danych i utility
**Priority**: 🔴 CRITICAL  
**Points**: 3  
**Status**: ✅ DONE  
**PR**: #74

**Subtasks**:
- [x] Model `ActivityLog` w Prisma schema (action, entityType, entityId, userId, details JSON, createdAt)
- [x] Utility `audit-logger.ts` z funkcją `logChange()` — centralne API do logowania
- [x] Typ TypeScript dla `details` JSON (description + dowolne pola)

**Implementacja**:
- Model zapisuje zdarzenia bez migracji (wykorzystuje istniejące struktury)
- `logChange()` przyjmuje: `userId`, `action`, `entityType`, `entityId`, `details`
- `details.description` — czytelny opis po polsku (zawsze obecny)
- `details.*` — dowolne dodatkowe dane (JSON)
- Nullable `userId` — wspiera zdarzenia systemowe (auto-cancel, cron jobs)

---

### US-9.2: Audit — Reservation Service (7 eventów)
**Priority**: 🔴 CRITICAL  
**Points**: 8  
**Status**: ✅ DONE  
**PR**: #74

**Subtasks**:
- [x] `CREATE` — loguje: klient, sala, typ wydarzenia, daty
- [x] `UPDATE` — loguje: diff zmian (guests, notes, menu, prices, dates)
- [x] `STATUS_CHANGE` — loguje: old status → new status, reason
- [x] `MENU_UPDATE` — loguje: pakiet, ceny, guests
- [x] `MENU_REMOVE` — loguje: usunięty pakiet, ceny
- [x] `PAYMENT_UPDATE` — loguje: deposit changes, discount applied/removed
- [x] `DELETE` — loguje: klient, sala, daty, powód usunięcia

**Implementacja**:
- Dodano `userId` do wszystkich mutujących metod w `reservation.service.ts`
- Kontroler przekazuje `req.user.id` do każdego wywołania serwisu
- Tracking zmian: porównanie old vs new values w `updateReservation()`
- Czytelne opisy: `"Utworzono rezerwację: Kowalski | Sala Kryształowa | Wesele"`

---

### US-9.3: Audit — Queue Service (8 eventów)
**Priority**: 🔴 CRITICAL  
**Points**: 8  
**Status**: ✅ DONE  
**PR**: #75

**Subtasks**:
- [x] `QUEUE_ADD` — loguje: klient, data kolejki, pozycja, guests
- [x] `QUEUE_UPDATE` — loguje: diff zmian (data, pozycja, guests, notes)
- [x] `QUEUE_SWAP` — loguje: obie rezerwacje z nazwiskami i pozycjami
- [x] `QUEUE_MOVE` — loguje: klient, old position → new position, data
- [x] `QUEUE_REORDER` — loguje: batch zmiana pozycji (lista zmian)
- [x] `QUEUE_REBUILD` — loguje: ilość rezerwacji, ilość dat, lista dat
- [x] `QUEUE_PROMOTE` — loguje: dane źródłowe (kolejka) + docelowe (rezerwacja)
- [x] `QUEUE_AUTO_CANCEL` — loguje: ilość anulowanych, ID, trigger (manual/system)

**Implementacja**:
- Dodano `userId` do 7 metod w `queue.service.ts` (wszystkie mutujące)
- `autoCancelExpired(userId?)` — opcjonalny userId dla rozróżnienia manual vs cron
- `batchUpdatePositions()` — zapisuje old positions przed transakcją dla diff
- `promoteReservation()` — dodano lookup hall + eventType dla czytelnych opisów

---

### US-9.4: Audit — Attachments & Reservation Menu (7 eventów)
**Priority**: 🟡 HIGH  
**Points**: 7  
**Status**: ✅ DONE  
**PR**: #76

**Subtasks**:
- [x] `ATTACHMENT_UPLOAD` — loguje: plik, kategoria, entity, RODO redirect
- [x] `ATTACHMENT_UPDATE` — loguje: diff zmian (label, description, category)
- [x] `ATTACHMENT_ARCHIVE` — loguje: nazwa pliku, kategoria, entity
- [x] `ATTACHMENT_DELETE` — loguje: pełne dane (trwałe usunięcie)
- [x] `MENU_SELECTED` — loguje: pakiet, ceny, guests, new vs update
- [x] `MENU_RECALCULATED` — loguje: old/new guests + old/new prices (przy zmianie guests)
- [x] `MENU_DIRECT_REMOVED` — loguje: pakiet, ceny (przed usunięciem)

**Implementacja**:
- `attachment.service.ts`: dodano `userId?` do 3 metod (update, delete, hardDelete)
- `reservation-menu.service.ts`: dodano `userId?` do 4 metod (wszystkie opcjonalne)
- Backward compatibility — `reservation.service.ts` wywołuje bez userId (zaloguje `null`)
- Po merge Phase 1, można zaktualizować callsite w `reservation.service.ts`

---

### US-9.5: SQL Functions — Queue Operations
**Priority**: 🟡 MEDIUM  
**Points**: 2  
**Status**: ✅ DONE  
**Migration**: `0002_queue_sql_functions`

**Subtasks**:
- [x] Funkcja `swap_queue_positions(id1, id2)` — atomowa zamiana pozycji z row locking
- [x] Funkcja `move_to_queue_position(res_id, new_pos)` — przesunięcie z automatycznym shiftem

**Implementacja**:
- Migracja Prisma z pełną definicją funkcji (plpgsql)
- `swap_queue_positions`: używa temp position `-1` żeby uniknąć unique constraint violation
- `move_to_queue_position`: shift up/down w zależności od kierunku ruchu
- `FOR UPDATE` locking — zapobiega race conditions
- Automatyczne utworzenie przy `prisma migrate deploy`

---

## ✅ Phase 2: Audit UI Viewer (16.02.2026)

**Status**: ✅ COMPLETED  
**Wersja**: v1.7.1 - v1.8.1  
**Czas realizacji**: ~4 godziny

### US-9.8: Activity Timeline — Per Entity
**Priority**: 🟡 MEDIUM  
**Points**: 5  
**Status**: ✅ DONE (16.02.2026)  
**PR**: #77  
**Branch**: `feature/us-9.8-entity-timeline`  
**Wersja**: v1.7.1

**Subtasks**:
- [x] Komponent `EntityActivityTimeline` — chronologiczna lista zmian
- [x] Integracja w reservation detail view (zakładka "Historia")
- [x] Integracja w client detail view (zakładka "Historia zmian")
- [x] Icon mapping dla action types (🆕 CREATE, ✏️ UPDATE, 🗑️ DELETE, etc.)
- [x] Polish labels (22 typy akcji + 35+ pól)
- [x] Rozwijalne szczegóły zmian (old → new diff)
- [x] Smart formatting (obiekty, daty, ceny, statusy)
- [x] Auto-refresh (React Query 30s)
- [x] Framer-motion animations

**Implementacja**:
- `lib/api/audit-log.ts` — hook `useEntityActivityLog(entityType, entityId)`
- `components/audit-log/EntityActivityTimeline.tsx` — reużywalny timeline
- Polskie labele dla 22 typów akcji (CREATE, UPDATE, DELETE, STATUS_CHANGE, MENU_RECALCULATED, etc.)
- Polskie nazwy pól (hall → Sala, client → Klient, guests → Goście łącznie)
- Ukryte pola techniczne (`menuSnapshot`, `createdBy`, `*Id`)
- Formatowanie: daty (`dd.MM.yyyy HH:mm`), ceny (`6 825 zł`), statusy ("Potwierdzona")
- Fix: `[object Object]` → smart extraction (hall.name, firstName+lastName, eventType.name)

---

### US-9.9: Archiwum — Soft Delete Reservations
**Priority**: 🟡 MEDIUM  
**Points**: 3  
**Status**: ✅ DONE (16.02.2026)  
**PR**: #78  
**Branch**: `feature/us-9.10-archive-page`  
**Wersja**: v1.8.1

**Subtasks**:
- [x] Pole `archivedAt` w modelu Reservation (już istniało)
- [x] Backend: `archiveReservation()` — ustawia timestamp + reason
- [x] Backend: `unarchiveReservation()` — resetuje timestamp
- [x] API: `POST /reservations/:id/archive`, `POST /reservations/:id/unarchive`
- [x] Frontend: hooks `useArchiveReservation`, `useUnarchiveReservation`
- [x] Frontend: przycisk archiwizacji w reservation list & details
- [x] Log: `ARCHIVE` i `UNARCHIVE` w ActivityLog

**Implementacja**:
- Backend routes: `/api/reservations/:id/archive` (POST), `/api/reservations/:id/unarchive` (POST)
- Frontend: ikona Archive (📦) na liście rezerwacji + w actions menu w szczegółach
- Toast notifications z sonner ("Rezerwacja zarchiwizowana", "Przywrócono z archiwum")
- Filtrowanie: `archived=false` na głównej liście, `archived=true` na stronie archiwum
- Audit log: wpisy z opisem "Zarchiwizowano rezerwację: [klient]", "Przywrócono z archiwum: [klient]"

---

### US-9.10: Archiwum — Archive Page
**Priority**: 🟢 LOW  
**Points**: 3  
**Status**: ✅ DONE (16.02.2026)  
**PR**: #78  
**Branch**: `feature/us-9.10-archive-page`  
**Wersja**: v1.8.1

**Subtasks**:
- [x] Design token `archive` (gray/slate gradient)
- [x] Strona `/dashboard/archive` z dedykowanym hero
- [x] Lista zarchiwizowanych rezerwacji (karty z danymi)
- [x] Stat cards: łącznie, zakończone, anulowane
- [x] Filtry: paginacja (20/stronę)
- [x] Akcje: zobacz szczegóły, przywróć (unarchive)
- [x] Link "Archiwum" w Sidebar (pod Rezerwacjami)
- [x] Badge "ARCHIVED" + data archivizacji na kartach
- [x] Empty state gdy archiwum puste

**Implementacja**:
- Dodano `archive` accent do `design-tokens.ts` (gray/slate palette)
- Sidebar: link "Archiwum" z ikoną Archive pod Rezerwacjami
- Strona `/dashboard/archive`:
  - Hero z gradientem + przycisk "Wróć do rezerwacji"
  - 3 stat cards (łącznie, zakończone, anulowane)
  - Lista kart z danymi: klient, typ, sala, data, goście, wartość
  - Badge statusu + data archivizacji
  - Przycisk "Przywróć" (ArchiveRestore icon, zielony)
  - Link do szczegółów rezerwacji (Eye icon)
  - Paginacja (20/stronę)
  - Empty state z ikoną
- Query: `useReservations({ archived: true })` z TanStack Query
- Toast notifications po unarchive

---

### US-9.11: Dziennik Audytu — Global Dashboard
**Priority**: 🟡 HIGH  
**Points**: 8  
**Status**: ✅ DONE (16.02.2026)  
**PR**: #79  
**Branch**: `feature/us-9.11-audit-dashboard`  
**Wersja**: v1.8.1

**Subtasks**:
- [x] Backend: endpoint `/api/audit-log` + `/api/audit-log/statistics`
- [x] Backend: filtry (action, entityType, dateFrom, dateTo, page, pageSize)
- [x] Backend: meta endpoints `/meta/entity-types`, `/meta/actions`
- [x] Frontend: strona `/dashboard/audit-log`
- [x] Frontend: 4 stat cards (total logs, most frequent action/entity, active users)
- [x] Frontend: filtry (action, entityType, date range)
- [x] Frontend: tabelka z paginacją (20/stronę)
- [x] Frontend: modal z pełną historią zmian (old/new values)
- [x] Frontend: 30+ polskich labelów dla akcji (QUEUE_REORDER, MENU_RECALCULATED, etc.)
- [x] Frontend: 12 typów encji (RESERVATION, CLIENT, ATTACHMENT, QUEUE, etc.)
- [x] Frontend: obsługa `user: null` (akcje systemowe) — fallback "System"
- [x] Frontend: kolorowe badge akcji (32 kolory dla 32 typów akcji)
- [x] Framer-motion animations (StatCard stagger, modal fade-in)

**Implementacja**:
- **Backend**: `audit-log.service.ts`, `audit-log.controller.ts`, `audit-log.routes.ts`
  - `GET /api/audit-log` — paginacja, filtry, sorting
  - `GET /api/audit-log/statistics` — 3 wykresy (byAction, byEntityType, byUser)
  - `GET /api/audit-log/meta/entity-types` — lista unikalnych encji
  - `GET /api/audit-log/meta/actions` — lista unikalnych akcji
  - `GET /api/audit-log/entity/:entityType/:entityId` — logi per encja (już używane w US-9.8)
- **Frontend**: `app/dashboard/audit-log/page.tsx` + komponenty
  - `AuditLogStats.tsx` — 4 karty statystyk z `framer-motion` stagger
  - `AuditLogFilters.tsx` — 4 filtry (action, entityType, dateFrom, dateTo)
  - `AuditLogTable.tsx` — tabelka z kolumnami: data, użytkownik, akcja, typ, opis
  - `AuditLogDetails.tsx` — modal z pełnym diff (old/new values)
  - Polskie etykiety dla 30+ akcji (wszystkie typy z backend)
  - Polskie etykiety dla 12 typów encji
  - 32 kolory badgeów (actionColors map) — każda akcja unikalna
  - Optional chaining `log.user?.firstName` — obsługa null ("System", "Akcja automatyczna")
- **Framer Motion**: 
  - StatCard: `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}` z delay 0.1s/0.2s/0.3s/0.4s
  - Modal: fade-in animacja
  - Hover effects na kartach
- **Fixes**:
  - `TypeError: Cannot read properties of null (reading 'firstName')` — dodano optional chaining + fallback labels
  - Pełna polonizacja wszystkich 30+ akcji (QUEUE_REORDER → "Zmiana kolejności", MENU_RECALCULATED → "Przeliczenie menu")

**Przykłady polskich labelów**:
- BASIC: CREATE → "Utworzenie", UPDATE → "Aktualizacja", DELETE → "Usunięcie", TOGGLE → "Przełączenie"
- STATUS: ARCHIVE → "Archiwizacja", UNARCHIVE → "Przywrócenie", STATUS_CHANGE → "Zmiana statusu"
- MENU: MENU_SELECTED → "Wybór menu", MENU_RECALCULATED → "Przeliczenie menu", MENU_DIRECT_REMOVED → "Bezpośrednie usunięcie menu"
- QUEUE: QUEUE_REORDER → "Zmiana kolejności", QUEUE_REBUILD → "Przebudowa kolejki", QUEUE_AUTO_CANCEL → "Auto-anulowanie z kolejki"
- PAYMENT: MARK_PAID → "Oznaczenie płatności", PAYMENT_UPDATE → "Aktualizacja płatności"
- ATTACHMENTS: ATTACHMENT_UPLOAD → "Wgranie załącznika", ATTACHMENT_ARCHIVE → "Archiwizacja załącznika"
- AUTH: LOGIN → "Logowanie", LOGOUT → "Wylogowanie"

---

## 📊 Summary Sprint 9
- **Total Points**: 42 (Phase 1: 28, Phase 2: 19 [5+3+3+8])
- **Deliverables**: 
  - 22 typy eventów w `ActivityLog`
  - Utility `audit-logger.ts` — centralne API
  - 3 serwisy z pełnym audit coverage (reservation, queue, attachments+menu)
  - 2 SQL functions w migracji Prisma (swap, move)
  - Timeline per entity (rezerwacja, klient) — `EntityActivityTimeline.tsx`
  - Polskie labele dla 22 akcji + 35 pól + smart formatting
  - Archiwum: backend API (archive/unarchive) + frontend page
  - Design token `archive` + sidebar link
  - Stat cards + lista kart + paginacja
  - **Globalny dashboard audytu** — `/dashboard/audit-log`
  - **4 karty statystyk** (total, action, entity, users)
  - **Filtry** (action, entity, date range)
  - **Tabelka paginowana** (20/stronę)
  - **Modal szczegółów** (old/new diff)
  - **30+ polskich labelów akcji** + 12 typów encji
  - **32 kolory badgeów** (actionColors)
  - **Obsługa `user: null`** (akcje systemowe)
  - **Framer-motion** (stagger animations)
- **Testy**: Wszystkie manualne testy zaliczone (archiwizacja, przywróć, timeline, audit dashboard)
- **Migracja DB**: ✅ 0002_queue_sql_functions
- **Restart wymagany**: backend (kod + migracja) + frontend
- **Risk**: Niski (zakończono przed terminem)
- **PR**: #74 (reservation audit), #75 (queue audit), #76 (attachments+menu audit), #77 (timeline), #78 (archive), #79 (audit dashboard)

---

# 🎨 SPRINT 10: Ujednolicenie UI & Mobile (27.02 - 05.03.2026)

## Cel
Spójny wygląd wszystkich modułów + pełna responswność mobilna.

**Estymacja:** ~5-7 dni  
**Wersja:** v1.9.0  
**Branch:** `feature/ui-unification`  
**Status**: 🔳 TODO

---

# ✅ SPRINT 11: Reports Module — Analytics (16.02.2026)

## Cel
Kompleksowy moduł raportów z analityką przychodów i zajętości + eksport do Excel/PDF.

**Estymacja:** ~3-4 dni (zrealizowano w ~5 godzin)  
**Wersja:** v1.0.0 (Reports Module)  
**Branch:** `feature/reports-module`  
**Status**: ✅ DONE (16.02.2026, 18:24-19:13)  
**Dokumentacja**: [REPORTS_MODULE_2026-02-16.md](REPORTS_MODULE_2026-02-16.md)

---

### US-11.1: Revenue Analytics — Backend Service
**Priority**: 🔴 CRITICAL  
**Points**: 8  
**Status**: ✅ DONE

**Subtasks**:
- [x] Serwis `reports.service.ts` z `getRevenueReport()`
- [x] Breakdown by period (day/week/month/year)
- [x] Revenue by hall ranking
- [x] Revenue by event type ranking
- [x] Growth % calculation vs previous period
- [x] Filtering: dateFrom, dateTo, groupBy, hallId, eventTypeId
- [x] Parallel queries z `Promise.all` dla performance

**Implementacja**:
- **Metryki summary**: totalRevenue, avgPerReservation, growthPercent, maxRevenueDay, pendingRevenue
- **Breakdown**: okres + przychód + liczba rezerwacji + średnia
- **Rankings**: wg sali i typu wydarzenia (revenue + count)
- **Filtry**: zakres dat, grupowanie (day/week/month/year), sala, typ wydarzenia

---

### US-11.2: Occupancy Analytics — Backend Service
**Priority**: 🔴 CRITICAL  
**Points**: 7  
**Status**: ✅ DONE

**Subtasks**:
- [x] Metoda `getOccupancyReport()` w `reports.service.ts`
- [x] Occupancy % calculation (dni z rezerwacją / total dni)
- [x] Peak day of week analysis
- [x] Peak hour analysis (0-23)
- [x] Hall rankings by occupancy + reservation count
- [x] Average guests per reservation by hall

**Implementacja**:
- **Summary**: avgOccupancy, peakDay, peakHall, totalReservations, totalDaysInPeriod
- **Hall stats**: occupancy %, liczba rezerwacji, średnia gości
- **Peak analysis**: hourly distribution + weekday distribution
- **Filters**: dateFrom, dateTo, hallId (optional)

---

### US-11.3: Export Service — Excel & PDF
**Priority**: 🟡 HIGH  
**Points**: 5  
**Status**: ✅ DONE

**Subtasks**:
- [x] Instalacja `exceljs@^4.4.0`
- [x] Serwis `reports-export.service.ts` z 4 metodami:
  - `exportRevenueToExcel()`
  - `exportRevenueToPDF()`
  - `exportOccupancyToExcel()`
  - `exportOccupancyToPDF()`
- [x] Excel: headers, data tables, summary sections, styling
- [x] PDF: title, metadata, formatted tables, Polish fonts (DejaVu)
- [x] Controller: 4 endpointy exportu
- [x] Routes: `/api/reports/export/*`

**Implementacja**:
- **Excel (ExcelJS)**: 
  - Arkusz 1: Podsumowanie
  - Arkusz 2: Szczegóły
  - Formatowanie: nagłówki, wycentrowanie, bold
  - Auto-formatting: currency, percentages
- **PDF (PDFKit)**: 
  - Format A4 portrait
  - Nagłówek + metadata
  - Tabele z danymi
  - Polskie czcionki (DejaVu)
- **Endpointy**:
  - `GET /api/reports/export/revenue/excel`
  - `GET /api/reports/export/revenue/pdf`
  - `GET /api/reports/export/occupancy/excel`
  - `GET /api/reports/export/occupancy/pdf`

---

### US-11.4: Reports Layout + Filters
**Priority**: 🟡 HIGH  
**Points**: 8  
**Status**: ✅ DONE

**Subtasks**:
- [x] Strona `/dashboard/reports` z 2 tabami (Revenue, Occupancy)
- [x] DateRange picker z presetami (this month, last month, this year, last year)
- [x] GroupBy selector (day/week/month/year)
- [x] Hall filter dropdown
- [x] EventType filter dropdown
- [x] Hook `useReports.ts` z TanStack Query
- [x] Export buttons (Excel, PDF) z download handlers

**Implementacja**:
- Hero z gradientem + stat cards
- Filtry w karcie z Shadcn UI components
- Presety dat dla wygody ("Ten miesiąc", "Ostatni miesiąc", "Ten rok", "Ostatni rok")
- Realtime query przy zmianie filtrów (debounce 300ms)
- Loading states + error handling
- Polish language UI

---

### US-11.5: Revenue Tab — Frontend UI
**Priority**: 🔴 CRITICAL  
**Points**: 10  
**Status**: ✅ DONE

**Subtasks**:
- [x] Summary cards (4): Total Revenue, Avg/Rezerwacja, Growth %, Max Day
- [x] Breakdown table: okres + przychód + liczba + średnia
- [x] Revenue by Hall table: sala + przychód + liczba
- [x] Revenue by Event Type table: typ + przychód + liczba
- [x] Export buttons (Excel, PDF)
- [x] Polish formatting: ceny (`6 825 zł`), percentages

**Implementacja**:
- Stat cards z ikonami (TrendingUp, DollarSign, BarChart, Calendar)
- Tabele z Shadcn Table component
- Responsive design (mobile-friendly)
- Empty states gdy brak danych
- Loading skeletons

---

### US-11.6: Occupancy Tab — Frontend UI
**Priority**: 🔴 CRITICAL  
**Points**: 7  
**Status**: ✅ DONE

**Subtasks**:
- [x] Summary cards (4): Avg Occupancy, Peak Day, Peak Hall, Total Reservations
- [x] Occupancy by Hall table: sala + occupancy % + liczba + avg gości
- [x] Peak Hours table: godzina + liczba rezerwacji
- [x] Peak Days table: dzień tygodnia + liczba rezerwacji
- [x] Export buttons (Excel, PDF)
- [x] Polish formatting: percentages, day names

**Implementacja**:
- Stat cards z percentages i day names
- 3 tabele z różnymi metrykami
- Ranking sal po occupancy %
- Peak analysis (hours 0-23, days Mon-Sun)
- Responsive layout

---

## 📊 Summary Sprint 11
- **Total Points**: 45 (8+7+5+8+10+7)
- **Deliverables**:
  - **Backend**: 2 serwisy (reports, reports-export), 1 controller, 6 endpointów
  - **Frontend**: 1 strona, 3 hooki custom, kompletny UI z filtrami
  - **Funkcjonalności**:
    - Revenue report: breakdown, rankings, growth %
    - Occupancy report: hall stats, peak analysis
    - Excel export (ExcelJS) — 2 arkusze, styled
    - PDF export (PDFKit) — A4, Polish fonts
  - **Dokumentacja**: [REPORTS_MODULE_2026-02-16.md](REPORTS_MODULE_2026-02-16.md) (17.6 KB)
  - **Kod**: ~1200 linii TypeScript (backend + frontend)
- **Migracja DB**: ❌ Brak (wykorzystuje istniejące modele)
- **Restart wymagany**: backend + frontend
- **Risk**: Niski (zrealizowano przed terminem w 5h)
- **Dependencies**: `exceljs@^4.4.0` (już zainstalowany)
- **Files**:
  - Backend (6): `reports.types.ts`, `reports.service.ts`, `reports-export.service.ts`, `reports.controller.ts`, `reports.routes.ts`, aktualizacja `server.ts`
  - Frontend (3): `app/dashboard/reports/page.tsx`, `hooks/use-reports.ts`, `types/reports.types.ts`

---

# ✅ SPRINT 12: RBAC + Settings UI (16.02.2026)

## Cel
System kontroli dostępu oparty na rolach z UI zarządzania użytkownikami, rolami i ustawieniami firmy.

**Estymacja:** ~4-5 dni (zrealizowano w ~3 godziny)  
**Wersja:** v1.0.0 (RBAC Module)  
**Branch:** `feature/rbac-settings`  
**Status**: ✅ DONE (16.02.2026, 20:20-21:30)  
**Dokumentacja**: [RBAC_SYSTEM.md](RBAC_SYSTEM.md)

---

### US-12.1: RBAC — Modele bazodanowe
**Priority**: 🔴 CRITICAL  
**Points**: 5  
**Status**: ✅ DONE

**Subtasks**:
- [x] Model `Role` w Prisma (name, slug, color, isSystem)
- [x] Model `Permission` (slug, description, module)
- [x] Model `RolePermission` (many-to-many)
- [x] Model `CompanySettings` (singleton z danymi firmy)
- [x] Relacja `User.roleId` → `Role`
- [x] Backward compatibility: pole `legacyRole`

**Implementacja**:
- Format uprawnień: `moduł:akcja` (np. `reservations:create`)
- 5 ról systemowych: Administrator, Kierownik, Pracownik, Podgląd, Koordynator
- 13 modułów, 49 uprawnień
- Role systemowe (`isSystem: true`) nie mogą być usunięte

---

### US-12.2: RBAC — Seed Script
**Priority**: 🔴 CRITICAL  
**Points**: 3  
**Status**: ✅ DONE

**Subtasks**:
- [x] Seed `rbac.seed.ts` z definicjami ról i uprawnień
- [x] 5 ról: admin (42 perm), manager (39), employee (17), viewer (9), koordynator (0)
- [x] 49 uprawnień w 13 modułach
- [x] Automatyczna migracja legacy → RBAC
- [x] Integracja z `npm run db:seed`

**Implementacja**:
- Moduły: Dashboard, Rezerwacje, Archiwum, Klienci, Sale, Menu, Kolejka, Zaliczki, Typy wydarzeń, Załączniki, Dziennik audytu, Raporty, Ustawienia
- Mapowanie legacy: `ADMIN` → admin, `EMPLOYEE` → employee
- Seed uruchamiany przy każdym `prisma migrate deploy`

---

### US-12.3: RBAC — Permission Middleware
**Priority**: 🔴 CRITICAL  
**Points**: 8  
**Status**: ✅ DONE

**Subtasks**:
- [x] Middleware `requirePermission(...permissions)` — wymaga wszystkich
- [x] Middleware `requireAnyPermission(...permissions)` — wymaga co najmniej jednego
- [x] Middleware `attachPermissionCheck(...permissions)` — nie blokuje, dołącza wynik
- [x] Cache uprawnień (TTL: 5min, invalidation on role change)
- [x] Helper `invalidatePermissionCache(userId)`
- [x] Integracja z `authMiddleware`

**Implementacja**:
- Cache w pamięci z TTL 5 minut
- Automatyczna invalidacja przy zmianie roli/uprawnień
- Obsługa legacy fallback (jeśli `roleId` null → sprawdź `legacyRole`)
- Error 403 Forbidden gdy brak uprawnień

---

### US-12.4: Settings API — Users, Roles, Permissions, Company
**Priority**: 🔴 CRITICAL  
**Points**: 13  
**Status**: ✅ DONE

**Subtasks**:
- [x] Users API (7 endpointów):
  - `GET /users` — lista + filtry + search
  - `POST /users` — utwórz
  - `PUT /users/:id` — edytuj
  - `PATCH /users/:id/password` — zmień hasło
  - `PATCH /users/:id/toggle-active` — aktywuj/dezaktywuj
  - `DELETE /users/:id` — soft delete
- [x] Roles API (5 endpointów):
  - `GET /roles` — lista z licznikiem użytkowników
  - `POST /roles` — utwórz rolę
  - `PUT /roles/:id` — edytuj
  - `PUT /roles/:id/permissions` — zaktualizuj uprawnienia
  - `DELETE /roles/:id` — usuń (jeśli nie systemowa)
- [x] Permissions API (2 endpointy):
  - `GET /permissions` — flat list
  - `GET /permissions/grouped` — grouped by module
- [x] Company API (2 endpointy):
  - `GET /company` — dane firmy
  - `PUT /company` — aktualizuj
- [x] Serwisy: users, roles, permissions, company-settings
- [x] Kontrolery: users, roles, permissions, company-settings
- [x] Routes: `/api/settings/*`
- [x] Audit log integration

**Implementacja**:
- Wszystkie endpointy chronione `authMiddleware` + permission middleware
- Users: filtry (role, status, search), paginacja
- Roles: walidacja usuwania (nie można usunąć systemowej + sprawdź czy są użytkownicy)
- Company: singleton record (upsert)
- Audit log: wszystkie akcje CRUD logowane

---

### US-12.5: Settings UI — 3 Tabs (Users, Roles, Company)
**Priority**: 🔴 CRITICAL  
**Points**: 16  
**Status**: ✅ DONE

**Subtasks**:
- [x] Strona `/dashboard/settings` z 3 tabami
- [x] **UsersTab**:
  - Tabela z filtrowaniem (rola, status) i wyszukiwaniem
  - Dialog dodawania/edycji użytkownika
  - Dialog zmiany hasła
  - Toggle aktywności (Switch)
  - Usuwanie z potwierdzeniem (AlertDialog)
  - Badge z rolą (kolorowy)
  - Data ostatniego logowania
- [x] **RolesTab**:
  - Lista ról z licznikiem użytkowników
  - Rozwijana macierz uprawnień per rola (Collapsible)
  - Checkboxy dla każdego uprawnienia
  - Bulk select/deselect per moduł
  - Dialog dodawania/edycji roli
  - Usuwanie niestandardowych ról (AlertDialog)
  - Ochrona systemowych ról
- [x] **CompanyTab**:
  - Formularz z danymi firmy (13 pól)
  - Walidacja NIP (10 cyfr), REGON (9 lub 14 cyfr)
  - Dropdown waluta + strefa czasowa
  - Zapis z potwierdzeniem (toast)
- [x] API client `lib/api/settings.ts`
- [x] Hooki TanStack Query (mutations + queries)
- [x] Polish language UI

**Implementacja**:
- **UsersTab**: 
  - Tabela Shadcn Table
  - Filtry: Select (role), ToggleGroup (status), Input (search)
  - Actions: Edit (Pencil icon), Password (Key icon), Toggle (Switch), Delete (Trash icon)
  - Dialog z formularzem: email, firstName, lastName, role (Select), password (optional przy edit)
- **RolesTab**:
  - Karty dla każdej roli z Collapsible
  - Macierz uprawnień: 13 sekcji (modules) × N checkboxów
  - Bulk actions: "Zaznacz wszystkie", "Odznacz wszystkie" per moduł
  - Dialog roli: name, slug, description, color (ColorPicker)
- **CompanyTab**:
  - Grid 2-column form
  - Pola: name, taxId (NIP), regon, street, postalCode, city, phone, email, website, currency, timezone, invoicePrefix, receiptPrefix
  - Walidacja: required fields, NIP regex, REGON regex
- **Components**: 6 nowych (UsersTab, UserFormDialog, ChangePasswordDialog, RolesTab, RoleFormDialog, CompanyTab)

---

## 📊 Summary Sprint 12
- **Total Points**: 45 (5+3+8+13+16)
- **Deliverables**:
  - **Backend**: 
    - 4 modele Prisma (Role, Permission, RolePermission, CompanySettings)
    - Seed script: 5 ról, 49 uprawnień, 13 modułów
    - 3 middleware (requirePermission, requireAnyPermission, attachPermissionCheck)
    - Cache z TTL 5min + invalidation
    - 4 serwisy (users, roles, permissions, company)
    - 4 kontrolery
    - 16 endpointów API (`/api/settings/*`)
    - Audit log integration
  - **Frontend**:
    - Strona `/dashboard/settings` z 3 tabami
    - 6 komponentów UI (UsersTab, RolesTab, CompanyTab + dialogi)
    - API client + hooki TanStack Query
    - Pełna polonizacja
    - Responsive design
- **Dokumentacja**: [RBAC_SYSTEM.md](RBAC_SYSTEM.md) (12.4 KB)
- **Migracja DB**: ✅ Dodane 4 modele (bez migracji — wykorzystuje istniejące struktury)
- **Restart wymagany**: backend + frontend + seed
- **Risk**: Niski (zrealizowano przed terminem w 3h)
- **Files**:
  - Backend (13): Prisma schema, seed, constants, middlewares, types, 4 serwisy, 4 kontrolery, routes
  - Frontend (7): page.tsx, 6 komponentów, lib/api/settings.ts

---

# 📊 Podsumowanie Sprintów 6-12

| Sprint | Temat | Points | Estymacja | Czas realny | Wersja | Status |
|--------|-------|--------|-----------|-------------|--------|--------|
| 6 | Quick Wins & Bugfixy | 16 | ~1 dzień | ~1 dzień | v1.5.0-v1.5.5 | ✅ DONE |
| 7 | UTF-8 Cleanup + Attachments | 25 | ~2 dni | ~1 dzień | v1.6.1-v1.6.2 | ✅ DONE |
| 8 | System Rabatów | 26 | ~2-3 dni | ~1 dzień | v1.7.0 | ✅ DONE |
| 9.1 | Audit Logging Backend | 28 | ~1 dzień | ~4h | v1.8.0 | ✅ DONE |
| 9.2 | Audit UI + Archive + Dashboard | 19 | ~1 dzień | ~4h | v1.8.1 | ✅ DONE |
| 10 | Ujednolicenie UI & Mobile | 47 | ~5-7 dni | — | v1.9.0 | 🔳 TODO |
| 11 | Reports Module | 45 | ~3-4 dni | ~5h | Reports v1.0.0 | ✅ DONE |
| 12 | RBAC + Settings UI | 45 | ~4-5 dni | ~3h | RBAC v1.0.0 | ✅ DONE |
| **RAZEM** | | **251** | **~21-31 dni** | **~3.5 dni** | | **7/8 DONE** |

**Velocity Sprint 11 & 12:**
- Sprint 11: 45 punktów / 5h = **9 pkt/h** 🚀
- Sprint 12: 45 punktów / 3h = **15 pkt/h** 🚀🚀
- Średnia Sprinty 11-12: **12 pkt/h** (ponad 3x szybciej niż estymacja)

---

**Last Updated**: 16.02.2026, 21:45 CET  
**Project Status**: ✅ Sprinty 11-12 COMPLETE — Reports Analytics + RBAC System done  
**Version**: v1.9.0 (Reports Module + RBAC Module)  
**Next Sprint**: Sprint 10 — Ujednolicenie UI & Mobile (47 pts, ~5-7 dni)
