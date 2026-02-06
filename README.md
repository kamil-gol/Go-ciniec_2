# 🎉 System Rezerwacji Sal - Gościniec Rodzinny

**Profesjonalny system zarządzania rezerwacjami sal dla restauracji Gościniec Rodzinny**

📍 ul. Bukowa 155, 41-600 Świętochłowice | 🌐 [gosciniecrodzinny.pl](https://gosciniecrodzinny.pl)

---

## 📋 Przegląd Projektu

Kompleksowy system do zarządzania rezerwacjami sal weselnych i okolicznościowych z pełną integracją administracyjną, statystykami i automatyzacją procesów biznesowych.

### ✨ Kluczowe Cechy

✅ **Moduł Rezerwacji** - pełny lifecycle rezerwacji (nowa, edycja, archiwum)
✅ **Zarządzanie Klientami** - baza klientów z historią rezerwacji
✅ **Panel Administratora** - pełna kontrola systemu
✅ **Statystyki & Raporty** - analityka rezerwacji i przychodów
✅ **Automatyczne Backupy** - bezpieczeństwo danych
✅ **Generowanie PDF** - faktury i potwierdzenia rezerwacji
✅ **Wysyłka Maili** - powiadomienia i przypomnienia
✅ **Historia Zmian** - pełna audyt trail każdej rezerwacji
✅ **Walidacje** - kompleksowe sprawdzenia danych
✅ **Testy Jednostkowe & E2E** - 80%+ coverage

---

## 🏗️ Stack Technologiczny

### Frontend
- **Next.js 14** - React framework z SSR
- **React 18** - UI library
- **TypeScript** - type safety
- **Tailwind CSS + Framer Motion** - styling i animacje
- **React Query** - data fetching
- **Vitest** - unit tests
- **Playwright** - E2E tests

### Backend
- **Node.js** - runtime
- **Express.js** - HTTP framework
- **TypeScript** - type safety
- **PostgreSQL** - database
- **Prisma ORM** - database access
- **JWT** - authentication
- **Nodemailer** - email sending
- **pdfkit** - PDF generation
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
git clone https://github.com/kamil-gol/rezerwacje.git
cd rezerwacje

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
│   │   │   ├── models/       # Schemat bazy danych
│   │   │   ├── middlewares/  # Auth, validation, error handling
│   │   │   ├── utils/        # Funkcje pomocnicze
│   │   │   ├── email/        # Template emaili
│   │   │   └── tests/        # Unit & integration testy
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/             # Next.js + React UI
│       ├── app/              # Next.js App Router
│       ├── components/       # React komponenty
│       ├── pages/            # Strony aplikacji
│       ├── hooks/            # Custom hooks
│       ├── utils/            # Funkcje pomocnicze
│       ├── styles/           # Globalne Style
│       ├── __tests__/        # Unit testy
│       ├── e2e/              # E2E testy Playwright
│       ├── Dockerfile
│       └── package.json
│
├── docs/                     # Dokumentacja
│   ├── API.md               # Dokumentacja API
│   ├── DATABASE.md          # Schema bazy
│   ├── SPRINTS.md           # Plan sprintów
│   ├── ARCHITECTURE.md      # Architektura
│   └── DEPLOYMENT.md        # Wdrażanie
│
├── docker-compose.yml       # Konfiguracja Docker
├── .env.example             # Przykład zmiennych
├── .gitignore
└── README.md
```

---

## 🎯 Plan Sprintów

### Sprint 1: Fundacja (Tydzień 1-2)
- Setup projektów (backend, frontend)
- Schemat bazy danych
- Autentykacja & autoryacja
- Setup CI/CD

### Sprint 2: Moduł Rezerwacji (Tydzień 3-4)
- CRUD rezerwacji
- Kalkulator ceny
- Walidacje
- Interfejs rezerwacji

### Sprint 3: Uzupełnianie Funkcjonalności (Tydzień 5-6)
- Zarządzanie klientami
- Generowanie PDF
- Wysyłka maili
- Historia zmian

### Sprint 4: Panel Admina & Zaawansowane (Tydzień 7-8)
- Panel administratora
- Statystyki i raporty
- Backupy automtyczne
- Harmonogram sal

### Sprint 5: Polish & Testing (Tydzień 9-10)
- Testy jednostkowe (80% coverage)
- Testy E2E
- Optimizacja wydajności
- Dokumentacja
- Production deployment

---

## 🔐 Bezpieczeństwo

- 🔒 **Hasła**: 12 znaków (UPPERCASE + lowercase + digits + symbols)
- 🛡️ **JWT**: Token-based authentication
- 🔑 **Role-based Access Control**: Admin, Pracownik, Klient
- 📋 **Audyt**: Historia wszystkich zmian
- 🔐 **Environment Variables**: Wrażliwe dane nie commituje się
- 🚨 **Input Validation**: XSS & SQL injection protection

---

## 📊 Moduły Systemu

### 1. **Rezerwacje**
- Nowa rezerwacja
- Lista rezerwacji (z paginacją)
- Archiwum rezerwacji
- Widok kalendarza sal na 30 dni
- Edycja rezerwacji (z powodem zmian)
- Anulowanie rezerwacji (z powodem)
- Generowanie PDF
- Wysyłka emailem
- Historia zmian

### 2. **Zarządzanie Klientami**
- Rejestr klientów
- Historia rezerwacji klienta
- Notatki o kliencie
- Kontakt i dane

### 3. **Panel Admina**
- Zarządzanie użytkownikami
- Konfiguracja sal
- Ustawienia systemu
- Logi aktywności

### 4. **Statystyki**
- Przychody miesięczne
- Popularność sal
- Typy eventów
- Wykresów

### 5. **Backupy**
- Automtyczne codzienne backupy
- Przechowywanie backupów
- Możliwość przywrócenia

---

## 📝 Dane Testowe

```json
{
  "sale": [
    {
      "name": "Sala Krysztalowa",
      "capacity": 40,
      "pricePerPerson": 250,
      "description": "Elegancka sala dla małych weseli"
    },
    {
      "name": "Sala Złota",
      "capacity": 80,
      "pricePerPerson": 300
    },
    {
      "name": "Sala Bankietowa",
      "capacity": 150,
      "pricePerPerson": 350
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
    "Wigilia"
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

---

## 📧 Konfiguracja Emaili

Ustaw zmienne w `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@gosciniecrodzinny.pl
```

---

## 🐛 Troubleshooting

### Baza danych nie łączy się
```bash
docker-compose down
docker-compose up -d postgres
# Czekaj 30 sekund na uruchomienie
docker-compose up -d
```

### Migracją nie uruchamia się
```bash
docker-compose exec backend npm run prisma:migrate:deploy
```

### Wyczyść wszystkie kontenery
```bash
docker-compose down -v
docker-compose up -d
```

---

## 📞 Wsparcie

Dla pytań lub problemów, otwórz issue na GitHubie.

---

## 📄 Licencja

Copyright © 2026 Gościniec Rodzinny. Wszystkie prawa zastrzeżone.

---

**Ostatnia aktualizacja**: 06.02.2026
**Status**: 🔧 W budowie