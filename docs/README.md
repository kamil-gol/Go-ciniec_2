# 📚 Dokumentacja Projektu - System Rezerwacji Sal

**Indeks całej dokumentacji projektu Gościniec Rodzinny**

---

## 📌 Spis Treści

### 1. 📖 Dokumentacja Główna
- [🏠 README.md](../README.md) - Przegląd projektu, quick start, stack
- [📖 API.md](../API.md) - Kompletna dokumentacja REST API
- [📏 CURRENT_STATUS.md](../CURRENT_STATUS.md) - Aktualny status rozwoju
- [🔧 CONTRIBUTING.md](../CONTRIBUTING.md) - Wytyczne dla kontrybutorów

### 2. 🏭 Architektura & Design
- [🏭 ARCHITECTURE.md](./ARCHITECTURE.md) - Architektura systemu
- [🗄️ DATABASE.md](./DATABASE.md) - Schemat bazy danych
- [📋 SPRINTS.md](./SPRINTS.md) - Plan sprintów i harmonogram

### 3. 📦 Moduły Funkcjonalne
- [📋 QUEUE.md](./QUEUE.md) - **Moduł Kolejki Rezerwacji** (pełna dokumentacja)
  - Architektura systemu kolejki
  - API endpoints (włącznie z batch update)
  - Drag & drop implementation
  - Auto-anulowanie
  - Bugfixy (Bug #9)
- [📊 BACKUP.md](./BACKUP.md) - System backupów

### 4. 🚀 Deployment & DevOps
- [🚀 DEPLOYMENT.md](./DEPLOYMENT.md) - Instrukcje wdrożenia
- [📦 DEPLOYMENT_BACKUP.md](./DEPLOYMENT_BACKUP.md) - Backup deployment
- [🚀 DEPLOYMENT_FIX_BUG7.md](../DEPLOYMENT_FIX_BUG7.md) - Hotfix Bug #7
- [📦 BACKEND_DEPLOYMENT.md](../BACKEND_DEPLOYMENT.md) - Deployment backendu

### 5. 🧪 Testing
- [🧪 E2E_TESTING_PLAN.md](./E2E_TESTING_PLAN.md) - Plan testów end-to-end
- [📁 testing/](./testing/) - Katalog dokumentów testowych

### 6. 🐞 Bugfix Sessions
- [🐞 BUGFIX_SESSION_2026-02-07.md](./BUGFIX_SESSION_2026-02-07.md) - **Sesja naprawcza Bug #1-8**
  - Bug #1: Nullable errors
  - Bug #2: SQL syntax errors
  - Bug #3: Client ID updates
  - Bug #4: Pricing decimal precision
  - Bug #5: Race conditions (row-level locking)
  - Bug #6: Loading states
  - Bug #7: Auto-cancel logic
  - Bug #8: Position validation

- [🐞 ✨ BUGFIX_SESSION_2026-02-09.md](./BUGFIX_SESSION_2026-02-09.md) - **Sesja naprawcza Bug #9** NOWE!
  - **Bug #9: Race Condition w Drag & Drop**
  - Batch Update API - atomiczne transakcje
  - Two-phase update strategy
  - Zero race conditions
  - Pełna dokumentacja fix'a

### 7. 🐛 Szczegółowe Raporty Bugów
- [🔄 BUG5_RACE_CONDITIONS.md](../BUG5_RACE_CONDITIONS.md) - Szczegóły fix race conditions
- [📏 BUG8_POSITION_VALIDATION.md](../BUG8_POSITION_VALIDATION.md) - Szczegóły fix walidacji pozycji
- [📦 ✨ BUG9_BATCH_UPDATE_RACE_CONDITION.md](../BUG9_BATCH_UPDATE_RACE_CONDITION.md) - **Szczegóły fix batch update** NOWE!
- [✅ BUG9_QUEUE_NULLABLE.md](../BUG9_QUEUE_NULLABLE.md) - Szczegóły fix nullable constraints

### 8. 📝 Plany & Implementacja
- [📋 IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Plan implementacji
- [📝 CHANGELOG_QUEUE_SYSTEM.md](../CHANGELOG_QUEUE_SYSTEM.md) - Changelog systemu kolejki

### 9. 📚 Requirements
- [📁 requirements/](./requirements/) - Katalog wymagań biznesowych

---

## 📂 Katalogi

### `/docs`
Główna dokumentacja projektu:
```
docs/
├── README.md                        # Ten plik - indeks dokumentacji
├── ARCHITECTURE.md                  # Architektura systemu
├── DATABASE.md                      # Schemat bazy danych
├── DEPLOYMENT.md                    # Instrukcje deployment
├── DEPLOYMENT_BACKUP.md             # Backup deployment
├── BACKUP.md                        # System backupów
├── SPRINTS.md                       # Plan sprintów
├── QUEUE.md                         # Dokumentacja modułu kolejki
├── E2E_TESTING_PLAN.md              # Plan testów E2E
├── BUGFIX_SESSION_2026-02-07.md     # Sesja bugfix Bug #1-8
├── BUGFIX_SESSION_2026-02-09.md     # Sesja bugfix Bug #9 ✨ NOWE!
├── requirements/                    # Wymagania biznesowe
└── testing/                         # Dokumenty testowe
```

### `/apps/backend`
Backend Node.js + Express:
```
apps/backend/
├── src/
│   ├── controllers/      # Logika endpointów
│   ├── services/         # Logika biznesowa
│   ├── routes/           # Definicje API routes
│   ├── middlewares/      # Auth, validation, error handling
│   ├── utils/            # Funkcje pomocnicze
│   ├── email/            # Template emaili
│   └── tests/            # Unit & integration testy
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── Dockerfile
```

### `/apps/frontend`
Frontend Next.js + React:
```
apps/frontend/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Strony autentykacji
│   ├── dashboard/        # Panel główny
│   ├── reservations/     # Moduł rezerwacji
│   ├── queue/            # Moduł kolejki
│   └── clients/          # Zarządzanie klientami
├── components/           # React komponenty
│   ├── ui/               # UI components (shadcn)
│   ├── reservations/     # Komponenty rezerwacji
│   └── queue/            # Komponenty kolejki (drag & drop)
├── lib/                  # Utilities & API clients
├── hooks/                # Custom React hooks
├── __tests__/            # Unit testy
├── e2e/                  # E2E testy Playwright
└── Dockerfile
```

---

## ✨ Najważniejsze Dokumenty

### Dla Developerów
1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Zacznij tutaj! Architektura całego systemu
2. **[DATABASE.md](./DATABASE.md)** - Struktura bazy danych
3. **[QUEUE.md](./QUEUE.md)** - Pełna dokumentacja modułu kolejki
4. **[API.md](../API.md)** - REST API reference

### Dla QA & Testerów
1. **[E2E_TESTING_PLAN.md](./E2E_TESTING_PLAN.md)** - Plan testów end-to-end
2. **[testing/](./testing/)** - Dokumenty testowe

### Dla DevOps
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Instrukcje deployment
2. **[BACKUP.md](./BACKUP.md)** - System backupów

### Dla PM & Product Owners
1. **[SPRINTS.md](./SPRINTS.md)** - Harmonogram i postęp sprintów
2. **[CURRENT_STATUS.md](../CURRENT_STATUS.md)** - Aktualny status projektu

---

## 🔄 Ostatnie Aktualizacje

### 09.02.2026 - Bug #9 Batch Update Fix ✨
- ✅ Dodano [BUGFIX_SESSION_2026-02-09.md](./BUGFIX_SESSION_2026-02-09.md)
- ✅ Zaktualizowano [QUEUE.md](./QUEUE.md) z nowym endpointem batch update
- ✅ Zaktualizowano główny [README.md](../README.md)
- ✅ Dodano link do dokumentu BUG9_BATCH_UPDATE_RACE_CONDITION.md

**Co się zmieniło:**
- Nowy endpoint POST /api/queue/batch-update-positions
- Atomiczne transakcje dla drag & drop
- Two-phase update strategy
- Zero race conditions
- Pełna dokumentacja techniczna

### 07.02.2026 - Bugfix Session #1-8
- ✅ Dodano [BUGFIX_SESSION_2026-02-07.md](./BUGFIX_SESSION_2026-02-07.md)
- ✅ Poprawiono 8 bugów w systemie kolejki
- ✅ Row-level locking dla race conditions
- ✅ Auto-cancel tylko dla przeszłych dat

---

## 📞 Kontakt & Wsparcie

**Pytania o dokumentację:**
- 📧 Email: dev@gosciniecrodzinny.pl
- 🐛 GitHub Issues: [Tag: documentation](https://github.com/kamil-gol/Go-ciniec_2/issues?q=label%3Adocumentation)

**Sugestie aktualizacji:**
- Otwórz issue z tagiem `documentation`
- Lub stwórz PR z aktualizacją

---

## 📝 Konwencje Dokumentacji

### Format Plików
- **Markdown (.md)** dla całej dokumentacji
- **UTF-8 encoding**
- **LF line endings** (nie CRLF)

### Struktura Dokumentów
```markdown
# Tytuł Dokumentu

Krótki opis (1-2 zdania).

---

## Sekcja 1
Treść...

## Sekcja 2
Treść...

---

**Ostatnia aktualizacja:** DD.MM.YYYY  
**Autor:** Imię Nazwisko
```

### Ikony Emoji
- ✅ - Ukończone
- 🔄 - W trakcie
- ⏳ - Planowane
- ❌ - Anulowane
- ✨ - Nowe
- 🐞 - Bug
- 🚀 - Deployment
- 📋 - Dokumentacja

### Linki Wewnętrzne
```markdown
# Relatywne linki
[ARCHITECTURE.md](./ARCHITECTURE.md)
[README.md](../README.md)

# Sekcje
[Zobacz Architekturę](#architektura)
```

---

## 🎯 Roadmap Dokumentacji

### Q1 2026 (Obecnie)
- ✅ Podstawowa dokumentacja modułów
- ✅ Dokumentacja API
- ✅ Sesje bugfix (Bug #1-9)
- 🔄 Dokumentacja deployment
- ⏳ Użytkownika guide

### Q2 2026 (Planowane)
- ⏳ Video tutorials
- ⏳ Interactive API explorer
- ⏳ Changelog automatyczny
- ⏳ Diagramy architektoniczne (Mermaid)

---

**📚 Dokumentacja tworzona z ❤️ dla zespołu Gościniec Rodzinny**

**Ostatnia aktualizacja:** 09.02.2026 - 12:48 CET  
**Wersja dokumentacji:** 1.2.0
