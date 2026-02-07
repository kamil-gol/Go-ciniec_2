# Database Seed Script

## Opis

Skrypt seedujący bazę danych - usuwa wszystkie rezerwacje i klientów, następnie tworzy przykładowe dane testowe.

## Co robi skrypt?

### 1. 🗑️ Czyszczenie
- Usuwa wszystkie rezerwacje (wraz z zależnościami: deposits, history)
- Usuwa wszystkich klientów

### 2. 🌱 Tworzenie danych

#### Klienci (5):
1. **Anna Kowalska** - `+48600123456`
   - Email: anna.kowalska@example.com
   - Stały klient, organizuje urodziny córki

2. **Piotr Nowak** - `+48601234567`
   - Email: piotr.nowak@example.com
   - Preferuje płatność przelewem

3. **Maria Wiśniewska** - `+48602345678`
   - Potrzebuje dodatkowych dekoracji

4. **Janusz Kowalczyk** - `+48603456789`
   - Email: janusz.kowalczyk@example.com

5. **Katarzyna Lewandowska** - `+48604567890`
   - Email: katarzyna.lewandowska@example.com
   - VIP klient

#### Rezerwacje (5):

##### 1. Urodziny dziecka (10 lat) 🎂
- **Klient:** Anna Kowalska
- **Data:** 15.03.2026, 15:00-21:00
- **Goście:** 20 dorosłych + 15 dzieci (4-12) = 35 osób
- **Ceny:** 80 PLN/dorosły, 40 PLN/dziecko
- **Całkowita cena:** 2,200 PLN
- **Zaliczka:** 600 PLN - **ZAPŁACONA** (przelew, 10.02.2026)
- **Status:** CONFIRMED

##### 2. Wesele 💍
- **Klient:** Piotr Nowak
- **Data:** 20.06.2026, 16:00 - 21.06.2026, 02:00 (10h)
- **Goście:** 80 dorosłych + 12 dzieci (4-12) = 92 osoby
- **Ceny:** 150 PLN/dorosły, 75 PLN/dziecko
- **Całkowita cena:** 12,900 PLN
- **Zaliczka:** 3,000 PLN - **OCZEKUJE** (termin: 20.04.2026)
- **Status:** CONFIRMED
- **Dodatkowe:** Menu 3 dania + bar otwarty, DJ + zespół

##### 3. Rocznica 25-lecia (Srebrne wesele) 🎉
- **Klient:** Maria Wiśniewska
- **Data:** 10.04.2026, 18:00 - 11.04.2026, 01:00 (7h)
- **Goście:** 45 dorosłych + 8 dzieci (4-12) = 53 osoby
- **Ceny:** 120 PLN/dorosły, 60 PLN/dziecko
- **Całkowita cena:** 5,880 PLN
- **Zaliczka:** 1,500 PLN - **OCZEKUJE** (termin: 10.03.2026)
- **Status:** PENDING (potwierdzenie do 03.04.2026)
- **Dodatkowe:** Dekoracje srebrne

##### 4. Spotkanie integracyjne firmy 🏛️
- **Klient:** Janusz Kowalczyk
- **Data:** 05.05.2026, 14:00-20:00 (6h)
- **Goście:** 30 dorosłych + 5 dzieci (mieszane) = 35 osób
- **Ceny:** 100 PLN/dorosły, 50 PLN/dziecko
- **Całkowita cena:** 3,200 PLN
- **Status:** CONFIRMED
- **Dodatkowe:** Kącik dla dzieci, animator
- **Typ:** Własny - "Spotkanie integracyjne firmy"

##### 5. 18. urodziny (pełnoletniość) 🎆
- **Klient:** Katarzyna Lewandowska
- **Data:** 12.07.2026, 19:00 - 13.07.2026, 03:00 (8h)
- **Goście:** 50 dorosłych
- **Cena:** 130 PLN/dorosły
- **Całkowita cena:** 6,500 PLN
- **Zaliczka:** 2,000 PLN - **ZAPŁACONA** (BLIK, 05.06.2026)
- **Status:** CONFIRMED
- **Dodatkowe:** DJ, bar z drinkami, +2h za 1,000 PLN

## Jak użyć?

### Metoda 1: Tylko seed (bez reset migracji)
```bash
cd /home/kamil/rezerwacje/apps/backend
npm run db:seed
```

### Metoda 2: Pełny reset bazy danych
⚠️ **UWAGA: To usunie CAŁĄ bazę danych i wszystkie dane!**

```bash
cd /home/kamil/rezerwacje/apps/backend
npm run db:reset
```

## Wymagania

⚠️ **Skrypt wymaga istnienia w bazie danych:**
- Co najmniej 1 sali (Hall)
- Co najmniej 1 typu wydarzenia (EventType)
- Co najmniej 1 użytkownika (User)

Jeśli nie istnieją, skrypt zwróci błąd.

## Output

```
🗑️  Clearing database...
✅ Deleted all reservations
✅ Deleted all clients

🌱 Seeding database...

👥 Creating clients...
✅ Created client: Anna Kowalska
✅ Created client: Piotr Nowak
✅ Created client: Maria Wiśniewska
✅ Created client: Janusz Kowalczyk
✅ Created client: Katarzyna Lewandowska

📊 Creating reservations...
✅ Created reservation for Anna Kowalska - Birthday (PAID DEPOSIT)
✅ Created reservation for Piotr Nowak - Wedding (PENDING DEPOSIT)
✅ Created reservation for Maria Wiśniewska - 25th Anniversary
✅ Created reservation for Janusz Kowalczyk - Corporate Event
✅ Created reservation for Katarzyna Lewandowska - 18th Birthday (PAID DEPOSIT)

✅ Database seeded successfully!

📊 Summary:
   - Clients created: 5
   - Reservations created: 5
   - Deposits created: 4 (2 paid, 2 pending)
```

## Struktura zgodna z systemem

Wszystkie rezerwacje spełniają obecne wymagania:
- ✅ Podział na dorosłych / dzieci (4-12) / dzieci (0-3)
- ✅ Osobne ceny dla każdej grupy wiekowej
- ✅ Daty w formacie DateTime (startDateTime, endDateTime)
- ✅ Terminy potwierdzenia dla statusu PENDING
- ✅ Zaliczki z pełnymi informacjami (kwota, termin, status, metoda płatności)
- ✅ Numery telefonów bez spacji (format: +48XXXXXXXXX)
- ✅ Różne typy wydarzeń (urodziny, wesela, rocznice, własne)
- ✅ Dodatkowe godziny wyliczone w notatkach
