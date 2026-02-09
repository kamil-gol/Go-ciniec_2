# 🎉 System Rezerwacji Sal - Gościniec Rodzinny

**Profesjonalny system zarządzania rezerwacjami sal dla restauracji Gościniec Rodzinny**

📍 ul. Bukowa 155, 41-600 Świętochłowice | 🌐 [gosciniecrodzinny.pl](https://gosciniecrodzinny.pl)

---

## 📋 Przegląd Projektu

Kompleksowy system do zarządzania rezerwacjami sal weselnych i okolicznościowych z pełną integracją administracyjną, statystykami, automatyzacją procesów biznesowych oraz inteligentnym systemem kolejki rezerwacji.

### ✨ Kluczowe Cechy

✅ **Moduł Rezerwacji** - pełny lifecycle rezerwacji (nowa, edycja, archiwum)  
✅ **Kolejka Rezerwacji** - zarządzanie listą oczekujących, priorytetyzacja, awansowanie  
✅ **Zarządzanie Klientami** - baza klientów z historią rezerwacji  
✅ **Panel Administratora** - pełna kontrola systemu  
✅ **Statystyki & Raporty** - analityka rezerwacji i przychodów  
✅ **Automatyczne Backupy** - bezpieczeństwo danych  
✅ **Generowanie PDF** - faktury i potwierdzenia rezerwacji  
✅ **Wysyłka Maili** - powiadomienia i przypomnienia  
✅ **Historia Zmian** - pełna audyt trail każdej rezerwacji  
✅ **Walidacje** - kompleksowe sprawdzenia danych  
✅ **Testy Jednostkowe & E2E** - 80%+ coverage  
✅ **Auto-anulowanie** - automatyczna anulacja przeterminowanych wpisów w kolejce  
✅ **Race Condition Protection** - row-level locking + retry logic  
✅ **✨ Batch Update API** - atomiczne aktualizacje kolejki (drag & drop) **— Bug #9 Fix!**

---

## 🏍️ Stack Technologiczny

### Frontend
- **Next.js 14** - React framework z SSR
- **React 18** - UI library
- **TypeScript** - type safety
- **Tailwind CSS + Framer Motion** - styling i animacje
- **React Query** - data fetching & caching
- **Radix UI** - accessible components
- **@dnd-kit** - drag & drop z accessibility
- **Vitest** - unit tests
- **Playwright** - E2E tests

### Backend
- **Node.js 18+** - runtime
- **Express.js** - HTTP framework
- **TypeScript** - type safety
- **PostgreSQL 15** - database
- **Prisma ORM** - database access
- **JWT** - authentication
- **Nodemailer** - email sending
- **pdfkit** - PDF generation
- **node-cron** - scheduled tasks
- **Jest** - unit tests
- **Supertest** - API tests

### DevOps
- **Docker** - containerization
- **Docker Compose** - orchestration
- **Redis** - caching & sessions
- **GitHub Actions** - CI/CD

---

## 🚀 Quick Start

### Wymagania
- Docker & Docker Compose
- Node.js 18+ (opcjonalnie dla lokalnego developmentu)
- Git

### Instalacja

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/kamil-gol/Go-ciniec_2.git
cd Go-ciniec_2

# 2. Konfiguracja zmiennych środowiskowych
cp .env.example .env.local

# 3. Uruchomienie z Docker Compose
docker-compose up -d

# 4. Aplikacja będzie dostępna na:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: localhost:5432
```

### Pierwsze Kroki

```bash
# Migracja bazy danych
docker-compose exec backend npm run prisma:migrate:dev

# Seeding testowymi danymi
docker-compose exec backend npm run seed

# Uruchomienie testów
docker-compose exec backend npm run test
docker-compose exec frontend npm run test

# E2E testy
docker-compose exec frontend npm run test:e2e
```

---

## 📂 Struktura Projektu

```
rezerwacje/
├── apps/
│   ├── backend/              # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/  # Logika endpointów
│   │   │   ├── services/     # Logika biznesowa
│   │   │   ├── routes/       # Definicje API endpoints
│   │   │   ├── middlewares/  # Auth, validation, error handling
│   │   │   ├── utils/        # Funkcje pomocnicze
│   │   │   ├── email/        # Template emaili
│   │   │   └── tests/        # Unit & integration testy
│   │   ├── prisma/           # Database schema & migrations
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/             # Next.js + React UI
│       ├── app/              # Next.js App Router
│       │   ├── (auth)/       # Strony autentykacji
│       │   ├── dashboard/    # Panel główny
│       │   ├── reservations/ # Moduł rezerwacji
│       │   ├── queue/        # Moduł kolejki
│       │   └── clients/      # Zarządzanie klientami
│       ├── components/       # React komponenty
│       │   ├── ui/           # Komponenty UI (buttons, forms, etc.)
│       │   ├── reservations/ # Komponenty rezerwacji
│       │   └── queue/        # Komponenty kolejki (drag & drop)
│       ├── lib/              # Utilities & API clients
│       ├── hooks/            # Custom hooks
│       ├── __tests__/        # Unit testy
│       ├── e2e/              # E2E testy Playwright
│       ├── Dockerfile
│       └── package.json
│
├── docs/                     # Dokumentacja
│   ├── README.md            # Indeks dokumentacji
│   ├── QUEUE.md             # Dokumentacja modułu kolejki
│   ├── DATABASE.md          # Schema bazy
│   ├── SPRINTS.md           # Plan sprintów & postęp
│   ├── ARCHITECTURE.md      # Architektura
│   ├── DEPLOYMENT.md        # Wdrażanie
│   ├── DARK_MODE_GUIDELINES.md  # 🌙 Wytyczne dark mode ✨ NOWE!
│   ├── BUGFIX_SESSION_2026-02-07.md  # Sesja naprawcza Bug #1-8
│   └── BUGFIX_SESSION_2026-02-09.md  # Sesja naprawcza Bug #9 ✨ NOWE!
│
├── scripts/                  # Skrypty pomocnicze
│   ├── deploy_bug7_fix.sh   # Deploy hotfix
│   ├── test-backend-api.sh  # Test API backendu
│   ├── test-backend-fixed.sh # Test poprawionych endpointów
│   └── test-queue-api.sh    # Test API kolejki
│
├── API.md                   # Dokumentacja REST API
├── CONTRIBUTING.md          # Wytyczne dla kontrybutorów
├── CURRENT_STATUS.md        # Aktualny status rozwoju
├── BUG5_RACE_CONDITIONS.md  # Szczegóły fix race conditions
├── BUG8_POSITION_VALIDATION.md  # Szczegóły fix walidacji
├── BUG9_BATCH_UPDATE_RACE_CONDITION.md  # Szczegóły fix batch update ✨ NOWE!
├── BUG9_QUEUE_NULLABLE.md   # Szczegóły fix nullable constraints
├── DEPLOYMENT_FIX_BUG7.md   # Instrukcje hotfix Bug #7
├── docker-compose.yml       # Konfiguracja Docker
├── .env.example             # Przykład zmiennych
├── .gitignore
└── README.md
```

---

## 🎯 Plan Sprintów

### ✅ Sprint 1: Fundacja (Tydzień 1-2) - **UKOŃCZONY**
- ✅ Setup projektów (backend, frontend)
- ✅ Schemat bazy danych
- ✅ Autentykacja & autoryzacja
- ✅ Setup CI/CD

### ✅ Sprint 2: Moduł Rezerwacji (Tydzień 3-4) - **UKOŃCZONY**
- ✅ CRUD rezerwacji
- ✅ Kalkulator ceny
- ✅ Walidacje
- ✅ Interfejs rezerwacji

### ✅ Sprint 3: Uzupełnianie Funkcjonalności (Tydzień 5-6) - **UKOŃCZONY**
- ✅ Zarządzanie klientami
- ✅ Generowanie PDF
- ✅ Wysyłka maili
- ✅ Historia zmian

### ✅ Sprint 4: Panel Admina & Zaawansowane (Tydzień 7-8) - **UKOŃCZONY**
- ✅ Panel administratora
- ✅ Statystyki i raporty
- ✅ Backupy automatyczne
- ✅ Harmonogram sal

### ✅ Sprint 5: Kolejka Rezerwacji (Tydzień 9-10) - **99% UKOŃCZONY**
- ✅ Model bazy danych (reservationQueueDate, position)
- ✅ Backend API endpoints (/queue/*)
- ✅ Funkcje SQL (swap, move, auto-cancel)
- ✅ Cron auto-anulowanie (tylko przeszłe daty)
- ✅ Frontend UI - lista kolejki
- ✅ Edycja wpisów w kolejce
- ✅ Formularz dodawania do kolejki
- ✅ Widok awansowania na pełną rezerwację
- ✅ Drag & drop reordering (zaimplementowane + bugfixy)
- ✅ Row-level locking + retry logic (race conditions fix)
- ✅ Walidacja pozycji i nullable constraints
- ✅ **✨ Batch update API dla atomicznych aktualizacji** - Bug #9 Fix!
  - ✅ Endpoint POST /api/queue/batch-update-positions
  - ✅ Atomiczne transakcje Prisma
  - ✅ Two-phase update (tymczasowe pozycje 1000+)
  - ✅ Frontend API client
  - ✅ Integracja z drag & drop
  - ✅ Pełna dokumentacja
- ✅ Loading states dla operacji async
- 🔄 Testy jednostkowe kolejki (85% complete)
- ⏳ Integracja z powiadomieniami email

### ⏳ Sprint 6: Polish & Testing (Tydzień 11-12) - **PLANOWANY**
- ⏳ Testy jednostkowe (85% coverage)
- ⏳ Testy E2E
- ⏳ Optimizacja wydajności
- ⏳ Dokumentacja użytkownika
- ⏳ Production deployment

---

## 🔐 Bezpieczeństwo

- 🔒 **Hasła**: 12 znaków (UPPERCASE + lowercase + digits + symbols)
- 🛡️ **JWT**: Token-based authentication z refresh tokens
- 🔑 **Role-based Access Control**: Admin, Pracownik, Klient
- 📋 **Audyt**: Historia wszystkich zmian w ReservationHistory
- 🔐 **Environment Variables**: Wrażliwe dane w .env (nie commitowane)
- 🚨 **Input Validation**: XSS & SQL injection protection
- 🔒 **HTTPS**: Wymuszony w produkcji
- 🛡️ **Rate Limiting**: Ochrona przed DDoS
- 🔒 **Row-Level Locking**: PostgreSQL FOR UPDATE dla operacji kolejki
- 🔄 **Retry Logic**: Automatyczne ponowienie przy konfliktach (3x exponential backoff)
- 🛡️ **Race Condition Protection**: Advisory locks dla concurrent operations
- 📦 **✨ Batch Operations**: Atomiczne transakcje dla multi-record updates (Bug #9 fix)
- ✅ **Nullable Constraints**: CHECK constraints dla spójności danych kolejki
- 📏 **Position Validation**: Walidacja zakresu pozycji [1, maxPosition]

---

## 📊 Moduły Systemu

### 1. **Rezerwacje**
- Nowa rezerwacja z pełnym formularzem
- Lista rezerwacji z filtrowaniem i paginacją
- Archiwum rezerwacji
- Widok kalendarza sal na 30 dni
- Edycja rezerwacji (z powodem zmian)
- Anulowanie rezerwacji (z powodem)
- Generowanie PDF z potwierdzeniem
- Wysyłka emailem do klienta
- Historia zmian dla każdej rezerwacji
- Walidacja dostępności sali
- Automatyczny kalkulator cen

### 2. **Kolejka Rezerwacji** 🆕
- Dodawanie do kolejki (RESERVED status)
- Lista oczekujących pogrupowana po datach
- Edycja wpisów w kolejce
- Automatyczne numerowanie pozycji
- Ręczne zarządzanie kolejnością (swap, move)
- **✨ Drag & drop z atomicznym batch update** (Bug #9 Fix!)
  - Jedna transakcja zamiast wielu requestów
  - Two-phase update pattern (tymczasowe pozycje 1000+)
  - Zero race conditions
  - Optymistyczny UI update
  - Error handling z revert
- Loading states i optymistyczny UI update
- Awansowanie do pełnej rezerwacji
- Auto-anulowanie przeterminowanych (tylko przeszłe daty)
- Statystyki kolejki (ilość, daty, goście)
- Notatki do wpisów w kolejce
- Race condition protection
- Walidacja pozycji

### 3. **Zarządzanie Klientami**
- Rejestr klientów z pełnymi danymi
- Historia wszystkich rezerwacji klienta
- Notatki o kliencie
- Dane kontaktowe (telefon, email)
- Wyszukiwanie i filtrowanie
- Export danych klientów

### 4. **Panel Admina**
- Zarządzanie użytkownikami (CRUD)
- Konfiguracja sal (pojemność, ceny)
- Typy eventów (wesele, urodziny, etc.)
- Ustawienia systemu
- Logi aktywności użytkowników
- Przegląd wszystkich rezerwacji

### 5. **Statystyki & Raporty**
- Przychody miesięczne/roczne
- Popularność sal (wykres)
- Typy eventów (rozkład)
- Współczynnik wykorzystania sal
- Liczba rezerwacji w czasie
- Export raportów do CSV/PDF

### 6. **Backupy & Bezpieczeństwo**
- Automatyczne codzienne backupy bazy
- Przechowywanie backupów (7/30/365 dni)
- Możliwość przywrócenia z backupu
- Logi systemowe
- Audyt zmian

---

## 🔄 Workflow Kolejki Rezerwacji

### Dodawanie do Kolejki
1. Klient dzwoni z zapytaniem o termin
2. Pracownik sprawdza dostępność
3. Jeśli brak wolnej sali → dodanie do kolejki
4. Minimalne dane: klient, data docelowa, liczba gości
5. Automatyczne przypisanie pozycji

### Zarządzanie Kolejką
1. Widok listy oczekujących
2. Pogrupowanie po datach
3. Możliwość zmiany kolejności (priorytetyzacja)
4. **✨ Drag & drop z atomicznym batch update** (Bug #9 Fix!)
   - Użytkownik przeciąga karty
   - Jedna transakcja aktualizuje wszystkie pozycje
   - Brak race conditions
5. **Natychmiastowy feedback + server confirmation**
6. Edycja danych (klient, data, goście, notatki)
7. Statistyki dla każdej daty

### Awansowanie
1. Pracownik wybiera wpis z kolejki
2. Otwiera pełny formularz rezerwacji
3. Dodaje szczegóły: sala, godziny, ceny
4. System waliduje dostępność
5. Awansowanie do PENDING/CONFIRMED
6. Automatyczne przeliczenie kolejki
7. Email do klienta z potwierdzeniem

### Auto-anulowanie
1. Cron uruchamia się codziennie o 00:01
2. Znajduje wpisy gdzie `reservationQueueDate < CURRENT_DATE` ⚠️ **Tylko przeszłe daty!**
3. Zmienia status na CANCELLED
4. Dodaje notatkę "Auto-anulowano (minął termin)"
5. Loguje w ReservationHistory
6. Przelicza pozycje pozostałych

**Ważne:** Auto-cancel anuluje **TYLKO** wpisy z przeszłych dat, nie z daty dzisiejszej.
Klient może dzwonić w ciągu dnia bez automatycznego anulowania rezerwacji.

**Przykład:**
- Dziś: 09.02.2026
- Klient w kolejce na 09.02.2026 - ✅ POZOSTAJE (może dzwonić)
- Klient w kolejce na 08.02.2026 i wcześniej - ❌ ZOSTANIE ANULOWANY o 00:01

---

## 📝 Dane Testowe

```json
{
  "sale": [
    {
      "name": "Sala Kryształowa",
      "capacity": 40,
      "pricePerPerson": 250,
      "description": "Elegancka sala dla małych weseli"
    },
    {
      "name": "Sala Złota",
      "capacity": 80,
      "pricePerPerson": 300,
      "description": "Średnia sala idealna na urodziny"
    },
    {
      "name": "Sala Bankietowa",
      "capacity": 150,
      "pricePerPerson": 350,
      "description": "Największa sala na duże wesela"
    }
  ],
  "eventTypes": [
    "Wesele",
    "Urodziny",
    "Rocznica",
    "Komunia",
    "Bal",
    "Konferencja",
    "Andrzejki",
    "Wigilia firmowa",
    "Inne"
  ],
  "users": [
    {
      "email": "admin@gosciniecrodzinny.pl",
      "role": "ADMIN",
      "firstName": "Admin",
      "lastName": "System"
    },
    {
      "email": "pracownik@gosciniecrodzinny.pl",
      "role": "EMPLOYEE",
      "firstName": "Jan",
      "lastName": "Kowalski"
    }
  ]
}
```

---

## 🧪 Testing

### Unit Tests
```bash
# Backend
cd apps/backend && npm run test

# Frontend
cd apps/frontend && npm run test
```

### Integration Tests
```bash
cd apps/backend && npm run test:integration
```

### E2E Tests
```bash
cd apps/frontend && npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

**Current Coverage:** ~82% (backend), ~75% (frontend)  
**Target:** 85%+ dla obu

### Skrypty Testowe API

```bash
# Test wszystkich endpointów backendu
./test-backend-api.sh

# Test poprawionych endpointów
./test-backend-fixed.sh

# Test API kolejki rezerwacji (włącznie z batch update)
./test-queue-api.sh
```

---

## 📧 Konfiguracja Emailów

Ustaw zmienne w `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@gosciniecrodzinny.pl
```

### Template Emailów
- Potwierdzenie rezerwacji
- Przypomnienie (7 dni przed)
- Anulowanie rezerwacji
- Awansowanie z kolejki
- Zmiana danych rezerwacji

---

## 🐛 Troubleshooting

### Baza danych nie łączy się
```bash
docker-compose down
docker-compose up -d postgres
# Czekaj 30 sekund na uruchomienie
docker-compose up -d
```

### Migracja nie uruchamia się
```bash
docker-compose exec backend npm run prisma:migrate:deploy
```

### Wyczyść wszystkie kontenery i dane
```bash
docker-compose down -v
docker-compose up -d
# Uwaga: To usunie WSZYSTKIE dane!
```

### Frontend nie kompiluje się
```bash
docker-compose exec frontend npm install
docker-compose restart frontend
```

### Sprawdź logi
```bash
# Wszystkie serwisy
docker-compose logs -f

# Tylko backend
docker-compose logs -f backend

# Tylko frontend
docker-compose logs -f frontend
```

---

## 📚 Dokumentacja

### Główna Dokumentacja
- [📖 Dokumentacja API](./API.md)
- [🕹️ Schemat Bazy Danych](./docs/DATABASE.md)
- [📋 Plan Sprintów](./docs/SPRINTS.md)
- [🏭 Architektura](./docs/ARCHITECTURE.md)
- [🚀 Wdrażanie](./docs/DEPLOYMENT.md)
- [📋 Moduł Kolejki](./docs/QUEUE.md)
- [🌙 ✨ Dark Mode Guidelines](./docs/DARK_MODE_GUIDELINES.md) - **NOWE!**
- [🧪 Testy](./docs/testing/)
- [🔧 Wytyczne dla Kontrybutorów](./CONTRIBUTING.md)
- [📏 Aktualny Status](./CURRENT_STATUS.md)

### Raporty Bugfixów
- [🐞 Sesja Bugfix 07.02.2026](./docs/BUGFIX_SESSION_2026-02-07.md) - Wszystkie 7 bugów (Bug #1-7)
- [🐞 ✨ Sesja Bugfix 09.02.2026](./docs/BUGFIX_SESSION_2026-02-09.md) - **Bug #9: Batch Update Race Condition** NOWE!
- [🔄 Bug #5: Race Conditions](./BUG5_RACE_CONDITIONS.md) - Row-level locking + retry logic
- [📏 Bug #8: Position Validation](./BUG8_POSITION_VALIDATION.md) - Walidacja pozycji
- [📦 ✨ Bug #9: Batch Update Race Condition](./BUG9_BATCH_UPDATE_RACE_CONDITION.md) - Atomiczne transakcje **NOWE!**
- [✅ Bug #9: Nullable Constraints](./BUG9_QUEUE_NULLABLE.md) - CHECK constraints
- [🚀 Deployment Bug #7](./DEPLOYMENT_FIX_BUG7.md) - Instrukcje hotfix auto-cancel

### Deployment & DevOps
- [📦 Backend Deployment](./BACKEND_DEPLOYMENT.md)
- [🚀 Ogólne Wdrażanie](./docs/DEPLOYMENT.md)
- [🔧 Deploy Hotfix Script](./deploy_bug7_fix.sh)

### Plany i Implementacja
- [📋 Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [📝 Changelog Queue System](./CHANGELOG_QUEUE_SYSTEM.md)

---

## 🛣️ Roadmap

### Q1 2026 (Obecnie)
- ✅ Core system rezerwacji
- ✅ Moduł kolejki rezerwacji (99% complete)
- ✅ **✨ Batch update API z atomicznymi transakcjami** (Bug #9 Fix)
- ✅ **🌙 Dark Mode Support** - Pełne wsparcie + dokumentacja
- 🔄 Testy E2E (85% complete)
- ⏳ Production deployment

### Q2 2026 (Planowane)
- 📱 Mobile app (React Native)
- 📏 Zaawansowane raporty
- 💳 Integracja płatności online
- 📧 Email marketing integration

### Q3 2026 (Rozważane)
- 🤖 AI-powered recommendations
- 📱 SMS notifications
- 🌐 Multi-language support
- 📏 Advanced analytics dashboard

---

## 📞 Wsparcie

Dla pytań lub problemów:
- 📧 Email: support@gosciniecrodzinny.pl
- 🐛 GitHub Issues: [github.com/kamil-gol/Go-ciniec_2/issues](https://github.com/kamil-gol/Go-ciniec_2/issues)
- 📖 Dokumentacja: [docs/](./docs/)

---

## 👥 Zespół

**Development:**
- Kamil Gol - Full Stack Developer

**Client:**
- Gościniec Rodzinny - ul. Bukowa 155, Świętochłowice

---

## 📝 Licencja

Copyright © 2026 Gościniec Rodzinny. Wszystkie prawa zastrzeżone.

Proprietarne oprogramowanie stworzone na zamówienie dla Gościniec Rodzinny.

---

## 🔄 Status Projektu

**Wersja:** 0.9.9 (Release Candidate + Bug #9 Batch Update Fix + Dark Mode)  
**Status:** 🔄 W aktywnym rozwoju - stabilny  
**Ostatnia aktualizacja:** 09.02.2026 - 23:15 CET  
**Kolejny release:** v1.0.0 (planowany marzec 2026)

### Postęp Ogólny
- **Backend:** 94% ✅ (+2% - batch update API)
- **Frontend:** 84% ✅ (+2% - atomiczne drag & drop)
- **Testy:** 82% 🔄 (+2% - testy batch operations)
- **Dokumentacja:** 92% ✅ (+2% - dark mode guidelines)
- **Deployment:** 70% 🔄

### Aktualnie w Rozwoju
- Moduł kolejki rezerwacji (99% complete)
- Dark Mode support (100% complete + dokumentacja)
- Testy jednostkowe (85% complete)
- Integracja powiadomień email
- Production deployment preparation

### Ostatnie Zmiany
- ✅ Bug #5: Race conditions - row-level locking + retry logic
- ✅ Bug #6: Loading states dla drag & drop
- ✅ Bug #7: Auto-cancel logic (tylko przeszłe daty)
- ✅ Bug #8: Walidacja pozycji w kolejce
- ✅ Bug #9: Nullable constraints dla queue fields
- ✅ **✨ Bug #9: Batch update API - atomiczne transakcje** (09.02.2026)
  - Endpoint POST /api/queue/batch-update-positions
  - Transakcja Prisma z two-phase update
  - Zero race conditions przy drag & drop
  - Pełna dokumentacja w BUGFIX_SESSION_2026-02-09.md
- ✅ **🌙 Dark Mode Guidelines** - Pełna dokumentacja (09.02.2026)
  - Semantic tokens patterns
  - Gradient adaptations
  - Component examples
  - Checklist & best practices

**Branch Status:** Stabilny - wszystkie komponenty mają wsparcie dark mode

---

**Built with ❤️ for Gościniec Rodzinny**
