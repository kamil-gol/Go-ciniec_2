# Seeds Documentation

## Overview

Ten folder zawiera dodatkowe skrypty seed dla specyficznych modułów.

---

## 🚀 Quick Start - Seedowanie Pełnego Menu

**Uruchom wszystkie seedy menu naraz:**
```bash
npm run db:seed:all-menu
```

To uruchomi po kolei:
1. `seed-menu.ts` - kategorie i dania
2. `seed-menu-templates.ts` - szablony, pakiety i opcje

---

## Dostępne Seedy

### 1. `seed-menu.ts` - Kategorie & Dania

**Uruchomienie:**
```bash
npm run db:seed:menu
```

**Co robi:**
- Czyści istniejące dane (DishCategory i Dish)
- **Tworzy 10 kategorii dań:**
  - 🍲 Zupy (SOUP)
  - 🥗 Przystawki (APPETIZER)
  - 🥬 Sałatki (SALAD)
  - 🍖 Dania główne (MAIN_COURSE)
  - 🍚 Dodatki (SIDE_DISH)
  - 🐟 Ryby (FISH)
  - 🍰 Desery (DESSERT)
  - 🥤 Napoje (BEVERAGE)
  - 🥐 Wypieki (PASTRY)
  - 🌱 Wegetariańskie (VEGETARIAN)

- **Tworzy 62 przykładowe dania** z pełnymi danymi
- Każde danie ma alergeny, opis, kolejność

**Wymagania:**
- Działająca baza PostgreSQL
- Uruchomione migracje Prisma

**Bezpieczeństwo:**
- ⚠️ Czyści dane przed seedowaniem
- Idempotentny (można uruchomić wielokrotnie)

---

### 2. `seed-menu-templates.ts` - Szablony, Pakiety & Opcje ⭐ NOWE!

**Uruchomienie:**
```bash
npm run db:seed:menu-templates
```

**Co robi:**
- Czyści istniejące dane (MenuTemplate, MenuPackage, MenuOption, PackageCategorySettings)
- **Tworzy opcje dodatkowe (20+ opcji):**
  - 🎂 Torty (weselny, urodzinowy)
  - 🍫 Fontanna czekoladowa
  - 🍭 Candy bar
  - 🍷 Wino stołowe
  - 🥂 Szampan powitalny
  - 🍺 Bar open (standard & premium)
  - 🥘 Stół serwowany
  - 🍇 Bufet owocowy
  - 🔥 Grill na żywo
  - 🌙 Przekąska nocna
  - 💐 Dekoracje
  - 📸 Ścianka Instagram
  - 📷 Fotobudka
  - 🎵 DJ + nagłośnienie
  - 🎆 Pokaz ogni sztucznych
  - 🌱 Menu specjalne (wegetariańskie, bezglutenowe, dziecięce)

- **Tworzy szablony menu** dla każdego typu wydarzenia (Wesele, Urodziny, Rocznica, etc.)
- **Każdy szablon ma 3 pakiety:**
  1. **Standard** (250 zł/osoba)
     - 1 zupa
     - 2 dania główne
     - 2 dodatki
     - Surówki
     - Deser
     - Kawa/herbata
  
  2. **Premium** (320 zł/osoba) ⭐ Popularny
     - 1-2 zupy
     - 2-3 przystawki
     - 3 dania główne
     - 3 dodatki
     - Surówki + sałatka
     - 2 desery
     - Kawa/herbata
  
  3. **VIP** (400 zł/osoba) 👑 Ekskluzywny
     - 2 zupy
     - 3-4 przystawki premium
     - 3-4 dania główne
     - 1-2 dania rybne
     - 4 dodatki
     - Bufet sałatek (4-6 rodzajów)
     - 3 desery
     - Kawa/herbata/espresso
     - Owoce świeże

- **PackageCategorySettings** - określa ile dań z każdej kategorii trzeba wybrać
- **MenuPackageOption** - łączy pakiety z dostępnymi opcjami dodatkowymi

**Wymagania:**
- **WYMAGANE:** Uruchomiony `seed-menu.ts` (kategorie dań)
- **WYMAGANE:** Istniejące EventTypes w bazie (z głównego seeda)
- Działająca baza PostgreSQL

**Bezpieczeństwo:**
- ⚠️ Czyści dane szablonów przed seedowaniem
- NIE usuwa kategorii ani dań
- Idempotentny

**Output:**
```
🎭 Seedowanie szablonów menu, pakietów i opcji...

📋 Pobieranie typów wydarzeń i kategorii dań...
✓ Znaleziono 5 typów wydarzeń
✓ Znaleziono 10 kategorii dań

🎨 Tworzenie opcji menu...
   ✓ 🎂 Tort weselny 3-piętrowy (25.0 zł)
   ✓ 🍷 Wino stołowe (15.0 zł)
   ...

✅ Utworzono 20 opcji menu

📋 Tworzenie szablonów menu...
   ✓ Menu Wesele 2026
   ✓ Menu Urodziny 2026
   ...

✅ Utworzono 5 szablonów menu
✅ Utworzono 15 pakietów (po 3 dla każdego typu)

═══════════════════════════════════════════════════════════════
📊 PODSUMOWANIE SEEDA MENU
═══════════════════════════════════════════════════════════════
📋 Szablony menu:        5
📦 Pakiety:              15
🎨 Opcje dodatkowe:      20
⚙️  Ustawienia kategorii: 105
🔗 Połączenia opcji:     180

📋 Szablony z liczbą pakietów:

   Wesele               3 pakiety
   Urodziny             3 pakiety
   Rocznica             3 pakiety
   Komunię              3 pakiety
   Inne                 3 pakiety

═══════════════════════════════════════════════════════════════
✅ Seed menu zakończony pomyślnie!
═══════════════════════════════════════════════════════════════
```

---

## Uruchamianie na Serwerze

### Docker (Produkcja)

```bash
# Pełne seedowanie menu
docker compose exec backend npm run db:seed:all-menu

# Lub osobno:
docker compose exec backend npm run db:seed:menu
docker compose exec backend npm run db:seed:menu-templates
```

### Lokalne Środowisko

```bash
# Z folderu apps/backend
cd apps/backend

# Pełne seedowanie
npm run db:seed:all-menu

# Lub osobno:
npm run db:seed:menu
npm run db:seed:menu-templates
```

---

## Troubleshooting

### Problem: "Cannot find module '@prisma/client'"

**Rozwiązanie:**
```bash
npm run prisma:generate
npm run db:seed:all-menu
```

### Problem: "Database connection error"

**Rozwiązanie:**
- Sprawdź czy baza PostgreSQL działa: `docker compose ps`
- Sprawdź `.env` czy `DATABASE_URL` jest poprawny
- Spróbuj połączyć się ręcznie: `docker compose exec postgres psql -U rezerwacje`

### Problem: "Brak typów wydarzeń" (seed-menu-templates)

**Rozwiązanie:**
- Uruchom najpierw główny seed: `npm run db:seed`
- Zawiera EventTypes wymagane przez seed-menu-templates

### Problem: "Brak kategorii dań" (seed-menu-templates)

**Rozwiązanie:**
- Uruchom najpierw: `npm run db:seed:menu`
- seed-menu-templates wymaga istniejących kategorii dań

### Problem: Foreign key constraint error

**Rozwiązanie:**
- Seed automatycznie czyści dane przed seedowaniem
- Jeśli problem występuje, uruchom pełny reset:
  ```bash
  npm run db:reset
  npm run db:seed:all-menu
  ```

---

## Modyfikacja Danych

### Dodawanie nowych dań
1. Edytuj `seed-menu.ts`
2. Dodaj danie do tablicy `DISHES`
3. Uruchom: `npm run db:seed:menu`

### Dodawanie nowych opcji menu
1. Edytuj `seed-menu-templates.ts`
2. Dodaj opcję do tablicy `MENU_OPTIONS`
3. Uruchom: `npm run db:seed:menu-templates`

### Zmiana cen pakietów
1. Edytuj `seed-menu-templates.ts`
2. Zmień `pricePerAdult` w definicjach pakietów
3. Uruchom: `npm run db:seed:menu-templates`

---

## Struktura Danych

```
EventType (Wesele, Urodziny, etc.)
  └─ MenuTemplate (Menu Wesele 2026)
      └─ MenuPackage (Standard, Premium, VIP)
          ├─ PackageCategorySettings (ile dań z każdej kategorii)
          │   └─ DishCategory (Zupy, Dania Główne, etc.)
          │       └─ Dish (konkretne dania)
          └─ MenuPackageOption
              └─ MenuOption (Tort, Bar open, etc.)
```

---

## Integracja z Głównym Seedem

Możesz dodać ten seed do głównego `prisma/seed.ts` jeśli chcesz, żeby uruchamiał się automatycznie:

```typescript
// W prisma/seed.ts na końcu main()
import { execSync } from 'child_process';

// ... po zakończeniu głównego seeda

console.log('🍽️  Running menu seeds...');
execSync('npm run db:seed:all-menu', { stdio: 'inherit' });
```

---

## 📊 Podsumowanie Danych po Seedzie

| Element | Ilość |
|---------|------|
| Kategorie dań | 10 |
| Dania | 62 |
| Opcje dodatkowe | 20+ |
| Szablony menu | ~5 (zależnie od EventTypes) |
| Pakiety | ~15 (3 na typ wydarzenia) |
| Ustawienia kategorii | ~100+ |
| Połączenia opcji | ~180+ |

**Gotowy system menu do użycia!** 🎉
