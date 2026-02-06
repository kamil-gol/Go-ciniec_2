# 📋 Plan Sprintów - System Rezerwacji Sal

**Status**: 🔧 W budowie
**Okres**: 10 tygodni (5 sprintów x 2 tygodnie)
**Start**: 06.02.2026
**Koniec**: 17.04.2026

---

## 📊 Mapa Sprintów

```
SPRINT 1 (Tydzień 1-2)   → Fundacja
SPRINT 2 (Tydzień 3-4)   → Moduł Rezerwacji
SPRINT 3 (Tydzień 5-6)   → Uzupełnianie Funkcjonalności
SPRINT 4 (Tydzień 7-8)   → Panel Admina & Zaawansowane
SPRINT 5 (Tydzień 9-10)  → Polish, Testing & Deployment
```

---

# 🏗️ SPRINT 1: Fundacja (06.02 - 19.02.2026)

## Cel
Ustanowienie fundacji technicznej, setup projektów, autentykacja i CI/CD.

## User Stories

### US-1.1: Setup Backend Project
**Priority**: 🔴 CRITICAL
**Points**: 8

**Akcept. Kryteria**:
- ✅ Node.js + Express + TypeScript skonfigurowany
- ✅ Struktura folderów (controllers, services, models, utils)
- ✅ ESLint + Prettier
- ✅ Development & production builds
- ✅ Dockerfile gotowy

**Subtasks**:
- [ ] Inicjalizacja Node.js projektu
- [ ] Setup Express + TypeScript
- [ ] Konfiguracja ESLint i Prettier
- [ ] Utworzenie Dockerfile
- [ ] Konfiguracja npm skrypty

---

### US-1.2: Setup Frontend Project
**Priority**: 🔴 CRITICAL
**Points**: 8

**Akcept. Kryteria**:
- ✅ Next.js 14 + React 18
- ✅ TypeScript + Tailwind CSS
- ✅ Folder structure (app, components, pages, hooks)
- ✅ Vitest skonfigurowany
- ✅ Dockerfile gotowy

**Subtasks**:
- [ ] Inicjalizacja Next.js projektu
- [ ] Setup Tailwind CSS
- [ ] Konfiguracja TypeScript
- [ ] Setup Vitest
- [ ] Konfiguracja Dockerfile

---

### US-1.3: Database Schema & Prisma Setup
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ Prisma ORM skonfigurowany
- ✅ Schemat bazy dla użytkowników, sal, rezerwacji, klientów
- ✅ Migracje
- ✅ Seed script

**Tabele**:
- `users` (id, email, password, role, firstName, lastName, createdAt, updatedAt)
- `halls` (id, name, capacity, pricePerPerson, description)
- `eventTypes` (id, name)
- `reservations` (id, hallId, clientId, eventTypeId, date, startTime, endTime, guests, totalPrice, status, notes, createdBy)
- `clients` (id, firstName, lastName, email, phone, address, createdAt, updatedAt)
- `reservationHistory` (id, reservationId, changedBy, changeType, oldValue, newValue, reason, createdAt)
- `deposits` (id, reservationId, amount, dueDate, paid, paidDate)

**Subtasks**:
- [ ] Inicjalizacja Prisma
- [ ] Zdefiniowanie modeli
- [ ] Utworzenie migracji
- [ ] Seed script z danymi testowymi

---

### US-1.4: Authentication & JWT
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ Login endpoint (email + password)
- ✅ Register endpoint (z walidacją hasła 12 znaków)
- ✅ JWT token generation
- ✅ Auth middleware
- ✅ Role-based access control (Admin, Employee, Client)
- ✅ Refresh token mechanism

**Hasło Requirements**:
- Min 12 znaków
- Conajmniej 1 DUŻA litera
- Conajmniej 1 mała litera
- Conajmniej 1 cyfra
- Conajmniej 1 znak specjalny (!@#$%^&*)

**Subtasks**:
- [ ] Login/Register endpoints
- [ ] Password hashing (bcrypt)
- [ ] JWT token generation
- [ ] Auth middleware
- [ ] Role validation middleware
- [ ] Unit testy

---

### US-1.5: Error Handling & Logging
**Priority**: 🟡 HIGH
**Points**: 8

**Akcept. Kryteria**:
- ✅ Globalna error handling middleware
- ✅ Custom error classes
- ✅ Logging system (info, warn, error)
- ✅ Request/Response logging

**Subtasks**:
- [ ] Error middleware
- [ ] Logger setup (pino lub winston)
- [ ] Error tracking integration

---

### US-1.6: CI/CD Pipeline (GitHub Actions)
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ GitHub Actions workflow
- ✅ Automatyczne testy na push
- ✅ Linting checks
- ✅ Coverage report
- ✅ Deploy to staging na merge do main

**Workflows**:
- `test.yml` - Uruchamia testy
- `lint.yml` - ESLint + Prettier checks
- `deploy.yml` - Deploy to staging

**Subtasks**:
- [ ] Setup test workflow
- [ ] Setup lint workflow
- [ ] Setup deploy workflow

---

### US-1.7: API Documentation
**Priority**: 🟡 HIGH
**Points**: 5

**Akcept. Kryteria**:
- ✅ Swagger/OpenAPI dokumentacja
- ✅ Endpointy udokumentowane

**Subtasks**:
- [ ] Setup Swagger
- [ ] Dokumentacja auth endpoints

---

## 📊 Summary Sprint 1
- **Total Points**: 68
- **Deliverables**: Pełna infrastruktura, baza danych, autentykacja
- **Testing**: 80% coverage dla auth

---

# 📝 SPRINT 2: Moduł Rezerwacji (20.02 - 05.03.2026)

## Cel
Implementacja pełnego lifecycle rezerwacji.

## User Stories

### US-2.1: Create Reservation - Backend
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ POST /api/reservations
- ✅ Walidacja daty (nie przeszłość)
- ✅ Walidacja liczby osób (max pojemność sali)
- ✅ Kalkulator ceny (za osobę / całość)
- ✅ Naliczanie godzin dodatkowych (domyślnie 6h)
- ✅ Walidacja zaliczki (max dzień przed)
- ✅ Historia zmian

**Validations**:
```
- Fecha nie może być w przeszłości
- Liczba gości <= pojemność sali
- Czas rezerwacji >= 1 godzina
- Jeśli > 6h: dopisz do uwag ile godzin płatnych
- Zaliczka: 0 - 100% ceny
- Jeśli zaliczka zaznaczona: dueDate <= dzień przed rezerwacją
```

**Subtasks**:
- [ ] Endpoint POST /api/reservations
- [ ] Walidacje
- [ ] Kalkulator ceny
- [ ] Historia zmian
- [ ] Unit testy
- [ ] Integration testy

---

### US-2.2: Get Reservations List - Backend
**Priority**: 🔴 CRITICAL
**Points**: 8

**Akcept. Kryteria**:
- ✅ GET /api/reservations (z paginacją)
- ✅ Filtry: status, sala, data, klient
- ✅ Sortowanie: data, status, cena
- ✅ Default page size: 20

**Subtasks**:
- [ ] Endpoint GET /api/reservations
- [ ] Paginacja
- [ ] Filtry
- [ ] Sortowanie
- [ ] Testy

---

### US-2.3: Update Reservation - Backend
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ PATCH /api/reservations/:id
- ✅ Obowiązkowe pole "reason" dla edycji
- ✅ Walidacje jak w Create
- ✅ Historia zmian

**Subtasks**:
- [ ] Endpoint PATCH /api/reservations/:id
- [ ] Reason validation
- [ ] Historia zmian
- [ ] Testy

---

### US-2.4: Cancel Reservation - Backend
**Priority**: 🔴 CRITICAL
**Points**: 8

**Akcept. Kryteria**:
- ✅ DELETE /api/reservations/:id
- ✅ Obowiązkowe pole "reason"
- ✅ Zmiana statusu na CANCELLED
- ✅ Historia zmian

**Subtasks**:
- [ ] Endpoint DELETE /api/reservations/:id
- [ ] Status update
- [ ] Historia zmian
- [ ] Testy

---

### US-2.5: Archive Reservation
**Priority**: 🟡 HIGH
**Points**: 5

**Akcept. Kryteria**:
- ✅ Pole `archivedAt` w rezerwacji
- ✅ GET /api/reservations?status=archived
- ✅ Archiwizacja automatyczna po 30 dniach

**Subtasks**:
- [ ] Dodaj `archivedAt` pole
- [ ] Endpoint archiwizacji
- [ ] Cron job do auto-archiwizacji

---

### US-2.6: Reservation UI - Create
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ Piękny formularz do tworzenia rezerwacji
- ✅ Calendar picker na datę (dd.mm.yyyy)
- ✅ Time picker
- ✅ Select sala z wyświetleniem pojemności
- ✅ Select typ wydarzenia
- ✅ Input liczby osób (z validacją max pojemności)
- ✅ Realtime price calculator
- ✅ Input notek
- ✅ Checkbox zaliczka + input kwota + date picker due date
- ✅ Attachment upload
- ✅ Submit + Cancel buttony
- ✅ Validacje na froncie
- ✅ Loading states
- ✅ Success/Error messages
- ✅ Framer Motion animacje

**Subtasks**:
- [ ] Layout i komponenty
- [ ] Date/Time pickers
- [ ] Price calculator
- [ ] Form validation
- [ ] File upload
- [ ] API integration
- [ ] Loading states
- [ ] Animacje

---

### US-2.7: Reservation UI - List & View
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ Tabela rezerwacji z paginacją
- ✅ Kolumny: Data, Sala, Klient, # gości, Cena, Status
- ✅ Filtry (sala, status, data)
- ✅ Sortowanie
- ✅ Modal do widoku szczegółów rezerwacji
- ✅ Przyciski: Edit, Delete, Archive, PDF
- ✅ Status badge z kolorami
- ✅ Historia zmian (timeline)

**Subtasks**:
- [ ] Table component
- [ ] Paginacja UI
- [ ] Filtry UI
- [ ] Detail modal
- [ ] Historia zmian timeline
- [ ] Ikony i styling

---

### US-2.8: Reservation UI - Edit
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ Pre-filled form z danymi rezerwacji
- ✅ Obowiązkowe pole "Powód zmian"
- ✅ Wskaźnik jakie pola się zmienią
- ✅ Walidacje
- ✅ Realtime price update
- ✅ Historia zmian w real time

**Subtasks**:
- [ ] Edit modal/page
- [ ] Form pre-population
- [ ] Reason field
- [ ] Changed fields indicator
- [ ] Real time updates

---

### US-2.9: Reservation UI - Calendar View
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ Widok kalendarza na 30 dni
- ✅ Każda sala to kolumna
- ✅ Rezerwacje wyświetlone jako bloki na osi czasu
- ✅ Kolor wg statusu
- ✅ Hover: szczegóły rezerwacji
- ✅ Click: otwórz modal

**Subtasks**:
- [ ] Calendar layout
- [ ] Reservation blocks
- [ ] Responsiveness
- [ ] Hover/Click interactions

---

## 📊 Summary Sprint 2
- **Total Points**: 115
- **Deliverables**: Pełny CRUD rezerwacji, UI, kalkulacje ceny
- **Testing**: 80% coverage

---

# 🔧 SPRINT 3: Uzupełnianie Funkcjonalności (06.03 - 19.03.2026)

## Cel
Zarządzanie klientami, generowanie PDF, maile, historia zmian.

## User Stories

### US-3.1: Client Management - Backend
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ CRUD clients endpoints
- ✅ Historia rezerwacji klienta
- ✅ Notatki o kliencie

**Subtasks**:
- [ ] CRUD endpoints
- [ ] Validation
- [ ] Testy

---

### US-3.2: Client Management UI
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ Lista klientów
- ✅ Formularz tworzenia/edycji klienta
- ✅ Historia rezerwacji (tab w detailach)
- ✅ Notatki (tab)

**Subtasks**:
- [ ] Klienci list page
- [ ] Client details modal
- [ ] Create/Edit form
- [ ] Rezerwacje tab
- [ ] Notatki tab

---

### US-3.3: PDF Generation
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ Generowanie PDF rezerwacji
- ✅ Dane restauracji (logo, adres, telefon)
- ✅ Dane klienta
- ✅ Szczegóły rezerwacji
- ✅ Cena (itemized)
- ✅ Zaliczka (jeśli istnieje)
- ✅ Brak danych osobowych wrażliwych
- ✅ Profesjonalny layout

**PDF Content**:
```
Header: Logo + Nazwa restauracji
Dane restauracji
---
Tytuł: REZERWACJA SALI
Data wygenerowania
---
Dane klienta
---
Szczegóły rezerwacji:
- Sala
- Data & Czas
- Liczba osób
- Typ wydarzenia
- Notatki
---
Kalkulacja:
- Liczba osób x cena za osobę = ...
- Godziny dodatkowe: ... x cena = ...
Razem: ...
---
Zaliczka (jeśli):
- Kwota zaliczki
- Termin płatności
```

**Subtasks**:
- [ ] PDF template
- [ ] PDF generation service
- [ ] Download endpoint
- [ ] Styling

---

### US-3.4: Email Sending
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ Email notification przy nowej rezerwacji
- ✅ Email przy edycji rezerwacji
- ✅ Email przy anulowaniu
- ✅ PDF w attachmencie
- ✅ Szablony emaili
- ✅ Queue system (Bull/Bullmq)

**Email Templates**:
1. **Nowa rezerwacja**
   - Do: klient + admin
   - Temat: Potwierdzenie rezerwacji sali
   - Treść: Szczegóły + link do podglądu
   - Załącznik: PDF rezerwacji

2. **Edycja rezerwacji**
   - Do: klient + admin
   - Temat: Zmiana rezerwacji sali
   - Treść: Co się zmieniło + powód
   - Załącznik: Nowy PDF

3. **Anulowanie**
   - Do: klient + admin
   - Temat: Rezerwacja anulowana
   - Treść: Powód anulowania

4. **Przypomnienie (24h przed)**
   - Do: klient + admin
   - Temat: Przypomnienie o rezerwacji jutro
   - Treść: Szczegóły

5. **Przypomnienie zaliczki (3 dni przed)**
   - Do: klient
   - Temat: Przypomnienie o zaliczce
   - Treść: Kwota + termin

**Subtasks**:
- [ ] Email service setup (Nodemailer)
- [ ] Email templates
- [ ] Queue setup (Bull)
- [ ] Cron jobs dla przypomnień
- [ ] Testy

---

### US-3.5: Reservation History
**Priority**: 🟡 HIGH
**Points**: 8

**Akcept. Kryteria**:
- ✅ Historia wszystkich zmian rezerwacji
- ✅ Timeline view
- ✅ Zmiana pola + stara wartość + nowa wartość
- ✅ Kto zmienił + kiedy
- ✅ Powód zmiany

**Subtasks**:
- [ ] Historia timeline UI
- [ ] Formatowanie zmian

---

### US-3.6: Data Export
**Priority**: 🟡 HIGH
**Points**: 8

**Akcept. Kryteria**:
- ✅ Export rezerwacji do CSV
- ✅ Export rezerwacji do Excel
- ✅ Filtry: data range, sala

**Subtasks**:
- [ ] CSV export
- [ ] Excel export
- [ ] Filters

---

## 📊 Summary Sprint 3
- **Total Points**: 84
- **Deliverables**: Klienci, PDF, Maile, Historia
- **Testing**: 80% coverage

---

# 🎛️ SPRINT 4: Panel Admina & Zaawansowane (20.03 - 02.04.2026)

## Cel
Panel administratora, statystyki, backupy, zaawansowane funkcjonalności.

## User Stories

### US-4.1: Admin Panel - Fundamentals
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ Dashboard admina
- ✅ Zarządzanie użytkownikami (CRUD)
- ✅ Role management
- ✅ User activation/deactivation
- ✅ Zmienianie hasła użytkownika

**Subtasks**:
- [ ] Admin layout
- [ ] Users management page
- [ ] User form (create/edit)
- [ ] Role selector
- [ ] Bulk actions

---

### US-4.2: Admin Panel - Configuration
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ Zarządzanie salami (CRUD)
- ✅ Edycja pojemności
- ✅ Edycja ceny za osobę
- ✅ Edycja typów eventów
- ✅ Aktywacja/deaktywacja sal

**Subtasks**:
- [ ] Halls management
- [ ] Hall form
- [ ] Event types management
- [ ] Status toggles

---

### US-4.3: Admin Panel - Settings
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ Ustawienia systemu
- ✅ Dane restauracji
- ✅ Ustawienia emaili
- ✅ Domyślny czas rezerwacji
- ✅ Currency i format daty

**Subtasks**:
- [ ] Settings page
- [ ] Settings form
- [ ] Validation
- [ ] Save settings

---

### US-4.4: Analytics & Reports
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ Dashboard ze statystykami
- ✅ Przychody miesięczne (chart)
- ✅ Popularność sal (chart)
- ✅ Typy eventów (chart)
- ✅ Liczba rezerwacji (trend)
- ✅ Średnia cena rezerwacji
- ✅ Raport do pobrania (PDF/CSV)

**Charts**:
- Revenue by month (line chart)
- Reservations by hall (bar chart)
- Event types distribution (pie chart)
- Occupancy rate (gauge)

**Subtasks**:
- [ ] Analytics endpoints
- [ ] Dashboard page
- [ ] Charts (Recharts lub Chart.js)
- [ ] Data aggregation
- [ ] Report generation

---

### US-4.5: Activity Logs
**Priority**: 🟡 HIGH
**Points**: 8

**Akcept. Kryteria**:
- ✅ Logi wszystkich akcji
- ✅ Kto co zrobił i kiedy
- ✅ Typ akcji (create, update, delete)
- ✅ Tabela z filtrami

**Subtasks**:
- [ ] Activity logging middleware
- [ ] Activity logs table
- [ ] Filters

---

### US-4.6: Backup System
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ Automtyczne codzienne backupy (2 AM)
- ✅ Przechowywanie backupów (30 dni)
- ✅ Manual backup trigger
- ✅ Restore z backupów
- ✅ Lista backupów z możliwością pobierania

**Subtasks**:
- [ ] Backup script (pg_dump)
- [ ] Cron job
- [ ] Backup storage
- [ ] Restore script
- [ ] UI do zarządzania backupów

---

### US-4.7: Email Reminders
**Priority**: 🟡 HIGH
**Points**: 8

**Akcept. Kryteria**:
- ✅ Automatyczne przypomnienia 24h przed rezerwacją
- ✅ Automatyczne przypomnienia o zaliczce 3 dni przed
- ✅ Konfigurowalny czas przypomnień
- ✅ Toggle do włączania/wyłączania

**Subtasks**:
- [ ] Cron jobs setup
- [ ] Reminder logic
- [ ] Email sending
- [ ] Settings toggle

---

### US-4.8: Advanced Filters & Search
**Priority**: 🟡 HIGH
**Points**: 8

**Akcept. Kryteria**:
- ✅ Zaawansowane filtry na liście rezerwacji
- ✅ Date range picker
- ✅ Multi-select sala
- ✅ Multi-select status
- ✅ Search po nazwie klienta
- ✅ Save filters

**Subtasks**:
- [ ] Filter UI
- [ ] Filter logic
- [ ] Saved filters

---

## 📊 Summary Sprint 4
- **Total Points**: 105
- **Deliverables**: Panel admina, statystyki, backupy
- **Testing**: 80% coverage

---

# ✅ SPRINT 5: Polish, Testing & Deployment (03.04 - 17.04.2026)

## Cel
Testy, optymizacja, dokumentacja, deployment do produkcji.

## User Stories

### US-5.1: Unit Tests - Backend
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ 80%+ code coverage
- ✅ Testy wszystkich serwisów
- ✅ Testy kontrolerów
- ✅ Testy walidacji
- ✅ Testy kalkulacji ceny
- ✅ Testy auth

**Subtasks**:
- [ ] Services tests
- [ ] Controllers tests
- [ ] Utils tests
- [ ] Auth tests
- [ ] Email service tests
- [ ] Coverage report

---

### US-5.2: Unit Tests - Frontend
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ 75%+ code coverage
- ✅ Testy komponentów
- ✅ Testy form
- ✅ Testy hooków
- ✅ Testy utils
- ✅ Snapshot tests

**Subtasks**:
- [ ] Components tests
- [ ] Forms tests
- [ ] Hooks tests
- [ ] Utils tests
- [ ] Snapshot tests
- [ ] Coverage report

---

### US-5.3: Integration Tests
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ Testy API endpoints
- ✅ Testy bazy danych
- ✅ Testy transakcji
- ✅ Testy z testową bazą

**Subtasks**:
- [ ] Database tests
- [ ] API endpoint tests
- [ ] Transaction tests
- [ ] Setup test database

---

### US-5.4: E2E Tests
**Priority**: 🔴 CRITICAL
**Points**: 34

**Akcept. Kryteria**:
- ✅ E2E test: Login flow
- ✅ E2E test: Create reservation
- ✅ E2E test: Edit reservation
- ✅ E2E test: Cancel reservation
- ✅ E2E test: Generate PDF
- ✅ E2E test: Client management
- ✅ E2E test: Admin panel
- ✅ E2E test: Analytics
- ✅ E2E test: Email sending
- ✅ E2E test: Validations

**Subtasks**:
- [ ] Login E2E test
- [ ] Reservation flow E2E tests
- [ ] Client management E2E tests
- [ ] Admin panel E2E tests
- [ ] Download PDF E2E test
- [ ] Form validations E2E tests

---

### US-5.5: Performance Optimization
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ Frontend: Lighthouse score > 90
- ✅ Database query optimization
- ✅ Image optimization
- ✅ Code splitting (Next.js)
- ✅ Caching strategy
- ✅ Lazy loading

**Subtasks**:
- [ ] Lighthouse audit
- [ ] Query optimization
- [ ] Code splitting
- [ ] Image optimization
- [ ] Caching setup

---

### US-5.6: Security Audit
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ OWASP top 10 review
- ✅ XSS protection
- ✅ CSRF protection
- ✅ SQL injection protection
- ✅ Rate limiting
- ✅ Security headers

**Subtasks**:
- [ ] Security audit
- [ ] CORS setup
- [ ] Rate limiting
- [ ] Security headers (helmet.js)
- [ ] Input sanitization

---

### US-5.7: Documentation
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ API documentation (Swagger)
- ✅ Deployment guide
- ✅ Architecture guide
- ✅ Development guide
- ✅ Database schema docs
- ✅ Troubleshooting guide

**Subtasks**:
- [ ] API docs
- [ ] Deployment guide
- [ ] Architecture docs
- [ ] Dev setup guide
- [ ] Database schema docs

---

### US-5.8: UI/UX Polish
**Priority**: 🟡 HIGH
**Points**: 13

**Akcept. Kryteria**:
- ✅ Framer Motion animacje
- ✅ Loading states
- ✅ Error handling UX
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Keyboard navigation

**Subtasks**:
- [ ] Animations polish
- [ ] Loading states
- [ ] Error messages
- [ ] Accessibility audit
- [ ] Mobile responsive
- [ ] Dark mode

---

### US-5.9: Deployment & DevOps
**Priority**: 🔴 CRITICAL
**Points**: 21

**Akcept. Kryteria**:
- ✅ Docker images optymalizowane
- ✅ Docker compose production ready
- ✅ Environment setup
- ✅ Database migrations automated
- ✅ SSL/HTTPS setup
- ✅ Domain configuration
- ✅ CDN setup
- ✅ Monitoring (optional)

**Subtasks**:
- [ ] Docker optimization
- [ ] Environment setup
- [ ] Database migration automation
- [ ] SSL certificates
- [ ] Domain DNS config
- [ ] CDN setup
- [ ] Nginx reverse proxy

---

### US-5.10: Final QA & Release
**Priority**: 🔴 CRITICAL
**Points**: 13

**Akcept. Kryteria**:
- ✅ Smoke tests
- ✅ Regression tests
- ✅ User acceptance testing
- ✅ Release notes
- ✅ Go-live checklist

**Subtasks**:
- [ ] QA testing
- [ ] Regression tests
- [ ] Release notes
- [ ] Go-live checklist
- [ ] Support documentation

---

## 📊 Summary Sprint 5
- **Total Points**: 183
- **Deliverables**: Pełne testowanie, dokumentacja, deployment
- **Testing**: 80% backend, 75% frontend
- **Final Status**: 🚀 PRODUCTION READY

---

# 📊 Podsumowanie Wszystkich Sprintów

| Sprint | Temat | Points | Tygodnie | Status |
|--------|-------|--------|----------|--------|
| 1 | Fundacja | 68 | 1-2 | 🔳 TODO |
| 2 | Rezerwacje | 115 | 3-4 | 🔳 TODO |
| 3 | Funkcjonalności | 84 | 5-6 | 🔳 TODO |
| 4 | Admin & Analytics | 105 | 7-8 | 🔳 TODO |
| 5 | Polish & Deploy | 183 | 9-10 | 🔳 TODO |
| **RAZEM** | | **555** | **10** | |

---

# 🎯 Key Metrics

- **Total Story Points**: 555
- **Estimated Duration**: 10 weeks (5 sprints)
- **Team Size**: 1 Full-stack developer (can be scaled)
- **Code Coverage**: 80% backend, 75% frontend
- **Testing**: Unit + Integration + E2E
- **Documentation**: Full API, deployment, architecture

---

**Last Updated**: 06.02.2026
**Project Status**: 🔧 In Planning Phase