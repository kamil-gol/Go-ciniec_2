# Seeding Kompletnego Systemu Menu

## 🌱 Opis

Seedy wypełniają bazę danych kompletnym systemem menu:

### 1️⃣ Event Types (7)
- Wesele
- Urodziny
- Chrzciny
- Komunia
- Rocznica
- Wydarzenie firmowe
- Inne

### 2️⃣ Szablony Menu (30)
- 10 weselnych
- 5 urodzinowych
- 3 chrzcin
- 3 komunijnych
- 3 rocznicowych
- 3 firmowych
- 3 specjalnych (vege/vegan/gf)

### 3️⃣ Pakiety Menu (20)
- Różne poziomy cenowe (90-250 zł)
- Badges: VIP, HIT!, PREMIUM, SEZON
- Kolory + emoji ikony
- includedItems (5 pozycji)
- Limity gości

---

## 🚀 Uruchomienie

### ⚡ ONE-LINER (ZALECANE)

Seeds wszystkiego w prawidłowej kolejności:

```bash
cd /home/kamil/rezerwacje && \
git pull origin feature/category-api && \
echo "🔹 Step 1/3: Event Types..." && \
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-event-types.ts && \
echo "" && \
echo "🔹 Step 2/3: Templates..." && \
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-templates.ts && \
echo "" && \
echo "🔹 Step 3/3: Packages..." && \
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-packages.ts && \
echo "" && \
echo "✅ GOTOWE!" && \
echo "Szablony: http://62.171.189.172:3000/dashboard/menu/templates" && \
echo "Pakiety: http://62.171.189.172:3000/dashboard/menu/packages"
```

### 🐚 Step-by-Step (manualnie)

#### Krok 1: Event Types
```bash
cd /home/kamil/rezerwacje
git pull origin feature/category-api
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-event-types.ts
```

**Output:**
```
🌱 Seeding event types...

✅ Seed complete!
   Created: 7 event types
   Skipped: 0 event types (already exist)
   Total in database: 7
```

#### Krok 2: Menu Templates
```bash
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-templates.ts
```

**Output:**
```
🌱 Seeding menu templates...

✅ Seed complete!
   Created: 30 templates
   Skipped: 0 templates (already exist)
   Total in database: 30
```

#### Krok 3: Menu Packages
```bash
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-packages.ts
```

**Output:**
```
🌱 Seeding menu packages...

✅ Seed complete!
   Created: 20 packages
   Skipped: 0 packages (already exist or template not found)
   Total in database: 20
```

---

## 🔍 Weryfikacja

### Frontend:
```
Event Types: http://62.171.189.172:3000/dashboard/settings (jeśli istnieje)
Szablony:    http://62.171.189.172:3000/dashboard/menu/templates
Pakiety:     http://62.171.189.172:3000/dashboard/menu/packages
```

### API:
```bash
# Event Types
curl http://62.171.189.172:3001/api/event-types | jq '.data | length'
# Powinno: 7

# Templates
curl http://62.171.189.172:3001/api/menu-templates | jq '.count'
# Powinno: 30

# Packages (przykład dla jednego szablonu)
curl "http://62.171.189.172:3001/api/menu-packages/template/{TEMPLATE_ID}" | jq '.count'
```

### SQL:
```bash
# Liczba rekordów
docker-compose exec postgres psql -U postgres -d rezerwacje -c "SELECT 'EventTypes' AS table_name, COUNT(*) FROM \"EventType\" UNION ALL SELECT 'Templates', COUNT(*) FROM \"MenuTemplate\" UNION ALL SELECT 'Packages', COUNT(*) FROM \"MenuPackage\";"
```

---

## 📊 Co dokładnie seedujesz?

### 📅 Event Types (7):
1. 💎 Wesele (#EC4899)
2. 🎉 Urodziny (#F59E0B)
3. 👶 Chrzciny (#3B82F6)
4. ⛪ Komunia (#FBBF24)
5. ❤️ Rocznica (#F43F5E)
6. 💼 Wydarzenie firmowe (#374151)
7. 🎭 Inne (#6B7280)

### 📋 Szablony Menu (30):

**Wesela (10):**
- Menu Weselne Premium, Standard, Budget
- Menu Weselne VIP, Regionalne, Międzynarodowe
- Menu Weselne Wiosenne, Letnie, Jesienne, Zimowe (sezonowe)

**Urodziny (5):**
- Dziecięce, Młodzieżowe, Dorosłe, Premium, Tematyczne

**Chrzciny (3):**
- Klasyczne, Premium, Rodzinne

**Komunie (3):**
- Standard, Premium, Wiosenne

**Rocznice (3):**
- Romantyczne, Jubileusz, Rodzinne

**Firmowe (3):**
- Konferencja, Gala, Team Building

**Specjalne (3):**
- Wegetariańskie, Wegańskie, Bezglutenowe

### 📦 Pakiety Menu (20):

**Weselne (4):**
- 💎 Diamentowy (250 zł) - VIP
- 🍽️ Złoty (180 zł) - HIT!
- 🍴 Srebrny (150 zł)
- 🌸 Wiosenny (170 zł) - SEZON

**Urodzinowe (3):**
- 🎉 Małego Smakosza (80 zł) - DZIECI
- 🎈 Party (100 zł) - PARTY
- 🍾 Elegancki (140 zł)

**Chrzciny (2):**
- 👶 Rodzinny (120 zł)
- 👼 Anielski (160 zł) - PREMIUM

**Komunijne (2):**
- ⛪ Klasyczny (130 zł)
- 🕊️ Świętej Uroczystości (170 zł) - PREMIUM

**Rocznicowe (2):**
- ❤️ Romantyczny (190 zł) - LOVE
- 💍 Złotych Godów (200 zł) - 50 LAT

**Firmowe (3):**
- 💼 Business (90 zł)
- 🎩 Gala (220 zł) - GALA
- 🤝 Integracyjny (110 zł) - TEAM

**Specjalne (3):**
- 🥗 Veggie (130 zł) - VEGGIE
- 🌱 Plant-Based (140 zł) - VEGAN
- 🌾 Gluten-Free (150 zł) - GF

---

## 🧹 Czyszczenie

### Usuń wszystko (UWAGA: trwale!):

```bash
docker-compose exec postgres psql -U postgres -d rezerwacje << EOF
DELETE FROM "MenuPackage";
DELETE FROM "MenuTemplate";
DELETE FROM "EventType";
EOF
```

### Lub indywidualnie:
```bash
# Tylko pakiety
docker-compose exec postgres psql -U postgres -d rezerwacje -c "DELETE FROM \"MenuPackage\";"

# Tylko szablony (usunie też pakiety)
docker-compose exec postgres psql -U postgres -d rezerwacje -c "DELETE FROM \"MenuTemplate\";"

# Tylko event types (usunie wszystko!)
docker-compose exec postgres psql -U postgres -d rezerwacje -c "DELETE FROM \"EventType\";"
```

---

## 📝 Notatki

- ✅ Seedy są **idempotentne** - bezpieczne wielokrotne uruchamianie
- ✅ Sprawdzają duplikaty przed wstawieniem
- ⚠️ **Kolejność ma znaczenie**: Event Types → Templates → Packages
- 🔗 Powiązania: Packages należą do Templates, Templates do EventTypes
- 📅 Sezonowe szablony mają `validFrom`/`validTo`
- 🎨 Każdy pakiet ma kolor, ikonę, badge

---

## 🎯 Gotowe!

Po seedowaniu masz:
- ✅ 7 typów wydarzeń
- ✅ 30 szablonów menu
- ✅ 20 pakietów z cenami
- ✅ Gotowy system do testów!

**Enjoy! 🎉**
