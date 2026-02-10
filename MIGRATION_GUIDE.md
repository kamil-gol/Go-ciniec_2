# Migration Guide: Course-based → Category-based Menu System

## 🎯 What Changed?

### Before (Course-based):
```
Package → Courses → Manually selected dishes
         ↓
    "Zupy" (Course)
      - Rosół ✓
      - Żurek ✓
      Choose: 1-2
```

### After (Category-based):
```
Package → Category Settings → ALL dishes from category
         ↓
    SOUP category
      - All 10 soups from library
      Choose: 1-2
```

## 📦 What Was Added?

1. **PackageCategorySettings** - Category limits per package
2. **ADDON** dish category - For paid extras
3. **AddonGroup** - Groups of addon dishes
4. **AddonGroupDish** - Junction table

## ❌ What Was Removed?

- **MenuCourse** table
- **MenuCourseOption** table
- `/courses` management page

## 🚀 Migration Steps

### 1. Pull latest code
```bash
git pull origin feature/menu-courses-dishes-ui
```

### 2. Backup database (IMPORTANT!)
```bash
docker-compose exec db pg_dump -U postgres rezerwacje > backup_before_migration.sql
```

### 3. Run migration
```bash
# Apply new schema
docker-compose exec backend npx prisma migrate dev --name category_based_menu

# Regenerate Prisma Client
docker-compose exec backend npx prisma generate

# Or run manual SQL migration
docker-compose exec backend psql -U postgres -d rezerwacje -f prisma/migrations/20260210_category_based_menu/migration.sql
```

### 4. Restart services
```bash
docker-compose restart backend frontend
```

### 5. Verify migration
```bash
# Check new tables exist
docker-compose exec db psql -U postgres -d rezerwacje -c "\dt Package*"
docker-compose exec db psql -U postgres -d rezerwacje -c "\dt Addon*"

# Check MenuCourse is gone
docker-compose exec db psql -U postgres -d rezerwacje -c "\dt MenuCourse*"
# Should return: Did not find any relation named "menucourse".
```

## 📝 What Happens to Existing Data?

### ✅ Safe (No data loss):
- All **Dishes** are kept
- All **MenuPackages** are kept
- All **MenuTemplates** are kept

### ⚠️ Removed:
- All **Course assignments** are deleted
- Packages get **default category settings**:
  - SOUP: min 1, max 2
  - MAIN_COURSE: min 1, max 1
  - SIDE_DISH: min 2, max 3
  - SALAD: min 1, max 2 (optional)
  - DESSERT: min 1, max 2

### 🔄 Migration automatically:
1. Drops `MenuCourse` and `MenuCourseOption` tables
2. Creates new tables
3. Adds default category settings to ALL existing packages

## 🎨 New UI Flow

### Old: `/dashboard/menu/courses`
- Select template → package → manually add courses → assign dishes

### New: Package edit in `/dashboard/menu`
- Edit package → Configure categories:
  - ✅ Zupy (10 available) → Guest picks 1-2
  - ✅ Dania główne (10 available) → Guest picks 1
  - ✅ Desery (9 available) → Guest picks 1-2
  - ❌ Sałatki - disabled

## 🆕 New Features

### 1. Addon Groups Management
```
/dashboard/menu/addons (NEW PAGE)

- Create addon groups (e.g., "Sosy Premium")
- Add addon dishes to groups
- Set pricing (per person / flat)
- Set selection limits
```

### 2. Faster Package Setup
- No need to manually assign dishes
- Just set category limits
- All active dishes auto-included

### 3. Better Scalability
- Add new dish → instantly available in ALL packages with that category
- No manual updates needed

## 🐛 Rollback (if needed)

```bash
# Restore from backup
docker-compose exec -T db psql -U postgres rezerwacje < backup_before_migration.sql

# Checkout old code
git checkout [previous-commit-hash]

# Restart
docker-compose restart backend frontend
```

## 📞 Support

If migration fails:
1. Check migration logs
2. Verify database connection
3. Ensure backup exists
4. Contact team

## ✅ Post-Migration Checklist

- [ ] Can view packages
- [ ] Can edit package category settings
- [ ] Dishes page works
- [ ] Can create addon groups
- [ ] Old `/courses` page returns 404
- [ ] No console errors
