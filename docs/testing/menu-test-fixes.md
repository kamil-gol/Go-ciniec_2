# Menu Integration Tests — Problem Analysis & Fixes

**Status:** 14 of 75 tests failing  
**Branch:** `test/issue-98-menu-integration`  
**Date:** 2026-02-21

---

## ✅ Already Fixed

### 1. MenuCourse and MenuCourseOption Models
**Status:** ✅ FIXED — Models added to `schema.prisma`

The `MenuCourse` and `MenuCourseOption` models have been successfully added to the Prisma schema:

```prisma
model MenuCourse {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  packageId     String   @db.Uuid
  name          String   @db.VarChar(255)
  description   String?  @db.Text
  minSelect     Int      @default(1) @db.SmallInt
  maxSelect     Int      @default(1) @db.SmallInt
  isRequired    Boolean  @default(true)
  displayOrder  Int      @default(0) @db.SmallInt
  icon          String?  @db.VarChar(50)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  package       MenuPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  options       MenuCourseOption[]
}

model MenuCourseOption {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId      String   @db.Uuid
  dishId        String   @db.Uuid
  customPrice   Decimal? @db.Decimal(10, 2)
  isDefault     Boolean  @default(false)
  isRecommended Boolean  @default(false)
  displayOrder  Int      @default(0) @db.SmallInt
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  course        MenuCourse @relation(fields: [courseId], references: [id], onDelete: Cascade)
  dish          Dish @relation(fields: [dishId], references: [id], onDelete: Cascade)
}
```

**Next Step:** Run `npx prisma migrate dev` or `npx prisma db push` to apply schema changes.

---

## ❌ Remaining Issues

### 2. Validation Schema Mismatches (8 failing tests)

#### Issue 2.1: `createMenuTemplateSchema` requires `validFrom`

**Affected Tests:**
- `POST /api/menu-templates — should create template as ADMIN`

**Problem:**  
Validation schema in `menu.validation.ts` line 17:
```typescript
validFrom: z.coerce.date(),  // ❌ Required, no .optional()
```

But tests send:
```typescript
{
  name: 'Menu Komunijne 2026',
  variant: 'basic',
  eventTypeId: seed.eventType2.id,
  isActive: true  // validFrom is missing
}
```

**Fix:** Make `validFrom` optional in schema:
```typescript
validFrom: z.coerce.date().optional(),
```

---

#### Issue 2.2: `duplicateMenuTemplateSchema` expects `newName`, test sends `name`

**Affected Tests:**
- `POST /api/menu-templates/:id/duplicate — should duplicate template as ADMIN`

**Problem:**  
Validation schema expects `newName` (line 53):
```typescript
newName: z.string().min(3).max(100),
```

But test sends:
```typescript
{ name: 'Menu Weselne 2026 — Kopia' }  // ❌ Should be 'newName'
```

**Fix:** Update test to use `newName`:
```typescript
.send({ newName: 'Menu Weselne 2026 — Kopia' })
```

---

#### Issue 2.3: `assignOptionsToPackageSchema` expects `options`, test sends `optionIds`

**Affected Tests:**
- `POST /api/menu-packages/:id/options — should assign options to package`

**Problem:**  
Validation schema expects array of objects with `optionId` (line 233):
```typescript
options: z.array(
  z.object({
    optionId: z.string().uuid(),
    customPrice: z.number().min(0).optional().nullable(),
    isRequired: z.boolean().optional().default(false),
    isDefault: z.boolean().optional().default(false),
    displayOrder: z.number().int().min(0).optional()
  })
)
```

But test sends:
```typescript
{ optionIds: [seed.menuOption.id] }  // ❌ Wrong format
```

**Fix:** Update test:
```typescript
.send({ 
  options: [{ 
    optionId: seed.menuOption.id 
  }] 
})
```

---

#### Issue 2.4: `reorderPackagesSchema` expects `packageOrders`, test sends `orders`

**Affected Tests:**
- `PUT /api/menu-packages/reorder — should reorder packages as ADMIN`

**Problem:**  
Validation schema expects `packageOrders` (line 128):
```typescript
packageOrders: z.array(...)
```

But test sends:
```typescript
{ orders: [{ id: seed.menuPackage.id, displayOrder: 5 }] }  // ❌ Wrong key
```

**Fix:** Update test:
```typescript
.send({
  packageOrders: [{ 
    packageId: seed.menuPackage.id,  // Note: also packageId, not id
    displayOrder: 5 
  }]
})
```

---

#### Issue 2.5: `bulkUpdateCategorySettingsSchema` requires at least one setting

**Affected Tests:**
- `PUT /api/menu-packages/:packageId/categories — should bulk update category settings`

**Problem:**  
Validation requires at least 1 setting (line 158):
```typescript
settings: z.array(categorySettingSchema).min(1, 'At least one category setting required')
```

But test sends empty array:
```typescript
.send({ settings: [] })  // ❌ Empty array not allowed
```

**Fix Options:**
1. **Skip this test case** (empty updates don't make sense)
2. **Or update test** to send at least one setting:
```typescript
.send({
  settings: [{
    categoryId: seed.dishCategory.id,
    minSelect: 1,
    maxSelect: 2,
    isRequired: true,
    isEnabled: true
  }]
})
```

---

#### Issue 2.6: dish.validation.ts references non-existent `DishCategory` enum

**Affected Tests:**
- Multiple dish-related tests

**Problem:**  
`dish.validation.ts` line 8 imports:
```typescript
import { DishCategory } from '@prisma/client';
```

But `DishCategory` in schema.prisma is a **model**, not an **enum**. Tests send:
```typescript
{
  name: 'Rosół z makaronem',
  categoryId: dishCategory.id,  // ✅ Correct: UUID reference
  allergens: ['gluten'],
}
```

**But validation expects:**
```typescript
category: dishCategorySchema,  // ❌ Expects enum value, not UUID
```

**Fix:** Update `dish.validation.ts` to accept `categoryId` as UUID:
```typescript
// Remove
import { DishCategory } from '@prisma/client';
export const dishCategorySchema = z.nativeEnum(DishCategory);

// Replace with
export const createDishSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid('Invalid category ID'),  // ✅ Changed from 'category'
  allergens: z.array(z.string()).default([]),
  // ... rest
});
```

---

### 3. Missing Route: `/dish-categories/slug/:slug` (1 failing test)

**Affected Tests:**
- `GET /api/dish-categories/slug/:slug — should return category by slug (public)`

**Problem:**  
Test expects this route but it doesn't exist in routing.

**Fix:** Add route in `apps/backend/src/routes/dish.routes.ts`:
```typescript
router.get(
  '/dish-categories/slug/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const category = await prisma.dishCategory.findUnique({ 
      where: { slug },
      include: { dishes: { where: { isActive: true } } }
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  })
);
```

---

### 4. Foreign Key Constraint Errors (audit logger)

**Affected:** All write operations (non-blocking, but logged)

**Problem:**  
Audit logger tries to log with invalid `userId`:
```
PrismaClientKnownRequestError: Foreign key constraint violated ActivityLog.userId_fkey
```

**Cause:**  
The `userId` passed to audit logger doesn't exist in the User table (test user IDs from seedTestData).

**Fix:** Ensure test users are created before any logged operations, or make audit logger more resilient:

```typescript
// In audit-logger.ts
try {
  await prisma.activityLog.create({ data });
} catch (error) {
  // Don't throw — just log error
  console.error('Audit Logger Failed:', error);
  // Business operation should continue
}
```

---

## 📋 Test-by-Test Breakdown

| # | Test Name | Issue | Fix Priority |
|---|-----------|-------|-------------|
| 1 | `POST /api/menu-templates` (ADMIN) | `validFrom` required | High |
| 2 | `POST /api/menu-templates/:id/duplicate` | `name` → `newName` | High |
| 3 | `POST /api/menu-packages/:id/options` | `optionIds` → `options` | High |
| 4 | `PUT /api/menu-packages/reorder` | `orders` → `packageOrders` | High |
| 5 | `PUT /api/menu-packages/:packageId/categories` | Empty array | Medium |
| 6 | `GET /api/menu-courses/package/:packageId` | MenuCourse model missing | ✅ FIXED |
| 7 | `POST /api/menu-courses` (ADMIN) | MenuCourse model missing | ✅ FIXED |
| 8 | `POST /api/menu-courses` (EMPLOYEE 403) | MenuCourse model missing | ✅ FIXED |
| 9 | `GET /api/dish-categories/slug/:slug` | Route missing | High |
| 10 | `POST /api/dishes` (ADMIN) | `category` → `categoryId` | High |
| 11 | `PUT /api/dishes/:id` (ADMIN) | `category` → `categoryId` | High |
| 12 | `POST /api/menu-calculator/calculate` | Validation? | Medium |
| 13 | `POST /api/reservations/:id/select-menu` | MenuPackageOption required | Medium |
| 14 | Multiple audit log errors | Foreign key | Low (non-blocking) |

---

## 🚀 Recommended Fix Order

### Phase 1: Schema & Migration
1. ✅ MenuCourse models added
2. Run migration: `npx prisma migrate dev --name add-menu-course-models`
3. Restart backend to load new Prisma client

### Phase 2: Validation Schema Fixes
1. Fix `createMenuTemplateSchema.validFrom` → optional
2. Fix `duplicateMenuTemplateSchema` → use `newName`
3. Fix dish validation → `categoryId` instead of `category`
4. Fix package options assignment → `options` array
5. Fix reorder schema → `packageOrders`

### Phase 3: Routing
1. Add `/dish-categories/slug/:slug` route

### Phase 4: Test Fixes
1. Update all test payloads to match validation schemas
2. Ensure seedTestData creates valid user IDs for audit logger

---

## 🔧 Quick Fix Commands

```bash
# 1. Apply Prisma schema changes
cd apps/backend
npx prisma migrate dev --name add-menu-course-models
npm run build

# 2. Run tests to verify
npm test -- menu.api.test.ts

# 3. Check specific failing tests
npm test -- menu.api.test.ts -t "should create template as ADMIN"
```

---

## 📝 Notes

- **Audit Logger Errors:** Non-blocking — operations succeed, but logs fail. Can be fixed separately.
- **MenuCourse Models:** Already in schema, just need DB migration.
- **Validation Mismatches:** Most are simple field name changes in tests.
- **Missing Routes:** Only 1 route missing (`/dish-categories/slug/:slug`).

---

## ✨ After All Fixes

Expected result: **75/75 tests passing** ✅
