# 🗺️ Roadmap - Moduł Rezerwacje

Plan rozwoju, znane problemy i zadania do wykonania dla modułu rezerwacji.

---

## 📋 Spis Treści

- [Status Projektu](#status-projektu)
- [Znane Problemy](#znane-problemy)
- [Planowane Funkcjonalności](#planowane-funkcjonalności)
- [Dług Techniczny](#dług-techniczny)
- [Roadmap Q1-Q2 2026](#roadmap-q1-q2-2026)

---

## 📊 Status Projektu

### Ogólna Kompletność: **95%** ✅

| Komponent | Kompletność | Status | Komentarz |
|-----------|-------------|--------|------------|
| **Backend API** | 95% | ✅ Gotowe | Wszystkie główne endpointy działają |
| **Frontend UI** | 90% | ✅ Gotowe | Wszystkie formularze i widoki działają |
| **Baza Danych** | 100% | ✅ Gotowe | Schemat kompletny i zoptymalizowany |
| **Integracja z Kolejką** | 100% | ✅ Gotowe | Automatyczne promowanie działa |
| **Zarządzanie Zaliczkami** | 95% | ✅ Gotowe | Nowe pola dodane (paidAt, paymentMethod) |
| **Generowanie PDF** | 80% | ⚠️ W trakcie | Problem z fontami na produkcji |
| **Testy E2E** | 40% | ❌ CI Cancelled | Testy napisane, CI cancelled (infrastruktura GH Actions) |
| **Dokumentacja** | 60% | 🔄 W trakcie | API i schemat BD gotowe |

---

## 🐛 Znane Problemy

### 🔴 KRYTYCZNE (P0)

#### 1. Generowanie PDF - Fonty nie działają na produkcji

**Status:** 🔄 W TRAKCIE  
**Priorytet:** 🔴 KRYTYCZNY  
**Zgłoszony:** 2026-02-09  
**Przypisany:** Kamil Gołębiowski  

**Opis problemu:**
- PDF generują się na backendzie
- Wyświetla się komunikat "sukces"
- Plik **NIE pobiera się** w przeglądarce
- Prawdopodobnie problem z fontami DejaVu

**Objawy:**
```
✅ Backend: PDF utworzony pomyślnie
✅ Frontend: "Generowanie PDF zakończone sukcesem"
❌ Przeglądarka: Brak pobierania pliku
```

**Możliwe przyczyny:**
1. Fonty DejaVu nie są zainstalowane na serwerze produkcyjnym
2. Nieprawidłowe ścieżki do fontów
3. Problem z uprawnieniami do odczytu fontów
4. Błąd w strumieniowaniu pliku do przeglądarki
5. Problem z MIME type w response headers

**Plan naprawy:**
- [x] Dodano system fallback dla fontów (Helvetica) - Commit [`f8c8322`](https://github.com/kamil-gol/Go-ciniec_2/commit/f8c8322)
- [x] Dodano szczegółowe logowanie
- [ ] Zainstalować fonty DejaVu na serwerze produkcyjnym
- [ ] Przetestować generowanie PDF po instalacji fontów
- [ ] Zweryfikować response headers (Content-Type, Content-Disposition)
- [ ] Sprawdzić network tab w devtools przeglądarki
- [ ] Jeśli problem persystuje - analiza logów backendu

**Obejście (workaround):**
- System używa fontów fallback (Helvetica)
- Brak polskich znaków diakrytycznych w fallback mode
- Zalecane: Używanie znaków ASCII

**Tracking Issue:** #TBD (do utworzenia)

---

### 🟡 ŚREDNIE (P1)

#### 2. Brak walidacji konfliktów dat przy edycji

**Status:** 📋 TODO  
**Priorytet:** 🟡 ŚREDNI  
**Zgłoszony:** 2026-02-09  

**Opis:**
- Przy tworzeniu rezerwacji system sprawdza konflikty dat
- Przy **edycji** rezerwacji i zmianie daty **nie ma** sprawdzania konfliktów
- Możliwe jest przeniesienie rezerwacji na zajęty termin

**Potencjalny wpływ:**
- Dwie rezerwacje w tej samej sali w tym samym czasie
- Konfuzja w systemie

**Plan naprawy:**
1. Dodać walidację w `reservation.service.ts` przy update
2. Sprawdzać konflikty tylko gdy `eventDate` się zmienia
3. Ignorować aktualną rezerwację przy sprawdzaniu
4. Zwracać odpowiedni błąd 409 Conflict

**Szacowany czas:** 1h

---

#### 3. Brak automatycznego powiadomienia o zbliżającym się terminie zaliczki

**Status:** 📋 TODO  
**Priorytet:** 🟡 ŚREDNI  
**Planowane:** Q1 2026  

**Opis:**
- System nie wysyła automatycznych przypomnień o zbliżającym się terminie płatności zaliczki
- Użytkownicy muszą ręcznie sprawdzać

**Proponowane rozwiązanie:**
- Cron job codziennie o 9:00
- Sprawdzanie zaliczek z `dueDate` w ciągu następnych 7, 3, 1 dni
- Wysyłanie emaili do klientów
- Dashboard alert dla pracowników

**Wymagania:**
- Email service integration
- Email templates
- Cron scheduler

**Szacowany czas:** 4h

---

### 🟢 NISKIE (P2)

#### 4. Optymalizacja wydajności zapytań dla dużych zakresów dat

**Status:** 📋 TODO  
**Priorytet:** 🟢 NISKI  
**Planowane:** Q2 2026  

**Opis:**
- Zapytania dla zakresów >6 miesięcy mogą być wolne
- Brak paginacji w niektórych widokach

**Plan:**
- Dodać indeksy composite (hall_id + event_date)
- Implementować lazy loading w kalendarzu
- Optymalizować Prisma queries (select only needed fields)

---

#### 5. Brak eksportu rezerwacji do Excel/CSV

**Status:** 📋 TODO  
**Priorytet:** 🟢 NISKI  
**Planowane:** Q2 2026  

**Opis:**
- Użytkownicy chcą eksportować rezerwacje do Excela
- Przydatne dla raportów i analizy

**Proponowane formaty:**
- Excel (.xlsx)
- CSV
- PDF z tabelą (alternatywa)

---

### 🧪 AUDIT TESTÓW (25.03.2026, PR #241)

#### 6. Integration Test Mock — Prisma 7 ESM Compatibility

**Status:** ✅ NAPRAWIONE (PR #241)
**Priorytet:** 🔴 KRYTYCZNY
**Data naprawy:** 25.03.2026

**Opis:**
- Prisma 7 generuje `import.meta.url` (ESM-only), który Jest CJS nie może sparsować
- Mock integracyjny `prisma-client-integration.ts` rozbudowany o: Decimal wrapping (19 modeli), `_count` include, JSON path filter, aggregate Decimal
- Mock unit testowy `prisma-client-jest.ts` rozbudowany o: `valueOf()`, `toJSON()`, `Symbol.toPrimitive` w klasie Decimal

**Wynik:** 342 testy integracyjne PASS, 0 failures (z 32 failures przed naprawą)

---

#### 7. Skipped testy — nieimplementowane feature'y

**Status:** ⏳ CZEKA NA IMPLEMENTACJĘ
**Priorytet:** 🟡 ŚREDNI

**42 skipniętych testów integracyjnych:**
- `service-extras.api.test.ts` (~15 testów) — Feature #118 Service Extras nie zaimplementowany
- `menu.api.test.ts` Addon Groups (~10) — Routy `/api/addon-groups` nie istnieją
- `menu.api.test.ts` Auth Matrix (~8) — Testuje addon-groups routes
- `portionTarget.api.test.ts` (9) — POST `/api/menu/templates/:id/categories` nie istnieje

**Akcja:** Odskipnąć po implementacji danego feature'a.

---

#### 8. E2E Tests — GitHub Actions Cancellation

**Status:** 🔴 DO NAPRAWY
**Priorytet:** 🟡 ŚREDNI

**Opis:**
- Wszystkie 4 joby E2E (chromium, firefox, webkit, smoke) mają status CANCELLED
- Setup przechodzi OK (checkout, install, DB push, seed, servers start)
- Step "Run tests" jest cancelowany
- Brak `concurrency` settings w `.github/workflows/e2e-tests.yml`

**Możliwe przyczyny:**
1. GitHub Actions timeout lub runner limit
2. Playwright timeout vs GitHub Actions timeout conflict
3. External cancellation (inny workflow lub manual)

**Plan naprawy:**
- [ ] Sprawdzić szczegółowe logi GitHub Actions
- [ ] Zweryfikować Playwright config timeouts vs workflow timeout
- [ ] Dodać `concurrency` group do workflow
- [ ] Przetestować z ograniczonym scope (tylko chromium + smoke)

---

## ✨ Planowane Funkcjonalności

### Q1 2026 (Luty - Marzec)

#### 1. Widok Kalendarza dla Rezerwacji
**Status:** 📋 Planowane  
**Priorytet:** 🔴 Wysoki  
**Szacowany czas:** 8h  

**Opis:**
- Graficzny kalendarz pokazujący zajętość sal
- Możliwość kliknięcia w dzień i utworzenia rezerwacji
- Kolorowe oznaczenia statusów (PENDING, CONFIRMED, etc.)
- Filtrowanie po salach

**Technologie:**
- FullCalendar.js lub podobne
- React integration
- Drag & drop do zmiany dat (opcjonalnie)

---

#### 2. System Przypomnień Email/SMS
**Status:** 📋 Planowane  
**Priorytet:** 🟡 Średni  
**Szacowany czas:** 6h  

**Funkcje:**
- Przypomnienie o zbliżającym się terminie zaliczki
- Przypomnienie o wydarzeniu (7 dni przed)
- Potwierdzenie po utworzeniu rezerwacji
- Powiadomienie o zmianie statusu

**Wymagania:**
- Email service (SendGrid, Mailgun, etc.)
- SMS gateway (opcjonalnie - Twilio)
- Email templates
- Cron scheduler

---

#### 3. Szablony Umów/Kontraktów
**Status:** 📋 Planowane  
**Priorytet:** 🟡 Średni  
**Szacowany czas:** 5h  

**Funkcje:**
- Generowanie umowy najmu sali
- Wypełnianie danych z rezerwacji
- Możliwość edycji tekstu umowy
- Export do PDF
- Podpis elektroniczny (przyszłość)

---

### Q2 2026 (Kwiecień - Czerwiec)

#### 4. Integracja z Płatnościami Online
**Status:** 💡 Pomysł  
**Priorytet:** 🟡 Średni  
**Szacowany czas:** 16h  

**Funkcje:**
- Płatność zaliczki online
- Przelewy24 / PayU / Stripe
- Automatyczna aktualizacja statusu po płatności
- Historia transakcji
- Zwroty (refunds)

**ROI:** Wysoki - zmniejszenie obciążenia pracowników

---

#### 5. Dashboard Analityczny
**Status:** 💡 Pomysł  
**Priorytet:** 🟢 Niski  
**Szacowany czas:** 12h  

**Funkcje:**
- Wykresy przychodu w czasie
- Najpopularniejsze typy wydarzeń
- Średnia liczba gości
- Wskaźnik wypełnienia sal
- Trendy sezonowe
- KPI metrics

**Technologie:**
- Chart.js / Recharts
- Agregowane zapytania SQL
- Cache dla wydajności

---

#### 6. Aplikacja Mobilna (PWA)
**Status:** 💡 Pomysł  
**Priorytet:** 🟢 Niski  
**Szacowany czas:** 40h  

**Funkcje:**
- Podstawowa responsywność już jest
- Pełna PWA z offline support
- Push notifications
- Instalacja na telefonie
- Szybki dostęp dla pracowników w terenie

---

## 🛠️ Dług Techniczny

### 1. Refactoring Komponentów Formularzy
**Priorytet:** 🟡 Średni  
**Szacowany czas:** 4h  

**Problem:**
- Dużo duplikacji kodu między `CreateReservationForm` i `EditReservationModal`
- Te same pola, podobna logika

**Rozwiązanie:**
- Wydzielić wspólny komponent `ReservationFormFields`
- Użyć React Hook Form dla lepszej walidacji
- Zredukować kod o ~30%

---

### 2. Migracja z `any` na Proper Types
**Priorytet:** 🟡 Średni  
**Szacowany czas:** 3h  

**Problem:**
- Niektóre miejsca używają `any` zamiast proper TypeScript types
- Zmniejsza to type safety

**Lokalizacje:**
- Event handlers w modals
- Niektóre API response types
- Props w komponentach

**Rozwiązanie:**
- Zdefiniować wszystkie typy w `types/reservation.types.ts`
- Zastąpić `any` na proper types
- Włączyć `strict: true` w tsconfig.json

---

### 3. Unit Testy dla Services
**Priorytet:** 🟡 Średni  
**Szacowany czas:** 8h  

**Obecny stan:**
- Brak unit testów dla `reservation.service.ts`
- Brak testów dla `deposit.service.ts`
- E2E testy pokrywają tylko happy paths

**Plan:**
- Unit testy dla wszystkich metod service
- Mock Prisma client
- Test edge cases i error handling
- Target: 80% code coverage

---

### 4. Optymalizacja Bundle Size
**Priorytet:** 🟢 Niski  
**Szacowany czas:** 2h  

**Problem:**
- Bundle size frontend może być mniejszy
- Niektóre biblioteki są duże (moment.js, lodash)

**Rozwiązanie:**
- Zamienić moment.js na day.js (mniejszy)
- Używać lodash/es z tree-shaking
- Code splitting dla dużych komponentów
- Lazy loading dla modals

---

### 5. API Documentation (OpenAPI/Swagger)
**Priorytet:** 🟢 Niski  
**Szacowany czas:** 4h  

**Problem:**
- Dokumentacja API jest w Markdown (statyczna)
- Brak interactive API explorer

**Rozwiązanie:**
- Dodać Swagger/OpenAPI spec
- Generować z TypeScript types
- Interactive docs na `/api/docs`
- Auto-generate API client

---

## 📅 Roadmap Q1-Q2 2026

### Luty 2026 ✅ BIEŻĄCY MIESIĄC

- [x] Integracja z systemem kolejki
- [x] Rozszerzone zarządzanie zaliczkami (paidAt, paymentMethod)
- [x] Wsparcie dla 3 grup wiekowych (adults, children, toddlers)
- [x] Struktura dokumentacji
- [x] CHANGELOG
- [x] API Documentation
- [x] Database Schema Documentation
- [x] Roadmap & Known Issues
- [ ] **Naprawa generowania PDF** 🔴 PRIORYTET
- [ ] User Guide
- [ ] Workflows Documentation

---

### Marzec 2026 🎯 NASTĘPNY

**Fokus:** UX Improvements & Testing

- [ ] Widok kalendarza dla rezerwacji 🔴
- [ ] Walidacja konfliktów dat przy edycji 🟡
- [ ] System przypomnień email 🟡
- [ ] Unit testy dla services 🟡
- [ ] Refactoring form components 🟡
- [ ] E2E testy - pełne pokrycie

**Cel:** 100% funkcjonalności core + stabilność

---

### Kwiecień 2026

**Fokus:** Advanced Features

- [ ] Szablony umów/kontraktów 🟡
- [ ] Eksport do Excel/CSV 🟢
- [ ] Optymalizacja wydajności zapytań 🟢
- [ ] Integracja z płatnościami online (start) 🟡

**Cel:** Automatyzacja procesów

---

### Maj 2026

**Fokus:** Payments & Analytics

- [ ] Integracja z płatnościami online (dokończenie) 🟡
- [ ] Dashboard analityczny 🟢
- [ ] Raporty dla managementu
- [ ] Migracja z `any` na proper types 🟡

**Cel:** Business intelligence

---

### Czerwiec 2026

**Fokus:** Polish & Optimization

- [ ] Optymalizacja bundle size 🟢
- [ ] OpenAPI/Swagger documentation 🟢
- [ ] Performance audit
- [ ] Security audit
- [ ] PWA (start)

**Cel:** Production-ready excellence

---

## 📊 Metryki Sukcesu

### KPIs dla Q1 2026

| Metryka | Obecny | Target | Status |
|---------|--------|--------|--------|
| **Kompletność modułu** | 95% | 100% | 🟡 |
| **Code coverage (testy)** | 40% | 80% | 🔴 |
| **Dokumentacja** | 60% | 90% | 🟡 |
| **Bug count (P0)** | 1 | 0 | 🔴 |
| **User satisfaction** | N/A | 4.5/5 | 📊 |
| **API response time** | <200ms | <150ms | 🟢 |

---

## 🤝 Jak Wnieść Wkład

### Zgłaszanie Problemów

1. Sprawdź czy problem nie jest już zgłoszony
2. Utwórz Issue na GitHub
3. Użyj template: Bug Report / Feature Request
4. Dodaj odpowiednie etykiety (bug, enhancement, documentation)

### Propozycje Nowych Funkcji

1. Otwórz Discussion na GitHub
2. Opisz przypadek użycia
3. Zaproponuj rozwiązanie
4. Czekaj na feedback zespołu

---

## 🔗 Powiązane Dokumenty

- [📋 CHANGELOG_RESERVATIONS.md](../../CHANGELOG_RESERVATIONS.md) - Historia zmian
- [🔌 RESERVATIONS_API.md](../api/RESERVATIONS_API.md) - Dokumentacja API
- [🗄️ RESERVATIONS_SCHEMA.md](../database/RESERVATIONS_SCHEMA.md) - Schemat bazy danych
- [📚 README.md](../../README.md) - Główny dokument projektu

---

## 📞 Kontakt

**Product Owner:** Kamil Gołębiowski  
**Email:** dev@gosciniecrodzinny.pl  
**GitHub:** [@kamil-gol](https://github.com/kamil-gol)  

---

## 📝 Historia Zmian Roadmap

| Data | Wersja | Zmiany |
|------|--------|--------|
| 09.02.2026 | 1.0 | Utworzenie roadmap, dodanie znanego problemu z PDF |

---

**Ostatnia aktualizacja:** 09.02.2026 - 17:09 CET  
**Wersja dokumentu:** 1.0  
**Status projektu:** 🟡 95% - W trakcie finalizacji  
**Następny milestone:** Naprawa PDF + Widok Kalendarza
