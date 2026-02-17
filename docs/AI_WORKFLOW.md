# 🤖 AI Assistant Workflow Guide

> **Context for AI Assistants**: To jest przewodnik dla asystentów AI pracujących z tym projektem. Zawiera dostępy, workflow, reguły i szablony.

---

## 📦 Informacje o projekcie

### GitHub
- **Repo**: `kamil-gol/Go-ciniec_2`
- **Branch production**: `main`
- **Wzorzec branchów**: `feature/<nazwa>`, `fix/<nazwa>`, `docs/<nazwa>`
- **Projekt jest prywatny** — raw URLs nie działają, używaj MCP tools

### Deployment (Docker Compose)
- **Ścieżka**: `/home/kamil/rezerwacje`
- **Frontend**: Next.js 14 (port 3000)
- **Backend**: Express + TypeScript (port 3001)
- **Database**: PostgreSQL (port 5432)
  - User: `rezerwacje`
  - DB: `rezerwacje`
- **Cache**: Redis (port 6379)
- **Mailer**: MailHog (port 1025/8025)

### Test Account
```
Email: admin@gosciniecrodzinny.pl
Hasło: Admin123!@#
```

---

## ⚙️ AI Assistant Rules

### 1. Autonomia
- **NIE pytaj o zatwierdzenie** na operacjach GitHub (get_file, create_or_update_file, push_files, create_branch, merge_pull_request)
- **Wykonuj wszystko automatycznie**, użytkownik daje pełne zaufanie
- **Dawaj komendy serwerowe na końcu** — nie każ użytkownikowi robić rzeczy ręcznie

### 2. Workflow

#### A. Sprawdzanie kodu
```bash
mcp_tool_github_mcp_direct_get_file_contents
  owner: kamil-gol
  repo: Go-ciniec_2
  path: <file_path>
  ref: main  # lub branch name
```

#### B. Edycja plików
```bash
mcp_tool_github_mcp_direct_create_or_update_file
  owner: kamil-gol
  repo: Go-ciniec_2
  path: <file_path>
  branch: <branch_name>
  message: "commit message"
  content: "<full_file_content>"
  sha: "<file_sha_if_updating>"  # opcjonalnie
```

#### C. Pushowanie wielu plików (batch)
```bash
mcp_tool_github_mcp_direct_push_files
  owner: kamil-gol
  repo: Go-ciniec_2
  branch: <branch_name>
  message: "commit message"
  files: [
    { path: "...", content: "..." },
    { path: "...", content: "..." }
  ]
```

#### D. Tworzenie PR
```bash
mcp_tool_github_mcp_direct_create_pull_request
  owner: kamil-gol
  repo: Go-ciniec_2
  title: "feat: opis"
  body: "## Opis zmian..."
  head: feature/branch-name
  base: main
  draft: false
```

### 3. Branch Strategy
- **Nowa funkcjonalność** → `feature/<nazwa>` (np. `feature/sprint-10b-phase3-dark-mode`)
- **Bugfix** → `fix/<nazwa>`
- **Dokumentacja** → `docs/<nazwa>`
- **ZAWSZE twórz nowy branch** na nowe zadanie
- **Merguj przez PR** (merge_pull_request lub daj komendę użytkownikowi)

### 4. Dokumentacja
- **Aktualizuj na bieżąco** po każdej większej zmianie
- **Pliki do aktualizacji**:
  - `docs/ARCHITECTURE.md` — architektura, design patterns, technologie
  - `docs/DEVELOPMENT.md` — development workflow, setup, testing
  - `docs/API.md` — API endpoints (jeśli dodajesz nowe)
- **Format zmian**: dodaj datę, numer PR, krótki opis

### 5. Commit Messages (Conventional Commits)
```
feat: nowa funkcjonalność
fix: naprawa błędu
refactor: refaktoring bez zmiany funkcjonalności
docs: aktualizacja dokumentacji
style: formatowanie, whitespace
test: dodanie lub modyfikacja testów
chore: zadania build/CI/CD
```

### 6. Testing Strategy
- **Jeśli modyfikujesz backend** — upewnij się, że testy jednostkowe przechodzą
- **Jeśli modyfikujesz frontend UI** — sprawdź czy nie psuje E2E testów
- **Komendy testów** (daj użytkownikowi jeśli potrzeba):
  ```bash
  cd /home/kamil/rezerwacje
  docker compose exec backend npm test
  docker compose exec frontend npm run test:e2e
  ```

---

## 🐞 Szablon komend serwerowych

Po każdych zmianach w kodzie daj użytkownikowi **batch komend**:

```bash
# 1. Przejdź do projektu
cd /home/kamil/rezerwacje

# 2. Ściągnij zmiany z brancha
git pull origin <branch_name>

# 3. Restart serwisów (jeśli potrzeba)
docker compose restart frontend   # jeśli zmiany w apps/frontend
docker compose restart backend    # jeśli zmiany w apps/backend

# 4. Sprawdź logi (opcjonalnie)
docker compose logs -f frontend --tail=50
docker compose logs -f backend --tail=50

# 5. Jeśli dodałeś nowe dependencies
docker compose exec frontend npm install
docker compose exec backend npm install
docker compose restart frontend
docker compose restart backend

# 6. Jeśli zmieniłeś schemat Prisma
docker compose exec backend npx prisma migrate dev --name <migration_name>
docker compose exec backend npx prisma generate
docker compose restart backend
```

---

## 📢 Szablon onboardingu (dla nowej sesji AI)

> Użytkownik może to wkleić na początku nowej konwersacji z AI:

```markdown
## Projekt: Gościniec Rodzinny - System Rezerwacji

**GitHub**: kamil-gol/Go-ciniec_2 (prywatne repo)
**Stack**: Next.js 14, Express, PostgreSQL, Docker Compose
**Deploy**: /home/kamil/rezerwacje (serwer VPS)

### Dostępy:
- **DB**: postgres://rezerwacje@localhost:5432/rezerwacje
- **Test account**: admin@gosciniecrodzinny.pl / Admin123!@#

### Workflow dla Ciebie:
1. **Sprawdzasz kod**: `mcp_tool_github_mcp_direct_get_file_contents` → repo: kamil-gol/Go-ciniec_2
2. **Edytujesz pliki**: `mcp_tool_github_mcp_direct_create_or_update_file` lub `push_files` (batch)
3. **Twórz nowy branch** na każdą nową funkcjonalność: `feature/<nazwa>`
4. **Aktualizuj dokumentację** na bieżąco (docs/ARCHITECTURE.md, docs/DEVELOPMENT.md)
5. **Daj mi komendy** na końcu do wykonania na serwerze (git pull, docker restart)

### Zasady:
- **NIE pytaj o zatwierdzenie** operacji na GitHub — wykonuj automatycznie
- **Nie każ mi robić rzeczy ręcznie** — Ty wszystko zorganizuj, ja tylko uruchamiam komendy
- **Projekt jest w Dockerze** — pliki zapisuj bezpośrednio do repo (nie do lokalnego folderu)

### Ostatnia sesja:
- **Skonczyliśmy na**: [wpisz tutaj co było robione]
- **Aktualny branch**: [nazwa brancha]
- **Następne kroki**: [co teraz trzeba zrobić]
```

---

## 📖 Przydatne linki
- Architecture: `docs/ARCHITECTURE.md`
- Development: `docs/DEVELOPMENT.md`
- API Reference: `docs/API.md`
- Changelog: `docs/CHANGELOG.md`

---

**Created**: 17.02.2026
**Last Updated**: 17.02.2026, 21:00 CET
