# 🐛 Sesja Bugfix - 14.02.2026

## 📋 Przegląd

**Data:** 14 lutego 2026, 19:30 - 19:52 CET  
**Branch:** `main`  
**Kontekst:** Naprawa błędów w module Menu — nawigacja, zliczanie pakietów i kodowanie polskich znaków UTF-8

---

## 🎯 Zidentyfikowane Problemy

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
  // 1. Sprawdź _count (na wypadek przyszłego dodania do backendu)
  if (template._count?.packages !== undefined) return template._count.packages
  // 2. Licz z tablicy packages
  if (template.packages) return template.packages.length
  // 3. Fallback
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

**Przykłady błędnego wyświetlania:**

| Wyświetlane | Oczekiwane |
|---|---|
| `Powr\u00f3t do Menu` | Powrót do Menu |
| `Doro\u015bli` | Dorośli |
| `z\u0142` | zł |
| `pakiet\u00f3w` | pakietów |
| `typ\u00f3w wydarze\u0144` | typów wydarzeń |
| `usun\u0105\u0107` | usunąć |
| `Utw\u00f3rz` | Utwórz |

**Przyczyna:**
Przy pushowaniu plików przez GitHub API, polskie znaki zostały zakodowane jako escape sequences z podwójnym backslashem (`\\u00f3` zamiast `\u00f3`), co spowodowało, że w pliku źródłowym zapisał się literalny tekst `\u00f3` zamiast znaku `ó`.

**Poprawka:**
Ponowne pushnięcie obu plików z prawidłowymi znakami UTF-8.

**Dotyczyło znaków:**
- `ó` (\u00f3), `ą` (\u0105), `ć` (\u0107), `ł` (\u0142)
- `ś` (\u015b), `ę` (\u0119), `ń` (\u0144), `ż` (\u017c)

**Pliki:**
- `apps/frontend/app/dashboard/menu/packages/page.tsx`
- `apps/frontend/app/dashboard/menu/templates/page.tsx`

**Commit:** `bb7723764fcc1435024e97e831461b3156a580e5`

---

## ✅ Rezultaty

### Przed naprawą
- ❌ Brak nawigacji powrotnej w Pakiety Menu
- ❌ Wszystkie szablony pokazywały "0 pakietów"
- ❌ Polskie znaki wyświetlane jako `\uXXXX`

### Po naprawie
- ✅ Przycisk "Powrót do Menu" widoczny w `/dashboard/menu/packages`
- ✅ Prawidłowa liczba pakietów wyświetlana przy każdym szablonie
- ✅ Polskie znaki diakrytyczne wyświetlane poprawnie w całym module Menu

---

## 🔄 Deployment

### Komendy
```bash
cd /home/kamil/rezerwacje
git pull origin main
docker compose up --build -d
```

### Ważna uwaga
> ⚠️ **`docker compose restart` NIE wystarczy!** Ponieważ `Dockerfile.dev` kopiuje kod instrukcją `COPY . .`, sam restart uruchamia kontener ze starym obrazem. Konieczne jest `docker compose up --build -d` aby przebudować obraz z nowym kodem.

---

## 📝 Lessons Learned

### 1. Spójność nawigacji w podstronach
- **Problem:** Nowe podstrony modułu (packages) nie miały spójnej nawigacji z istniejącymi (templates)
- **Best Practice:** Przy tworzeniu nowych widoków w module, zawsze kopiować wzorzec nawigacji z istniejących stron

### 2. Niezgodność `_count` vs tablica w API
- **Problem:** Frontend zakładał `_count.packages` z Prisma, ale backend zwracał pełną tablicę `packages[]`
- **Best Practice:** Używać defensywnego podejścia — sprawdzać oba źródła danych z fallbackiem

### 3. Kodowanie UTF-8 przy push przez API
- **Problem:** Polskie znaki zakodowane jako escape sequences w treści plików
- **Best Practice:** Przy pushowaniu plików przez GitHub API upewnić się, że znaki specjalne są przekazywane jako prawdziwe znaki UTF-8, nie jako `\\uXXXX`

---

## 📚 Związane Dokumenty

- [BUGFIX_SESSION_2026-02-11.md](./BUGFIX_SESSION_2026-02-11.md) - Bug #10-13
- [BUGFIX_SESSION_2026-02-09.md](./BUGFIX_SESSION_2026-02-09.md) - Bug #9 Batch Update
- [BUGFIX_SESSION_2026-02-07.md](./BUGFIX_SESSION_2026-02-07.md) - Bug #1-7
- [MENU_IMPLEMENTATION_SUMMARY.md](./MENU_IMPLEMENTATION_SUMMARY.md) - Podsumowanie modułu Menu
- [FRONTEND_MENU_INTEGRATION.md](./FRONTEND_MENU_INTEGRATION.md) - Integracja frontendu z Menu

---

**Status:** ✅ Wszystkie bugi naprawione i zdeployowane  
**Data zakończenia:** 14.02.2026, 19:52 CET  
**Environment:** Production (gosciniec.duckdns.org)  
**Branch:** main
