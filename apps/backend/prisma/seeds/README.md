# Seeds Documentation

## Overview

Ten folder zawiera dodatkowe skrypty seed dla specyficznych modułów.

## Dostępne Seedy

### `seed-menu.ts` - Menu System Seed

**Uruchomienie:**
```bash
npm run db:seed:menu
```

**Co robi:**
- Czyści istniejące dane menu (DishCategory i Dish)
- Tworzy 10 kategorii dań:
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

- Tworzy ~90 przykładowych dań
- Każde danie ma:
  - Nazwę
  - Opis
  - Alergeny (gluten, dairy, eggs, fish, nuts, itp.)
  - Kolejność wyświetlania
  - Status aktywności

**Wymagania:**
- Działająca baza danych PostgreSQL
- Uruchomione migracje Prisma

**Bezpieczeństwo:**
- ⚠️ **Seed czyści wszystkie istniejące dane menu przed seedowaniem**
- Sprawdza czy dane już istnieją i pyta o potwierdzenie
- Bezpieczny do uruchomienia wielokrotnie (idempotentny)

**Output:**
```
🍽️  Seedowanie danych menu...

📂 Tworzenie kategorii dań...
   ✓ 🍲 Zupy (SOUP)
   ✓ 🥗 Przystawki (APPETIZER)
   ...

✅ Utworzono 10 kategorii

🍽️  Tworzenie dań...
   ✓ Utworzono 10/90 dań...
   ✓ Utworzono 20/90 dań...
   ...

✅ Utworzono 90 dań

═══════════════════════════════════════
📊 PODSUMOWANIE SEEDA MENU
═══════════════════════════════════════
📂 Kategorie:  10
🍽️  Dania:      90

📋 Kategorie z liczbą dań:

   🍲 Zupy                 5 dań
   🥗 Przystawki           5 dań
   🥬 Sałatki              6 dań
   🍖 Dania główne        10 dań
   🍚 Dodatki              8 dań
   🐟 Ryby                 5 dań
   🍰 Desery               8 dań
   🥤 Napoje               5 dań
   🥐 Wypieki              4 dań
   🌱 Wegetariańskie       6 dań

═══════════════════════════════════════
✅ Seed menu zakończony pomyślnie!
═══════════════════════════════════════
```

## Uruchamianie na Serwerze

### Docker (Produkcja)

```bash
# W kontenerze backend
docker compose exec backend npm run db:seed:menu
```

### Lokalne Środowisko

```bash
# Z folderu apps/backend
cd apps/backend
npm run db:seed:menu
```

## Troubleshooting

### Problem: "Cannot find module '@prisma/client'"

**Rozwiązanie:**
```bash
npm run prisma:generate
npm run db:seed:menu
```

### Problem: "Database connection error"

**Rozwiązanie:**
- Sprawdź czy baza PostgreSQL działa: `docker compose ps`
- Sprawdź `.env` czy `DATABASE_URL` jest poprawny
- Spróbuj połączyć się ręcznie: `docker compose exec postgres psql -U rezerwacje`

### Problem: Foreign key constraint error

**Rozwiązanie:**
- Seed automatycznie czyści dane przed seedowaniem
- Jeśli problem występuje, uruchom pełny reset:
  ```bash
  npm run db:reset
  npm run db:seed:menu
  ```

## Modyfikacja Danych

Jeśli chcesz dostosować dane:

1. Edytuj `seed-menu.ts`
2. Zmień kategorie w `DISH_CATEGORIES`
3. Zmień dania w `DISHES`
4. Uruchom ponownie: `npm run db:seed:menu`

## Integracja z Głównym Seedem

Możesz dodać ten seed do głównego `prisma/seed.ts` jeśli chcesz, żeby uruchamiał się automatycznie:

```typescript
// W prisma/seed.ts na końcu main()
import { execSync } from 'child_process';

// ... po zakończeniu głównego seeda

console.log('🍽️  Running menu seed...');
execSync('tsx prisma/seeds/seed-menu.ts', { stdio: 'inherit' });
```
