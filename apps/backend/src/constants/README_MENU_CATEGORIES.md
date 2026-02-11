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

| English (Database) | Polish (UI) | Description |
|-------------------|-------------|-------------|
| `Alcohol` | Alkohol | Alcoholic beverages, bar services |
| `Animations` | Animacje | Entertainment for children, performers |
| `Decorations` | Dekoracje | Flowers, balloons, table decorations |
| `Additions` | Dodatki | Extra food items, upgrades |
| `Photo & Video` | Foto & Video | Photography, videography services |
| `Music` | Muzyka | DJ, live bands, sound equipment |
| `Entertainment` | Rozrywka | Games, activities, attractions |
| `Food` | Jedzenie | Additional food items |
| `Drinks` | Napoje | Non-alcoholic beverages |
| `Services` | Usługi | Additional services |
| `Equipment` | Sprzęt | Rental equipment, technical gear |
| `Other` | Inne | Miscellaneous options |

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

### ❌ DON'T:

- Don't use Polish category names in database
- Don't use arbitrary category names not in the list
- Don't use different capitalizations (e.g., `music` vs `Music`)
- Don't hardcode category strings without using constants

## Adding New Categories

1. **Backend**: Add to `apps/backend/src/constants/menuOptionCategories.ts`
2. **Frontend**: Add translation to `apps/frontend/lib/menu-utils.ts`
3. **Update this documentation**

## Migration

If you have existing options with Polish categories, run a migration:

```typescript
// Example migration script
const categoryMap = {
  'Alkohol': 'Alcohol',
  'Animacje': 'Animations',
  'Muzyka': 'Music',
  // ... etc
};

for (const [polish, english] of Object.entries(categoryMap)) {
  await prisma.menuOption.updateMany({
    where: { category: polish },
    data: { category: english }
  });
}
```

## Questions?

For questions about categories or translations, contact the development team.
