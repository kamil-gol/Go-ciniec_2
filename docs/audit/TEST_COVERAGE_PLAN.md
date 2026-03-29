# Plan poprawy pokrycia testami

**Data audytu:** 2026-03-29
**Agent:** Claude Opus 4.6
**Branch:** audit/test-coverage-2026-03-29
**Kontekst:** Wcześniejsze audyty: #257 (backend 76→90%), #258 (frontend→90%), #266 (domknięcie luk), #436 (bezpieczeństwo)

## Statystyki repozytorium

| Metryka | Backend | Frontend |
|---------|---------|----------|
| Pliki źródłowe | 207 | 409 |
| Pliki testowe | 169 + 11 nowych | 68 + 3 nowe |
| Kontrolery/Pages pokryte | 32/32 (100%) | 9/119 (8%) |
| Serwisy/Hooks pokryte | 77/93 (83%) | 20/21 (95%) |
| Utils pokryte | 4/12 → 9/12 | 1/33 → 4/33 |
| Middleware pokryte | 8/8 (100%) | N/A |
| Walidacja pokryta | 9/9 (100%) | N/A |

## Sprint 1 (tydzień 1-2) — Krytyczne braki [P1]

| Zadanie | Priorytet | Estymacja |
|---------|-----------|-----------|
| Testy reservation-create.helper — orchestracja 5 etapów | P1 | M |
| Testy reservation-update.helper — orchestracja aktualizacji | P1 | M |
| Testy recalculate-price.ts — kalkulacja cen z extra hours | P1 | S |
| Testy frontend API modules (23 pliki) — MSW mocking | P1 | L |
| Testy frontend pages — 9/119 pokrytych, min. 30 kluczowych | P1 | XL |
| Integration testy brakujących endpointów | P1 | M |

## Sprint 2 (tydzień 3-4) — Ważne braki [P2]

| Zadanie | Priorytet | Estymacja |
|---------|-----------|-----------|
| Testy UI components (33 pliki designsystem) | P2 | L |
| Testy PDF builders (6 plików) | P2 | M |
| Testy archive-scheduler.service | P2 | S |
| Testy frontend form components (>20 formularzy) | P2 | L |
| Coverage enforcement we frontend CI workflow | P2 | S |

## Sprint 3 (tydzień 5-6) — Jakość i sugestie [P3]

| Zadanie | Priorytet | Estymacja |
|---------|-----------|-----------|
| Testy a11y kluczowych formularzy | P3 | M |
| Testy i18n (polskie tłumaczenia) | P3 | S |
| Nightly scheduled CI run | P3 | S |
| Multi-browser E2E (Firefox + Safari) | P3 | M |
| Performance regression tracking w CI | P3 | M |

## Docelowe metryki

| Metryka | Aktualnie | Cel Sprint 1 | Cel Sprint 3 |
|---------|-----------|--------------|--------------|
| Backend unit coverage | ~82% | 90% | 95% |
| Backend integration coverage | ~70% | 80% | 90% |
| Frontend component coverage | ~16% | 50% | 80% |
| Frontend lib/utils coverage | ~12% | 60% | 90% |
| E2E critical paths | 27 specs | 35 specs | 45 specs |

## Harmonogram CI/CD

- **Pull Request:** unit + integration + lint + type-check (każdy PR + branches claude/*)
- **Merge to main:** pełna suita: E2E + performance + visual regression
- **Nightly 00:00:** pełna suita na main + raport pokrycia do codecov

## Zasady utrzymania jakości

1. Każdy PR z nową funkcjonalnością MUSI zawierać testy
2. Spadek pokrycia poniżej threshold blokuje merge
3. Codecov raportuje delta pokrycia w każdym PR
4. Kwartalny re-audit tym samym promptem
