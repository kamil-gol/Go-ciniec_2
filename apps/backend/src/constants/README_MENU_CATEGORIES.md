# Menu Option Categories

## Overview

Menu options are categorized to help users find and filter additional services. Categories are stored in **English** in the database and automatically translated to **Polish** in the frontend UI.

## Why English in Database?

1. **Internationalization Ready**: Easy to add more languages in the future
2. **Code Consistency**: Standard values across codebase
3. **Database Stability**: No need to update database when changing translations
4. **API Clarity**: Clear, universal values in API responses

## Valid Categories

### Standard Categories (English → Polish)

| English (Database) | Polish (UI) | Description | Legacy Formats |
|-------------------|-------------|-------------|----------------|
| `Alcohol` | Alkohol | Alcoholic beverages, bar services | ALCOHOL |
| `Drinks` | Napoje | Non-alcoholic beverages | DRINK, DRINKS |
| `Food` | Jedzenie | Food items, desserts, extras | DESSERT, EXTRA_DISH, FOOD |
| `Animations` | Animacje | Entertainment for children, performers | ANIMATIONS |
| `Decorations` | Dekoracje | Flowers, balloons, table decorations | DECORATION, DECORATIONS |
| `Music` | Muzyka | DJ, live bands, sound equipment | MUSIC |
| `Photo & Video` | Foto & Video | Photography, videography services | PHOTO_VIDEO |
| `Entertainment` | Rozrywka | Games, activities, attractions | ENTERTAINMENT |
| `Services` | Usługi | Additional services | SERVICE, SERVICES |
| `Equipment` | Sprzęt | Rental equipment, technical gear | EQUIPMENT |
| `Additions` | Dodatki | Extra items, upgrades | - |
| `Other` | Inne | Miscellaneous options | OTHER |

## Category Formats

The system supports multiple category formats for backward compatibility:

### ✅ Standard Format (Recommended)
```
"Alcohol", "Drinks", "Food", "Music", etc.
```

### ⚠️ Legacy Formats (Auto-converted)
```
"ALCOHOL" → "Alcohol"
"DRINK" → "Drinks"
"DESSERT" → "Food"
"EXTRA_DISH" → "Food"
"SERVICE" → "Services"
"DECORATION" → "Decorations"
```

### 🇵🇱 Polish Format (Auto-converted)
```
"Alkohol" → "Alcohol"
"Napoje" → "Drinks"
"Jedzenie" → "Food"
"Muzyka" → "Music"
```

## Usage Examples

### Creating a Menu Option (TypeScript)

```typescript
import { MENU_OPTION_CATEGORIES } from '../constants/menuOptionCategories';

const newOption = await prisma.menuOption.create({
  data: {
    name: 'DJ na całą noc',
    category: MENU_OPTION_CATEGORIES.MUSIC, // 'Music'
    priceType: 'FLAT',
    priceAmount: 800,
    description: 'Profesjonalny DJ z własnym sprzętem',
  }
});
```

### API Request (JSON)

```json
POST /api/menu-options
{
  "name": "Tort weselny 3-piętrowy",
  "category": "Food",
  "priceType": "FLAT",
  "priceAmount": 450,
  "description": "Tort z kremem maślanym"
}
```

### API Response (JSON)

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Tort weselny 3-piętrowy",
    "category": "Food",
    "priceType": "FLAT",
    "priceAmount": 450
  }
}
```

**Note**: The frontend will automatically display "Jedzenie" instead of "Food" to users.

## Frontend Translation

Translation happens automatically in the frontend using `translateOptionCategory()` function:

```typescript
// Frontend (apps/frontend/lib/menu-utils.ts)
import { translateOptionCategory } from '@/lib/menu-utils';

const category = 'Music'; // From API
const translated = translateOptionCategory(category); // 'Muzyka'
```

### Features

- **Automatic translation**: English → Polish
- **Fallback handling**: Unknown categories display as-is
- **Smart sorting**: Categories display in preferred order
- **Search support**: Search works with both English and Polish

## Migration

### Running Migration Script

If you have existing options with non-standard categories:

```bash
# From project root
cd /home/kamil/rezerwacje

# Pull latest changes
git pull origin feature/category-api

# Run migration inside Docker container
docker compose exec backend npx tsx scripts/migrate-menu-option-categories.ts
```

### What Gets Migrated

The script will convert:

```
DRINK (27 options)        → Drinks
ALCOHOL (32 options)      → Alcohol
DESSERT (20 options)      → Food
EXTRA_DISH (15 options)   → Food
SERVICE (10 options)      → Services
DECORATION (8 options)    → Decorations
ENTERTAINMENT (7 options) → Entertainment
OTHER (4 options)         → Other
```

### Manual Migration (SQL)

If you prefer SQL:

```sql
-- Inside database container
docker compose exec db psql -U postgres -d rezerwacje

-- Update categories
UPDATE "MenuOption" SET category = 'Alcohol' WHERE category = 'ALCOHOL';
UPDATE "MenuOption" SET category = 'Drinks' WHERE category IN ('DRINK', 'DRINKS');
UPDATE "MenuOption" SET category = 'Food' WHERE category IN ('DESSERT', 'EXTRA_DISH', 'FOOD');
UPDATE "MenuOption" SET category = 'Services' WHERE category IN ('SERVICE', 'SERVICES');
UPDATE "MenuOption" SET category = 'Decorations' WHERE category IN ('DECORATION', 'DECORATIONS');
UPDATE "MenuOption" SET category = 'Entertainment' WHERE category = 'ENTERTAINMENT';
UPDATE "MenuOption" SET category = 'Music' WHERE category = 'MUSIC';
UPDATE "MenuOption" SET category = 'Animations' WHERE category = 'ANIMATIONS';
UPDATE "MenuOption" SET category = 'Equipment' WHERE category = 'EQUIPMENT';
UPDATE "MenuOption" SET category = 'Other' WHERE category = 'OTHER';
```

## Validation

Use the provided utilities to validate category values:

```typescript
import { 
  isValidMenuOptionCategory,
  VALID_MENU_OPTION_CATEGORIES 
} from '../constants/menuOptionCategories';

// Check if valid
if (isValidMenuOptionCategory('Music')) {
  // Valid category
}

// Get all valid values
console.log(VALID_MENU_OPTION_CATEGORIES);
// ['Alcohol', 'Animations', 'Decorations', ...]
```

## Best Practices

### ✅ DO:

- Always use constants from `menuOptionCategories.ts`
- Use English category names in database
- Use exact spelling with proper capitalization (e.g., `Photo & Video`)
- Validate category values before saving to database
- Run migration script when updating from legacy system

### ❌ DON'T:

- Don't use Polish category names in database
- Don't use arbitrary category names not in the list
- Don't use UPPERCASE format for new entries
- Don't hardcode category strings without using constants
- Don't mix different formats in the same system

## Troubleshooting

### Categories Not Translating

**Problem**: Categories show in English instead of Polish

**Solution**:
```bash
# Restart frontend
docker compose restart frontend

# Check if translation file exists
ls apps/frontend/lib/menu-utils.ts
```

### Unknown Category Warning

**Problem**: Migration script reports unknown categories

**Solution**:
1. Check the category spelling in database
2. Add mapping to `CATEGORY_MAPPING` in migration script
3. Re-run migration

### TypeScript Errors

**Problem**: `Type 'string' is not assignable to MenuOptionCategory`

**Solution**:
```typescript
// Cast to type
const category = 'Music' as MenuOptionCategory;

// Or use constants
import { MENU_OPTION_CATEGORIES } from '../constants/menuOptionCategories';
const category = MENU_OPTION_CATEGORIES.MUSIC;
```

## Adding New Categories

### Step 1: Backend Constants

Add to `apps/backend/src/constants/menuOptionCategories.ts`:

```typescript
export const MENU_OPTION_CATEGORIES = {
  // ... existing categories
  NEW_CATEGORY: 'New Category Name',
} as const;
```

### Step 2: Frontend Translation

Add to `apps/frontend/lib/menu-utils.ts`:

```typescript
export const OPTION_CATEGORY_TRANSLATIONS: Record<string, string> = {
  // ... existing translations
  'New Category Name': 'Polska Nazwa Kategorii',
};
```

### Step 3: Update Documentation

Add new category to this file's category table.

### Step 4: Restart Services

```bash
docker compose restart frontend backend
```

## Category Grouping

Categories are displayed in a preferred order in the frontend:

1. **Alkohol** (Alcohol)
2. **Muzyka** (Music)
3. **Foto & Video** (Photo & Video)
4. **Animacje** (Animations)
5. **Dekoracje** (Decorations)
6. **Rozrywka** (Entertainment)
7. **Jedzenie** (Food)
8. **Napoje** (Drinks)
9. **Dodatki** (Additions)
10. **Usługi** (Services)
11. **Sprzęt** (Equipment)
12. Others alphabetically

## API Endpoints

### List Options by Category

```http
GET /api/menu-options?category=Music
```

### Get All Categories

```typescript
// Returns unique categories from all options
const categories = await prisma.menuOption.findMany({
  select: { category: true },
  distinct: ['category'],
});
```

## Related Files

- **Backend Constants**: `apps/backend/src/constants/menuOptionCategories.ts`
- **Frontend Utils**: `apps/frontend/lib/menu-utils.ts`
- **Migration Script**: `apps/backend/scripts/migrate-menu-option-categories.ts`
- **Frontend Components**: 
  - `apps/frontend/components/menu/OptionsSelector.tsx`
  - `apps/frontend/components/menu/OptionCard.tsx`

## Questions?

For questions about categories or translations, contact the development team.
