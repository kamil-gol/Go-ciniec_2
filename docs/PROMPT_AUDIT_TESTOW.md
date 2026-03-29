# Prompt: Pełny audyt pokrycia testami — Claude Opus 4.6

> Użycie: Skopiuj całość poniżej jako prompt do sesji Claude z dostępem do GitHub MCP Tools
> Repozytorium: kamil-gol/Go-ciniec_2
> Data wygenerowania szablonu: 2026-03-29

---

# ROLA I MISJA

Jesteś autonomicznym agentem audytowym AI z pełnym dostępem do repozytorium
GitHub `kamil-gol/Go-ciniec_2` przez GitHub MCP Tools. Twoim zadaniem jest:

1. Przeprowadzić kompleksowy audyt pokrycia testami całego systemu
2. Wygenerować brakujące testy jako commity na GitHub
3. Zaktualizować CI/CD workflows na GitHub
4. Zarejestrować WSZYSTKIE zadania wynikające z audytu jako Issues w backlogu GitHub
5. Ustalić plan autonomicznego działania i wpisać go jako GitHub Milestone
6. Podsumować całość jako Pull Request z pełnym raportem

Działasz w pełni autonomicznie. Nie pytasz o potwierdzenie kroków pośrednich.
Każde działanie wykonujesz bezpośrednio na GitHub przez dostępne narzędzia.
Nie kończysz pracy do momentu gdy wszystkie fazy są wykonane.
Cała komunikacja (Issues, PR, pliki, commity) jest po POLSKU.

================================================================================
FAZA 0 — DEDUPLIKACJA I SETUP ŚRODOWISKA
================================================================================

⚠️ KRYTYCZNE: Przed utworzeniem JAKICHKOLWIEK Issues, MUSISZ wykonać deduplikację.
W poprzednich audytach 8 z 28 issues okazało się duplikatami — to zmarnowany czas.

0.1 Sprawdź zamknięte issues związane z testami
```
gh issue list --repo kamil-gol/Go-ciniec_2 --state closed --label testing --limit 100
gh issue list --repo kamil-gol/Go-ciniec_2 --state closed --label audit --limit 100
gh issue list --repo kamil-gol/Go-ciniec_2 --state closed --label coverage --limit 100
```
Zapisz listę zamkniętych issues i ich zakres — NIE twórz duplikatów.

Znane ukończone prace (NIE raportuj ponownie):
- #249: k6 benchmarki krytycznych endpointów ✅
- #257: Backend coverage 76% → 90% ✅
- #258: Frontend coverage → 90% ✅
- #259: Visual regression tests — Playwright screenshots ✅
- #260: Contract testing — OpenAPI/Zod sync ✅
- #266: Domknięcie luk w pokryciu — backend serwisy + frontend hooki ✅
- #271: k6 performance testy — walidacja CI ✅
- #272: E2E deduplikacja — testDir fix ✅
- #273: E2E: a11y violations + broken selectors ✅
- #274: Visual regression — baseline screenshots ✅
- #285-#297: Hollow tests, k6, coverage 80%, Codecov, component-tests CI ✅
- #436/#437: Audyt bezpieczeństwa — 26 issues, rate limiting, JWT, Zod ✅

0.2 Sprawdź ostatnie 50 commitów
```
git log --oneline -50 main
```
Zidentyfikuj co już zostało naprawione/dodane w testach.

0.3 Utwórz branch audytowy
  Branch: `audit/test-coverage-{YYYY-MM-DD}`
  Bazowany na: `main`

0.4 Utwórz brakujące label-e (sprawdź najpierw `gh label list`)
Istniejące (NIE twórz ponownie): testing, audit, security, performance,
  backend, frontend, database, coverage, enhancement, epic, refactor, bug

Dodaj TYLKO jeśli nie istnieją:
  - "ci-cd"       kolor #059669  opis: "CI/CD pipeline change"
  - "backlog"     kolor #6b7280  opis: "Backlog item from audit"
  - "critical"    — sprawdź czy "priority: critical" już istnieje, użyj tego

0.5 Utwórz Milestone
  Nazwa:  "Test Coverage Audit {YYYY-MM-DD}"
  Due:    30 dni od daty audytu
  Opis:   "Autonomiczny audyt pokrycia testami — wygenerowany przez AI agent"

================================================================================
FAZA 1 — ANALIZA STRUKTURY I KONTEKSTU
================================================================================

1.1 Eksploracja repozytorium
Przejrzyj WSZYSTKIE pliki i katalogi:

Struktura monorepo:
```
apps/backend/     Node.js/Express + Prisma
  ├── src/
  │   ├── controllers/    REST controllers
  │   ├── services/       Logika biznesowa
  │   ├── middlewares/     Auth, upload, validation
  │   ├── routes/          Routing Express
  │   ├── utils/           Helpery, walidacja
  │   ├── types/           TypeScript types
  │   ├── validation/      Zod schemas
  │   ├── i18n/            Tłumaczenia
  │   └── tests/           Testy (unit/, integration/, security/)
  ├── prisma/              Schema + migracje + seedy
  └── fonts/               PDF fonts (Roboto)

apps/frontend/    Next.js 14 + React + TailwindCSS
  ├── app/                 App Router pages
  ├── components/          Komponenty React
  │   ├── ui/              Bazowe (Button, Dialog, Card...)
  │   ├── forms/           Formularze
  │   └── [domain]/        Domenowe (reservation, menu, client...)
  ├── hooks/               Custom hooks
  ├── contexts/            React Context providers
  ├── utils/               Frontend utils
  ├── lib/                 API clients, konfiguracja
  └── __tests__/           Testy frontend

e2e/              Playwright E2E testy
  ├── specs/              Spec files
  └── helpers/            Test helpers

k6/               Testy wydajnościowe
contracts/         Typy współdzielone frontend ↔ backend
scripts/           Skrypty pomocnicze
docs/              Dokumentacja
```

Istniejące konfiguracje testowe do analizy:
  - `jest.config.cjs` (backend)
  - `vitest.config.*` lub konfiguracja w `package.json` (frontend)
  - `playwright.config.ts` (E2E)
  - `docker-compose.test.yml` (środowisko testowe)
  - `codecov.yml` (konfiguracja pokrycia)
  - `Makefile` (komendy: test-unit, test-integration, test-frontend, test-all)

1.2 Analiza historii commitów
Pobierz ostatnie 50 commitów z main i zidentyfikuj:
  - Nowe funkcjonalności wprowadzone BEZ towarzyszących testów
  - Moduły refaktoryzowane — czy testy zostały zaktualizowane?
  - "Hot spots" — pliki modyfikowane najczęściej = obszary wysokiego ryzyka
  - Wzorce nazewnictwa i konwencje testowe stosowane w projekcie

1.3 Inwentaryzacja istniejących testów
Zlokalizuj WSZYSTKIE pliki testowe:
  - `*.test.ts`, `*.spec.ts` w `apps/backend/src/tests/`
  - `*.test.ts`, `*.test.tsx` w `apps/frontend/__tests__/` i `apps/frontend/components/`
  - `*.spec.ts` w `e2e/specs/`
  - `*.js` w `k6/`
  - Policz: ile testów, ile plików, ile describe/it bloków

1.4 Analiza Prisma schema
Przeanalizuj `prisma/schema.prisma`:
  - Wylistuj WSZYSTKIE modele i ich relacje
  - Dla każdego modelu sprawdź czy istnieją:
    - Testy CRUD na serwisie obsługującym ten model
    - Testy walidacji inputów
    - Testy relacji (cascade, onDelete, includes)
  - Zidentyfikuj modele bez jakiegokolwiek pokrycia testami

================================================================================
FAZA 2 — AUDYT POKRYCIA (MACIERZ)
================================================================================

Dla KAŻDEGO modułu oceń pokrycie poniższymi typami testów.
Konstruuj macierz: Moduł → [typy testów] → status (✅/⚠️/❌/N/A)

Status:
  ✅ = pokrycie ≥ 80%, dobre praktyki
  ⚠️ = pokrycie < 80% lub naruszenia praktyk
  ❌ = brak testów
  N/A = nie dotyczy

------------------------------------------------------------------------------
Typy testów — Backend
------------------------------------------------------------------------------

| Typ | Co weryfikuje | Narzędzie |
|-----|---------------|-----------|
| Unit | Izolowane serwisy, utils, walidatory z mockami | Jest |
| Integration | Endpointy API + prawdziwa DB testowa | Jest + Supertest + docker-compose.test.yml |
| Contract | Zgodność odpowiedzi API z typami z contracts/ | Zod + ts-jest |
| Security | Auth JWT, autoryzacja ról, SQL injection, rate limit | Jest + supertest |
| Error handling | Kody HTTP, komunikaty błędów, edge cases | Jest |
| Database | CRUD, relacje, transakcje, Prisma queries | Jest + testowa DB Postgres |
| Validation | Zod schemas w validation/, poprawne/błędne inputy | Jest |

------------------------------------------------------------------------------
Typy testów — Frontend
------------------------------------------------------------------------------

| Typ | Co weryfikuje | Narzędzie |
|-----|---------------|-----------|
| Unit | Hooki, utils, pure functions | Vitest/Jest |
| Component | Renderowanie, props, stany, interakcje | React Testing Library |
| Integration | Przepływ wielokomponentowy, konteksty, MSW | RTL + MSW |
| Visual regression | Zmiany wizualne UI | Playwright screenshots |
| Accessibility | WCAG, aria, nawigacja klawiaturą | jest-axe / axe-core |
| Form validation | Formularze, walidacja klient-side, stany błędów | RTL |

------------------------------------------------------------------------------
Typy testów — Cross-cutting / System
------------------------------------------------------------------------------

| Typ | Co weryfikuje | Narzędzie |
|-----|---------------|-----------|
| E2E | Pełne scenariusze użytkownika | Playwright |
| Performance/Load | Obciążenie endpointów, SLA | k6 |
| Smoke | Krytyczne ścieżki po deployu | k6 smoke / Playwright |
| API Contract | Frontend ↔ Backend zgodność typów | MSW + Zod |

------------------------------------------------------------------------------
Checklist jakości dla KAŻDEGO istniejącego testu
------------------------------------------------------------------------------

  [ ] Testy testują zachowanie, nie implementację
  [ ] Wzorzec AAA (Arrange-Act-Assert) zachowany
  [ ] Każdy test weryfikuje JEDNO zachowanie
  [ ] Test isolation — brak side effects między testami
  [ ] Deterministyczność — brak zależności od czasu, kolejności, losowości
  [ ] Sensowne nazwy opisujące oczekiwane zachowanie
  [ ] Brak duplikacji logiki produkcyjnej w testach
  [ ] Właściwe użycie mocków (nie za dużo, nie za mało)
  [ ] Cleanup po testach (afterEach/afterAll)
  [ ] Testowanie edge cases i obsługi błędów
  [ ] Brak "hollow tests" (testy które niczego nie asertują)

================================================================================
FAZA 3 — ANALIZA WORKFLOWS CI/CD
================================================================================

Przeanalizuj KAŻDY istniejący workflow:

**backend-ci.yml:**
  - Czy uruchamia unit + integration testy?
  - Czy używa docker-compose.test.yml dla izolowanej DB?
  - Czy raportuje pokrycie do codecov?
  - Czy blokuje merge przy spadku pokrycia poniżej threshold?
  - Czy działa na PR do main ORAZ na branches `claude/*`?
  - Czy cache'uje node_modules (npm cache)?

**e2e-tests.yml:**
  - Czy E2E uruchamiane na każdy PR czy tylko na main?
  - Czy środowisko E2E jest prawidłowo izolowane?
  - Czy artefakty (screenshots, videos, traces) zachowywane przy failach?
  - Czy testy uruchamiane równolegle (sharding)?

**frontend-tests.yml:**
  - Czy obejmuje unit + component + integration testy?
  - Czy jest test accessibility (axe)?

**performance-tests.yml:**
  - Czy k6 testy uruchamiane w odpowiednim środowisku?
  - Czy są progi SLA (thresholds)?
  - Czy wyniki archiwizowane/porównywane?

**visual-regression.yml:**
  - Czy baseline screenshots są utrzymywane?
  - Czy jest mechanizm akceptacji nowych baseline-ów?

Braki do zidentyfikowania:
  - Brak consolidated test summary w PR
  - Brak notification przy spadku pokrycia
  - Brak scheduled nightly runs
  - Brak matrix strategy dla różnych wersji Node.js
  - Brak job "All tests required" jako branch protection gate

================================================================================
FAZA 4 — GENEROWANIE BRAKUJĄCYCH TESTÓW NA GITHUB
================================================================================

Dla KAŻDEGO modułu z ❌ lub ⚠️ w macierzy wygeneruj testy i commituj je na
branch audytowy przez `create_or_update_file`.

Zasady generowania:
  1. KONWENCJE PROJEKTU — sprawdź istniejące testy i stosuj te same wzorce,
     importy, struktury, nazewnictwo (np. `describe('ServiceName')`)
  2. TypeScript wszędzie — testy MUSZĄ być `.test.ts` / `.test.tsx`
  3. Wzorzec AAA — Arrange-Act-Assert w każdym teście
  4. Factory functions dla danych testowych zamiast hardcoded obiektów
  5. Jeden behavior per test — atomowe, izolowane przypadki
  6. NIE TWÓRZ hollow tests — każdy test MUSI mieć sensowne expect()
  7. Oznaczenie TODO przy testach wymagających ręcznego uzupełnienia:
     `// TODO: [AUDIT] uzupełnij o dane produkcyjne`
  8. WERYFIKUJ składnię TypeScript przed commitem
  9. Import paths muszą pasować do tsconfig paths projektu

Priorytety (generuj w tej kolejności):
  **[P1] KRYTYCZNE:**
  - Endpointy API bez jakichkolwiek testów integration
  - Serwisy z logiką biznesową bez unit testów
  - Główne user flows bez E2E (rezerwacja, auth, menu, klienci)
  - Modele Prisma z relacjami bez testów CRUD

  **[P2] WAŻNE:**
  - Komponenty React z logiką (formularze, modals) bez testów
  - Custom hooks bez unit testów
  - Utility functions bez unit testów
  - Scenariusze bezpieczeństwa (auth, role-based access)
  - Zod validation schemas bez testów walidacji

  **[P3] SUGESTIA:**
  - Testy dostępności dla kluczowych formularzy
  - Testy edge cases dla istniejących modułów
  - Testy i18n (polskie tłumaczenia)

Konwencja commit messages:
```
[AUDIT] feat(tests): add unit tests for {module}
[AUDIT] feat(tests): add integration tests for {endpoint}
[AUDIT] feat(tests): add e2e test for {user-flow}
[AUDIT] fix(ci): update workflow for {purpose}
```

================================================================================
FAZA 5 — REJESTRACJA BACKLOGU NA GITHUB
================================================================================

⚠️ DEDUPLIKACJA: Przed utworzeniem KAŻDEGO issue sprawdź czy nie istnieje
zamknięty issue o tym samym zakresie (lista z Fazy 0.1). Jeśli tak — POMIŃ.

Po zakończeniu analizy i generowania testów utwórz Issues.
Każdy Issue przypisany do Milestone z Fazy 0.

------------------------------------------------------------------------------
5.1 Issues dla wygenerowanych testów (wymagających weryfikacji)
------------------------------------------------------------------------------

Tytuł:    `[TEST] {Typ testu}: {nazwa modułu/endpointu}`
Labele:   `testing, audit` + (`priority: critical` LUB `enhancement`)
Milestone: "Test Coverage Audit {data}"

Body:
```markdown
## Kontekst
Moduł/plik: `{ścieżka}`
Typ testów: {unit/integration/e2e/...}
Priorytet: [P1]/[P2]/[P3]

## Co zostało zrobione automatycznie
- [x] Wygenerowano testy w `{ścieżka testu}`
- [x] Commit: {sha}

## Co wymaga ręcznego uzupełnienia
- [ ] {lista // TODO: [AUDIT]}
- [ ] Weryfikacja przypadków brzegowych

## Kryteria akceptacji
- [ ] Wszystkie testy przechodzą w CI
- [ ] Pokrycie modułu >= 80%
- [ ] Code review
```

------------------------------------------------------------------------------
5.2 Issues dla braków zbyt złożonych do automatyzacji
------------------------------------------------------------------------------

Tytuł:    `[TEST MANUAL] {Typ testu}: {nazwa modułu}`
Labele:   `testing, audit, backlog` + priorytet
Milestone: "Test Coverage Audit {data}"

Body:
```markdown
## Dlaczego nie zautomatyzowano
{powód: wymaga credenciali, złożona logika domenowa, itp.}

## Przypadki testowe do napisania
{szczegółowy opis}

## Ryzyko przy braku pokrycia
{opis ryzyka}

## Sugerowane podejście
{wskazówki implementacyjne}

## Estymacja: {XS/S/M/L/XL}
```

------------------------------------------------------------------------------
5.3 Issues dla ulepszeń CI/CD
------------------------------------------------------------------------------

Tytuł:    `[CI] {Opis ulepszenia}`
Labele:   `ci-cd, audit, enhancement`

Body:
```markdown
## Problem
{co brakuje lub jest źle skonfigurowane}

## Proponowane rozwiązanie
{konkretny YAML snippet}

## Impact
{co to poprawi}
```

------------------------------------------------------------------------------
5.4 Issues dla refaktoryzacji istniejących testów
------------------------------------------------------------------------------

Tytuł:    `[REFACTOR] Poprawa jakości testów: {moduł}`
Labele:   `testing, refactor, backlog`

Body:
```markdown
## Naruszone praktyki
- {konkretne problemy z cytatami kodu}

## Jak naprawić
{wskazówki z przykładami}
```

------------------------------------------------------------------------------
5.5 MASTER ISSUE — centralny tracker audytu
------------------------------------------------------------------------------

Tytuł:    `[AUDIT MASTER] Podsumowanie audytu pokrycia testami {data}`
Labele:   `audit, epic`
Milestone: "Test Coverage Audit {data}"

Body:
```markdown
## Wyniki audytu

### Statystyki
| Metryka | Wartość |
|---------|---------|
| Pliki przeanalizowane | {N} |
| Commity przeanalizowane | {N} |
| Moduły bez testów | {N} |
| Nowe pliki testowe | {N} |
| Pokrycie PRZED audytem | ~{X}% |
| Pokrycie PO audycie (estymacja) | ~{Y}% |
| Issues w backlogu | {N} |
| Powiązanie z wcześniejszymi audytami | #257, #258, #266, #436 |

### Macierz pokrycia
| Moduł | Unit | Integration | E2E | Perf | Security | A11y | Status |
|-------|------|-------------|-----|------|----------|------|--------|
{wypełnij dla każdego modułu — użyj ✅/⚠️/❌/N/A}

### Wszystkie powiązane Issues
{lista z linkami}

### Pull Request
{link do PR}
```

================================================================================
FAZA 6 — PLAN AUTONOMICZNEGO DZIAŁANIA
================================================================================

6.1 Commituj: `docs/audit/TEST_COVERAGE_PLAN.md`

```markdown
# Plan poprawy pokrycia testami

**Data audytu:** {data}
**Agent:** Claude Opus 4.6
**Branch:** audit/test-coverage-{data}
**Master Issue:** #{numer}
**Kontekst:** Wcześniejsze audyty: #257 (backend 76→90%), #258 (frontend→90%),
              #266 (domknięcie luk), #436 (bezpieczeństwo)

## Sprint 1 (tydzień 1-2) — Krytyczne braki [P1]
| Zadanie | Issue | Estymacja |
|---------|-------|-----------|
{lista [P1]}

## Sprint 2 (tydzień 3-4) — Ważne braki [P2]
| Zadanie | Issue | Estymacja |
|---------|-------|-----------|
{lista [P2]}

## Sprint 3 (tydzień 5-6) — Jakość i sugestie [P3]
| Zadanie | Issue | Estymacja |
|---------|-------|-----------|
{lista [P3]}

## Docelowe metryki
| Metryka | Aktualnie | Cel Sprint 1 | Cel Sprint 3 |
|---------|-----------|--------------|--------------|
| Backend unit coverage | {X}% | 85% | 95% |
| Backend integration coverage | {X}% | 70% | 85% |
| Frontend component coverage | {X}% | 80% | 90% |
| E2E critical paths | {N}/? | 100% | 100% |

## Harmonogram CI/CD
- **Pull Request:** unit + integration + lint + type-check (każdy PR + branches claude/*)
- **Merge to main:** pełna suita: E2E + performance + visual regression
- **Nightly 00:00:** pełna suita na main + raport pokrycia do codecov

## Zasady utrzymania jakości
1. Każdy PR z nową funkcjonalnością MUSI zawierać testy
2. Spadek pokrycia poniżej threshold blokuje merge
3. Codecov raportuje delta pokrycia w każdym PR
4. Kwartalny re-audit tym samym promptem
```

6.2 Commituj workflow: `.github/workflows/audit-ci-enforcement.yml`

```yaml
name: CI Enforcement (post-audit)

on:
  pull_request:
    branches: [main]

jobs:
  coverage-gate:
    name: Coverage Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Run backend tests with coverage
        run: cd apps/backend && npm run test:coverage
      - name: Run frontend tests with coverage
        run: cd apps/frontend && npm run test:coverage
      - name: Check coverage thresholds
        run: |
          echo "Checking coverage thresholds..."
          # Backend: 80% lines, 70% branches
          # Frontend: 75% lines, 65% branches

  test-required:
    name: All Tests Required
    runs-on: ubuntu-latest
    needs: [coverage-gate]
    if: always()
    steps:
      - name: Check results
        run: |
          if [ "${{ needs.coverage-gate.result }}" != "success" ]; then
            echo "Coverage gate failed"
            exit 1
          fi
          echo "All required test suites passed"
```

================================================================================
FAZA 7 — PULL REQUEST Z RAPORTEM
================================================================================

Utwórz PR: `audit/test-coverage-{data}` → `main`
Tytuł: `[AUDIT] Pełny audyt pokrycia testami — {data}`

Body:
```markdown
## Raport Audytu Pokrycia Testami

> Automatycznie wygenerowany przez AI Agent (Claude Opus 4.6)
> Data: {data}
> Repozytorium: kamil-gol/Go-ciniec_2
> Kontekst: Kontynuacja prac #257, #258, #266, #436

---

## Podsumowanie

| Metryka | Wartość |
|---------|---------|
| Pliki przeanalizowane | {N} |
| Commity przeanalizowane | 50 |
| Krytyczne braki [P1] | {N} |
| Ważne braki [P2] | {N} |
| Sugestie [P3] | {N} |
| Nowe pliki testowe | {N} |
| Pokrycie przed → po | ~{X}% → ~{Y}% |
| Issues w backlogu | {N} |

---

## Krytyczne braki naprawione automatycznie
{lista z linkami do commitów}

## Krytyczne braki wymagające ręcznej interwencji
{lista z linkami do Issues}

## Dodane pliki testowe
{lista ścieżek z opisem}

## Zmiany w CI/CD
{opis zmian w workflows}

## Macierz pokrycia
| Moduł | Unit | Int | E2E | Perf | Security | A11y | Status |
|-------|------|-----|-----|------|----------|------|--------|
{pełna macierz}

## Backlog Issues
{lista z numerami, tytułami i priorytetami}

## Plan działania
Szczegóły: `docs/audit/TEST_COVERAGE_PLAN.md`

---
Powiązany Master Issue: #{numer}
Milestone: "Test Coverage Audit {data}"
```

================================================================================
ZASADY DZIAŁANIA AUTONOMICZNEGO
================================================================================

1. NIE pytaj o potwierdzenie kroków pośrednich — działaj do końca
2. KAŻDE działanie (testy, Issues, commit, PR) wykonuj przez GitHub tools
3. NIE pomijaj żadnego katalogu — eksploruj cały filesystem repozytorium
4. DEDUPLIKACJA jest OBOWIĄZKOWA — sprawdź zamknięte issues PRZED tworzeniem nowych
5. JEŚLI nie możesz wygenerować testu — utwórz Issue zamiast pomijać
6. WERYFIKUJ TypeScript syntax przed commitem
7. TRZYMAJ SIĘ konwencji projektu — wzorce z istniejących testów mają priorytet
8. LINKUJ wszystko — Issues ↔ PR ↔ Milestone ↔ Master Issue
9. NIE buduj lokalnie — wszystko działa przez CI na GitHub
10. BRAK hollow tests — każdy test MUSI mieć sensowne asercje

================================================================================
DANE REPOZYTORIUM
================================================================================

  Owner:           kamil-gol
  Repo:            Go-ciniec_2
  Branch audytowy: audit/test-coverage-{YYYY-MM-DD}
  Branch docelowy: main
  Trigger CI:      branches claude/* są obsługiwane w backend-ci.yml

  Makefile commands (na VPS, nie lokalnie):
    make test-unit, make test-integration, make test-frontend, make test-all

  Docker: docker-compose.test.yml (izolowane środowisko testowe)
  VPS: /home/kamil/rezerwacje (dev :4000/:4001, prod :3000/:3001)

================================================================================
DIAGRAM SEKWENCJI WYKONANIA
================================================================================

```
FAZA 0  Deduplikacja (closed issues + git log) + Setup (branch + labels + milestone)
    │
    ▼
FAZA 1  Analiza (pliki + Prisma schema + 50 commitów + istniejące testy)
    │
    ▼
FAZA 2  Audyt pokrycia (macierz: moduł × typ testu × status)
    │
    ▼
FAZA 3  Analiza CI/CD (5 workflows + luki)
    │
    ▼
FAZA 4  Generowanie testów → commit na branch audytowy
    │
    ▼
FAZA 5  Rejestracja backlogu → Issues na GitHub (z deduplikacją!)
    │      5.1 Issues dla wygenerowanych testów
    │      5.2 Issues dla ręcznych braków
    │      5.3 Issues dla CI/CD
    │      5.4 Issues dla refaktoryzacji
    │      5.5 MASTER ISSUE
    ▼
FAZA 6  Plan autonomiczny (docs/audit/ + enforcement workflow)
    │
    ▼
FAZA 7  Pull Request z pełnym raportem
    │
    ▼
GOTOWE — PR + Issues + Milestone + Plan na GitHub
```

================================================================================
START
================================================================================

Zacznij od FAZY 0 i wykonaj WSZYSTKIE fazy po kolei bez przerwy.
Nie kończ pracy do momentu gdy spełnione są WSZYSTKIE warunki:
  ✅ Branch audytowy istnieje z commitami testów
  ✅ Milestone jest utworzony
  ✅ Wszystkie Issues zarejestrowane z właściwymi labelami (BEZ duplikatów!)
  ✅ Master Issue agreguje całość
  ✅ docs/audit/TEST_COVERAGE_PLAN.md commitowany
  ✅ audit-ci-enforcement.yml commitowany
  ✅ Pull Request otwarty z pełnym raportem
