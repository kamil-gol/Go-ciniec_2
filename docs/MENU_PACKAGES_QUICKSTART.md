# Menu Packages - Quick Start (30 seconds!)

## ⚡ Quick Deploy

```bash
cd /home/kamil/rezerwacje
git pull origin main
docker compose restart backend frontend
```

✅ **DONE!** System gotowy.

---

## 🎯 Access URLs

```
Frontend:  http://localhost:3000/dashboard/menu/packages
Backend:   http://localhost:3001/api/menu-packages
Docs:      /docs/MENU_PACKAGES_GUIDE.md
```

---

## 🔑 Key Endpoints

### Create Package with Categories
```bash
curl -X POST http://localhost:3001/api/menu-packages \
  -H "Content-Type: application/json" \
  -d '{
    "menuTemplateId": "YOUR_TEMPLATE_ID",
    "name": "Pakiet Standard",
    "pricePerAdult": 150,
    "pricePerChild": 75,
    "categorySettings": [
      {
        "categoryId": "cat-soups",
        "minSelect": 1,
        "maxSelect": 2,
        "isRequired": true,
        "isEnabled": true,
        "displayOrder": 0
      }
    ]
  }'
```

### Update Package Categories (BULK)
```bash
curl -X PUT http://localhost:3001/api/menu-packages/PKG_ID/categories \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {
        "categoryId": "cat-soups",
        "minSelect": 1,
        "maxSelect": 2,
        "isRequired": true,
        "isEnabled": true,
        "displayOrder": 0
      },
      {
        "categoryId": "cat-mains",
        "minSelect": 1.5,
        "maxSelect": 2,
        "isRequired": true,
        "isEnabled": true,
        "displayOrder": 1
      }
    ]
  }'
```

### Get Package Categories
```bash
curl http://localhost:3001/api/menu-packages/PKG_ID/categories
```

### List All Categories
```bash
curl http://localhost:3001/api/dish-categories
```

---

## 📝 Common Patterns

### Pattern 1: Standard Wedding Package
```json
{
  "categorySettings": [
    {"categoryId": "appetizers", "minSelect": 2, "maxSelect": 3, "isRequired": true},
    {"categoryId": "soups", "minSelect": 1, "maxSelect": 1, "isRequired": true},
    {"categoryId": "mains", "minSelect": 2, "maxSelect": 2, "isRequired": true},
    {"categoryId": "sides", "minSelect": 2, "maxSelect": 3, "isRequired": true},
    {"categoryId": "desserts", "minSelect": 1, "maxSelect": 2, "isRequired": false}
  ]
}
```

### Pattern 2: Premium with Half Portions
```json
{
  "categorySettings": [
    {"categoryId": "appetizers", "minSelect": 3, "maxSelect": 4, "isRequired": true},
    {"categoryId": "soups", "minSelect": 1.5, "maxSelect": 2, "isRequired": true},
    {"categoryId": "seafood", "minSelect": 0.5, "maxSelect": 1, "isRequired": false}
  ]
}
```

---

## ⚙️ Frontend Usage

### Import Components
```tsx
import PackageForm from '@/components/menu/PackageForm';
import CategorySettingsSection from '@/components/menu/CategorySettingsSection';
```

### Use Form
```tsx
<PackageForm
  menuTemplateId="tpl-123"
  initialData={existingPackage}  // Optional for edit
  onSuccess={() => router.push('/packages')}
/>
```

---

## 🐞 Quick Troubleshooting

### Issue: No categories in form
```sql
-- Add sample categories
INSERT INTO "DishCategory" (id, slug, name, icon, display_order, is_active)
VALUES
  (uuid_generate_v4(), 'soups', 'Zupy', '🍲', 0, true),
  (uuid_generate_v4(), 'mains', 'Dania główne', '🥩', 1, true);
```

### Issue: 501 Not Implemented
```bash
git pull origin main
docker compose restart backend
```

### Issue: Frontend not saving
Check `PackageForm.tsx` line ~80:
```tsx
const packageData = {
  ...formData,
  categorySettings,  // <-- Must be included!
};
```

---

## 📊 Database Schema (Quick Ref)

```sql
MenuPackage
  ├─ id, name, prices
  └─ categorySettings []

PackageCategorySettings
  ├─ packageId (FK)
  ├─ categoryId (FK)
  ├─ minSelect (Decimal!)
  ├─ maxSelect (Decimal!)
  ├─ isRequired
  ├─ isEnabled
  └─ customLabel

DishCategory
  ├─ id, slug, name
  └─ dishes []
```

---

## 🚀 You're Ready!

Przejdź do:
```
http://localhost:3000/dashboard/menu/packages?templateId=YOUR_TEMPLATE_ID
```

Kliknij "+ Dodaj pakiet" i zacznij!

---

**Pełna dokumentacja:** [`/docs/MENU_PACKAGES_GUIDE.md`](./MENU_PACKAGES_GUIDE.md)
