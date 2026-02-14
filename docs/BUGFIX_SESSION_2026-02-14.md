# 🐛 Sesja Bugfix - 14.02.2026

## 📋 Przegląd

**Data:** 14 lutego 2026  
**Branch:** `main`  

### Sesja 1: 19:30 - 19:52 CET — Menu Module
**Kontekst:** Naprawa błędów w module Menu — nawigacja, zliczanie pakietów i kodowanie polskich znaków UTF-8

### Sesja 2: 23:00 - 23:30 CET — E2E Tests Alignment
**Kontekst:** Dopasowanie testów E2E do faktycznego UI Gościnieca — testy były pisane pod nieistniejące elementy

---

## Sesja 1: Menu Module Fixes

### Bug #14: Brak nawigacji powrotnej w Pakiety Menu
**Priorytet:** 🟡 MEDIUM  
**Status:** ✅ FIXED

**Problem:**
Na stronie `/dashboard/menu/packages` nie było możliwości powrotu do głównego widoku modułu Menu (`/dashboard/menu`). Użytkownik musiał używać nawigacji bocznej zamiast intuicyjnego przycisku powrotnego.

**Porównanie:**
- `templates/page.tsx` — posiadał przycisk "Powrót do Menu" ✅
- `packages/page.tsx` — brak jakiegokolwiek linku powrotnego ❌

**Poprawka:**
Dodano przycisk "Powrót do Menu" z ikoną `ArrowLeft` nad tytułem strony, analogicznie do widoku szablonów:

```tsx
<Link
  href="/dashboard/menu"
  className="inline-flex items-center gap-2 px-4 py-2 mb-6 ..."
>
  <ArrowLeft className="w-4 h-4" />
  Powrót do Menu
</Link>
```

**Pliki:**
- `apps/frontend/app/dashboard/menu/packages/page.tsx`

**Commit:** `637274e7119f7b8f07a37343e4d78679d718d856`

---

### Bug #15: Pakiety = 0 w widoku szablonów menu
**Priorytet:** 🟠 HIGH  
**Status:** ✅ FIXED

**Problem:**
W widoku `/dashboard/menu/templates` przy każdym szablonie wyświetlało się "0 pakietów", mimo że pakiety były prawidłowo przypisane w bazie danych.

**Analiza przyczyny:**
```typescript
// Backend (menu.service.ts -> getMenuTemplates()) zwracał:
// - template.packages[] — pełna tablica pakietów ✅
// - template._count.packages — NIE było zwracane ❌

// Frontend (templates/page.tsx) odczytywał:
template._count?.packages || 0  // Zawsze 0, bo _count nie istniał
```

**Poprawka:**
Dodano funkcję pomocniczą `getPackageCount()` która obsługuje oba źródła danych:

```typescript
const getPackageCount = (template: MenuTemplate): number => {
  if (template._count?.packages !== undefined) return template._count.packages
  if (template.packages) return template.packages.length
  return 0
}
```

**Pliki:**
- `apps/frontend/app/dashboard/menu/templates/page.tsx`

**Commit:** `637274e7119f7b8f07a37343e4d78679d718d856`

---

### Bug #16: Kodowanie polskich znaków — literalne sekwencje `\uXXXX`
**Priorytet:** 🟠 HIGH  
**Status:** ✅ FIXED

**Problem:**
Polskie znaki diakrytyczne wyświetlały się jako literalne sekwencje Unicode zamiast prawidłowych znaków. Dotyczyło obu plików: `packages/page.tsx` i `templates/page.tsx`.

**Przyczyna:**
Przy pushowaniu plików przez GitHub API, polskie znaki zostały zakodowane jako escape sequences z podwójnym backslashem, co spowodowało, że w pliku źródłowym zapisał się literalny tekst `\u00f3` zamiast znaku `ó`.

**Poprawka:**
Ponowne pushnięcie obu plików z prawidłowymi znakami UTF-8.

**Pliki:**
- `apps/frontend/app/dashboard/menu/packages/page.tsx`
- `apps/frontend/app/dashboard/menu/templates/page.tsx`

**Commit:** `bb7723764fcc1435024e97e831461b3156a580e5`

---

## Sesja 2: E2E Tests Alignment

### Bug #17: Testy E2E niedopasowane do faktycznego UI
**Priorytet:** 🔴 CRITICAL  
**Status:** ✅ FIXED (3 iteracje)

**Problem:**
Testy E2E zostały napisane pod założenia dotyczące UI, które nie odpowiadały faktycznemu kodowi komponentów Gościnieca. 5 z 45 testów failowało.

**Analiza — co zakładały testy vs rzeczywistość:**

| Element | Test zakładał | Faktyczny UI | Komponent |
|---------|--------------|-------------|----------|
| User menu | `button[aria-label="Menu użytkownika"]` | **Nie istnieje** — logout bezpośrednio w Sidebar | `Sidebar.tsx` |
| Logout | Dropdown menu → "Wyloguj" | `button:has-text("Wyloguj")` wprost | `Sidebar.tsx` |
| Dashboard heading | `/Dashboard\|Panel/` | `h1` → "Witaj, {firstName}! 👋" | `Header.tsx` |
| Login heading | `/Logowanie/` | `h1` → "Gościniec Rodzinny" | `login/page.tsx` |
| Empty field error | `.text-red-600`, `input:invalid` | `.text-error-600` (custom Tailwind) | `login/page.tsx` |
| Login error text | `.text-error-600` | Matchowało SVG `<AlertCircle>` (pusty tekst!) | `login/page.tsx` |

**Root cause:**
Testy zostały wygenerowane na podstawie założeń o typowym UI (dropdown user menu, standardowe klasy Tailwind), bez weryfikacji faktycznego kodu komponentów `Header.tsx`, `Sidebar.tsx` i `login/page.tsx`.

**Naprawy (3 commity):**

#### Iteracja 1: Refactor całości (`779167c` → `3e42b2d`)
- Usunięto wszystkie referencje do `button[aria-label="Menu użytkownika"]`
- Logout: `button:has-text("Wyloguj")` bezpośrednio w sidebar
- Weryfikacja logowania: `h1` z "Witaj" (Header.tsx)
- Empty credentials: `.text-error-600` selektor
- User info: sprawdzanie sidebar `aside` zamiast dropdown
- **Wynik:** 5 failów → 2 faile

#### Iteracja 2: Fix selektora błędu (`0fe652d`)
- `.text-error-600` matchował `<svg class="text-error-600">` (ikonę AlertCircle) — pusty tekst
- Zmieniono na `.bg-error-50` — kontener `<div>` zawierający "Błąd logowania" + treść błędu
- **Wynik:** 2 faile → 0 failów ✅

#### Wynik końcowy
```
45 tests: 43 passed, 2 skipped, 0 failed
Duration: ~3.0m
```

**Pliki zmienione:**
- `apps/frontend/e2e/fixtures/auth.fixture.ts` — logout helper
- `apps/frontend/e2e/specs/01-auth.spec.ts` — selektory auth testów
- `apps/frontend/e2e/specs/10-bugfix-regression.spec.ts` — uproszczenie regresji

**Commity:**
- `779167c` — initial E2E test implementation
- `3e42b2d` — align E2E tests with actual UI (no user menu dropdown)
- `0fe652d` — error selector targets `.bg-error-50` container instead of SVG icon

---

## ✅ Rezultaty Całego Dnia

### Sesja 1 (Menu Module): 3 bugi naprawione
- ✅ Bug #14: Nawigacja powrotna w Pakiety Menu
- ✅ Bug #15: Zliczanie pakietów w szablonach
- ✅ Bug #16: Kodowanie polskich znaków UTF-8

### Sesja 2 (E2E Tests): 1 bug naprawiony (3 iteracje)
- ✅ Bug #17: Testy E2E dopasowane do faktycznego UI
- ✅ 43/45 testów PASS, 0 FAIL

### Podsumowanie statystyk
| Metryka | Wartość |
|---------|----------|
| Bugi naprawione | 4 (Bug #14-17) |
| Pliki zmienione | 7 |
| Commity | 5 |
| Testy E2E pass | 43/45 |
| Czas sesji 1 | ~22 min |
| Czas sesji 2 | ~30 min |

---

## 📝 Lessons Learned

### Sesja 1

#### 1. Spójność nawigacji w podstronach
- **Problem:** Nowe podstrony modułu (packages) nie miały spójnej nawigacji z istniejącymi (templates)
- **Best Practice:** Przy tworzeniu nowych widoków w module, zawsze kopiować wzorzec nawigacji z istniejących stron

#### 2. Niezgodność `_count` vs tablica w API
- **Problem:** Frontend zakładał `_count.packages` z Prisma, ale backend zwracał pełną tablicę `packages[]`
- **Best Practice:** Używać defensywnego podejścia — sprawdzać oba źródła danych z fallbackiem

#### 3. Kodowanie UTF-8 przy push przez API
- **Problem:** Polskie znaki zakodowane jako escape sequences w treści plików
- **Best Practice:** Przy pushowaniu plików przez GitHub API upewnić się, że znaki specjalne są przekazywane jako prawdziwe znaki UTF-8

### Sesja 2

#### 4. Testy E2E muszą być pisane PO weryfikacji kodu komponentów
- **Problem:** Testy zostały napisane na podstawie założeń ("pewnie jest user menu dropdown"), nie faktycznego kodu
- **Best Practice:** Przed pisaniem testów E2E zawsze sprawdzić faktyczne:
  - `aria-label` w komponentach
  - Klasy CSS (custom vs standardowe Tailwind)
  - Strukturę DOM (co jest parent, co child)

#### 5. CSS class selektory mogą matchować nieoczekiwane elementy
- **Problem:** `.text-error-600` matchowało SVG ikonę (pusty tekst) zamiast paragrafów z błędem
- **Best Practice:** Używać selektorów kontenerów (`.bg-error-50`) lub tag-specific (`p.text-error-700`) zamiast ogólnych klas które mogą być na SVG/ikonach

#### 6. Iteracyjne debugowanie > jednorazowy big-bang fix
- **Problem:** Pierwsza iteracja naprawiła 3/5 failów, dopiero druga dokończyła
- **Best Practice:** Po każdej iteracji uruchomić testy i analizować pozostałe błędy — każdy może mieć inną przyczynę

---

## 🔄 Deployment

### Komendy
```bash
cd /home/kamil/rezerwacje
git pull origin main
docker compose up --build -d
```

### Weryfikacja
```bash
# Testy E2E
docker-compose exec frontend npx playwright test

# Oczekiwany wynik: 43 passed, 2 skipped, 0 failed
```

### Ważna uwaga
> ⚠️ **`docker compose restart` NIE wystarczy!** Ponieważ `Dockerfile.dev` kopiuje kod instrukcją `COPY . .`, sam restart uruchamia kontener ze starym obrazem. Konieczne jest `docker compose up --build -d` aby przebudować obraz z nowym kodem.

---

## 📚 Związane Dokumenty

- [E2E_TESTING_PLAN.md](./E2E_TESTING_PLAN.md) - Aktualny plan testów E2E z selektorami
- [BUGFIX_SESSION_2026-02-11.md](./BUGFIX_SESSION_2026-02-11.md) - Bug #10-13
- [BUGFIX_SESSION_2026-02-09.md](./BUGFIX_SESSION_2026-02-09.md) - Bug #9 Batch Update
- [BUGFIX_SESSION_2026-02-07.md](./BUGFIX_SESSION_2026-02-07.md) - Bug #1-7
- [MENU_IMPLEMENTATION_SUMMARY.md](./MENU_IMPLEMENTATION_SUMMARY.md) - Podsumowanie modułu Menu
- [FRONTEND_MENU_INTEGRATION.md](./FRONTEND_MENU_INTEGRATION.md) - Integracja frontendu z Menu

---

**Status:** ✅ Wszystkie bugi naprawione i zdeployowane  
**Data zakończenia:** 14.02.2026, 23:30 CET  
**Environment:** Production (gosciniec.duckdns.org)  
**Branch:** main
