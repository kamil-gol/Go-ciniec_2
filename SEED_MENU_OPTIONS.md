# Seeding Menu Options - 120+ opcji

## 🌱 Opis

Skrypt seed wypełnia bazę danych **120+ różnorodnymi opcjami menu**:

### Kategorie:
- **DRINK** (25): Kawy, herbaty, soki, napoje gazowane, smoothies
- **ALCOHOL** (30): Wódki, wina, piwa, whisky, cocktaile
- **DESSERT** (20): Torty, lody, tiramisu, ciasta
- **EXTRA_DISH** (15): Dodatki do dań, przystawki, warzywa
- **SERVICE** (10): Fotograf, DJ, kelnerzy, ochrona
- **DECORATION** (8): Balony, kwiaty, oświetlenie
- **ENTERTAINMENT** (7): Fajerwerki, fotobudka, magik
- **OTHER** (5): Menu specjalne (wege, bezglutenowe, dziecięce)

## 🚀 Uruchomienie

### Metoda 1: W kontenerze Docker (ZALECANA)

```bash
cd /home/kamil/rezerwacje

# Pull latest code
git pull origin feature/category-api

# Enter backend container
docker-compose exec backend bash

# Inside container:
cd /app
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/seed-menu-options.ts

# Exit container
exit
```

### Metoda 2: Jeden liner (szybsze)

```bash
cd /home/kamil/rezerwacje && \
git pull origin feature/category-api && \
docker-compose exec -T backend npx ts-node --compiler-options '{"module":"commonjs"}' /app/prisma/seeds/seed-menu-options.ts
```

### Metoda 3: Shell script

```bash
cd /home/kamil/rezerwacje
git pull origin feature/category-api
docker-compose exec backend bash scripts/seed-menu-options.sh
```

## ✅ Oczekiwany output

```
🌱 Seeding menu options...

✅ Seed complete!
   Created: 120 options
   Skipped: 0 options (already exist)
   Total in database: 120
```

## 🔗 Sprawdzenie

Po uruchomieniu sprawdź:

**Frontend:**
- http://62.171.189.172:3000/dashboard/menu/options

**API:**
```bash
curl http://62.171.189.172:3001/api/menu-options | jq '.count'
# Powinno zwrócić: 120+
```

## 📦 Co zawiera seed?

Przykładowe opcje:

### Napoje (25)
- Kawy: espresso, cappuccino, latte, mrożona
- Herbaty: czarna, zielona, owocowa
- Soki: pomarańczowy, jabłkowy, multiowocowy
- Lemoniad: klasyczna, malinowa
- Napoje: cola, sprite, fanta, woda, kompot
- Shake: czekoladowy, waniliowy
- Smoothie: truskawkowe, bananowe

### Alkohol (30)
- Wódki: czysta, Żubrówka, Finlandia
- Wina: białe/czerwone wytrawne/półsłodkie, Prosecco, Szampan
- Piwa: jasne, ciemne, kraftowe, bezalkoholowe
- Whisky: Ballantines, Jack Daniels, Jameson
- Gin: Gordon's, Bombay Sapphire
- Rum: Bacardi, Captain Morgan
- Likie: Baileys, Jägermeister
- Specjalne: Cocktail bar (obs uga)

### Desery (20)
- Torty: czekoladowy, owocowy, bezowy
- Klasyczne: sernik, tiramisu, panna cotta, crème brûlée
- Lody: waniliowe, czekoladowe, truskawkowe
- Inne: brownie, makaroniki, cupcake, ptysie
- Specjalne: Candy bar

### Dania dodatkowe (15)
- Zupy, dania główne, przystawki
- Dodatki: frytki, ryż, ziemniaki, kasza
- Warzywa: grillowane, sałatki
- Tradycyjne: pyzy śląskie, naleśniki, pielmieni

### Usługi (10)
- Fotograf, kamerzysta
- DJ, zespół muzyczny, wodzirej
- Barman mobilny
- Kelner dodatkowy, ochrona
- Garderobiany, valet parking

### Dekoracje (8)
- Balony, kwiaty, obrusy
- Świece, oświetlenie LED
- Tło fotograficzne, girlandy

### Rozrywka (7)
- Pokaz sztucznych ogni
- Fotobudka, karykaturzysta
- Magik, barman flair
- Tancerze, karaoke

### Inne (5)
- Menu: wegetariańskie, wegańskie, bezglutenowe
- Menu dziecięce
- Tort weselny

## 📝 Notatki

- Skrypt sprawdza duplikaty (nazwa + kategoria)
- Jeśli opcja istnieje - pomija
- Można uruchomić wielokrotnie bez ryzyka duplikatów
- Każda opcja ma:
  - Emoji icon 🎉
  - Opis
  - Prawidłowy `priceType` (PER_PERSON/PER_ITEM/FLAT)
  - Cenę w PLN
  - `isActive: true`
  - Sekwencyjny `displayOrder`

## 🧹 Czyszczenie (jeśli potrzeba)

Jeśli chcesz wyczyścić wszystkie opcje:

```bash
docker-compose exec backend npx prisma studio
# W przeglądarce: http://localhost:5555
# Ręcznie usuń rekordy z tabeli MenuOption
```

Lub przez SQL:
```bash
docker-compose exec postgres psql -U postgres -d rezerwacje -c "DELETE FROM \"MenuOption\";"
```
