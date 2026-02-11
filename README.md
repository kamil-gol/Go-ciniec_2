# 🎉 System Rezerwacji Sal - Gościniec Rodzinny

**Profesjonalny system zarządzania rezerwacjami sal dla restauracji Gościniec Rodzinny**

📍 ul. Bukowa 155, 41-600 Świętochłowice | 🌐 [gosciniecrodzinny.pl](https://gosciniecrodzinny.pl)

---

## 📋 Przegląd Projektu

Kompleksowy system do zarządzania rezerwacjami sal weselnych i okolicznościowych z pełną integracją administracyjną, statystykami, automatyzacją procesów biznesowych, inteligentnym systemem kolejki rezerwacji, zarządzaniem menu i kategoriami dań oraz **modułem zaliczek**.

### ✨ Kluczowe Cechy

✅ **Moduł Rezerwacji** - pełny lifecycle rezerwacji (nowa, edycja, archiwum)  
✅ **Kolejka Rezerwacji** - zarządzanie listą oczekujących, priorytetyzacja, awansowanie  
✅ **✨ Moduł Zaliczek** - pełne zarządzanie zaliczkami i płatnościami **— NOWE!**  
✅ **✨ System Menu** - kategorie dań, zarządzanie daniami  
✅ **Zarządzanie Klientami** - baza klientów z historią rezerwacji  
✅ **Panel Administratora** - pełna kontrola systemu  
✅ **Statystyki & Raporty** - analityka rezerwacji i przychodów  
✅ **Automatyczne Backupy** - bezpieczeństwo danych  
✅ **Generowanie PDF** - faktury i potwierdzenia rezerwacji  
✅ **Wysyłka Maili** - powiadomienia i przypomnienia  
✅ **Historia Zmian** - pełna audyt trail każdej rezerwacji  
✅ **Walidacje** - kompleksowe sprawdzenia danych  
✅ **Testy Jednostkowe & E2E** - 80%+ coverage z pełnymi danymi testowymi  
✅ **Auto-anulowanie** - automatyczna anulacja przeterminowanych wpisów w kolejce  
✅ **Race Condition Protection** - row-level locking + retry logic  
✅ **✨ Batch Update API** - atomiczne aktualizacje kolejki (drag & drop)

---

## 🏮 Stack Technologiczny

### Backend
- **Go 1.23+** - wydajny, kompilowany język
- **Gin Framework** - szybki HTTP router
- **GORM** - ORM dla PostgreSQL
- **PostgreSQL 15** - relacyjna baza danych
- **JWT** - autentykacja token-based
- **Gomail** - wysyłka emailów
- **Cron** - zaplanowane zadania

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

# Seeding testowymi danymi (pełne dane E2E)
docker-compose exec backend npm run db:seed

# Uruchomienie testów
docker-compose exec backend npm run test
docker-compose exec frontend npm run test

# E2E testy
docker-compose exec frontend npm run test:e2e
```

### 🧪 Dane Testowe E2E

Po uruchomieniu `npm run db:seed` otrzymasz:

```
🏛️  Halls: 6 (Kryształowa, Taneczna, Złota, Cały obiekt, Strzecha 1, Strzecha 2)
👥 Users: 3 (1 ADMIN + 2 EMPLOYEE)
👤 Clients: 5 (Marek, Anna, Piotr, Katarzyna, Michał)
📅 Reservations: 6 (RESERVED, CONFIRMED, COMPLETED)
💰 Deposits: 5 (wszystkie PAID)
🍽️ Dishes: 110 (12 kategorii)
📝 Menu Templates: 5
📦 Menu Packages: 8
⚙️ Category Settings: 43
```

**Test Login:**
- Email: `admin@gosciniecrodzinny.pl`
- Hasło: `Admin123!@#`

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

### 2. **Kolejka Rezerwacji**
- Dodawanie do kolejki (RESERVED status)
- Lista oczekujących pogrupowana po datach
- Edycja wpisów w kolejce
- Automatyczne numerowanie pozycji
- Ręczne zarządzanie kolejnością (swap, move)
- **✨ Drag & drop z atomicznym batch update**
  - Jedna transakcja zamiast wielu requestów
  - Two-phase update pattern
  - Zero race conditions
  - Optymistyczny UI update
  - Error handling z revert
- Loading states i optymistyczny UI update
- Awansowanie do pełnej rezerwacji
- Auto-anulowanie przeterminowanych
- Statystyki kolejki
- Notatki do wpisów
- Race condition protection
- Walidacja pozycji

### 3. **✨ Moduł Zaliczek** - **NOWE!**
- **CRUD Zaliczek**
  - Tworzenie nowych zaliczek dla rezerwacji
  - Edycja kwot i terminów płatności
  - Usuwanie zaliczek
  - Lista wszystkich zaliczek z filtrowaniem
- **System Płatności**
  - Dodawanie częściowych wpłat
  - Śledzenie historii płatności
  - Różne metody płatności (gotówka, przelew, karta)
  - Automatyczne przeliczanie pozostałej kwoty
- **Statusy Zaliczek**
  - PENDING - oczekująca
  - PARTIAL - częściowo opłacona
  - PAID - w pełni opłacona
  - OVERDUE - przeterminowana
- **Statystyki Zaliczek**
  - Suma wszystkich zaliczek
  - Kwota opłacona / pozostała
  - Liczba przeterminowanych
  - Nadchodzące terminy płatności
- **Przypomnienia**
  - Lista zaliczek wymagających przypomnienia
  - Znaczniki wysyłki przypomnień
  - Integracja z systemem emailów
- **Filtrowanie**
  - Według statusu (wszystkie/oczekujące/opłacone/przeterminowane)
  - Według zakresu dat
  - Wyszukiwanie po kliencie
- **UI/UX**
  - Responsywny design
  - Statystyki w kartach
  - Lista z akcjami (zobacz, edytuj, usuń, zapłać)
  - Modał dodawania płatności
  - Potwierdzenia usuwania

### 4. **✨ System Menu**
- **Kategorie Dań**
  - Tworzenie i edycja kategorii
  - Unikalne slugi
  - Ikony emoji
  - System kolorów
  - Kolejność wyświetlania
  - Sortowanie
  - Aktywacja/dezaktywacja
  - Walidacja unikalnych slugów
- **Zarządzanie Daniami** (⏳ w planach)

### 5. **Zarządzanie Klientami**
- Rejestr klientów z pełnymi danymi
- Historia wszystkich rezerwacji klienta
- Notatki o kliencie
- Dane kontaktowe
- Wyszukiwanie i filtrowanie
- Export danych

### 6. **Panel Admina**
- Zarządzanie użytkownikami (CRUD)
- Konfiguracja sal
- Typy eventów
- Ustawienia systemu
- Logi aktywności
- Przegląd wszystkich rezerwacji

### 7. **Statystyki & Raporty**
- Przychody miesięczne/roczne
- Popularność sal
- Typy eventów
- Współczynnik wykorzystania sal
- Liczba rezerwacji w czasie
- Export raportów do CSV/PDF

### 8. **Backupy & Bezpieczeństwo**
- Automatyczne codzienne backupy
- Przechowywanie backupów
- Możliwość przywrócenia
- Logi systemowe
- Audyt zmian

---

## 🔐 Bezpieczeństwo

- 🔒 **Hasła**: 12 znaków (UPPERCASE + lowercase + digits + symbols)
- 🛡️ **JWT**: Token-based authentication z refresh tokens
- 🔑 **Role-based Access Control**: Admin, Pracownik, Klient
- 📋 **Audyt**: Historia wszystkich zmian
- 🔐 **Environment Variables**: Wrażliwe dane w .env
- 🚨 **Input Validation**: XSS & SQL injection protection
- 🔒 **HTTPS**: Wymuszony w produkcji
- 🛡️ **Rate Limiting**: Ochrona przed DDoS
- 🔒 **Row-Level Locking**: PostgreSQL FOR UPDATE
- 🔄 **Retry Logic**: Automatyczne ponowienie przy konfliktach
- 🛡️ **Race Condition Protection**: Advisory locks
- 📦 **✨ Batch Operations**: Atomiczne transakcje
- ✅ **Nullable Constraints**: CHECK constraints
- 📏 **Position Validation**: Walidacja zakresów
- 🔑 **✨ Unified Token Management**: Spójne użycie localStorage

---

## 📚 Dokumentacja

### Główna Dokumentacja
- [📖 Dokumentacja API](./API.md)
- [🎭 Schemat Bazy Danych](./docs/DATABASE.md)
- [📋 Plan Sprintów](./docs/SPRINTS.md)
- [🏭 Architektura](./docs/ARCHITECTURE.md)
- [🚀 Wdrażanie](./docs/DEPLOYMENT.md)
- [📋 Moduł Kolejki](./docs/QUEUE.md)
- [🔎 Testy](./docs/testing/)
- [🔧 Wytyczne dla Kontrybutorów](./CONTRIBUTING.md)
- [📏 Aktualny Status](./CURRENT_STATUS.md)

### Raporty Bugfixów
- [🐞 Sesja Bugfix 07.02.2026](./docs/BUGFIX_SESSION_2026-02-07.md)
- [🐞 Sesja Bugfix 09.02.2026](./docs/BUGFIX_SESSION_2026-02-09.md)
- [🐞 Sesja Bugfix 11.02.2026](./docs/BUGFIX_SESSION_2026-02-11.md)
- [🔄 Bug #5: Race Conditions](./BUG5_RACE_CONDITIONS.md)
- [📏 Bug #8: Position Validation](./BUG8_POSITION_VALIDATION.md)
- [📦 Bug #9: Batch Update](./BUG9_BATCH_UPDATE_RACE_CONDITION.md)
- [✅ Bug #9: Nullable Constraints](./BUG9_QUEUE_NULLABLE.md)
- [🚀 Deployment Bug #7](./DEPLOYMENT_FIX_BUG7.md)

---

## 🛣️ Roadmap

### Q1 2026 (Obecnie)
- ✅ Core system rezerwacji
- ✅ Moduł kolejki rezerwacji (99% complete)
- ✅ **✨ Batch update API** (Bug #9 Fix)
- ✅ **🌙 Dark Mode Support**
- ✅ **✨ E2E Test Data** (Bug #10-13 Fix)
- ✅ **✨ System Menu & Kategorie Dań**
- ✅ **✨ Moduł Zaliczek** - **NOWE!**
  - ✅ Backend API (Go + GORM)
  - ✅ Model bazy danych (Deposit, Payment)
  - ✅ Frontend UI (Next.js + TypeScript)
  - ✅ Komponenty (DepositStats, DepositList, PaymentModal)
  - ✅ Service layer i TypeScript types
  - ✅ Responsywny design
- 🔄 Testy E2E (85% complete)
- ⏳ Production deployment

### Q2 2026 (Planowane)
- 📱 Mobile app (React Native)
- 📏 Zaawansowane raporty
- 💳 Integracja płatności online
- 📧 Email marketing integration
- 🍽️ Zarządzanie menu + generowanie dokumentów
- 💰 Przypomnienia o płatnościach zaliczek (SMS/Email)
- 📊 Zaawansowane statystyki zaliczek

### Q3 2026 (Rozważane)
- 🤖 AI-powered recommendations
- 📱 SMS notifications
- 🌐 Multi-language support
- 📏 Advanced analytics dashboard

---

## 🔄 Status Projektu

**Wersja:** 0.9.11 (Release Candidate + Deposits Module)  
**Status:** 🔄 W aktywnym rozwoju - stabilny  
**Ostatnia aktualizacja:** 11.02.2026 - 16:44 CET  
**Kolejny release:** v1.0.0 (planowany marzec 2026)

### Postęp Ogólny
- **Backend:** 98% ✅ (+1% - deposits API)
- **Frontend:** 88% ✅ (+1% - deposits UI)
- **Testy:** 83% 🔄
- **Dokumentacja:** 96% ✅ (+1% - deposits docs)
- **Deployment:** 70% 🔄

### Aktualnie w Rozwoju
- Moduł zaliczek (100% complete)
- System menu & kategorie dań (100% complete)
- Dark Mode support (100% complete)
- E2E test data (100% complete)
- Testy jednostkowe (85% complete)
- Integracja powiadomień email
- Production deployment preparation

### Ostatnie Zmiany
- ✅ **✨ Moduł Zaliczek** (11.02.2026)
  - Backend API (Go + GORM)
  - Frontend UI (Next.js + TypeScript)
  - Komponenty: DepositStats, DepositList, PaymentModal
  - Service layer: depositService.ts
  - TypeScript types: Deposit, Payment
  - Statystyki i filtrowanie
  - Responsywny design
  - Pełna dokumentacja
- ✅ Bug #5-9: Race conditions, walidacje, batch updates
- ✅ Bug #10-13: E2E Seed Fixes & Menu API Token
- ✅ System Menu & Kategorie Dań
- ✅ Dark Mode Guidelines

---

**Built with ❤️ for Gościniec Rodzinny**
