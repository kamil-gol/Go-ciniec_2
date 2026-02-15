# 📝 Changelog

## [1.6.0] - 2026-02-15

### ✨ Nowe funkcjonalności (Sprint 7 — System Rabatów)

- **System rabatów dla rezerwacji** — rabat procentowy lub kwotowy, z powodem i pełną kalkulacją ceny końcowej.

#### US-7.1: Schema & Migracja DB
- 5 nowych pól w `Reservation`: `discountType` (PERCENTAGE/FIXED), `discountValue` (Decimal), `discountAmount` (Decimal), `discountReason` (String), `priceBeforeDiscount` (Decimal).
- Migracja Prisma wdrożona na produkcji.

#### US-7.2: Backend API — Rabaty
- `PATCH /api/reservations/:id/discount` — zastosuj/edytuj rabat (typ, wartość, powód).
- `DELETE /api/reservations/:id/discount` — usuń rabat (przywraca cenę sprzed rabatu).
- Walidacja: value > 0, reason min 3 znaki, % ≤ 100, rabat nie może przekroczyć ceny.
- Historia: wpisy `DISCOUNT_APPLIED` / `DISCOUNT_REMOVED` w `ReservationHistory`.

#### US-7.3: Frontend — Rabat w szczegółach rezerwacji
- `DiscountSection.tsx` — komponent z 3 stanami: brak rabatu → „Dodaj rabat”; aktywny → karta z edit/delete; edycja → formularz z live preview.
- `discountApi` + hooki (`useApplyDiscount`, `useRemoveDiscount`) z cache invalidation.
- Integracja w `ReservationFinancialSummary.tsx`.
- `finalTotalPrice = effectiveTotalPrice - discountAmount` (prawidłowa kalkulacja ceny końcowej).

#### US-7.4: Frontend — Rabat w formularzu tworzenia rezerwacji ✅
- Sekcja „Rabat” w podsumowaniu nowej rezerwacji (wizard) z wyborem typu (% / PLN), wartością, powodem i live preview.
- Pola rabatu przekazywane do `POST /api/reservations`.

### 🐛 Bugfixy (Sprint 7)
- Fix mutacji discount (eliminacja `/reservations/undefined/discount`).
- Fix kalkulacji total bar: użycie `finalTotalPrice` (uwzględnia rabat).
- Fix layoutu DiscountSection (kompaktowy design, bez card-in-card).

### 📦 Zmienione/nowe pliki (wybrane)
- `apps/backend/prisma/schema.prisma` — pola rabatu.
- `apps/backend/src/services/discount.service.ts` — apply/remove.
- `apps/backend/src/controllers/discount.controller.ts` — kontroler.
- `apps/backend/src/routes/reservation.routes.ts` — endpointy rabatu.
- `apps/frontend/components/reservations/DiscountSection.tsx`.
- `apps/frontend/components/reservations/CreateReservationDiscountSection.tsx`.
- `apps/frontend/components/reservations/ReservationFinancialSummary.tsx`.

---

## [1.5.0] - 2026-02-15

### ✨ Nowe funkcjonalności (Sprint 6 — Quick Wins)

**PR:** [#62](https://github.com/kamil-gol/Go-ciniec_2/pull/62) | **Branch:** `feature/sprint-6-quick-wins`

- **US-6.2: Usunięcie nazwy sali z PDF** — potwierdzenie rezerwacji (PDF) nie zawiera już nazwy sali.
- **US-6.3: Usunięcie auto-notatki >6h** — zlikwidowano automatyczne dopisywanie notatki o dodatkowych godzinach.
- **US-6.4: Blokada statusu COMPLETED przed datą wydarzenia** — zmiana statusu na COMPLETED jest blokowana, jeśli wydarzenie jeszcze się nie zakończyło.
- **US-6.6: Auto-notatka o inflacji** — przy tworzeniu rezerwacji na następny rok system dopisuje informację o możliwej zmianie cen.

### 📦 Zmienione pliki
- `apps/backend/src/services/pdf-generator.service.ts` — US-6.2
- `apps/backend/src/services/reservation.service.ts` — US-6.3, US-6.4, US-6.6

### ✅ Testy (wykonane na serwerze produkcyjnym)
| Test | Wynik |
|------|-------|
| US-6.2: `strings test-pdf.pdf \| grep sala` → pusty | ✅ PASS |
| US-6.3: Rezerwacja 8h → notes bez extra hours | ✅ PASS |
| US-6.4: COMPLETED na przyszłą datę → błąd 400 | ✅ PASS |
| US-6.6: Rezerwacja na 2027 → auto-notatka inflacja | ✅ PASS |

### 🚀 Deployment
```bash
cd /home/kamil/rezerwacje && git checkout main && git pull origin main && docker compose restart backend
```

---

## [1.4.4] - 2026-02-15

### 🐛 Bugfixy
- **Fix kodowania UTF-8 w szczegółach rezerwacji** — zamiana ~12 Unicode escape sequences na poprawne polskie znaki w `reservations/[id]/page.tsx`.
- **Fix API Error 500: `/api/attachments`** — `attachment.routes.ts` wywoływał `attachmentController.list()`, ale kontroler eksportuje tę metodę jako `getByEntity()`. Zmieniono wywołanie na `.getByEntity()`.

### 📦 Zmienione pliki
- `apps/frontend/app/dashboard/reservations/[id]/page.tsx`
- `apps/backend/src/routes/attachment.routes.ts`

### 🚀 Deployment
```bash
cd /home/kamil/rezerwacje && git pull origin main && docker compose restart backend frontend
```

---

## [1.4.3] - 2026-02-15

### 🚀 Ulepszenia
- **Frontend w trybie produkcyjnym** — przejście na `npm run build && npm run start` oraz `NODE_ENV=production`.
- **Backend pozostaje w trybie dev** — `npm run dev` (zmiana planowana osobno).

### 📦 Zmienione pliki
- `docker-compose.yml`

---

## [1.4.2] - 2026-02-15

### 🐛 Bugfixy
- **Fix kodowania UTF-8 w formularzu rezerwacji** — zamiana ~100+ Unicode escape sequences (`\\uXXXX`) na poprawne znaki UTF-8 w `create-reservation-form.tsx`.

---

## [1.4.1] - 2026-02-15

### 🐛 Bugfixy
- Fix build error: brakujący moduł `./client` w `menu-selection.ts`.
- Fix crash buildu przez `NODE_ENV` dual-bundle.
- Fix fallback 404 dla App Router (`app/not-found.tsx`).

---

## [1.4.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Redesign formularza rezerwacji — 6-krokowy Wizard UI** (PR #49).

---

## [1.3.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Karta Menu PDF** — generowanie karty menu jako PDF.

---

## [1.2.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Detekcja konfliktu "Cała Sala"**.

---

## [1.1.0] - 2026-02-14

### 🔒 Bezpieczeństwo
- **Auth middleware na endpointach menu**.

---

## [1.0.0] - 2026-02-14

### 📚 Dokumentacja
- Pełna aktualizacja CURRENT_STATUS.md + API.md.

---

## [0.9.8] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Moduł Typy Wydarzeń** — pełny frontend CRUD.

---

## [0.9.7] - 2026-02-11

### ✨ Nowe funkcjonalności
- **System Menu & Dania**.

---

## [0.9.6] - 2026-02-09

### 🐛 Bugfixy
- Bug #9: Nullable constraints + batch update.

---

## [0.9.5] - 2026-02-07

### 🐛 Bugfixy
- Bug #5-#8: Race conditions, loading, auto-cancel, walidacje.

---

## [0.9.0] - 2026-02-06

### ✨ Nowe funkcjonalności
- System rezerwacji (pełny CRUD) + kolejka + sale + klienci + typy wydarzeń.
