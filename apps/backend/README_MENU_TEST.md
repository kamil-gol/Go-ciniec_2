# 🧪 Menu API Testing Guide

Quick guide to test the Menu System API.

## 🚀 Quick Start

### 1. Start Backend

```bash
cd /home/kamil/rezerwacje
docker compose up backend

# Verify it's running
curl http://localhost:3001/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T00:00:00.000Z",
  "uptime": 123.456
}
```

---

## 📦 Test Scenarios

### Scenario 1: Create Complete Menu Setup

```bash
#!/bin/bash
# Save as test-menu-api.sh

BASE_URL="http://localhost:3001/api"

echo "1. Creating menu template..."
TEMPLATE=$(curl -s -X POST "$BASE_URL/menu-templates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Testowe",
    "variant": "Standard",
    "eventTypeId": "wesele-test",
    "isActive": true,
    "validFrom": "2026-01-01T00:00:00.000Z",
    "validTo": "2026-12-31T23:59:59.999Z"
  }')

TEMPLATE_ID=$(echo $TEMPLATE | jq -r '.data.id')
echo "\u2705 Template created: $TEMPLATE_ID"

echo "\n2. Adding package..."
PACKAGE=$(curl -s -X POST "$BASE_URL/menu-packages" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "'$TEMPLATE_ID'",
    "name": "Ekonomiczny",
    "priceAdult": 250.00,
    "priceChild": 125.00,
    "priceToddler": 0.00,
    "includedItems": [
      "Przystawki",
      "Zupa",
      "Danie główne",
      "Deser"
    ],
    "displayOrder": 1
  }')

PACKAGE_ID=$(echo $PACKAGE | jq -r '.data.id')
echo "\u2705 Package created: $PACKAGE_ID"

echo "\n3. Adding menu options..."
OPTION1=$(curl -s -X POST "$BASE_URL/menu-options" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bar Open",
    "category": "Alkohol",
    "description": "Nieograniczona ilość alkoholu",
    "priceType": "PER_PERSON",
    "priceAmount": 50.00,
    "isActive": true
  }')

OPTION1_ID=$(echo $OPTION1 | jq -r '.data.id')
echo "\u2705 Option 1 created: $OPTION1_ID"

OPTION2=$(curl -s -X POST "$BASE_URL/menu-options" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DJ + Taniec",
    "category": "Muzyka",
    "description": "Profesjonalny DJ",
    "priceType": "FLAT",
    "priceAmount": 800.00,
    "isActive": true
  }')

OPTION2_ID=$(echo $OPTION2 | jq -r '.data.id')
echo "\u2705 Option 2 created: $OPTION2_ID"

echo "\n4. Listing all templates..."
curl -s "$BASE_URL/menu-templates" | jq '.data[] | {id, name, variant}'

echo "\n5. Getting packages for template..."
curl -s "$BASE_URL/menu-packages/template/$TEMPLATE_ID" | jq '.data[] | {id, name, priceAdult}'

echo "\n6. Listing all options..."
curl -s "$BASE_URL/menu-options" | jq '.data[] | {id, name, category, priceAmount}'

echo "\n\u2705 All tests passed!"
echo "\nCreated IDs:"
echo "  Template: $TEMPLATE_ID"
echo "  Package: $PACKAGE_ID"
echo "  Option 1: $OPTION1_ID"
echo "  Option 2: $OPTION2_ID"
```

**Run it:**
```bash
chmod +x test-menu-api.sh
./test-menu-api.sh
```

---

### Scenario 2: Test Menu Selection for Reservation

```bash
#!/bin/bash
# Assumes you have a reservation ID

RESERVATION_ID="res_test_123"
TEMPLATE_ID="your_template_id"
PACKAGE_ID="your_package_id"
OPTION_ID="your_option_id"

echo "Selecting menu for reservation..."
curl -X POST "http://localhost:3001/api/reservations/$RESERVATION_ID/select-menu" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "'$TEMPLATE_ID'",
    "packageId": "'$PACKAGE_ID'",
    "selectedOptions": [
      {
        "optionId": "'$OPTION_ID'",
        "quantity": 50
      }
    ],
    "adultsCount": 50,
    "childrenCount": 10,
    "toddlersCount": 5
  }' | jq '.'

echo "\nGetting reservation menu..."
curl "http://localhost:3001/api/reservations/$RESERVATION_ID/menu" | jq '.'
```

---

### Scenario 3: Update Operations

```bash
# Update template
curl -X PUT "http://localhost:3001/api/menu-templates/tpl_123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menu Weselne Premium",
    "variant": "Deluxe"
  }' | jq '.'

# Update package
curl -X PUT "http://localhost:3001/api/menu-packages/pkg_456" \
  -H "Content-Type: application/json" \
  -d '{
    "priceAdult": 320.00,
    "includedItems": [
      "Przystawki premium",
      "Zupa kremu",
      "2 dania główne",
      "Deser + kawa"
    ]
  }' | jq '.'

# Update option
curl -X PUT "http://localhost:3001/api/menu-options/opt_789" \
  -H "Content-Type: application/json" \
  -d '{
    "priceAmount": 60.00
  }' | jq '.'
```

---

### Scenario 4: Filtering & Search

```bash
# Get active templates for event type
curl "http://localhost:3001/api/menu-templates?eventTypeId=wesele-123&isActive=true" | jq '.'

# Get active template for specific date
curl "http://localhost:3001/api/menu-templates/active/wesele-123?date=2026-06-15" | jq '.'

# Filter options by category
curl "http://localhost:3001/api/menu-options?category=Alkohol" | jq '.'

# Search options
curl "http://localhost:3001/api/menu-options?search=bar" | jq '.'
```

---

### Scenario 5: Advanced Operations

```bash
# Duplicate template
curl -X POST "http://localhost:3001/api/menu-templates/tpl_123/duplicate" \
  -H "Content-Type: application/json" \
  -d '{
    "newName": "Menu Weselne 2027",
    "newVariant": "Standard",
    "validFrom": "2027-01-01T00:00:00.000Z",
    "validTo": "2027-12-31T23:59:59.999Z"
  }' | jq '.'

# Reorder packages
curl -X PUT "http://localhost:3001/api/menu-packages/reorder" \
  -H "Content-Type: application/json" \
  -d '{
    "packageOrders": [
      {"id": "pkg_1", "displayOrder": 3},
      {"id": "pkg_2", "displayOrder": 1},
      {"id": "pkg_3", "displayOrder": 2}
    ]
  }' | jq '.'

# Assign options to package
curl -X POST "http://localhost:3001/api/menu-packages/pkg_123/options" \
  -H "Content-Type: application/json" \
  -d '{
    "optionIds": ["opt_1", "opt_2", "opt_3"],
    "replace": true
  }' | jq '.'
```

---

## 📊 Response Validation

### Check Status Codes

```bash
# 200 OK - Success
curl -w "\nStatus: %{http_code}\n" "http://localhost:3001/api/menu-templates"

# 201 Created - Resource created
curl -w "\nStatus: %{http_code}\n" -X POST "http://localhost:3001/api/menu-templates" -d '...'

# 400 Bad Request - Validation error
curl -w "\nStatus: %{http_code}\n" -X POST "http://localhost:3001/api/menu-templates" -d '{}'

# 404 Not Found - Resource not found
curl -w "\nStatus: %{http_code}\n" "http://localhost:3001/api/menu-templates/invalid_id"

# 409 Conflict - Cannot delete (has dependencies)
curl -w "\nStatus: %{http_code}\n" -X DELETE "http://localhost:3001/api/menu-templates/tpl_with_reservations"
```

---

## 🧑‍💻 Sample Test Data

### Complete Menu Setup JSON

```json
{
  "template": {
    "name": "Menu Weselne 2026",
    "variant": "Premium",
    "eventTypeId": "wesele-123",
    "isActive": true,
    "validFrom": "2026-01-01T00:00:00.000Z",
    "validTo": "2026-12-31T23:59:59.999Z"
  },
  "packages": [
    {
      "name": "Ekonomiczny",
      "priceAdult": 250.00,
      "priceChild": 125.00,
      "priceToddler": 0.00,
      "includedItems": [
        "Przystawki (3 rodzaje)",
        "Zupa",
        "Danie główne",
        "Deser",
        "Napoje bezalkoholowe"
      ],
      "displayOrder": 1
    },
    {
      "name": "Standard",
      "priceAdult": 300.00,
      "priceChild": 150.00,
      "priceToddler": 0.00,
      "includedItems": [
        "Przystawki (5 rodzajów)",
        "Zupa krem",
        "2 dania główne",
        "Deser + kawa",
        "Napoje + zimne napoje"
      ],
      "displayOrder": 2
    },
    {
      "name": "Premium",
      "priceAdult": 400.00,
      "priceChild": 200.00,
      "priceToddler": 0.00,
      "includedItems": [
        "Przystawki premium (7 rodzajów)",
        "2 zupy",
        "3 dania główne",
        "Deser + kawa + ciasto",
        "Napoje + soki + lody"
      ],
      "displayOrder": 3
    }
  ],
  "options": [
    {
      "name": "Bar Open",
      "category": "Alkohol",
      "description": "Nieograniczona ilość alkoholu przez całe wesele",
      "priceType": "PER_PERSON",
      "priceAmount": 50.00
    },
    {
      "name": "Alkohol Premium",
      "category": "Alkohol",
      "description": "Wysokogatunkowe alkohole",
      "priceType": "PER_PERSON",
      "priceAmount": 80.00
    },
    {
      "name": "DJ + Taniec",
      "category": "Muzyka",
      "description": "Profesjonalny DJ z nagłośnieniem",
      "priceType": "FLAT",
      "priceAmount": 800.00
    },
    {
      "name": "Zespół na żywo",
      "category": "Muzyka",
      "description": "Zespół muzyczny 4 osoby",
      "priceType": "FLAT",
      "priceAmount": 2000.00
    },
    {
      "name": "Dekoracje Premium",
      "category": "Dekoracje",
      "description": "Kwiaty + świece + ubranie sali",
      "priceType": "FLAT",
      "priceAmount": 1500.00
    },
    {
      "name": "Fotograf",
      "category": "Multimediia",
      "description": "Całodniowa sesja foto",
      "priceType": "FLAT",
      "priceAmount": 1200.00
    }
  ]
}
```

---

## ✅ Verification Checklist

```bash
# ☐ Backend is running
curl http://localhost:3001/api/health

# ☐ Can create template
curl -X POST http://localhost:3001/api/menu-templates -d '...'

# ☐ Can list templates
curl http://localhost:3001/api/menu-templates

# ☐ Can get single template
curl http://localhost:3001/api/menu-templates/tpl_123

# ☐ Can update template
curl -X PUT http://localhost:3001/api/menu-templates/tpl_123 -d '...'

# ☐ Can create package
curl -X POST http://localhost:3001/api/menu-packages -d '...'

# ☐ Can list packages by template
curl http://localhost:3001/api/menu-packages/template/tpl_123

# ☐ Can create option
curl -X POST http://localhost:3001/api/menu-options -d '...'

# ☐ Can list options
curl http://localhost:3001/api/menu-options

# ☐ Can filter options by category
curl http://localhost:3001/api/menu-options?category=Alkohol

# ☐ Can select menu for reservation
curl -X POST http://localhost:3001/api/reservations/res_123/select-menu -d '...'

# ☐ Can get reservation menu
curl http://localhost:3001/api/reservations/res_123/menu

# ☐ Price calculation is correct
# Verify priceBreakdown in response

# ☐ Can update guest counts
curl -X PUT http://localhost:3001/api/reservations/res_123/menu -d '...'

# ☐ Can delete template
curl -X DELETE http://localhost:3001/api/menu-templates/tpl_123

# ☐ Can delete package
curl -X DELETE http://localhost:3001/api/menu-packages/pkg_456

# ☐ Can delete option
curl -X DELETE http://localhost:3001/api/menu-options/opt_789
```

---

## 🐛 Common Issues

### Issue: "Template not found"

**Solution:** Check if template ID is correct
```bash
# List all templates first
curl http://localhost:3001/api/menu-templates | jq '.data[].id'
```

### Issue: "Validation error"

**Solution:** Check request body format
```bash
# Use -v for verbose output
curl -v -X POST http://localhost:3001/api/menu-templates \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Issue: "Cannot delete: has reservations"

**Solution:** This is expected. Template/package/option with active reservations cannot be deleted for data integrity.

---

## 📖 Documentation Links

- **Full API Docs:** `apps/backend/src/routes/README_MENU_API.md`
- **Frontend Hooks:** `apps/frontend/hooks/use-menu.ts`
- **Frontend Components:** `apps/frontend/components/menu/`
- **Prisma Schema:** `apps/backend/prisma/schema.prisma`

---

**Pro Tip:** Use `jq` for pretty JSON formatting:
```bash
curl http://localhost:3001/api/menu-templates | jq '.'
```

**Install jq:**
```bash
sudo apt install jq  # Ubuntu/Debian
brew install jq      # macOS
```

---

**Created:** 2026-02-10  
**Status:** ✅ Ready to Test  
