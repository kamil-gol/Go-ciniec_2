# 📋 Plan Sprintów - System Rezerwacji Sal

**Status**: 🔧 W budowie  
**Okres**: Ciągły rozwój  
**Start projektu**: 06.02.2026  
**Aktualna wersja**: 1.7.0  

---

## 📊 Mapa Sprintów

> Uwaga: Sprinty 6, 7 i 8 zostały zrealizowane przed planowanym terminem.

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
SPRINT 9 (21.02 - 26.02)   → Historia Zmian & Archiwum         🔳 TODO
SPRINT 10 (27.02 - 05.03)  → Ujednolicenie UI & Mobile         🔳 TODO
```

---

# ✅ SPRINTY 1-8: ZAKOŃCZONE (v1.0.0 → v1.7.0)

Szczegóły zakończonych sprintów → patrz [CHANGELOG.md](../CHANGELOG.md)

**Podsumowanie:**
- ✅ Pełna infrastruktura (Docker, PostgreSQL, JWT Auth, RBAC)
- ✅ System rezerwacji + kolejka + 6-krokowy wizard
- ✅ System menu (kategorie, dania, szablony, pakiety, opcje, dodatki)
- ✅ System zaliczek, załączników, typów wydarzeń
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

# 📜 SPRINT 9: Historia Zmian & Archiwum (21.02 - 26.02.2026)

## Cel
Globalny system audytu (kto co zmienił i kiedy) + moduł archiwum.

**Estymacja:** ~3-5 dni  
**Wersje:** v1.8.0 - v1.8.1  
**Branch:** `feature/audit-trail-and-archive`

---

# 🎨 SPRINT 10: Ujednolicenie UI & Mobile (27.02 - 05.03.2026)

## Cel
Spójny wygląd wszystkich modułów + pełna responsywność mobilna.

**Estymacja:** ~5-7 dni  
**Wersja:** v1.9.0  
**Branch:** `feature/ui-unification`

---

# 📊 Podsumowanie Sprintów 6-10

| Sprint | Temat | Points | Estymacja | Wersja | Status |
|--------|-------|--------|-----------|--------|--------|
| 6 | Quick Wins & Bugfixy | 16 | ~1 dzień | v1.5.0-v1.5.5 | ✅ DONE |
| 7 | UTF-8 Cleanup + Attachments | 25 | ~2 dni | v1.6.1-v1.6.2 | ✅ DONE |
| 8 | System Rabatów | 26 | ~1 dzień | v1.7.0 | ✅ DONE |
| 9 | Historia Zmian & Archiwum | 47 | ~3-5 dni | v1.8.0-v1.8.1 | 🔳 TODO |
| 10 | Ujednolicenie UI & Mobile | 47 | ~5-7 dni | v1.9.0 | 🔳 TODO |
| **RAZEM** | | **161** | **~13-18 dni** | | **3/5 DONE** |

---

**Last Updated**: 16.02.2026, 15:53 CET  
**Project Status**: 🔧 Sprint 9 (Historia Zmian & Archiwum) jako następny
