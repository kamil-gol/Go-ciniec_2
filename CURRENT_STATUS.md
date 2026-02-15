# 📍 Status Projektu - 15.02.2026

## ⚡ Szybki Przegląd

**Branch:** `main`  
**Ostatnia aktualizacja:** 15.02.2026, 19:13 CET  
**Status:** ✅ Stabilny - W aktywnym rozwoju  
**Wersja:** 1.6.0 (System Rabatów ✅ + Sprint 6 Quick Wins ✅)

---

## 🗺️ Roadmap

| Sprint | Temat | Estymacja | Wersja | Status |
|--------|-------|-----------|--------|--------|
| 6 | Quick Wins & Bugfixy (6 tasków) | ~1 dzień | v1.5.0 | ✅ Done |
| 7 | System Rabatów (% / PLN) | ~2-3 dni | v1.6.0 | ✅ Done |
| 8 | Historia Zmian & Archiwum | ~3-5 dni | v1.7.0-v1.7.1 | 🔳 Planowany |
| 9 | Ujednolicenie UI & Mobile | ~5-7 dni | v1.8.0 | 🔳 Planowany |

📚 **Pełny plan sprintów:** [docs/SPRINTS.md](docs/SPRINTS.md)

---

## 📦 Co Działa

### 💰 System Rabatów (v1.6.0) ✅
✅ Rabat **procentowy** lub **kwotowy** dla rezerwacji (typ, wartość, powód)  
✅ API: `PATCH /api/reservations/:id/discount` oraz `DELETE /api/reservations/:id/discount`  
✅ Historia zmian: `DISCOUNT_APPLIED` / `DISCOUNT_REMOVED` w `ReservationHistory`  
✅ UI rabatu w szczegółach rezerwacji (Financial Summary) z live preview  
✅ UI rabatu w formularzu tworzenia rezerwacji (wizard) + wysyłka pól rabatu do `POST /api/reservations`  
✅ PDF potwierdzenia uwzględnia cenę końcową po rabacie (jeśli rabat istnieje)

### ✨ Sprint 6 — Quick Wins (v1.5.0) ✅
✅ Redirect do szczegółów po utworzeniu rezerwacji (bez przejścia przez listę)  
✅ PDF potwierdzenia nie pokazuje nazwy sali klientowi  
✅ Usunięta auto-notatka o extra hours (>6h)  
✅ Blokada zmiany statusu na COMPLETED przed zakończeniem wydarzenia (backend + UI)  
✅ Dodawanie nowego klienta w formularzu rezerwacji (Krok 5)  
✅ Auto-notatka o inflacji dla rezerwacji na kolejny rok (≥ 3 miesiące do wydarzenia)

### 🐛 Reservation Detail Fixes (v1.4.4)
✅ Fix UTF-8 w szczegółach rezerwacji  
✅ Fix 500 `/api/attachments` + poprawne ładowanie załączników

### 🚀 Production Mode (v1.4.3)
✅ Frontend w trybie produkcyjnym (`build` + `start`)  
⚠️ Backend nadal w dev mode (`npm run dev`) — do przeniesienia później

### 🧙 Formularz Rezerwacji — 6-krokowy Wizard (v1.4.0)
✅ Wizard UI + Stepper/Combobox/DatePicker/TimePicker  
✅ Flow: Szablon → Pakiet → Ceny  
✅ Extra hours w Financial Summary (500 PLN/h > 6h)  
📚 Dokumentacja: [docs/RESERVATION_FORM_WIZARD.md](docs/RESERVATION_FORM_WIZARD.md)

### System Rezerwacji & Kolejki
✅ Rezerwacje + kolejka (RESERVED) + drag&drop + row-level locking + retry logic  
✅ Detekcja konfliktu "Cała Sala" (v1.2.0) + sanityzacja null bytes

### 🍽️ System Menu (KOMPLETNY)
✅ Kategorie Dań, Biblioteka Dań, Szablony, Pakiety, Opcje, Dodatki, historia cen  
✅ Karta Menu PDF (v1.3.0)

### 📎 System Załączników
✅ Upload/Download/Archive/Delete z kategoriami i integracją w rezerwacji

### 🔒 Bezpieczeństwo & Auth
✅ JWT + RBAC (ADMIN, EMPLOYEE)  
✅ Auth middleware na endpointach menu (45+)

### 🧪 Testy E2E
✅ 45 testów (43 pass, 2 skip) — Playwright w Docker  
📚 Dokumentacja: [docs/E2E_TESTING_PLAN.md](docs/E2E_TESTING_PLAN.md)

---

## 📋 TODO — Nadchodzące Sprinty

### 📜 Sprint 8: Historia Zmian & Archiwum (v1.7.x)
- [ ] US-8.1: Reusable Audit Logger (`logChange()` + `diffObjects()`)
- [ ] US-8.2: Integracja audit loggera w modułach
- [ ] US-8.3: Activity Log API (paginacja + filtry)
- [ ] US-8.4: Frontend `<AuditTimeline>` + widok globalny
- [ ] US-8.5: Moduł Archiwum

### 🎨 Sprint 9: Ujednolicenie UI & Mobile (v1.8.0)
- [ ] Design System shared components + migracja modułów
- [ ] Mobile-first responsive fixes

### 🔄 Backlog
- [ ] Backend production mode (kompilacja TS → JS + `npm run start`)
- [ ] Testy jednostkowe systemu menu
- [ ] Production deployment

---

## 📚 Dokumentacja

| Dokument | Opis |
|----------|------|
| [CURRENT_STATUS.md](CURRENT_STATUS.md) | Status projektu |
| [CHANGELOG.md](CHANGELOG.md) | Historia zmian (najnowsza: v1.6.0) |
| [docs/SPRINTS.md](docs/SPRINTS.md) | Plan sprintów |
| [API.md](API.md) | Dokumentacja API |
| [docs/RESERVATION_FORM_WIZARD.md](docs/RESERVATION_FORM_WIZARD.md) | Wizard rezerwacji |

---

## 🔧 Komendy Docker

```bash
# Pobranie zmian
cd /home/kamil/rezerwacje
git checkout main
git pull origin main

# Restart (po pull)
docker compose restart backend frontend

# Logi
docker compose logs -f backend --tail=50
docker compose logs -f frontend --tail=50

# Migracje (gdy zmieniamy schema)
docker compose exec backend npm run prisma:migrate:deploy

# Baza danych
docker compose exec postgres psql -U rezerwacje -d rezerwacje
```
