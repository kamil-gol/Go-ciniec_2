# Jak uruchomić Tech Debt Cleanup Task

## Opcja 1: Automatycznie z Agentem (REKOMENDOWANE)

### Szybko — Phase 1 & 2 (najważniejsze)
```bash
@"developer-agent (agent)" wykonaj Phase 1 (usunięcie fix-skryptów) i Phase 2 (console.log → logger) z .claude/tasks/tech-debt-cleanup.md
```

### Pełny task (wszystkie fazy)
```bash
@"developer-agent (agent)" wykonaj wszystkie fazy z .claude/tasks/tech-debt-cleanup.md krok po kroku, committing każdą fazę oddzielnie
```

### Z CLI (background)
```bash
claude --agent developer-agent "Przeczytaj .claude/tasks/tech-debt-cleanup.md sekcję 'PROMPT DO AGENTA' i wykonaj Phase 1 & 2"
```

---

## Opcja 2: Manualnie z pełnym promptem

Skopiuj poniższy prompt do Claude Code:

```
Wykonaj Phase 1 i Phase 2 z tech-debt-cleanup.md:

CONTEXT:
- Project: go-ciniec (wedding venue booking system)
- Backend: apps/backend/ (TypeScript/Express/Prisma)
- Main issue: 11 fix-*.js/.sh scripts left in repo, 57x console.log in production code

PHASE 1 - Cleanup (15 min):
1. List all fix-*.{js,sh} files in apps/backend/
2. Check src/scripts/fix-timezone-offset.ts
3. Remove all of them with: git rm [files]
4. Commit: "chore: remove temporary fix scripts"

PHASE 2 - Logging (60 min):
1. Replace 13x console.warn in middlewares/errorHandler.ts → logger.warn
2. Replace 2x console.error in controllers/menu-calculator.controller.ts → logger.error
3. Replace 2x console.log in controllers/menuTemplate.controller.ts → logger.info
4. Test: npm run build
5. Commit: "fix: replace console logs with logger in middleware and controllers"

After completion:
- npm run test (should pass)
- git log --oneline | head -5 (verify 2 new commits)
- git status (clean working tree)
```

---

## Opcja 3: Fazami (jeśli wolisz robić stopniowo)

### Phase 1 — Cleanup (15 min)
```bash
@"developer-agent (agent)" wykonaj tylko Phase 1 z .claude/tasks/tech-debt-cleanup.md — usuwanie fix-skryptów
```
Czekaj na potwierdzenie że jest gotowe.

### Phase 2 — Logging (60 min) 
```bash
@"developer-agent (agent)" wykonaj Phase 2 z .claude/tasks/tech-debt-cleanup.md — zamiana console.log na logger
```

### Phase 3-5 — Reszta
Kiedy Phase 1 i 2 są zmergowane, uruchom Phase 3 itd.

---

## Jak Weryfikować Rezultat

Po wykonaniu Phase 1 & 2:

```bash
# 1. Sprawdź że skrypty są usunięte
ls apps/backend/fix-* 2>/dev/null  # powinno być: file not found

# 2. Sprawdź że console.log jest zamieniony
grep -r "console\\.log\\|console\\.warn\\|console\\.error" apps/backend/src/middlewares/ apps/backend/src/controllers/
# Powinno być: no matches (w tych katalogach)

# 3. Uruchom build
cd apps/backend && npm run build && echo "✓ Build OK"

# 4. Uruchom testy (nie powinno być console.log warnings)
npm run test 2>&1 | grep -i "console"  
# Powinno być: no matches

# 5. Sprawdź git history
git log --oneline | head -5
# Powinno być 2 nowe commity:
# - chore: remove temporary fix scripts
# - fix: replace console logs with logger...
```

---

## Troubleshooting

### Błąd: "logger is not defined"
- Upewnij się że jest `import { logger }` na górze pliku
- Ścieżka powinna być `../services/logger.service` lub `../utils/logger`
- Sprawdź czy logger.service.ts istnieje w projekcie

### Błąd: "Cannot find module" przy npm run build
- Możliwe że jest zła ścieżka do importu loggera
- Grep `const logger = ` w kontrolerach aby zobaczyć jaka jest istniejąca ścieżka

### Commity się nie tworzą
- Sprawdź `git status` — czy pliki są staged?
- Jeśli nie: `git add [files]` przed committem

---

## Recommended Order

1. **Teraz**: Phase 1 & 2 (1.5h) — szybkie winy, wysoki impact
2. **Następnie**: Phase 3 & 4 (2.5h) — czyści deprecated symbols, kończy testy
3. **Opcjonalnie**: Phase 5 (2h) — refactor dla jakości kodu

---
