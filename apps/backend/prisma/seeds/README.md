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
1. `seed-menu.ts` - kategorie i dania (62 dania, 10 kategorii)
2. `seed-menu-advanced.ts` - opcje, szablony i pakiety (20 opcji, 3 szablony, 7 pakietów)

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

### 2. `seed-menu-advanced.ts` - Opcje, Szablony & Pakiety ⭐ NOWE!

**Uruchomienie:**
```bash
npm run db:seed:menu:advanced
```

**Co robi:**
- Czyści istniejące dane (MenuOption, MenuTemplate, MenuPackage, PackageCategorySettings)
- **Tworzy 20 opcji dodatkowych menu:**
  
  **🎵 Muzyka & Rozrywka:**
  - 🎧 DJ - Pakiet podstawowy (2000 zł)
  - 🎶 DJ - Pakiet premium (3500 zł)
  - 🎸 Zespół muzyczny (5000 zł)
  - 🎺 Orkiestra (6000 zł)
  - ⏱️ Dodatkowa godzina muzyki (400 zł)
  
  **🎉 Dekoracje:**
  - 🌺 Dekoracja stołów (1500 zł)
  - 🎉 Dekoracja sali - podstawowa (2000 zł)
  - ✨ Dekoracja sali - premium (4000 zł)
  - 📸 Fotobudka (1200 zł)
  
  **🍺 Napoje:**
  - 🍺 Bar alkoholowy - podstawowy (80 zł/os)
  - 🥂 Bar alkoholowy - premium (150 zł/os)
  - 🍸 Barman + drink bar (1500 zł)
  - 🥂 Toast o północy (20 zł/os)
  
  **🎂 Torty & Słodycze:**
  - 🎂 Tort weselny - 3 piętra (800 zł)
  - 🎉 Tort urodzinowy - 2 piętra (500 zł)
  - 🍭 Candy bar (1200 zł)
  
  **🎨 Inne:**
  - 🎨 Animacje dla dzieci (800 zł)
  - 🛌 Noclegi dla gości (100 zł/os)
  - 💼 Koordynator ślubu (2000 zł)
  - 📷 Fotograf + Kamerzysta (4500 zł)

- **Tworzy szablony menu** dla typów wydarzeń:
  - 💍 **Wesele** - Menu Weselne (3 pakiety)
  - 🎉 **Urodziny** - Menu Urodzinowe (2 pakiety)
  - 🙏 **Komunia** - Menu Komunijne (2 pakiety)

- **Pakiety w szablonach:**
  
  **Wesele:**
  1. **Ekonomiczny** (200 zł/os) - Podstawowe menu w atrakcyjnej cenie
  2. **Standard** (280 zł/os) ⭐ - Kompletne menu, popularny wybór
  3. **Premium** (400 zł/os) 👑 - Ekskluzywne menu premium
  
  **Urodziny:**
  1. **Rodzinny** (180 zł/os) - Dla dzieci i dorosłych
  2. **Premium** (250 zł/os) ⭐ - Rozbudowane menu
  
  **Komunia:**
  1. **Komunijny** (220 zł/os) ⭐ - Klasyczne menu
  2. **Rozszerzony** (280 zł/os) - Większy wybór dań

- **PackageCategorySettings** - określa ile dań z każdej kategorii można wybrać
  - Każdy pakiet ma własne limity (min/max) dla każdej kategorii
  - Przykład: Standard Wesele = 1 zupa, 1-2 dania główne, 2-4 dodatki

**Wymagania:**
- **WYMAGANE:** Uruchomiony `seed-menu.ts` (kategorie dań muszą istnieć)
- **WYMAGANE:** Istniejące EventTypes w bazie (z głównego seeda `db:seed`)
- Działająca baza PostgreSQL

**Bezpieczeństwo:**
- ⚠️ Czyści dane szablonów, pakietów i opcji przed seedowaniem
- NIE usuwa kategorii ani dań
- Idempotentny

**Output:**
```
🎉 Seedowanie zaawansowanych danych menu...

🔍 Pobieranie danych z bazy...
   ✓ EventTypes: 7
   ✓ DishCategories: 10

⚙️  Tworzenie opcji menu...
   ✓ 🎧 DJ - Pakiet podstawowy
   ✓ 🍺 Bar alkoholowy - podstawowy
   ✓ 🎂 Tort weselny - 3 piętra
   ...

✅ Utworzono 20 opcji menu

📋 Tworzenie szablonów menu i pakietów...

   ✓ Wesele: 1 szablon, 3 pakiety
   ✓ Urodziny: 1 szablon, 2 pakiety
   ✓ Komunia: 1 szablon, 2 pakiety

✅ Utworzono 3 szablonów i 7 pakietów

✅ Utworzono 42 ustawień kategorii

═══════════════════════════════════════════════════════════
📊 PODSUMOWANIE ZAAWANSOWANEGO SEEDA MENU
═══════════════════════════════════════════════════════════
⚙️  Opcje menu:          20
📋 Szablony menu:       3
📦 Pakiety menu:        7
⚙️  Ustawienia kategorii: 42

🎉 Typy wydarzeń z menu:
   ✓ Wesele - 3 pakiety (Ekonomiczny, Standard, Premium)
   ✓ Urodziny - 2 pakiety (Rodzinny, Premium)
   ✓ Komunia - 2 pakiety (Komunijny, Rozszerzony)

═══════════════════════════════════════════════════════════
✅ Seed zaawansowanego menu zakończony pomyślnie!
═══════════════════════════════════════════════════════════
```

---

## Uruchamianie na Serwerze

### Docker (Produkcja)

```bash
# Pełne seedowanie menu (wszystko naraz)
docker compose exec backend npm run db:seed:all-menu

# Lub osobno:
docker compose exec backend npm run db:seed:menu
docker compose exec backend npm run db:seed:menu:advanced
```

### Lokalne Środowisko

```bash
# Z folderu apps/backend
cd apps/backend

# Pełne seedowanie
npm run db:seed:all-menu

# Lub osobno:
npm run db:seed:menu
npm run db:seed:menu:advanced
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

### Problem: "Brak typów wydarzeń" (seed-menu-advanced)

**Rozwiązanie:**
- Uruchom najpierw główny seed: `npm run db:seed`
- Zawiera EventTypes wymagane przez seed-menu-advanced

### Problem: "Brak kategorii dań" (seed-menu-advanced)

**Rozwiązanie:**
- Uruchom najpierw: `npm run db:seed:menu`
- seed-menu-advanced wymaga istniejących kategorii dań

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
1. Edytuj `seed-menu-advanced.ts`
2. Dodaj opcję do tablicy `MENU_OPTIONS`
3. Uruchom: `npm run db:seed:menu:advanced`

### Zmiana cen pakietów
1. Edytuj `seed-menu-advanced.ts`
2. Zmień `pricePerAdult` w definicjach pakietów
3. Uruchom: `npm run db:seed:menu:advanced`

### Dodawanie nowego pakietu
1. Edytuj `seed-menu-advanced.ts`
2. Dodaj pakiet do odpowiedniego szablonu
3. Skonfiguruj `PackageCategorySettings`
4. Uruchom: `npm run db:seed:menu:advanced`

---

## Struktura Danych

```
EventType (Wesele, Urodziny, Komunia, etc.)
  └─ MenuTemplate (Menu Weselne, Menu Urodzinowe, etc.)
      └─ MenuPackage (Ekonomiczny, Standard, Premium, etc.)
          ├─ PackageCategorySettings (ile dań z każdej kategorii)
          │   └─ DishCategory (Zupy, Dania Główne, Desery, etc.)
          │       └─ Dish (konkretne dania - 62 sztuki)
          └─ MenuPackageOption (opcjonalne dodatki)
              └─ MenuOption (DJ, Tort, Bar open, etc. - 20 opcji)
```

**Przykład dla pakietu "Standard Wesele":**
- Musi zawierać: 1 zupę (required)
- Może zawierać: 1-2 dania główne (required, min 1, max 2)
- Może zawierać: 2-4 dodatki (required, min 2, max 4)
- Może zawierać: 0-2 przystawki (optional)
- Może zawierać: 1-2 desery (required)

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

## 📊 Podsumowanie Danych po Pełnym Seedzie

| Element | Ilość | Skrypt |
|---------|------|--------|
| Kategorie dań | 10 | `seed-menu.ts` |
| Dania | 62 | `seed-menu.ts` |
| Opcje dodatkowe | 20 | `seed-menu-advanced.ts` |
| Szablony menu | 3 | `seed-menu-advanced.ts` |
| Pakiety | 7 | `seed-menu-advanced.ts` |
| Ustawienia kategorii | ~42 | `seed-menu-advanced.ts` |

**Kompletny system menu gotowy do użycia!** 🎉

---

## 💡 Przykładowe Use Case

### Scenariusz: Rezerwacja wesela dla 100 osób

1. **Wybór typu wydarzenia:** Wesele
2. **System automatycznie pokazuje:** "Menu Weselne" z 3 pakietami
3. **Klient wybiera:** Pakiet Standard (280 zł/os)
4. **System prezentuje wybór dań:**
   - 1 zupa (wybór z 5 dostępnych)
   - 2 dania główne (wybór z 10 dostępnych)
   - 3 dodatki (wybór z 8 dostępnych)
   - 1-2 desery (wybór z 8 dostępnych)
5. **Klient dodaje opcje:**
   - DJ - Pakiet premium (3500 zł)
   - Tort weselny 3-piętrowy (800 zł)
   - Bar alkoholowy premium (150 zł × 100 = 15000 zł)
   - Fotobudka (1200 zł)
6. **Kalkulacja końcowa:**
   - Menu: 280 × 100 = 28000 zł
   - Opcje: 3500 + 800 + 15000 + 1200 = 20500 zł
   - **RAZEM: 48500 zł**

---

**Gotowe! Masz teraz pełny, działający system menu z opcjami, szablonami i pakietami.** 🍽️🎉
