# 📋 Plan Sprintów - System Rezerwacji Sal

**Status**: 🔧 W budowie  
**Okres**: Ciągły rozwój  
**Start projektu**: 06.02.2026  
**Aktualna wersja**: 1.6.0  

---

## 📊 Mapa Sprintów

> Uwaga: Sprinty 6 i 7 zostały zrealizowane przed planowanym terminem.

```
SPRINT 1 (06.02 - 09.02)   → Fundacja                          ✅ DONE
SPRINT 2 (09.02 - 11.02)   → Moduł Rezerwacji                  ✅ DONE
SPRINT 3 (11.02 - 12.02)   → Uzupełnianie Funkcjonalności      ✅ DONE
SPRINT 4 (12.02 - 13.02)   → System Menu & Dania               ✅ DONE
SPRINT 5 (13.02 - 15.02)   → Stabilizacja & Production Mode    ✅ DONE
─────────────────────────────────────────────────────────────────
SPRINT 6 (16.02 - 17.02)   → Quick Wins & Bugfixy              ✅ DONE
SPRINT 7 (18.02 - 20.02)   → System Rabatów                    ✅ DONE
SPRINT 8 (21.02 - 26.02)   → Historia Zmian & Archiwum         🔳 TODO
SPRINT 9 (27.02 - 05.03)   → Ujednolicenie UI & Mobile         🔳 TODO
```

---

# ✅ SPRINTY 1-7: ZAKOŃCZONE (v1.0.0 → v1.6.0)

Szczegóły zakończonych sprintów → patrz [CHANGELOG.md](../CHANGELOG.md)

**Podsumowanie:**
- ✅ Pełna infrastruktura (Docker, PostgreSQL, JWT Auth, RBAC)
- ✅ System rezerwacji + kolejka + 6-krokowy wizard
- ✅ System menu (kategorie, dania, szablony, pakiety, opcje, dodatki)
- ✅ System zaliczek, załączników, typów wydarzeń
- ✅ Frontend production mode (build + start)
- ✅ 45 testów E2E (Playwright)
- ✅ Pełna dokumentacja API (~68 endpointów)
- ✅ Sprint 6: quick wins
- ✅ Sprint 7: system rabatów (% / PLN)

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

# ✅ SPRINT 7: System Rabatów (18.02 - 20.02.2026)

## Cel
Możliwość udzielenia rabatu procentowego lub kwotowego na cenę końcową rezerwacji.

**Estymacja:** ~2-3 dni  
**Wersja:** v1.6.0  
**Branch:** `feature/discount-system`

---

### US-7.1: Model danych — rozszerzenie Reservation
**Priority**: 🔴 CRITICAL  
**Points**: 5

**Subtasks**:
- [x] Migracja Prisma: dodanie 5 nowych pól
- [x] Deployment migracji: `prisma migrate deploy`

---

### US-7.2: Backend — Discount API
**Priority**: 🔴 CRITICAL  
**Points**: 8

**Subtasks**:
- [x] Serwis: `applyDiscount()` + `removeDiscount()`
- [x] Kontroler: `PATCH` + `DELETE` endpointy
- [x] Routes: dodanie do `reservation.routes.ts`
- [x] Walidacje: Zod schema
- [x] Historia zmian: wpis do `ReservationHistory`
- [x] Testy: edge cases (100%, > totalPrice, negatywna wartość)

---

### US-7.3: Frontend — UI rabatu w Financial Summary
**Priority**: 🔴 CRITICAL  
**Points**: 8

**Subtasks**:
- [x] UI sekcji rabatu w Financial Summary
- [x] Toggle PERCENTAGE / FIXED
- [x] Realtime preview kalkulacji
- [x] Przycisk dodaj/edytuj/usuń rabat
- [x] Mutacje PATCH/DELETE rabatu
- [x] Aktualizacja PDF generatora (sekcja rabat)
- [x] Test: dodaj rabat 10% → cena się zmienia; usuń → wraca do oryginału

---

### US-7.4: Rabat w formularzu nowej rezerwacji
**Priority**: 🟡 HIGH  
**Points**: 5

**Subtasks**:
- [x] UI sekcji rabatu w Kroku 6
- [x] Zod schema: opcjonalne pola rabatu
- [x] Realtime price recalc
- [x] Backend: obsługa pól rabatu w `create()`

---

## 📊 Summary Sprint 7
- **Total Points**: 26
- **Deliverables**: Kompletny system rabatów (DB + API + UI + PDF)
- **Migracja DB**: ✅ Wymagana (5 nowych pól w Reservation)
- **Restart wymagany**: backend + frontend + migracja
- **Risk**: Średni

---

# 📜 SPRINT 8: Historia Zmian & Archiwum (21.02 - 26.02.2026)

## Cel
Globalny system audytu (kto co zmienił i kiedy) + moduł archiwum.

**Estymacja:** ~3-5 dni  
**Wersje:** v1.7.0 - v1.7.1  
**Branch:** `feature/audit-trail-and-archive`

---

# 🎨 SPRINT 9: Ujednolicenie UI & Mobile (27.02 - 05.03.2026)

## Cel
Spójny wygląd wszystkich modułów + pełna responsywność mobilna.

**Estymacja:** ~5-7 dni  
**Wersja:** v1.8.0  
**Branch:** `feature/ui-unification`

---

# 📊 Podsumowanie Sprintów 6-9

| Sprint | Temat | Points | Estymacja | Wersja | Status |
|--------|-------|--------|-----------|--------|--------|
| 6 | Quick Wins & Bugfixy | 16 | ~1 dzień | v1.5.0-v1.5.5 | ✅ DONE |
| 7 | System Rabatów | 26 | ~2-3 dni | v1.6.0 | ✅ DONE |
| 8 | Historia Zmian & Archiwum | 47 | ~3-5 dni | v1.7.0-v1.7.1 | 🔳 TODO |
| 9 | Ujednolicenie UI & Mobile | 47 | ~5-7 dni | v1.8.0 | 🔳 TODO |
| **RAZEM** | | **136** | **~11-16 dni** | | |

---

**Last Updated**: 15.02.2026, 19:13 CET  
**Project Status**: 🔧 Sprint 8 zaplanowany
