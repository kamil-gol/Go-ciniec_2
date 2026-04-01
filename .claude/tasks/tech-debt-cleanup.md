# Task: Tech Debt Cleanup Sprint

**Status**: Backlog
**Estimated**: 8.5h (~2 sprints)
**Priority**: Medium (after security/performance fixes)
**Created**: 2026-04-01

---

## Problem Statement

Audyt techniczny z 2026-04-01 zidentyfikował **krytyczne problemy** długu technicznego:
- 11 skryptów fix-*.js/.sh zacommitowanych do repo (powinny być usunięte po użyciu)
- 57 instancji `console.log` w kodzie produkcyjnym zamiast winstona
- 3 deprecate'd symbole wymagające refaktoru
- 4 niedokończone testy [AUDIT]
- Duplikaty logiki dat

## Deliverables

### Phase 1: Quick Wins (1.5h) — Czyszczenie
- [ ] Usuń wszystkie `fix-*.js` i `fix-*.sh` z backendu
- [ ] Usuń `src/scripts/fix-timezone-offset.ts` (jeśli migracja zaaplikowana)
- [ ] Potwierdź że nie ma więcej skryptów pomocniczych

### Phase 2: Logging (2h) — console.log → logger
- [ ] Zastąp 13x `console.warn` w `middlewares/errorHandler.ts` na `logger.warn()`
- [ ] Zastąp 2x `console.error` w `controllers/menu-calculator.controller.ts`
- [ ] Zastąp 2x `console.log` w `controllers/menuTemplate.controller.ts`
- [ ] Zweryfikuj że wszystkie 57 instancji są w testach/skryptach (poza wymienionymi)

### Phase 3: Deprecation (1h) — Usunięcie zastaraych symboli
- [ ] Zastąp używanie deprecated `requireAuth` z `auth.ts:119` na `requirePermission`
- [ ] Zastąp `logAudit` na `logChange` w `audit-logger.ts`
- [ ] Usuń komentarz deprecacji z `i18n/pl.ts:236`
- [ ] Sprawdzić że brak callsites do usuniętych symboli

### Phase 4: Tests (1.5h) — Dokończenie [AUDIT]
- [ ] Dokończ test w `reservationCategoryExtra.service.test.ts:123`
- [ ] Dokończ test w `reservationCategoryExtra.service.test.ts:142`
- [ ] Dodaj test password strength w `auth.api.test.ts:152`
- [ ] Dodaj test error handling w `sql-injection.security.test.ts:100`

### Phase 5: Optional Refactors (2h) — Lepsze kody
- [ ] Wydziel `src/utils/date.utils.ts` z helperami `toDateString()`, `getDateKey()`
- [ ] Zastąp 10+ callsites `.toISOString().substring(0, 10)` na `toDateString()`
- [ ] Review duplikatów logiki w `reservationCategoryExtra.service.ts`

---

## Files Affected

### Crítico (Phase 1-2)
- `apps/backend/fix-*.js` i `fix-*.sh` (11 plików do usunięcia)
- `apps/backend/src/middlewares/errorHandler.ts` (13x console.warn)
- `apps/backend/src/controllers/menu-calculator.controller.ts` (2x)
- `apps/backend/src/controllers/menuTemplate.controller.ts` (2x)

### Ważne (Phase 3-4)
- `apps/backend/src/middlewares/auth.ts` (deprecated symbol)
- `apps/backend/src/utils/audit-logger.ts` (deprecated symbol)
- `apps/backend/src/i18n/pl.ts` (deprecated comment)
- `apps/backend/src/tests/unit/services/reservationCategoryExtra.service.test.ts` (2x TODO)
- `apps/backend/src/tests/integration/auth.api.test.ts` (1x TODO)
- `apps/backend/src/tests/security/sql-injection.security.test.ts` (1x TODO)

### Opcjonalne (Phase 5)
- `apps/backend/src/utils/date.utils.ts` (nowy plik)
- `apps/backend/src/services/queue.service.ts` (8x toISOString)
- `apps/backend/src/services/deposit.service.ts` (2x toISOString)
- `apps/backend/src/services/deposits/deposit-stats.service.ts` (3x toISOString)
- `apps/backend/src/services/queue/queue-operations.service.ts` (3x toISOString)
- `apps/backend/src/services/reservationCategoryExtra.service.ts` (logic review)

---

## Acceptance Criteria

- [ ] Wszystkie 11 skryptów fix usunięte, brak pozostałych fix-*.* w repo
- [ ] Wszystkie console.log/warn/error w kontrolerach/middleware zastąpione na logger
- [ ] Deprecated symbole usunięte, brak callsites do nich
- [ ] Wszystkie 4 [AUDIT] TODO testy dokończone i zielone
- [ ] `npm run test` przechodzi na 100% (bez `console.log` warnings)
- [ ] Commity logiczne, każdy faza w osobnym commicie

---

## How to Run This Task

### Option 1: Automatycznie z agentem (rekomendowane)

```bash
# Podaj full kontekst agentowi
@"developer-agent (agent)" wykonaj tasks z .claude/tasks/tech-debt-cleanup.md focusując się na Phase 1 i Phase 2 najpierw
```

Lub z CLI:
```bash
claude --agent developer-agent ".claude/tasks/tech-debt-cleanup.md — Phase 1 & 2"
```

### Option 2: Manualnie z tym promptem

Skopiuj poniższy prompt i podaj agentowi:

---

## PROMPT DO AGENTA

### Context

Jesteś senior software engineer pracujący nad projektem `go-ciniec` — system rezerwacji sali weselnej. Backend to TypeScript/Express, frontend Next.js, baza PostgreSQL + Prisma.

Przed Tobą task tech debt cleanup na podstawie audytu z 2026-04-01. Projekt znajduje się w `/Users/root/git/go-ciniec-clean`.

### Phase 1: Usuń skrypty fix (15 min)

1. Glob `apps/backend/fix-*.{js,sh}` — powinna być lista:
   ```
   fix-all-tests.sh
   fix-etap1-2.sh
   fix-i18n-tests.sh
   fix-controllers-v3.js
   fix-test-strings.js
   fix-test-strings-v2.js
   fix-v4.js
   fix-v5.js
   fix-v5b.js
   fix-v5c.js
   ```

2. Sprawdź `src/scripts/fix-timezone-offset.ts` — jeśli migracja jest już w schemacie (model ma `createdAt: DateTime @default(now())`), usuń ten plik też

3. Usuń wszystkie znalezione pliki:
   ```bash
   git rm apps/backend/fix-*.{js,sh} apps/backend/src/scripts/fix-timezone-offset.ts
   ```

4. Commituj:
   ```bash
   git commit -m "chore: remove temporary fix scripts"
   ```

### Phase 2: Zastąp console na logger (60 min)

1. **errorHandler.ts** — Przeczytaj `apps/backend/src/middlewares/errorHandler.ts`
   - Grep `console.warn` — powinna być lista ~13 instancji
   - Każdy `console.warn(...)` zamień na `logger.warn(...)`
   - Upewnij się że jest `import { logger }` na górze (powinien być)

2. **menu-calculator.controller.ts** — Przeczytaj `apps/backend/src/controllers/menu-calculator.controller.ts`
   - Grep `console.error` — powinno być 2x
   - Zamień na `logger.error(...)`

3. **menuTemplate.controller.ts** — Przeczytaj `apps/backend/src/controllers/menuTemplate.controller.ts`
   - Grep `console.log` — powinno być 2x
   - Zamień na `logger.info(...)` (info level dla non-error logs)

4. Test że compilation działa:
   ```bash
   cd apps/backend && npm run build
   ```

5. Commituj:
   ```bash
   git commit -m "fix: replace console logs with logger in middleware and controllers"
   ```

### Phase 3: Deprecated symbols (45 min)

1. **auth.ts deprecated** — Przeczytaj `apps/backend/src/middlewares/auth.ts` linia ~119
   - Powinien być komentarz `@deprecated Use requirePermission`
   - Grep w całym `apps/backend/src` gdzie jest używana ta funkcja (np. `requireAuth`)
   - Zastąp wszystkie na `requirePermission`
   - Usuń deprecated funkcję

2. **audit-logger.ts deprecated** — Przeczytaj `apps/backend/src/utils/audit-logger.ts` linia ~76
   - Powinien być `@deprecated Use logChange instead`
   - Grep gdzie jest używana `logAudit`
   - Zastąp na `logChange`

3. **i18n deprecated comment** — Przeczytaj `apps/backend/src/i18n/pl.ts` linia ~236
   - Powinien być komentarz `@deprecated Od 2026-03-05...`
   - Jeśli komentarz jest stary (>1 miesiąc), usuń go

4. Commituj:
   ```bash
   git commit -m "refactor: remove deprecated symbols and migrate to new APIs"
   ```

### Phase 4: Dokończ [AUDIT] testy (90 min)

1. **reservationCategoryExtra.service.test.ts** — Przeczytaj plik
   - Linia 123: `[AUDIT] uzupełnij — oczekiwany błąd dla kategorii bez extraItemPrice`
   - Linia 142: `[AUDIT] uzupełnij wywołanie upsertExtras`
   - Dokończ te testy (sprawdź co powinny testować bazując na serwisie)
   - Upewnij się że mają `expect()` assertiony, nie są puste

2. **auth.api.test.ts** — Przeczytaj plik
   - Linia 152: `Backend may not validate password strength yet (TODO: add validation)`
   - Sprawdź czy serwis ma password strength validator (`isStrongPassword` w utils)
   - Jeśli mamy validator, dodaj test; jeśli nie, dodaj TODO do backlogu (nie tutaj)

3. **sql-injection.security.test.ts** — Przeczytaj plik
   - Linia 100: `queue.service should return 400, not throw unhandled error`
   - Sprawdź czy endpoint queue.* ma error handling middleware
   - Jeśli nie, dodaj error handler lub dokumentuj dlaczego nie powinien

4. Uruchom testy:
   ```bash
   cd apps/backend && npm run test -- reservationCategoryExtra.service.test.ts auth.api.test.ts sql-injection.security.test.ts
   ```

5. Commituj:
   ```bash
   git commit -m "test: complete [AUDIT] test cases for category extras, auth, security"
   ```

---

## Success Indicators

Kiedy task jest skończony:
- `git log --oneline | head -5` pokaże 4-5 nowych commitów (cleanup, logging, deprecated, tests)
- `npm run test` — wszystkie testy zielone, zero `console.log` warnings
- `git status` — clean working tree
- Brak plików `fix-*.js` w backendu
- Brak `console.log/warn/error` w kontrolerach/middleware (poza testami)

---

## Notes

- **Phase 1-2** jest najważniejsza (szybkie winy, + obsługiwane przez wielu programistów)
- **Phase 3** wymaga ostrożności — sprawdzić wszystkie callsites
- **Phase 4** wymaga zrozumienia co każdy test powinien sprawdzać
- **Phase 5** jest opcjonalna, ale poprawi czytelność kodu

Jeśli napotkasz problemy:
- Grep `console\.log|console\.warn|console\.error` przed/po aby potwierdzić że zamieniłeś wszystko
- Sprawdź import `logger` — jeśli brakuje, dodaj `import { logger } from '../services/logger.service'` (lub odpowiednia ścieżka)
- Dla deprecated symboli: najpierw grep gdzie są używane, POTEM usuń starą funkcję

---
