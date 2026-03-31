# Prompt: Premium UI Implementation — Etap po etapie

> **Kopiuj ten prompt i wklej do nowej sesji Claude Code (VS Code) przy kazdym etapie.**
> **Zmien numer etapu przed uruchomieniem.**

---

## PROMPT DO UZYCIA:

```
Realizuj issue #[NUMER_ISSUE] z repozytorium kamil-gol/Go-ciniec_2.

## Kontekst
To jest czesc planu Premium UI Overhaul (EPIC #519). Pelny audyt UI/UX zostal przeprowadzony w 15 fazach (#520-#534). Raport koncowy z planem implementacji jest w #534. Kazdy etap = osobna galaz, osobny PR.

## Twoje zadanie
1. Przeczytaj issue #[NUMER_ISSUE] — zawiera szczegolowy checklist zadan
2. Przeczytaj raport z odpowiednich faz audytu (linki w issue)
3. Stworz nowa galaz: `feat/premium-ui-etap-[N]`
4. Zrealizuj WSZYSTKIE taski z checklisty w issue
5. Po kazdym tasku — commituj z opisem co zostalo zrobione
6. Uruchom testy: sprawdz czy przechodzą
7. Wypchnij galaz i stworz PR

## Zasady
- NIE buduj lokalnie — daj mi komendy do wykonania na VPS (62.171.189.172)
- NIE kasuj danych z bazy dev
- Testowanie po zmianach:
  ```bash
  cd /home/kamil/rezerwacje
  git pull origin <branch>
  make dev-build
  make logs
  make test-frontend
  ```
- Weryfikacja wizualna: dev.gosciniec.online
- Kazdy commit: opisowy message w jezyku angielskim
- Nie dodawaj feature'ow poza zakresem issue
- Przed edycja pliku — przeczytaj go najpierw

## Kluczowe pliki design system
- `apps/frontend/lib/design-tokens.ts` — tokeny kolorow, spacing, typografii, animacji
- `apps/frontend/lib/status-colors.ts` — kolory statusow
- `apps/frontend/app/globals.css` — CSS variables
- `apps/frontend/tailwind.config.ts` — Tailwind konfiguracja
- `apps/frontend/components/shared/` — wspoldzielone komponenty (PageHero, DetailHero, SectionCard, StatCard, etc.)

## Workflow
Galaz → implementacja → testy → PR → merge → komendy VPS
```

---

## KOLEJNOSC ETAPOW

| Etap | Issue | Opis | Priorytet |
|------|-------|------|-----------|
| **1** | **#535** | Design System Foundation — cleanup + tokeny + bugi | P0 |
| **2** | **#536** | Unifikacja Detail Heroes | P0 |
| **3** | **#537** | Unifikacja kart sekcji (SectionCard) | P0 |
| **4** | **#538** | Unifikacja podsumowania finansowego | P1 |
| **5** | **#539** | Animacje Premium (Framer Motion) | P1 |
| **6** | **#540** | Unifikacja tabel i list | P1 |
| **7** | **#541** | Unifikacja nawigacji zakladek | P2 |
| **8** | **#542** | Premium Polish (glass, noise, micro-interactions) | P2 |
| **9** | **#543** | Responsive Excellence — audyt mobile | P2 |
| **10** | **#544** | Dark Mode Perfection — audyt dark mode | P2 |

## PRZYKLAD UZYCIA

Dla Etapu 1 wklej:
```
Realizuj issue #535 z repozytorium kamil-gol/Go-ciniec_2.
[...reszta promptu...]
```

Dla Etapu 2 wklej:
```
Realizuj issue #536 z repozytorium kamil-gol/Go-ciniec_2.
[...reszta promptu...]
```
