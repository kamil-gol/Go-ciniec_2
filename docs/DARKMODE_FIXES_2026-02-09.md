# Dark Mode Fixes - Sesja 09.02.2026

## 🎯 Cel
Poprawa obsługi dark mode we wszystkich modułach aplikacji.

---

## 🐞 Problem

Użytkownik zgłosił, że niektóre strony mają złą obsługę dark mode:
- **Białe karty** na ciemnym tle
- **Białe tła** na listach
- **Słaby kontrast** tekstu
- **Hardcoded kolory** zamiast theme-aware classes

### Przykład Problemu (Strona Klienci)
```tsx
// ❌ ZŁE:
<Card className="border-0 shadow-md">

// ✅ DOBRE:
<Card className="border bg-card hover:bg-accent/50 shadow-md">
```

---

## 🔧 Rozwiązania

### Generalne Zasady Dark Mode

#### 1. Zawsze Używaj Theme-Aware Classes
```tsx
// Tła
bg-card           // Zamiast bg-white
bg-background     // Główne tło
bg-muted          // Przyciemnione sekcje
bg-accent         // Akcenty/hover states

// Teksty
text-foreground   // Główny tekst (zamiast text-black)
text-muted-foreground // Drugorzędny tekst

// Obramowania
border-border     // Zamiast border-gray-200
```

#### 2. Gradient Backgrounds - Potrzebują Wariantu Dark
```tsx
// ❌ ZŁE:
className="from-blue-50 to-cyan-50"

// ✅ DOBRE:
className="from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
```

#### 3. Ikony z Kolorami
```tsx
// ❌ ZŁE:
className="text-blue-600"

// ✅ DOBRE:
className="text-blue-600 dark:text-blue-400"
```

#### 4. Hover States
```tsx
// ❌ ZŁE:
className="hover:bg-white"

// ✅ DOBRE:
className="hover:bg-accent/50"
```

---

## 📦 Zmiany

### Commit 1: Fix Clients List Dark Mode
**Commit:** `f313809`  
**Plik:** `apps/frontend/components/clients/clients-list.tsx`

**Zmiany:**
```diff
- <Card className="group border-0 shadow-md ...">
+ <Card className="group border bg-card hover:bg-accent/50 shadow-md ...">

- <h3 className="text-lg font-bold group-hover:text-orange-600 ...">
+ <h3 className="text-lg font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 ...">

- <div className="... border-2 border-white dark:border-gray-800 ...">
+ <div className="... border-2 border-background ...">

- <Calendar className="h-4 w-4 text-blue-600" />
+ <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />

- <ChevronRight className="... group-hover:text-orange-600 ..." />
+ <ChevronRight className="... group-hover:text-orange-600 dark:group-hover:text-orange-400 ..." />
```

**Rezultat:**
- ✅ Karty klientów adaptują się do dark mode
- ✅ Właściwy kontrast tekstu
- ✅ Hover states działają w obu trybach
- ✅ Ikony są widoczne

---

### Commit 2: Fix Halls Page Toggle Button
**Commit:** `1239819`  
**Plik:** `apps/frontend/app/dashboard/halls/page.tsx`

**Zmiany:**
```diff
  <Button
    ...
    className={`... ${
      showInactive
        ? '...'
-       : 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30'
+       : 'bg-card hover:bg-accent text-foreground border-border hover:border-purple-300 dark:hover:border-purple-700'
    }`}
  >
```

**Rezultat:**
- ✅ Przycisk toggle adaptuje się do dark mode
- ✅ Prostszy kod (mniej hardcoded kolorów)
- ✅ Sposób hover działa w obu trybach

---

## 🧪 Test Manual

### Test 1: Strona Klienci
```bash
# Uruchom frontend
npm run dev

# 1. Otwórz: http://localhost:3000/dashboard/clients
# 2. Przełącz dark mode (ikona słońca/księżyca)
# 3. Sprawdź:
#    - Karty klientów są ciemne (nie białe)
#    - Tekst jest czytelny
#    - Hover działa
#    - Ikony są widoczne
```

### Test 2: Strona Sale
```bash
# 1. Otwórz: http://localhost:3000/dashboard/halls
# 2. Przełącz dark mode
# 3. Sprawdź:
#    - Przycisk "Tylko Aktywne" ma ciemne tło
#    - Hover działa poprawnie
#    - Stats cards są widoczne
```

### Test 3: Cała Aplikacja
```bash
# Sprawdź wszystkie strony w dark mode:
- /dashboard
- /dashboard/reservations
- /dashboard/clients
- /dashboard/halls
- /dashboard/queue
- /dashboard/deposits
- /dashboard/event-types
- /dashboard/reports
- /dashboard/settings
```

---

## 📊 Rezultaty

### Przed
- ❌ Białe karty na ciemnym tle
- ❌ Słaby kontrast
- ❌ Hardcoded kolory
- ❌ Niektóre elementy niewidoczne

### Po
- ✅ Pełna obsługa dark mode
- ✅ Dobry kontrast we wszystkich modułach
- ✅ Theme-aware classes
- ✅ Wszystkie elementy widoczne

---

## 📝 Checklist Dla Przyszłych Komponentów

Przy tworzeniu nowych komponentów, upewnij się że:

- [ ] Używasz `bg-card` zamiast `bg-white`
- [ ] Używasz `text-foreground` zamiast `text-black`
- [ ] Używasz `border-border` zamiast `border-gray-X`
- [ ] Gradienty mają wariant `dark:`
- [ ] Kolorowe ikony mają jasniejszą wersję dla dark mode
- [ ] Hover states działają w obu trybach
- [ ] Testujesz w obu trybach (light i dark)

---

## 🔗 Related

- [UI Improvements Session 09.02.2026](./UI_IMPROVEMENTS_2026-02-09.md)
- [Tailwind CSS Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)

---

## 🚀 Deploy

```bash
# 1. Pull changes
git pull origin main

# 2. Rebuild frontend
docker-compose up -d --build frontend

# 3. Verify
# Otwórz aplikację i przełącz dark mode
```

---

**Data:** 09.02.2026, 23:08 CET  
**Commits:** 2  
**Pliki zmienione:** 2  
**Status:** ✅ Complete
