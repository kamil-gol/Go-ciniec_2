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

#### 📅 Moduł Rezerwacje (NOWE! ✨)
- [📁 database/](./database/) - **Dokumentacja bazy danych**
  - Schemat tabel rezerwacji
  - Relacje między tabelami
  - Migracje
- [📁 api/](./api/) - **Dokumentacja API**
  - REST endpoints rezerwacji
  - Przykłady requestów/responses
  - Kody błędów
- [📁 user-guide/](./user-guide/) - **Podręcznik użytkownika**
  - Jak tworzyć rezerwacje
  - Zarządzanie statusami
  - FAQ
- [📁 workflows/](./workflows/) - **Procesy biznesowe**
  - Cykl życia rezerwacji
  - Diagramy przepływów
  - Integracje
- [📁 deployment/](./deployment/) - **Wdrożenie**
  - Instrukcje deployment
  - Konfiguracja środowiska
  - Troubleshooting
- [📁 roadmap/](./roadmap/) - **Plany rozwoju**
  - Znane problemy
  - Feature requests
  - Dług techniczny

#### 📋 Moduł Kolejki
- [📋 QUEUE.md](./QUEUE.md) - **Moduł Kolejki Rezerwacji** (pełna dokumentacja)
  - Architektura systemu kolejki
  - API endpoints (włącznie z batch update)
  - Drag & drop implementation
  - Auto-anulowanie
  - Bugfixy (Bug #9)

#### 📦 Inne Moduły
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

### `/docs` - Struktura Główna
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
│
├── database/                        # 🆕 Dokumentacja bazy danych modułu Rezerwacje
│   ├── README.md
│   ├── RESERVATIONS_SCHEMA.md       # (do utworzenia)
│   ├── DEPOSITS_SCHEMA.md           # (do utworzenia)
│   └── MIGRATIONS.md                # (do utworzenia)
│
├── api/                             # 🆕 Dokumentacja API modułu Rezerwacje
│   ├── README.md
│   ├── RESERVATIONS_API.md          # (do utworzenia)
│   ├── DEPOSITS_API.md              # (do utworzenia)
│   └── QUEUE_API.md                 # (do utworzenia)
│
├── user-guide/                      # 🆕 Podręczniki użytkownika
│   ├── README.md
│   ├── RESERVATIONS_USER_GUIDE.md   # (do utworzenia)
│   ├── QUEUE_USER_GUIDE.md          # (do utworzenia)
│   └── FAQ.md                       # (do utworzenia)
│
├── workflows/                       # 🆕 Procesy biznesowe
│   ├── README.md
│   ├── RESERVATION_WORKFLOWS.md     # (do utworzenia)
│   ├── QUEUE_WORKFLOWS.md           # (do utworzenia)
│   └── STATUS_TRANSITIONS.md        # (do utworzenia)
│
├── deployment/                      # 🆕 Dokumentacja wdrożenia
│   ├── README.md
│   ├── RESERVATIONS_DEPLOYMENT.md   # (do utworzenia)
│   ├── ENVIRONMENT_SETUP.md         # (do utworzenia)
│   └── TROUBLESHOOTING.md           # (do utworzenia)
│
├── roadmap/                         # 🆕 Plany rozwoju i TODO
│   ├── README.md
│   ├── RESERVATIONS_ROADMAP.md      # (do utworzenia)
│   ├── KNOWN_ISSUES.md              # (do utworzenia)
│   └── TECH_DEBT.md                 # (do utworzenia)
│
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
5. **[database/](./database/)** - 🆕 Szczegółowa dokumentacja bazy danych rezerwacji
6. **[api/](./api/)** - 🆕 Szczegółowa dokumentacja API rezerwacji

### Dla QA & Testerów
1. **[E2E_TESTING_PLAN.md](./E2E_TESTING_PLAN.md)** - Plan testów end-to-end
2. **[testing/](./testing/)** - Dokumenty testowe

### Dla DevOps
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Instrukcje deployment
2. **[deployment/](./deployment/)** - 🆕 Szczegółowe instrukcje deployment modułu rezerwacji
3. **[BACKUP.md](./BACKUP.md)** - System backupów

### Dla PM & Product Owners
1. **[SPRINTS.md](./SPRINTS.md)** - Harmonogram i postęp sprintów
2. **[CURRENT_STATUS.md](../CURRENT_STATUS.md)** - Aktualny status projektu
3. **[roadmap/](./roadmap/)** - 🆕 Plany rozwoju i znane problemy

### Dla Użytkowników Końcowych
1. **[user-guide/](./user-guide/)** - 🆕 Podręczniki użytkownika
2. **[workflows/](./workflows/)** - 🆕 Opisy procesów biznesowych

---

## 🔄 Ostatnie Aktualizacje

### 09.02.2026 - Nowa Struktura Dokumentacji Modułu Rezerwacje ✨
- ✅ Utworzono strukturę katalogów dla dokumentacji modułu Rezerwacje
- ✅ Dodano README.md w każdym katalogu z opisem zawartości
- ✅ Katalogi: `database/`, `api/`, `user-guide/`, `workflows/`, `deployment/`, `roadmap/`
- ✅ Zaktualizowano główny indeks dokumentacji

**Nowe katalogi dokumentacji:**
- 📁 `docs/database/` - Szczegółowa dokumentacja schematów bazy danych
- 📁 `docs/api/` - Kompletna dokumentacja REST API dla modułu rezerwacji
- 📁 `docs/user-guide/` - Podręczniki użytkownika i FAQ
- 📁 `docs/workflows/` - Diagramy procesów biznesowych
- 📁 `docs/deployment/` - Instrukcje wdrożenia i konfiguracji
- 📁 `docs/roadmap/` - Plany rozwoju i znane problemy

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

## 📋 Spis Treści
- [Sekcja 1](#sekcja-1)
- [Sekcja 2](#sekcja-2)

## Sekcja 1
Treść...

## Sekcja 2
Treść...

---

## 🔗 Powiązane Dokumenty
- [Link do innego dokumentu](./dokument.md)

## 📅 Historia Zmian
| Data | Wersja | Autor | Zmiany |
|------|--------|-------|--------|
| DD.MM.YYYY | 1.0 | Imię | Wersja inicjalna |

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
- 🆕 - Nowa funkcjonalność
- ⚠️ - Uwaga/Ostrzeżenie
- 💡 - Wskazówka

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
- ✅ Struktura katalogów dla modułu Rezerwacje
- 🔄 Szczegółowa dokumentacja API rezerwacji
- 🔄 Podręcznik użytkownika
- ⏳ Diagramy procesów biznesowych

### Q2 2026 (Planowane)
- ⏳ Video tutorials
- ⏳ Interactive API explorer
- ⏳ Changelog automatyczny
- ⏳ Diagramy architektoniczne (Mermaid)
- ⏳ Dokumentacja w języku angielskim

---

## 📊 Status Dokumentacji

| Moduł | Dokumentacja | API Docs | User Guide | Tests | Status |
|-------|--------------|----------|------------|-------|--------|
| Kolejka | ✅ 100% | ✅ 100% | 🔄 50% | ✅ 90% | **Kompletna** |
| Rezerwacje | 🔄 40% | 🔄 30% | ⏳ 0% | 🔄 60% | **W trakcie** |
| Zaliczki | 🔄 30% | 🔄 20% | ⏳ 0% | 🔄 50% | **W trakcie** |
| Klienci | 🔄 20% | ⏳ 10% | ⏳ 0% | 🔄 40% | **Planowana** |
| Dashboard | ⏳ 10% | ⏳ 0% | ⏳ 0% | ⏳ 20% | **Planowana** |

---

**📚 Dokumentacja tworzona z ❤️ dla zespołu Gościniec Rodzinny**

**Ostatnia aktualizacja:** 09.02.2026 - 16:58 CET  
**Wersja dokumentacji:** 2.0.0  
**Główne zmiany:** Utworzono dedykowaną strukturę dokumentacji dla modułu Rezerwacje
