# Seeding Szablonów i Pakietów Menu - 30 + 20 przykładów

## 🌱 Opis

Seedy wypełniają bazę danych przykładowymi danymi:

### 📋 Szablony Menu (30)

Szablony podzielone według typów wydarzeń:

#### Wesela (10)
- Menu Weselne Premium
- Menu Weselne Standard
- Menu Weselne Wiosenne (sezonowe)
- Menu Weselne Letnie (sezonowe)
- Menu Weselne Jesienne (sezonowe)
- Menu Weselne Zimowe (sezonowe)
- Menu Weselne VIP
- Menu Weselne Regionalne
- Menu Weselne Międzynarodowe
- Menu Weselne Budget

#### Urodziny (5)
- Menu Urodzinowe Dziecięce
- Menu Urodzinowe Młodzieżowe
- Menu Urodzinowe Dorosłe
- Menu Urodzinowe Premium
- Menu Urodzinowe Tematyczne

#### Chrzciny (3)
- Menu na Chrzciny Klasyczne
- Menu na Chrzciny Premium
- Menu na Chrzciny Rodzinne

#### Komunie (3)
- Menu Komunijne Standard
- Menu Komunijne Premium
- Menu Komunijne Wiosenne (sezonowe)

#### Rocznice (3)
- Menu Rocznicowe Romantyczne
- Menu Rocznicowe Jubileusz
- Menu Rocznicowe Rodzinne

#### Firmowe (3)
- Menu Firmowe Konferencja
- Menu Firmowe Gala
- Menu Firmowe Team Building

#### Specjalne (3)
- Menu Wegetariańskie
- Menu Wegańskie
- Menu Bezglutenowe

---

### 📦 Pakiety Menu (20)

Różnorodne pakiety dla szablonów:

#### Weselne (4)
- Pakiet Diamentowy (Premium, 250 zł/os) 💎 VIP
- Pakiet Złoty (Standard, 180 zł/os) 🍽️ HIT!
- Pakiet Srebrny (Budget, 150 zł/os) 🍴
- Pakiet Wiosenny (Sezonowy, 170 zł/os) 🌸 SEZON

#### Urodzinowe (3)
- Pakiet Małego Smakosza (80 zł/os) 🎉 DZIECI
- Pakiet Party (100 zł/os) 🎈 PARTY
- Pakiet Elegancki (140 zł/os) 🍾

#### Chrzciny (2)
- Pakiet Rodzinny (120 zł/os) 👶
- Pakiet Anielski (160 zł/os) 👼 PREMIUM

#### Komunijne (2)
- Pakiet Komunijny Klasyczny (130 zł/os) ⛪
- Pakiet Świętej Uroczystości (170 zł/os) 🕊️ PREMIUM

#### Rocznicowe (2)
- Pakiet Romantyczny (190 zł/os) ❤️ LOVE
- Pakiet Złotych Godów (200 zł/os) 💍 50 LAT

#### Firmowe (3)
- Pakiet Business (90 zł/os) 💼
- Pakiet Gala (220 zł/os) 🎩 GALA
- Pakiet Integracyjny (110 zł/os) 🤝 TEAM

#### Specjalne (3)
- Pakiet Veggie (130 zł/os) 🥗 VEGGIE
- Pakiet Plant-Based (140 zł/os) 🌱 VEGAN
- Pakiet Gluten-Free (150 zł/os) 🌾 GF

---

## 🚀 Uruchomienie

### ⚠️ WYMAGANIA

Przed uruchomieniem upewnij się że:
1. ✅ **EventTypes** są w bazie (Wesele, Urodziny, Chrzciny, etc.)
2. ✅ Seedujesz **NAJPIERW szablony**, **POTEM pakiety**

### Krok 1: Seed Szablonów (30)

```bash
cd /home/kamil/rezerwacje
git pull origin feature/category-api

# W kontenerze Docker
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-templates.ts
```

**Oczekiwany output:**
```
🌱 Seeding menu templates...

✅ Seed complete!
   Created: 30 templates
   Skipped: 0 templates (already exist)
   Total in database: 30
```

---

### Krok 2: Seed Pakietów (20)

```bash
# W kontenerze Docker
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-packages.ts
```

**Oczekiwany output:**
```
🌱 Seeding menu packages...

✅ Seed complete!
   Created: 20 packages
   Skipped: 0 packages (already exist or template not found)
   Total in database: 20
```

---

### One-Liner (oba seedy)

```bash
cd /home/kamil/rezerwacje && \
git pull origin feature/category-api && \
echo "📋 Seeding templates..." && \
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-templates.ts && \
echo "" && \
echo "📦 Seeding packages..." && \
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-packages.ts && \
echo "" && \
echo "✅ Sprawdź:" && \
echo "   Szablony: http://62.171.189.172:3000/dashboard/menu/templates" && \
echo "   Pakiety: http://62.171.189.172:3000/dashboard/menu/packages"
```

---

## 🔍 Weryfikacja

### Frontend:
```
Szablony: http://62.171.189.172:3000/dashboard/menu/templates
Pakiety:  http://62.171.189.172:3000/dashboard/menu/packages
```

### API:
```bash
# Count szablonów
curl http://62.171.189.172:3001/api/menu-templates | jq '.count'
# Powinno: 30

# Count pakietów dla szablonu
curl "http://62.171.189.172:3001/api/menu-packages/template/{TEMPLATE_ID}" | jq '.count'
```

### SQL:
```bash
# W PostgreSQL
docker-compose exec postgres psql -U postgres -d rezerwacje -c "SELECT COUNT(*) FROM \"MenuTemplate\";"
docker-compose exec postgres psql -U postgres -d rezerwacje -c "SELECT COUNT(*) FROM \"MenuPackage\";"
```

---

## 📊 Szczegóły Pakietów

Każdy pakiet zawiera:
- ✅ **Nazwę** i opis
- ✅ **Ceny**: adult, child, toddler
- ✅ **Kolor** i **ikona** (emoji)
- ✅ **Badge** (HIT!, PREMIUM, VIP, etc.)
- ✅ **Flagi**: isPopular, isRecommended
- ✅ **includedItems** - lista 5 rzeczy w pakiecie
- ✅ **Guest limits** - min/max liczba gości

---

## 🧹 Czyszczenie (jeśli potrzeba)

### Usuń wszystkie pakiety i szablony:

```bash
# UWAGA: To usuwa WSZYSTKIE dane!
docker-compose exec postgres psql -U postgres -d rezerwacje -c "DELETE FROM \"MenuPackage\";"
docker-compose exec postgres psql -U postgres -d rezerwacje -c "DELETE FROM \"MenuTemplate\";"
```

### Lub przez Prisma Studio:
```bash
docker-compose exec backend npx prisma studio
# Otwórz: http://localhost:5555
# Ręcznie usuń rekordy
```

---

## 📝 Notatki

- Seedy są **idempotentne** - można uruchamiać wielokrotnie
- Sprawdzają duplikaty przed wstawieniem
- **Wymagają EventTypes** w bazie
- Pakiety wymagają istniejących szablonów
- Sezonowe szablony mają ustawione `validFrom`/`validTo`

---

## 🎯 Następne kroki

Po seedowaniu możesz:
1. Przeglądać szablony w UI
2. Edytować pakiety (ceny, opisy)
3. Przypisywać opcje menu do pakietów
4. Tworzyć własne szablony i pakiety
5. Używać w rezerwacjach

---

**Enjoy! 🎉**
